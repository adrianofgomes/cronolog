<?php

declare(strict_types=1);

namespace App\Application\Actions\Event;

use App\Application\Actions\Action;
use App\Domain\Category\CategoryRepository;
use App\Domain\Event\EventRepository;
use App\Domain\Ai\AiServiceInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use DateTime;
use DateTimeZone;
use Slim\Exception\HttpBadRequestException;

class ParseNLLEventAction extends Action
{
    private CategoryRepository $categoryRepository;
    private EventRepository $eventRepository;
    private AiServiceInterface $aiService;

    public function __construct(
        LoggerInterface $logger,
        CategoryRepository $categoryRepository,
        EventRepository $eventRepository,
        AiServiceInterface $aiService
    ) {
        parent::__construct($logger);
        $this->categoryRepository = $categoryRepository;
        $this->eventRepository = $eventRepository;
        $this->aiService = $aiService;
    }

    protected function action(): Response
    {
        $user = $this->request->getAttribute('authenticated_user');
        $data = $this->getFormData();
        $text = $data['text'] ?? '';
        $timezone = $data['timezone'] ?? 'UTC';

        if (empty($text)) {
            throw new HttpBadRequestException($this->request, 'Input text is required.');
        }

        $categories = $this->categoryRepository->findAll();

        // Fetch historical context
        $recentEvents = $this->eventRepository->findByUser($user->getId());
        $historyContext = [];
        
        foreach ($recentEvents as $event) {
            $catId = $event->getCategoryId();
            $metadata = $event->getMetadata();
            
            if (!$metadata) continue;

            if (!isset($historyContext[$catId])) {
                $historyContext[$catId] = [];
            }

            foreach ($metadata as $key => $value) {
                if (is_string($value) && !empty($value)) {
                    if (!isset($historyContext[$catId][$key])) {
                        $historyContext[$catId][$key] = [];
                    }
                    if (!in_array($value, $historyContext[$catId][$key])) {
                        $historyContext[$catId][$key][] = $value;
                        // Limit to 10 unique values per field to keep prompt size manageable
                        if (count($historyContext[$catId][$key]) > 10) {
                            array_shift($historyContext[$catId][$key]);
                        }
                    }
                }
            }
        }

        $categoriesContext = array_map(function ($cat) use ($historyContext) {
            return [
                'id' => $cat->getId(),
                'name' => $cat->getName(),
                'metadataSchema' => $cat->getMetadataSchema(),
                'known_values' => $historyContext[$cat->getId()] ?? []
            ];
        }, $categories);

        $now = new DateTime('now', new DateTimeZone($timezone));
        $currentDate = $now->format('Y-m-d H:i:s');

        $systemPrompt = <<<PROMPT
Você é um assistente do Cronolog, um sistema de log de eventos pessoais.
Sua tarefa é extrair informações de um pedido em linguagem natural e retornar um JSON estruturado.

DATA ATUAL: {$currentDate} (Fuso horário: {$timezone})

CATEGORIAS DISPONÍVEIS E VALORES CONHECIDOS (HISTÓRICO):
JSON:
PROMPT;

        $systemPrompt .= json_encode($categoriesContext, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $systemPrompt .= <<<PROMPT

REGRAS:
1. Identifique a categoria mais adequada.
2. Extraia a data do evento. Se não houver data explícita, use a data atual.
3. Preencha o objeto `metadata` baseando-se no `metadataSchema` da categoria.
4. STATUS INTELIGENTE: Se a categoria permitir `status_tracking`, defina o campo `status` como 'pending' se a data for futura ou se o texto indicar uma tarefa ainda não realizada. Caso contrário, use 'completed'.
5. CONSISTÊNCIA: Verifique os `known_values` da categoria.
6. O campo `description` deve conter um resumo do evento.
7. Retorne APENAS o JSON no formato abaixo, sem markdown ou explicações:
{
  "category_id": int,
  "date": "YYYY-MM-DD HH:mm:ss",
  "description": "string",
  "status": "pending" | "completed",
  "metadata": { ... }
}
PROMPT;

        $this->logger->info("Parsing NLL Event: " . $text);

        try {
            $aiResponse = $this->aiService->generateContent($systemPrompt . "\n\nUSUÁRIO: " . $text);

            // Limpar resposta da IA (remover markdown se existir)
            $jsonText = preg_replace('/^```json\s*|\s*```$/', '', trim($aiResponse));

            $parsedData = json_decode($jsonText, true);

            if ($parsedData === null) {
                $this->logger->error("JSON Decode Error. Content: " . $aiResponse);
                return $this->respondWithData(['error' => 'Invalid JSON from AI.'], 500);
            }

            return $this->respondWithData($parsedData);
        } catch (\Exception $e) {
            $this->logger->error("Gemini API Error: " . $e->getMessage());
            return $this->respondWithData(['error' => 'Failed to process natural language request.'], 500);
        }
    }
}

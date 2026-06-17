<?php

declare(strict_types=1);

namespace App\Application\Actions\Event;

use App\Application\Actions\Action;
use App\Application\Settings\SettingsInterface;
use App\Domain\Category\CategoryRepository;
use App\Domain\Event\EventRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use DateTime;
use DateTimeZone;
use Slim\Exception\HttpBadRequestException;

class ParseNLLEventAction extends Action
{
    private CategoryRepository $categoryRepository;
    private EventRepository $eventRepository;
    private string $googleAiKey;

    public function __construct(
        LoggerInterface $logger,
        CategoryRepository $categoryRepository,
        EventRepository $eventRepository,
        SettingsInterface $settings
    ) {
        parent::__construct($logger);
        $this->categoryRepository = $categoryRepository;
        $this->eventRepository = $eventRepository;
        $this->googleAiKey = $settings->get('google')['ai_key'];
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

        if (empty($this->googleAiKey)) {
            throw new HttpBadRequestException($this->request, 'Google AI Key is not configured.');
        }

        $categories = $this->categoryRepository->findByUser($user->getId());
        
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
1. Identifique a categoria mais adequada (ex: "Conta a Pagar" para pagamentos, boletos, cartões).
2. Extraia a data do evento. Se não houver data explícita, use a data atual. Se expressões como "ontem" ou "hoje" forem usadas, calcule a data relativa à DATA ATUAL fornecida.
3. Preencha o objeto `metadata` baseando-se no `metadataSchema` da categoria.
4. STATUS INTELIGENTE: Se a categoria permitir `status_tracking`, defina o campo `status` como 'pending' se a data for futura (após a DATA ATUAL) ou se o texto indicar uma tarefa ainda não realizada. Caso contrário, use 'completed'.
5. CONSISTÊNCIA: Verifique os `known_values` da categoria. Se o usuário mencionar algo similar a um valor conhecido (ex: usuário disse "jurema" e existe "BR Jurema" no histórico), prefira o valor do histórico para manter a consistência.
6. O campo `description` deve conter um resumo do evento.
7. Retorne APENAS o JSON no formato abaixo, sem markdown ou explicações:
{
  "category_id": int,
  "date": "YYYY-MM-DD HH:mm:ss",
  "description": "string",
  "status": "pending" | "completed",
  "metadata": { ... }
}

Se não for possível identificar uma categoria, tente mapear para a categoria mais genérica ou retorne null no `category_id`.
PROMPT;

        $this->logger->info("Parsing NLL Event: " . $text);

        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $systemPrompt . "\n\nUSUÁRIO: " . $text]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.1
            ]
        ];

        $apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=' . $this->googleAiKey;
        $this->logger->info("Calling Gemini API: " . $apiUrl);

        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($httpCode !== 200) {
            $this->logger->error("Gemini API Error (HTTP $httpCode). Response: " . ($response ?: 'Empty response') . ". cURL Error: " . $curlError);
            return $this->respondWithData(['error' => 'Failed to process natural language request.', 'details' => json_decode($response, true), 'curl_error' => $curlError], 500);
        }

        $this->logger->info("Gemini API Success: " . $response);


        $result = json_decode($response, true);
        $jsonText = $result['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (!$jsonText) {
            return $this->respondWithData(['error' => 'Could not parse AI response.'], 500);
        }

        // Sanitize: remove markdown code blocks if present
        $jsonText = preg_replace('/^```json\s*/i', '', $jsonText);
        $jsonText = preg_replace('/```$/', '', $jsonText);
        $jsonText = trim($jsonText);

        $parsedData = json_decode($jsonText, true);

        if ($parsedData === null) {
            $this->logger->error("JSON Decode Error: " . json_last_error_msg() . ". Content: " . $jsonText);
            return $this->respondWithData(['error' => 'Invalid JSON from AI.', 'content' => $jsonText], 500);
        }

        return $this->respondWithData($parsedData);
    }
}

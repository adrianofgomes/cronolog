<?php

declare(strict_types=1);

namespace App\Application\Actions\Notification;

use App\Application\Actions\Action;
use App\Domain\Notification\PushSubscription;
use App\Domain\Notification\PushSubscriptionRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;

class SavePushSubscriptionAction extends Action
{
    private PushSubscriptionRepository $pushSubscriptionRepository;

    public function __construct(
        LoggerInterface $logger,
        PushSubscriptionRepository $pushSubscriptionRepository
    ) {
        parent::__construct($logger);
        $this->pushSubscriptionRepository = $pushSubscriptionRepository;
    }

    /**
     * {@inheritdoc}
     */
    protected function action(): Response
    {
        $userId = (int) $this->request->getAttribute('user_id');
        $data = $this->getFormData();

        $endpoint = $data['endpoint'] ?? null;
        $keys = $data['keys'] ?? null;

        if (!$endpoint || !$keys || !isset($keys['p256dh']) || !isset($keys['auth'])) {
            throw new HttpBadRequestException($this->request, 'Dados de inscrição inválidos.');
        }

        $subscription = new PushSubscription(
            null,
            $userId,
            $endpoint,
            $keys['p256dh'],
            $keys['auth']
        );

        try {
            $this->pushSubscriptionRepository->save($subscription);
            $this->logger->info("Inscrição push salva para o usuário ID: $userId");
            return $this->respondWithData(['status' => 'success']);
        } catch (\Exception $e) {
            $this->logger->error("Erro ao salvar inscrição push: " . $e->getMessage());
            throw new \RuntimeException("Erro interno ao salvar inscrição: " . $e->getMessage());
        }
    }
}

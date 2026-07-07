<?php

declare(strict_types=1);

namespace App\Infrastructure\Notification;

use App\Application\Settings\SettingsInterface;
use App\Domain\Notification\PushSubscriptionRepository;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Psr\Log\LoggerInterface;

class WebPushService
{
    private WebPush $webPush;
    private PushSubscriptionRepository $pushSubscriptionRepository;
    private LoggerInterface $logger;

    public function __construct(
        SettingsInterface $settings,
        PushSubscriptionRepository $pushSubscriptionRepository,
        LoggerInterface $logger
    ) {
        $vapid = $settings->get('vapid');
        $auth = [
            'VAPID' => [
                'subject' => $vapid['subject'],
                'publicKey' => $vapid['public_key'],
                'privateKey' => $vapid['private_key'],
            ],
        ];

        $this->webPush = new WebPush($auth);
        $this->pushSubscriptionRepository = $pushSubscriptionRepository;
        $this->logger = $logger;
    }

    /**
     * Envia uma notificação para todos os administradores.
     * 
     * @param string $title
     * @param string $body
     * @param string|null $url
     */
    public function notifyAdmins(string $title, string $body, ?string $url = null): void
    {
        $subscriptions = $this->pushSubscriptionRepository->findAllAdminSubscriptions();
        
        if (empty($subscriptions)) {
            $this->logger->info("Nenhum administrador inscrito para notificações push.");
            return;
        }

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'url' => $url,
        ]);

        foreach ($subscriptions as $pushSubscription) {
            $subscription = Subscription::create([
                'endpoint' => $pushSubscription->getEndpoint(),
                'publicKey' => $pushSubscription->getP256dh(),
                'authToken' => $pushSubscription->getAuth(),
            ]);

            $this->webPush->queueNotification($subscription, $payload);
        }

        foreach ($this->webPush->flush() as $report) {
            if (!$report->isSuccess()) {
                $this->logger->error("Falha ao enviar push: " . $report->getReason());
                
                // Se o endpoint não existe mais, removemos do banco
                if ($report->isSubscriptionExpired()) {
                    $this->pushSubscriptionRepository->deleteByEndpoint($report->getEndpoint());
                }
            }
        }
    }
}

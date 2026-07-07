<?php

declare(strict_types=1);

namespace App\Domain\Notification;

interface PushSubscriptionRepository
{
    /**
     * @param PushSubscription $subscription
     * @return void
     */
    public function save(PushSubscription $subscription): void;

    /**
     * @param int $userId
     * @return PushSubscription[]
     */
    public function findByUserId(int $userId): array;

    /**
     * @return PushSubscription[]
     */
    public function findAllAdminSubscriptions(): array;

    /**
     * @param string $endpoint
     * @return void
     */
    public function deleteByEndpoint(string $endpoint): void;
}

<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Notification;

use App\Domain\Notification\PushSubscription;
use App\Domain\Notification\PushSubscriptionRepository;
use App\Infrastructure\Persistence\MySqlRepository;
use PDO;

class MySqlPushSubscriptionRepository extends MySqlRepository implements PushSubscriptionRepository
{
    /**
     * {@inheritdoc}
     */
    public function save(PushSubscription $subscription): void
    {
        $query = "
            INSERT INTO user_push_subscriptions (user_id, endpoint, p256dh, auth)
            VALUES (:user_id, :endpoint, :p256dh, :auth)
            ON DUPLICATE KEY UPDATE
                p256dh = VALUES(p256dh),
                auth = VALUES(auth)
        ";

        $statement = $this->connection->prepare($query);
        $statement->execute([
            'user_id' => $subscription->getUserId(),
            'endpoint' => $subscription->getEndpoint(),
            'p256dh' => $subscription->getP256dh(),
            'auth' => $subscription->getAuth(),
        ]);
    }

    /**
     * {@inheritdoc}
     */
    public function findByUserId(int $userId): array
    {
        $query = "SELECT * FROM user_push_subscriptions WHERE user_id = :user_id";
        $statement = $this->connection->prepare($query);
        $statement->execute(['user_id' => $userId]);

        $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        $subscriptions = [];

        foreach ($rows as $row) {
            $subscriptions[] = new PushSubscription(
                (int) $row['id'],
                (int) $row['user_id'],
                $row['endpoint'],
                $row['p256dh'],
                $row['auth'],
                $row['created_at']
            );
        }

        return $subscriptions;
    }

    /**
     * {@inheritdoc}
     */
    public function findAllAdminSubscriptions(): array
    {
        $query = "
            SELECT s.* 
            FROM user_push_subscriptions s
            JOIN users u ON s.user_id = u.id
            WHERE u.is_admin = 1
        ";
        $statement = $this->connection->query($query);
        $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        
        $subscriptions = [];
        foreach ($rows as $row) {
            $subscriptions[] = new PushSubscription(
                (int) $row['id'],
                (int) $row['user_id'],
                $row['endpoint'],
                $row['p256dh'],
                $row['auth'],
                $row['created_at']
            );
        }

        return $subscriptions;
    }

    /**
     * {@inheritdoc}
     */
    public function deleteByEndpoint(string $endpoint): void
    {
        $query = "DELETE FROM user_push_subscriptions WHERE endpoint = :endpoint";
        $statement = $this->connection->prepare($query);
        $statement->execute(['endpoint' => $endpoint]);
    }
}

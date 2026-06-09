<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\User;

use App\Domain\User\User;
use App\Domain\User\UserRepository;
use App\Infrastructure\Persistence\MySqlRepository;

class MySqlUserRepository extends MySqlRepository implements UserRepository
{
    /**
     * {@inheritdoc}
     */
    public function findUserByGoogleId(string $googleId): ?User
    {
        $query = "SELECT id, google_id, email, name, is_admin, status FROM users WHERE google_id = :google_id";
        $statement = $this->connection->prepare($query);
        $statement->execute(['google_id' => $googleId]);
        
        $row = $statement->fetch();
        
        if (!$row) {
            return null;
        }

        return new User(
            (int) $row['id'],
            $row['google_id'],
            $row['email'],
            $row['name'],
            (bool) $row['is_admin'],
            $row['status']
        );
    }

    /**
     * {@inheritdoc}
     */
    public function save(User $user): void
    {
        $query = "
            INSERT INTO users (google_id, email, name, is_admin, status)
            VALUES (:google_id, :email, :name, :is_admin, :status)
            ON DUPLICATE KEY UPDATE
                email = VALUES(email),
                name = VALUES(name),
                is_admin = VALUES(is_admin),
                status = VALUES(status)
        ";

        $statement = $this->connection->prepare($query);
        $statement->execute([
            'google_id' => $user->getGoogleId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'is_admin' => (int) $user->isAdmin(),
            'status' => $user->getStatus(),
        ]);
    }

    /**
     * {@inheritdoc}
     */
    public function findPendingUsers(): array
    {
        $query = "SELECT id, google_id, email, name, is_admin, status FROM users WHERE status = 'pending'";
        $statement = $this->connection->query($query);
        $rows = $statement->fetchAll();

        $users = [];
        foreach ($rows as $row) {
            $users[] = new User(
                (int) $row['id'],
                $row['google_id'],
                $row['email'],
                $row['name'],
                (bool) $row['is_admin'],
                $row['status']
            );
        }

        return $users;
    }

    /**
     * {@inheritdoc}
     */
    public function updateStatus(string $googleId, string $status): void
    {
        $query = "UPDATE users SET status = :status WHERE google_id = :google_id";
        $statement = $this->connection->prepare($query);
        $statement->execute([
            'status' => $status,
            'google_id' => $googleId,
        ]);
    }
}

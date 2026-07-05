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
        $query = "SELECT id, google_id, email, name, is_admin, status, refresh_token FROM users WHERE google_id = :google_id";
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
            $row['status'],
            $row['refresh_token']
        );
    }

    /**
     * {@inheritdoc}
     */
    public function findUserByEmail(string $email): ?User
    {
        $query = "SELECT id, google_id, email, name, is_admin, status, refresh_token FROM users WHERE email = :email";
        $statement = $this->connection->prepare($query);
        $statement->execute(['email' => $email]);

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
            $row['status'],
            $row['refresh_token']
        );
    }

    public function save(User $user): void
    {
        $query = "
            INSERT INTO users (google_id, email, name, is_admin, status, refresh_token)
            VALUES (:google_id, :email, :name, :is_admin, :status, :refresh_token)
            ON DUPLICATE KEY UPDATE
                google_id = VALUES(google_id),
                email = VALUES(email),
                name = VALUES(name),
                is_admin = VALUES(is_admin),
                status = VALUES(status),
                refresh_token = VALUES(refresh_token)
        ";

        $statement = $this->connection->prepare($query);
        $statement->execute([
            'google_id' => $user->getGoogleId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'is_admin' => (int) $user->isAdmin(),
            'status' => $user->getStatus(),
            'refresh_token' => $user->getRefreshToken(),
        ]);
    }

    public function update(User $user): void
    {
        $query = "UPDATE users SET refresh_token = :refresh_token, google_id = :google_id, name = :name, status = :status WHERE email = :email";
        $statement = $this->connection->prepare($query);
        $statement->execute([
            'refresh_token' => $user->getRefreshToken(),
            'google_id' => $user->getGoogleId(),
            'name' => $user->getName(),
            'status' => $user->getStatus(),
            'email' => $user->getEmail(),
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
    public function findPreApprovedUsers(): array
    {
        $query = "SELECT id, google_id, email, name, is_admin, status FROM users WHERE status = 'pre_approved'";
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
    public function deletePreApproved(string $email): void
    {
        $query = "DELETE FROM users WHERE email = :email AND status = 'pre_approved'";
        $statement = $this->connection->prepare($query);
        $statement->execute(['email' => $email]);
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

    /**
     * {@inheritdoc}
     */
    public function findAllWithEventStats(): array
    {
        $query = "
            SELECT u.id, u.name, u.email, u.status, 
                   COUNT(e.id) as event_count, 
                   MAX(e.created_at) as last_event_at
            FROM users u
            LEFT JOIN events e ON u.id = e.user_id
            GROUP BY u.id
        ";
        $statement = $this->connection->query($query);
        return $statement->fetchAll();
    }

    /**
     * {@inheritdoc}
     */
    public function deleteUser(int $userId): void
    {
        $query = "DELETE FROM users WHERE id = :id";
        $statement = $this->connection->prepare($query);
        $statement->execute(['id' => $userId]);
    }
}

<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\User;

use App\Domain\User\UserFavoriteRepository;
use App\Infrastructure\Persistence\MySqlRepository;

class MySqlUserFavoriteRepository extends MySqlRepository implements UserFavoriteRepository
{
    public function getFavoriteCategoryIds(int $userId): array
    {
        $query = "SELECT category_id FROM user_favorite_categories WHERE user_id = :user_id";
        $statement = $this->connection->prepare($query);
        $statement->execute(['user_id' => $userId]);
        
        return array_map('intval', $statement->fetchAll(\PDO::FETCH_COLUMN));
    }

    public function addFavorite(int $userId, int $categoryId): void
    {
        $query = "INSERT IGNORE INTO user_favorite_categories (user_id, category_id) VALUES (:user_id, :category_id)";
        $statement = $this->connection->prepare($query);
        $statement->execute(['user_id' => $userId, 'category_id' => $categoryId]);
    }

    public function removeFavorite(int $userId, int $categoryId): void
    {
        $query = "DELETE FROM user_favorite_categories WHERE user_id = :user_id AND category_id = :category_id";
        $statement = $this->connection->prepare($query);
        $statement->execute(['user_id' => $userId, 'category_id' => $categoryId]);
    }

    public function isFavorite(int $userId, int $categoryId): bool
    {
        $query = "SELECT 1 FROM user_favorite_categories WHERE user_id = :user_id AND category_id = :category_id";
        $statement = $this->connection->prepare($query);
        $statement->execute(['user_id' => $userId, 'category_id' => $categoryId]);
        
        return (bool) $statement->fetchColumn();
    }
}

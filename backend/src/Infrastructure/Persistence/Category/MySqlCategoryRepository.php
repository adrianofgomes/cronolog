<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Category;

use App\Domain\Category\Category;
use App\Domain\Category\CategoryRepository;
use App\Infrastructure\Persistence\MySqlRepository;

class MySqlCategoryRepository extends MySqlRepository implements CategoryRepository
{
    public function findByUser(int $userId): array
    {
        $query = "SELECT id, user_id, name, icon, color, metadata_schema FROM categories WHERE user_id = :user_id";
        $statement = $this->connection->prepare($query);
        $statement->execute(['user_id' => $userId]);
        $rows = $statement->fetchAll();

        $categories = [];
        foreach ($rows as $row) {
            $categories[] = $this->mapRowToCategory($row);
        }

        return $categories;
    }

    public function findByIdAndUser(int $id, int $userId): ?Category
    {
        $query = "SELECT id, user_id, name, icon, color, metadata_schema FROM categories WHERE id = :id AND user_id = :user_id";
        $statement = $this->connection->prepare($query);
        $statement->execute(['id' => $id, 'user_id' => $userId]);
        $row = $statement->fetch();

        return $row ? $this->mapRowToCategory($row) : null;
    }

    public function findByNameAndUser(string $name, int $userId): ?Category
    {
        $query = "SELECT id, user_id, name, icon, color, metadata_schema FROM categories WHERE name = :name AND user_id = :user_id";
        $statement = $this->connection->prepare($query);
        $statement->execute(['name' => $name, 'user_id' => $userId]);
        $row = $statement->fetch();

        return $row ? $this->mapRowToCategory($row) : null;
    }

    public function save(Category $category): int
    {
        if ($category->getId() !== null) {
            $query = "
                UPDATE categories 
                SET name = :name, icon = :icon, color = :color, metadata_schema = :metadata_schema
                WHERE id = :id AND user_id = :user_id
            ";
            $params = [
                'id' => $category->getId(),
                'user_id' => $category->getUserId(),
                'name' => $category->getName(),
                'icon' => $category->getIcon(),
                'color' => $category->getColor(),
                'metadata_schema' => json_encode($category->getMetadataSchema()),
            ];
            $statement = $this->connection->prepare($query);
            $statement->execute($params);
            return $category->getId();
        }

        $query = "
            INSERT INTO categories (user_id, name, icon, color, metadata_schema)
            VALUES (:user_id, :name, :icon, :color, :metadata_schema)
        ";
        $params = [
            'user_id' => $category->getUserId(),
            'name' => $category->getName(),
            'icon' => $category->getIcon(),
            'color' => $category->getColor(),
            'metadata_schema' => json_encode($category->getMetadataSchema()),
        ];
        $statement = $this->connection->prepare($query);
        $statement->execute($params);
        return (int) $this->connection->lastInsertId();
    }

    private function mapRowToCategory(array $row): Category
    {
        return new Category(
            (int) $row['id'],
            (int) $row['user_id'],
            $row['name'],
            $row['icon'],
            $row['color'],
            $row['metadata_schema'] ? json_decode($row['metadata_schema'], true) : null
        );
    }
}

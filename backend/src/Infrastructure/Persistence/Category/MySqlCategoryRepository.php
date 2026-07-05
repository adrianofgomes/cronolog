<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Category;

use App\Domain\Category\Category;
use App\Domain\Category\CategoryRepository;
use App\Infrastructure\Persistence\MySqlRepository;

class MySqlCategoryRepository extends MySqlRepository implements CategoryRepository
{
    public function findAll(): array
    {
        $query = "SELECT id, name, icon, color, metadata_schema FROM categories";
        $statement = $this->connection->query($query);
        $rows = $statement->fetchAll();

        $categories = [];
        foreach ($rows as $row) {
            $categories[] = $this->mapRowToCategory($row);
        }

        return $categories;
    }

    public function findById(int $id): ?Category
    {
        $query = "SELECT id, name, icon, color, metadata_schema FROM categories WHERE id = :id";
        $statement = $this->connection->prepare($query);
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();

        return $row ? $this->mapRowToCategory($row) : null;
    }

    public function findByName(string $name): ?Category
    {
        $query = "SELECT id, name, icon, color, metadata_schema FROM categories WHERE name = :name";
        $statement = $this->connection->prepare($query);
        $statement->execute(['name' => $name]);
        $row = $statement->fetch();

        return $row ? $this->mapRowToCategory($row) : null;
    }

    public function save(Category $category): int
    {
        if ($category->getId() !== null) {
            $query = "
                UPDATE categories 
                SET name = :name, icon = :icon, color = :color, metadata_schema = :metadata_schema
                WHERE id = :id
            ";
            $params = [
                'id' => $category->getId(),
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
            INSERT INTO categories (name, icon, color, metadata_schema)
            VALUES (:name, :icon, :color, :metadata_schema)
        ";
        $params = [
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
            0, // user_id não existe mais
            $row['name'],
            $row['icon'],
            $row['color'],
            $row['metadata_schema'] ? json_decode($row['metadata_schema'], true) : null
        );
    }
}

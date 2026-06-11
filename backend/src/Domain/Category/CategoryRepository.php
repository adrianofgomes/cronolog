<?php

declare(strict_types=1);

namespace App\Domain\Category;

interface CategoryRepository
{
    /**
     * @param int $userId
     * @return Category[]
     */
    public function findByUser(int $userId): array;

    /**
     * @param int $id
     * @param int $userId
     * @return Category|null
     */
    public function findByIdAndUser(int $id, int $userId): ?Category;

    /**
     * @param string $name
     * @param int $userId
     * @return Category|null
     */
    public function findByNameAndUser(string $name, int $userId): ?Category;

    /**
     * @param Category $category
     * @return int
     */
    public function save(Category $category): int;
}

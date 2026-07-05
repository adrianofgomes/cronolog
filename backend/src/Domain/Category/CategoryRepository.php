<?php

declare(strict_types=1);

namespace App\Domain\Category;

interface CategoryRepository
{
    /**
     * @return Category[]
     */
    public function findAll(): array;

    /**
     * @param int $id
     * @return Category|null
     */
    public function findById(int $id): ?Category;

    /**
     * @param string $name
     * @return Category|null
     */
    public function findByName(string $name): ?Category;

    /**
     * @param Category $category
     * @return int
     */
    public function save(Category $category): int;
}

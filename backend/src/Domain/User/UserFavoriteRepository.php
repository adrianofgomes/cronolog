<?php

declare(strict_types=1);

namespace App\Domain\User;

interface UserFavoriteRepository
{
    /**
     * @param int $userId
     * @return int[]
     */
    public function getFavoriteCategoryIds(int $userId): array;

    /**
     * @param int $userId
     * @param int $categoryId
     * @return void
     */
    public function addFavorite(int $userId, int $categoryId): void;

    /**
     * @param int $userId
     * @param int $categoryId
     * @return void
     */
    public function removeFavorite(int $userId, int $categoryId): void;

    /**
     * @param int $userId
     * @param int $categoryId
     * @return bool
     */
    public function isFavorite(int $userId, int $categoryId): bool;
}

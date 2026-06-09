<?php

declare(strict_types=1);

namespace App\Domain\User;

interface UserRepository
{
    /**
     * @param string $googleId
     * @return User|null
     */
    public function findUserByGoogleId(string $googleId): ?User;

    /**
     * @param User $user
     * @return void
     */
    public function save(User $user): void;

    /**
     * @return User[]
     */
    public function findPendingUsers(): array;

    /**
     * @param string $googleId
     * @param string $status
     * @return void
     */
    public function updateStatus(string $googleId, string $status): void;
}

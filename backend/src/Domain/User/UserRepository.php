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
     * @param User $user
     * @return void
     */
    public function update(User $user): void;

    /**
     * @param string $email
     * @return User|null
     */
    public function findUserByEmail(string $email): ?User;

    /**
     * @return User[]
     */
    public function findPendingUsers(): array;

    /**
     * @return User[]
     */
    public function findPreApprovedUsers(): array;

    /**
     * @param string $email
     * @return void
     */
    public function deletePreApproved(string $email): void;

    /**
     * @param string $googleId
     * @param string $status
     * @return void
     */
    public function updateStatus(string $googleId, string $status): void;
    /**
     * @return array
     */
    public function findAllWithEventStats(): array;

    /**
     * @param int $userId
     */
    public function deleteUser(int $userId): void;
    /**
     * @param int $userId
     * @param string $status
     */
    public function updateStatusById(int $userId, string $status): void;
}

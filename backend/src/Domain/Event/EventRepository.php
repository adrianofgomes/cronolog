<?php

declare(strict_types=1);

namespace App\Domain\Event;

interface EventRepository
{
    /**
     * @param Event $event
     * @return int The ID of the saved event
     */
    public function save(Event $event): int;

    /**
     * @param int $id
     * @param int $userId
     * @return Event|null
     */
    public function findByIdAndUser(int $id, int $userId): ?Event;

    /**
     * @param int $id
     * @param int $userId
     */
    public function delete(int $id, int $userId): void;

    /**
     * @param int $userId
     * @param int|null $categoryId
     * @param string|null $categoryName
     * @param string|null $status
     * @return Event[]
     */
    public function findByUser(int $userId, ?int $categoryId = null, ?string $categoryName = null, ?string $status = null): array;
}

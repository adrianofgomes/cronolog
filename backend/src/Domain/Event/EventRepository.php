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
     * @param int[]|null $categoryIds
     * @param string|null $categoryName
     * @param string|null $status
     * @param string|null $startDate
     * @param string|null $endDate
     * @param int|null $limit
     * @param int|null $offset
     * @param string|null $searchTerm
     * @return Event[]
     */
    public function findByUser(
        int $userId, 
        ?array $categoryIds = null, 
        ?string $categoryName = null, 
        ?string $status = null,
        ?string $startDate = null,
        ?string $endDate = null,
        ?int $limit = null,
        ?int $offset = null,
        ?string $searchTerm = null
    ): array;

    /**
     * @param int $userId
     * @param int[]|null $categoryIds
     * @param string|null $categoryName
     * @param string|null $status
     * @param string|null $startDate
     * @param string|null $endDate
     * @param string|null $searchTerm
     * @return int
     */
    public function countByUser(
        int $userId, 
        ?array $categoryIds = null, 
        ?string $categoryName = null, 
        ?string $status = null,
        ?string $startDate = null,
        ?string $endDate = null,
        ?string $searchTerm = null
    ): int;
}

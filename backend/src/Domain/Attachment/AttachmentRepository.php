<?php

declare(strict_types=1);

namespace App\Domain\Attachment;

interface AttachmentRepository
{
    public function save(Attachment $attachment): int;
    public function findByEventId(int $eventId): array;
    public function getAllFilenames(): array;
    public function updateDescription(int $attId, int $eventId, string $description): void;
    public function delete(int $attId, int $eventId): void;
}

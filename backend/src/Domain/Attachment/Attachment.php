<?php

declare(strict_types=1);

namespace App\Domain\Attachment;

class Attachment
{
    private ?int $id;
    private int $eventId;
    private string $filename;
    private ?string $description;
    private string $fileType;

    public function __construct(
        ?int $id,
        int $eventId,
        string $filename,
        ?string $description,
        string $fileType
    ) {
        $this->id = $id;
        $this->eventId = $eventId;
        $this->filename = $filename;
        $this->description = $description;
        $this->fileType = $fileType;
    }

    public function getId(): ?int { return $this->id; }
    public function getEventId(): int { return $this->eventId; }
    public function getFilename(): string { return $this->filename; }
    public function getDescription(): ?string { return $this->description; }
    public function getFileType(): string { return $this->fileType; }
}

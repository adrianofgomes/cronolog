<?php

declare(strict_types=1);

namespace App\Domain\Event;

use JsonSerializable;
use DateTime;

class Event implements JsonSerializable
{
    private ?int $id;
    private int $userId;
    private ?int $profileId;
    private int $categoryId;
    private string $title;
    private DateTime $eventDate;
    private ?string $description;
    private ?array $metadata;
    private ?array $tags;
    private string $source;
    private ?string $rawInput;
    private ?string $categoryName;
    private array $attachments = [];

    public function __construct(
        ?int $id,
        int $userId,
        int $categoryId,
        string $title,
        DateTime $eventDate,
        ?int $profileId = null,
        ?string $description = null,
        ?array $metadata = null,
        ?array $tags = null,
        string $source = 'manual',
        ?string $rawInput = null,
        ?string $categoryName = null,
        array $attachments = []
    ) {
        $this->id = $id;
        $this->userId = $userId;
        $this->profileId = $profileId;
        $this->categoryId = $categoryId;
        $this->title = $title;
        $this->eventDate = $eventDate;
        $this->description = $description;
        $this->metadata = $metadata;
        $this->tags = $tags;
        $this->source = $source;
        $this->rawInput = $rawInput;
        $this->categoryName = $categoryName;
        $this->attachments = $attachments;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getProfileId(): ?int
    {
        return $this->profileId;
    }

    public function getCategoryId(): int
    {
        return $this->categoryId;
    }

    public function getCategoryName(): ?string
    {
        return $this->categoryName;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getEventDate(): DateTime
    {
        return $this->eventDate;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getMetadata(): ?array
    {
        return $this->metadata;
    }

    public function getTags(): ?array
    {
        return $this->tags;
    }

    public function getSource(): string
    {
        return $this->source;
    }

    public function getRawInput(): ?string
    {
        return $this->rawInput;
    }

    public function getAttachments(): array
    {
        return $this->attachments;
    }

    public function setCategoryId(int $categoryId): void
    {
        $this->categoryId = $categoryId;
    }

    public function setTitle(string $title): void
    {
        $this->title = $title;
    }

    public function setEventDate(DateTime $eventDate): void
    {
        $this->eventDate = $eventDate;
    }

    public function setProfileId(?int $profileId): void
    {
        $this->profileId = $profileId;
    }

    public function setDescription(?string $description): void
    {
        $this->description = $description;
    }

    public function setMetadata(?array $metadata): void
    {
        $this->metadata = $metadata;
    }

    public function setTags(?array $tags): void
    {
        $this->tags = $tags;
    }

    public function setAttachments(array $attachments): void
    {
        $this->attachments = $attachments;
    }

    #[\ReturnTypeWillChange]
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->userId,
            'profileId' => $this->profileId,
            'categoryId' => $this->categoryId,
            'categoryName' => $this->categoryName,
            'title' => $this->title,
            'eventDate' => $this->eventDate->format('Y-m-d\TH:i:s\Z'),
            'description' => $this->description,
            'metadata' => $this->metadata,
            'tags' => $this->tags,
            'source' => $this->source,
            'rawInput' => $this->rawInput,
            'attachments' => $this->attachments,
        ];
    }
}

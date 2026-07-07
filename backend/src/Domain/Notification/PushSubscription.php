<?php

declare(strict_types=1);

namespace App\Domain\Notification;

use JsonSerializable;

class PushSubscription implements JsonSerializable
{
    private ?int $id;
    private int $userId;
    private string $endpoint;
    private string $p256dh;
    private string $auth;
    private ?string $createdAt;

    public function __construct(
        ?int $id,
        int $userId,
        string $endpoint,
        string $p256dh,
        string $auth,
        ?string $createdAt = null
    ) {
        $this->id = $id;
        $this->userId = $userId;
        $this->endpoint = $endpoint;
        $this->p256dh = $p256dh;
        $this->auth = $auth;
        $this->createdAt = $createdAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getEndpoint(): string
    {
        return $this->endpoint;
    }

    public function getP256dh(): string
    {
        return $this->p256dh;
    }

    public function getAuth(): string
    {
        return $this->auth;
    }

    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }

    #[\ReturnTypeWillChange]
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->userId,
            'endpoint' => $this->endpoint,
            'p256dh' => $this->p256dh,
            'auth' => $this->auth,
            'createdAt' => $this->createdAt,
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Domain\User;

use JsonSerializable;

class User implements JsonSerializable
{
    private ?int $id;
    private string $googleId;
    private string $email;
    private ?string $name;
    private bool $isAdmin;
    private string $status;

    public function __construct(
        ?int $id,
        string $googleId,
        string $email,
        ?string $name,
        bool $isAdmin = false,
        string $status = 'pending'
    ) {
        $this->id = $id;
        $this->googleId = $googleId;
        $this->email = $email;
        $this->name = $name;
        $this->isAdmin = $isAdmin;
        $this->status = $status;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getGoogleId(): string
    {
        return $this->googleId;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function isAdmin(): bool
    {
        return $this->isAdmin;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    #[\ReturnTypeWillChange]
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'googleId' => $this->googleId,
            'email' => $this->email,
            'name' => $this->name,
            'isAdmin' => $this->isAdmin,
            'status' => $this->status,
        ];
    }
}

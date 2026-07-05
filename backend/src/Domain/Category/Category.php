<?php

declare(strict_types=1);

namespace App\Domain\Category;

use JsonSerializable;

class Category implements JsonSerializable
{
    private ?int $id;
    private string $name;
    private ?string $icon;
    private ?string $color;
    private ?array $metadataSchema;

    public function __construct(
        ?int $id,
        string $name,
        ?string $icon = null,
        ?string $color = null,
        ?array $metadataSchema = null
    ) {
        $this->id = $id;
        $this->name = $name;
        $this->icon = $icon;
        $this->color = $color;
        $this->metadataSchema = $metadataSchema;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getIcon(): ?string
    {
        return $this->icon;
    }

    public function getColor(): ?string
    {
        return $this->color;
    }

    public function getMetadataSchema(): ?array
    {
        return $this->metadataSchema;
    }

    #[\ReturnTypeWillChange]
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'icon' => $this->icon,
            'color' => $this->color,
            'metadataSchema' => $this->metadataSchema,
        ];
    }
}

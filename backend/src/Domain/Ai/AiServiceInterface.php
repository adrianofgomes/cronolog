<?php

declare(strict_types=1);

namespace App\Domain\Ai;

interface AiServiceInterface
{
    public function generateContent(string $prompt): string;
}

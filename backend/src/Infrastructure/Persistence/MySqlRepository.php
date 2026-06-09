<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use PDO;

abstract class MySqlRepository
{
    protected PDO $connection;

    public function __construct(PDO $connection)
    {
        $this->connection = $connection;
    }
}

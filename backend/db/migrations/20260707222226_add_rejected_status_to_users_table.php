<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddRejectedStatusToUsersTable extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("ALTER TABLE users MODIFY COLUMN status ENUM('pending', 'active', 'blocked', 'rejected', 'pre_approved') DEFAULT 'pending'");
    }

    public function down(): void
    {
        // Reverter para o estado anterior se necessário
        $this->execute("ALTER TABLE users MODIFY COLUMN status ENUM('pending', 'active', 'blocked') DEFAULT 'pending'");
    }
}

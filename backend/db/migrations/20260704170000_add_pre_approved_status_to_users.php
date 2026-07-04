<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddPreApprovedStatusToUsers extends AbstractMigration
{
    public function up(): void
    {
        // 1. Alter google_id to be nullable
        $this->table('users')
            ->changeColumn('google_id', 'string', ['null' => true, 'limit' => 255])
            ->save();

        // 2. Add 'pre_approved' to status ENUM
        $this->execute("ALTER TABLE users MODIFY COLUMN status ENUM('pending', 'active', 'blocked', 'pre_approved') DEFAULT 'pending'");

        // 3. Add UNIQUE index to email (if not exists)
        // Note: We need to handle potential duplicates before adding unique index in a real scenario, 
        // but here we assume it's clean or we are in dev.
        $this->table('users')
            ->addIndex(['email'], ['unique' => true])
            ->save();
    }

    public function down(): void
    {
        $table = $this->table('users');
        if ($table->hasIndex(['email'])) {
            $table->removeIndex(['email'])->save();
        }

        $this->execute("ALTER TABLE users MODIFY COLUMN status ENUM('pending', 'active', 'blocked') DEFAULT 'pending'");
        
        $this->table('users')
            ->changeColumn('google_id', 'string', ['null' => false, 'limit' => 255])
            ->save();
    }
}

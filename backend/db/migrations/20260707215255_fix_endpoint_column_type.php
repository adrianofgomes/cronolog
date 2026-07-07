<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class FixEndpointColumnType extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('user_push_subscriptions');
        
        // Remove index first to change column type
        if ($table->hasIndex(['endpoint'])) {
            $table->removeIndex(['endpoint']);
        }

        $table->changeColumn('endpoint', 'string', ['length' => 512])
              ->addIndex(['endpoint'], ['unique' => true, 'name' => 'idx_endpoint_unique'])
              ->update();
    }
}

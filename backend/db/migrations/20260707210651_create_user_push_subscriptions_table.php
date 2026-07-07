<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateUserPushSubscriptionsTable extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * https://book.cakephp.org/phinx/0/en/migrations.html#the-change-method
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change(): void
    {
        $table = $this->table('user_push_subscriptions');
        $table->addColumn('user_id', 'integer')
              ->addColumn('endpoint', 'text')
              ->addColumn('p256dh', 'string')
              ->addColumn('auth', 'string')
              ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
              ->addForeignKey('user_id', 'users', 'id', ['delete' => 'CASCADE', 'update' => 'NO_ACTION'])
              ->addIndex(['endpoint'], ['unique' => true, 'name' => 'idx_endpoint_unique', 'limit' => 255])
              ->create();
    }
}

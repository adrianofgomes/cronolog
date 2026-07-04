<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateUserFavoriteCategoriesTable extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('user_favorite_categories', ['id' => false, 'primary_key' => ['user_id', 'category_id']]);
        $table->addColumn('user_id', 'integer', ['null' => false])
              ->addColumn('category_id', 'integer', ['null' => false])
              ->addForeignKey('user_id', 'users', 'id', ['delete' => 'CASCADE'])
              ->addForeignKey('category_id', 'categories', 'id', ['delete' => 'CASCADE'])
              ->save();
    }

    public function down(): void
    {
        $this->table('user_favorite_categories')->drop()->save();
    }
}

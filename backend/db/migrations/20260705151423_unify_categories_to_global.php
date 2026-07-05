<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class UnifyCategoriesToGlobal extends AbstractMigration
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
    public function up(): void
    {
        // Desativar verificações para permitir a migração
        $this->execute("SET FOREIGN_KEY_CHECKS = 0");
        $this->execute("SET SESSION sql_mode = ''");

        // 1. Identificar categorias únicas por nome (mantendo a primeira instância de cada)
        $this->execute("
            CREATE TEMPORARY TABLE temp_unique_categories AS
            SELECT MIN(id) as id, name, icon, color, metadata_schema
            FROM categories
            GROUP BY name
        ");

        // 2. Limpar a tabela original (agora possível com FKEY desativado)
        $this->execute("TRUNCATE TABLE categories");

        // 3. Reinserir as categorias únicas
        $this->execute("
            INSERT INTO categories (id, name, icon, color, metadata_schema)
            SELECT id, name, icon, color, metadata_schema
            FROM temp_unique_categories
        ");

        // 4. Remover a FK antes de remover a coluna
        $this->execute("ALTER TABLE categories DROP FOREIGN KEY categories_ibfk_1");

        // 5. Remover a coluna user_id
        $table = $this->table('categories');
        $table->removeColumn('user_id')->update();
        
        $this->execute("SET FOREIGN_KEY_CHECKS = 1");
    }

    public function down(): void
    {
        $this->execute("SET FOREIGN_KEY_CHECKS = 0");
        $table = $this->table('categories');
        $table->addColumn('user_id', 'integer', ['null' => true])->update();
        $this->execute("SET FOREIGN_KEY_CHECKS = 1");
    }
}

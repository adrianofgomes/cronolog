<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class StandardizeMonetaryFieldToValor extends AbstractMigration
{
    public function up(): void
    {
        // 1. Update Category Schema for "Abastecimento"
        $categories = $this->fetchAll("SELECT id, metadata_schema FROM categories WHERE name = 'Abastecimento'");
        foreach ($categories as $cat) {
            $schema = json_decode($cat['metadata_schema'], true);
            if (isset($schema['fields'])) {
                foreach ($schema['fields'] as &$field) {
                    if ($field['name'] === 'total') {
                        $field['name'] = 'valor';
                        $field['label'] = 'Valor Total (R$)'; // Standardizing label too
                    }
                }
                $updatedSchema = json_encode($schema);
                $this->execute("UPDATE categories SET metadata_schema = '" . addslashes($updatedSchema) . "' WHERE id = " . $cat['id']);
            }
        }

        // 2. Update existing Events Metadata for "Abastecimento"
        // We look for categories named "Abastecimento" to get their IDs
        $catIds = array_column($categories, 'id');
        if (!empty($catIds)) {
            $idsList = implode(',', $catIds);
            $events = $this->fetchAll("SELECT id, metadata FROM events WHERE category_id IN ($idsList)");
            foreach ($events as $event) {
                $metadata = json_decode($event['metadata'], true);
                if (isset($metadata['total'])) {
                    $metadata['valor'] = $metadata['total'];
                    unset($metadata['total']);
                    $updatedMetadata = json_encode($metadata);
                    $this->execute("UPDATE events SET metadata = '" . addslashes($updatedMetadata) . "' WHERE id = " . $event['id']);
                }
            }
        }
    }

    public function down(): void
    {
        // Logic to revert if necessary (omitted for brevity but recommended in production)
    }
}

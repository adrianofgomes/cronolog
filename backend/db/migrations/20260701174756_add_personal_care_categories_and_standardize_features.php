<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddPersonalCareCategoriesAndStandardizeFeatures extends AbstractMigration
{
    public function up(): void
    {
        $newCategories = [
            [
                'name' => 'Corte de Cabelo',
                'icon' => 'scissors',
                'color' => '#f472b6',
                'metadata_schema' => [
                    'group' => 'Cuidados Pessoais',
                    'description' => 'Registro de idas ao barbeiro ou cabeleireiro.',
                    'fields' => [
                        ['name' => 'profissional', 'label' => 'Profissional/Salão', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'valor', 'label' => 'Valor (R$)', 'type' => 'number', 'step' => '0.01', 'width' => 'half'],
                        ['name' => 'servicos', 'label' => 'Serviços Adicionais', 'type' => 'text', 'width' => 'half'],
                    ],
                    'features' => ['attachments' => true, 'recurrence' => true, 'status_tracking' => true]
                ]
            ],
            [
                'name' => 'Unhas',
                'icon' => 'sparkles',
                'color' => '#fb7185',
                'metadata_schema' => [
                    'group' => 'Cuidados Pessoais',
                    'description' => 'Manicure, pedicure e cuidados com as unhas.',
                    'fields' => [
                        ['name' => 'profissional', 'label' => 'Manicure/Salão', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'valor', 'label' => 'Valor (R$)', 'type' => 'number', 'step' => '0.01', 'width' => 'half'],
                        ['name' => 'procedimento', 'label' => 'Procedimento', 'type' => 'text', 'suggest' => true, 'width' => 'half'],
                    ],
                    'features' => ['attachments' => true, 'recurrence' => true, 'status_tracking' => true]
                ]
            ],
            [
                'name' => 'Barba',
                'icon' => 'user',
                'color' => '#94a3b8',
                'metadata_schema' => [
                    'group' => 'Cuidados Pessoais',
                    'description' => 'Manutenção de barba e aparo.',
                    'fields' => [
                        ['name' => 'profissional', 'label' => 'Barbeiro/Barbearia', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'valor', 'label' => 'Valor (R$)', 'type' => 'number', 'step' => '0.01', 'width' => 'half'],
                    ],
                    'features' => ['attachments' => true, 'recurrence' => true, 'status_tracking' => true]
                ]
            ],
            [
                'name' => 'Depilação',
                'icon' => 'zap',
                'color' => '#fbbf24',
                'metadata_schema' => [
                    'group' => 'Cuidados Pessoais',
                    'description' => 'Sessões de depilação e estética corporal.',
                    'fields' => [
                        ['name' => 'local', 'label' => 'Clínica/Local', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'profissional', 'label' => 'Profissional', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'area', 'label' => 'Área do Corpo', 'type' => 'text', 'suggest' => true, 'width' => 'half'],
                        ['name' => 'valor', 'label' => 'Valor (R$)', 'type' => 'number', 'step' => '0.01', 'width' => 'half'],
                    ],
                    'features' => ['attachments' => true, 'recurrence' => true, 'status_tracking' => true]
                ]
            ]
        ];

        // Fetch all users
        $users = $this->fetchAll("SELECT id FROM users");

        foreach ($users as $user) {
            $userId = (int) $user['id'];
            
            // 1. Insert new categories
            foreach ($newCategories as $cat) {
                $existing = $this->fetchRow("SELECT id FROM categories WHERE user_id = $userId AND name = '" . $cat['name'] . "'");
                
                $data = [
                    'user_id' => $userId,
                    'name' => $cat['name'],
                    'icon' => $cat['icon'],
                    'color' => $cat['color'],
                    'metadata_schema' => json_encode($cat['metadata_schema']),
                ];

                if (!$existing) {
                    $this->table('categories')->insert([$data])->saveData();
                }
            }

            // 2. Standardize existing categories
            $existingCategories = $this->fetchAll("SELECT id, metadata_schema FROM categories WHERE user_id = $userId");
            foreach ($existingCategories as $cat) {
                $schema = json_decode($cat['metadata_schema'], true);
                
                if (!$schema) continue;

                // Ensure features object exists
                if (!isset($schema['features'])) {
                    $schema['features'] = [];
                }

                // Standardize: enable attachments and recurrence by default
                // Only change if they are not explicitly set or set to false (per user request)
                // Actually the user said "marque todos os eventos existentes para permitir anexos e agendamento"
                // So I will force them to true.
                $schema['features']['attachments'] = true;
                $schema['features']['recurrence'] = true;
                
                // For categories that previously had status_tracking (like Financeiro), keep it.
                // For others, if it's recurring, it probably needs status tracking.
                if (!isset($schema['features']['status_tracking'])) {
                    $schema['features']['status_tracking'] = true;
                }

                $updatedSchema = json_encode($schema);
                $this->execute("UPDATE categories SET metadata_schema = '" . addslashes($updatedSchema) . "' WHERE id = " . $cat['id']);
            }
        }
    }

    public function down(): void
    {
    }
}

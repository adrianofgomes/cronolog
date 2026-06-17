<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

class SeedDefaultCategoriesWithSchemas extends AbstractMigration
{
    public function up(): void
    {
        $categories = [
            [
                'name' => 'Abastecimento',
                'icon' => 'fuel',
                'color' => '#3b82f6',
                'metadata_schema' => [
                    'group' => 'Veículo',
                    'description' => 'Registro de combustível, KM e valores pagos.',
                    'preset' => 'vehicle',
                    'fields' => [
                        ['name' => 'carro', 'label' => 'Carro', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'km_atual', 'label' => 'KM Atual', 'type' => 'number', 'width' => 'half'],
                        ['name' => 'litros', 'label' => 'Litros', 'type' => 'number', 'step' => '0.01', 'width' => 'half'],
                        ['name' => 'total', 'label' => 'Total Pago (R$)', 'type' => 'number', 'step' => '0.01', 'width' => 'half'],
                        ['name' => 'posto', 'label' => 'Posto', 'type' => 'text', 'suggest' => true, 'width' => 'half'],
                    ],
                    'features' => ['attachments' => true, 'recurrence' => false]
                ]
            ],
            [
                'name' => 'Manutenção',
                'icon' => 'wrench',
                'color' => '#f59e0b',
                'metadata_schema' => [
                    'group' => 'Veículo',
                    'description' => 'Revisões, trocas de óleo, peças e serviços mecânicos.',
                    'preset' => 'vehicle',
                    'fields' => [
                        ['name' => 'carro', 'label' => 'Carro', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'km_atual', 'label' => 'KM Atual', 'type' => 'number', 'width' => 'half'],
                        ['name' => 'servico', 'label' => 'Serviço', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'pecas', 'label' => 'Peças', 'type' => 'text', 'width' => 'full'],
                        ['name' => 'custo_mao_obra', 'label' => 'Mão de Obra (R$)', 'type' => 'number', 'step' => '0.01', 'width' => 'half'],
                        ['name' => 'custo_pecas', 'label' => 'Peças (R$)', 'type' => 'number', 'step' => '0.01', 'width' => 'half'],
                    ],
                    'features' => ['attachments' => true, 'recurrence' => false]
                ]
            ],
            [
                'name' => 'Exame Médico',
                'icon' => 'stethoscope',
                'color' => '#10b981',
                'metadata_schema' => [
                    'group' => 'Saúde',
                    'description' => 'Resultados de exames, laudos e arquivos PDF/Imagens.',
                    'preset' => 'health',
                    'fields' => [
                        ['name' => 'paciente', 'label' => 'Paciente', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'exame', 'label' => 'Exame', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'local', 'label' => 'Local/Laboratório', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'medico', 'label' => 'Médico Solicitante', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'resultado', 'label' => 'Resultado/Notas', 'type' => 'textarea', 'width' => 'full'],
                    ],
                    'features' => ['attachments' => true, 'recurrence' => false]
                ]
            ],
            [
                'name' => 'Consulta',
                'icon' => 'clipboard-list',
                'color' => '#8b5cf6',
                'metadata_schema' => [
                    'group' => 'Saúde',
                    'description' => 'Agendamentos e registros de visitas ao médico.',
                    'preset' => 'health',
                    'fields' => [
                        ['name' => 'paciente', 'label' => 'Paciente', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'especialidade', 'label' => 'Especialidade', 'type' => 'text', 'suggest' => true, 'width' => 'half'],
                        ['name' => 'medico', 'label' => 'Médico', 'type' => 'text', 'suggest' => true, 'width' => 'half'],
                        ['name' => 'local', 'label' => 'Local/Clínica', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'motivo', 'label' => 'Motivo/Sintomas', 'type' => 'textarea', 'width' => 'full'],
                        ['name' => 'diagnostico', 'label' => 'Diagnóstico/Conduta', 'type' => 'textarea', 'width' => 'full'],
                    ],
                    'features' => ['attachments' => true, 'recurrence' => false]
                ]
            ],
            [
                'name' => 'Vacina',
                'icon' => 'syringe',
                'color' => '#ec4899',
                'metadata_schema' => [
                    'group' => 'Saúde',
                    'description' => 'Controle de imunizações e doses tomadas.',
                    'preset' => 'health',
                    'fields' => [
                        ['name' => 'paciente', 'label' => 'Paciente', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'vacina', 'label' => 'Vacina', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'dose', 'label' => 'Dose (Ex: 1ª, Reforço)', 'type' => 'text', 'suggest' => true, 'width' => 'half'],
                        ['name' => 'lote', 'label' => 'Lote', 'type' => 'text', 'width' => 'half'],
                        ['name' => 'local', 'label' => 'Local/Posto', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                    ],
                    'features' => ['attachments' => true, 'recurrence' => false]
                ]
            ],
            [
                'name' => 'Remédios',
                'icon' => 'pill',
                'color' => '#ef4444',
                'metadata_schema' => [
                    'group' => 'Saúde',
                    'description' => 'Uso de medicamentos e tratamentos contínuos.',
                    'preset' => 'health',
                    'fields' => [
                        ['name' => 'paciente', 'label' => 'Paciente', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'medicamento', 'label' => 'Medicamento', 'type' => 'text', 'suggest' => true, 'width' => 'full'],
                        ['name' => 'dosagem', 'label' => 'Dosagem', 'type' => 'text', 'suggest' => true, 'width' => 'half'],
                        ['name' => 'frequencia', 'label' => 'Frequência', 'type' => 'text', 'suggest' => true, 'width' => 'half'],
                        ['name' => 'prescrito_por', 'label' => 'Prescrito por', 'type' => 'text', 'suggest' => true, 'width' => 'half'],
                        ['name' => 'duracao', 'label' => 'Duração', 'type' => 'text', 'width' => 'half'],
                        ['name' => 'observacoes', 'label' => 'Observações', 'type' => 'textarea', 'width' => 'full'],
                    ],
                    'features' => ['attachments' => true, 'recurrence' => false]
                ]
            ],
            [
                'name' => 'Conta a Pagar',
                'icon' => 'banknote',
                'color' => '#059669',
                'metadata_schema' => [
                    'group' => 'Financeiro',
                    'description' => 'Lembretes de pagamentos, boletos e contas recorrentes.',
                    'fields' => [
                        ['name' => 'valor', 'label' => 'Valor (R$)', 'type' => 'number', 'step' => '0.01', 'width' => 'full'],
                        ['name' => 'beneficiario', 'label' => 'Beneficiário', 'type' => 'text', 'suggest' => true, 'width' => 'half'],
                        ['name' => 'categoria_pagamento', 'label' => 'Categoria de Pagamento', 'type' => 'text', 'suggest' => true, 'width' => 'half'],
                    ],
                    'features' => ['attachments' => true, 'recurrence' => true, 'status_tracking' => true]
                ]
            ],
            [
                'name' => 'Geral',
                'icon' => 'tag',
                'color' => '#6b7280',
                'metadata_schema' => [
                    'group' => 'Outros',
                    'description' => 'Outros tipos de registros e anotações gerais.',
                    'fields' => [
                        ['name' => 'notas', 'label' => 'Notas', 'type' => 'textarea', 'width' => 'full'],
                    ],
                    'features' => ['attachments' => true, 'recurrence' => false]
                ]
            ]
        ];

        // Fetch all users
        $users = $this->fetchAll("SELECT id FROM users");

        foreach ($users as $user) {
            $userId = (int) $user['id'];
            foreach ($categories as $cat) {
                // Check if category already exists for this user
                $existing = $this->fetchRow("SELECT id FROM categories WHERE user_id = $userId AND name = '" . $cat['name'] . "'");
                
                $data = [
                    'user_id' => $userId,
                    'name' => $cat['name'],
                    'icon' => $cat['icon'],
                    'color' => $cat['color'],
                    'metadata_schema' => json_encode($cat['metadata_schema']),
                ];

                $table = $this->table('categories');
                if ($existing) {
                    $this->execute("UPDATE categories SET icon = '{$data['icon']}', color = '{$data['color']}', metadata_schema = '" . addslashes($data['metadata_schema']) . "' WHERE id = " . $existing['id']);
                } else {
                    $table->insert([$data])->saveData();
                }
            }
        }
    }

    public function down(): void
    {
    }
}

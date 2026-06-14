<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

class AddScheduledAndRecurrenceToEvents extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('events');
        $table->addColumn('status', 'enum', [
                'values' => ['pending', 'completed', 'cancelled'],
                'default' => 'completed',
                'after' => 'raw_input'
            ])
            ->addColumn('is_recurring', 'boolean', [
                'default' => false,
                'after' => 'status'
            ])
            ->addColumn('recurrence_interval', 'integer', [
                'null' => true,
                'after' => 'is_recurring'
            ])
            ->addColumn('recurrence_type', 'enum', [
                'values' => ['days', 'weeks', 'months', 'years'],
                'null' => true,
                'after' => 'recurrence_interval'
            ])
            ->update();
    }
}

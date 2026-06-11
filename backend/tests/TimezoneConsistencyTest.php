<?php

declare(strict_types=1);

namespace App\Tests;

use App\Domain\Event\Event;
use DateTime;
use PHPUnit\Framework\TestCase;

class TimezoneConsistencyTest extends TestCase
{
    protected function setUp(): void
    {
        date_default_timezone_set('UTC');
    }

    public function testEventJsonSerializationUsesISO8601UTC()
    {
        $date = new DateTime('2026-06-11 14:00:00');
        $event = new Event(
            1, 1, 1, 'Test Event', $date, null, null, null, null, 'manual', null, 'Category'
        );

        $json = $event->jsonSerialize();
        
        $this->assertEquals('2026-06-11T14:00:00Z', $json['eventDate']);
    }

    public function testDateTimeParsingOfISO8601()
    {
        // When receiving from frontend
        $isoDate = '2026-06-11T14:00:00.000Z';
        $date = new DateTime($isoDate);
        
        $this->assertEquals(0, $date->getOffset());
        $this->assertEquals('2026-06-11 14:00:00', $date->format('Y-m-d H:i:s'));
    }

    public function testDateTimeParsingOfLocalTimeStringsWhenDefaultIsUTC()
    {
        // If frontend sends naive string, it should be treated as UTC by the backend now
        $naiveDate = '2026-06-11 14:00:00';
        $date = new DateTime($naiveDate);
        
        $this->assertEquals(0, $date->getOffset());
        $this->assertEquals('14:00:00', $date->format('H:i:s'));
    }
}

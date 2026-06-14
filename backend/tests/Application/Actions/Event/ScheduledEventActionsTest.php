<?php

declare(strict_types=1);

namespace App\Tests\Application\Actions\Event;

use App\Tests\TestCase;
use App\Domain\User\UserRepository;
use App\Domain\User\User;
use App\Domain\Event\EventRepository;
use App\Domain\Category\CategoryRepository;
use App\Domain\Category\Category;
use App\Domain\Event\Event;
use DateTime;

class ScheduledEventActionsTest extends TestCase
{
    public function testCreateScheduledEvent()
    {
        $user = new User(1, '123456789', 'admin@example.com', 'Admin User', true, 'active');
        $category = new Category(6, 1, 'Conta a Pagar');

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $categoryRepository = $this->createMock(CategoryRepository::class);
        $categoryRepository->method('findByNameAndUser')->willReturn($category);

        $eventRepository = $this->createMock(EventRepository::class);
        
        // Expect save to be called with correct data
        $eventRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(function (Event $event) {
                return $event->getStatus() === 'pending' 
                    && $event->isRecurring() === true
                    && $event->getRecurrenceInterval() === 1
                    && $event->getRecurrenceType() === 'months';
            }))
            ->willReturn(1);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
            CategoryRepository::class => $categoryRepository,
            EventRepository::class => $eventRepository,
        ]);

        $request = $this->createRequest('POST', '/events');
        $request = $request->withHeader('Authorization', 'Bearer test-token');
        $request = $request->withHeader('Content-Type', 'application/json');
        $request->getBody()->write(json_encode([
            'categoryName' => 'Conta a Pagar',
            'title' => 'Aluguel',
            'status' => 'pending',
            'isRecurring' => true,
            'recurrenceInterval' => 1,
            'recurrenceType' => 'months',
            'metadata' => ['valor' => 1500]
        ]));

        $response = $app->handle($request);
        $this->assertEquals(201, $response->getStatusCode());
    }

    public function testCompleteRecurringEventCreatesNextOne()
    {
        $user = new User(1, '123456789', 'admin@example.com', 'Admin User', true, 'active');
        $category = new Category(6, 1, 'Conta a Pagar');
        $date = new DateTime('2026-06-14 10:00:00');
        
        $pendingEvent = new Event(
            1, 1, 6, 'Aluguel', $date, null, null, ['valor' => 1500], [], 'manual', null, 'Conta a Pagar', [],
            'pending', true, 1, 'months'
        );

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $eventRepository = $this->createMock(EventRepository::class);
        $eventRepository->method('findByIdAndUser')->willReturn($pendingEvent);
        
        // Use a counter or specific callbacks to verify multiple calls to save
        $callIndex = 0;
        $eventRepository->expects($this->exactly(2))
            ->method('save')
            ->with($this->callback(function (Event $event) use (&$callIndex) {
                $callIndex++;
                if ($callIndex === 1) {
                    // First call: Update current event to completed
                    return $event->getId() === 1 && $event->getStatus() === 'completed';
                } else {
                    // Second call: Create next recurring event
                    return $event->getId() === null 
                        && $event->getStatus() === 'pending'
                        && $event->getEventDate()->format('Y-m-d') === '2026-07-14';
                }
            }))
            ->willReturnOnConsecutiveCalls(1, 2);

        $categoryRepository = $this->createMock(CategoryRepository::class);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
            EventRepository::class => $eventRepository,
            CategoryRepository::class => $categoryRepository,
        ]);

        $request = $this->createRequest('PUT', '/events/1');
        $request = $request->withHeader('Authorization', 'Bearer test-token');
        $request = $request->withHeader('Content-Type', 'application/json');
        $request->getBody()->write(json_encode([
            'status' => 'completed'
        ]));

        $response = $app->handle($request);
        $this->assertEquals(200, $response->getStatusCode());
    }
}

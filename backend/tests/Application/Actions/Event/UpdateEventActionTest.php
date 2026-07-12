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

class UpdateEventActionTest extends TestCase
{
    public function testUpdateEventWithInvalidMetadataTypeReturns400()
    {
        $user = new User(1, '123456789', 'admin@example.com', 'Admin User', true, 'active');
        $event = new Event(1, 1, 1, 'Test Event', new DateTime());

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $eventRepository = $this->createMock(EventRepository::class);
        $eventRepository->method('findByIdAndUser')->willReturn($event);

        $categoryRepository = $this->createMock(CategoryRepository::class);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
            EventRepository::class => $eventRepository,
            CategoryRepository::class => $categoryRepository,
        ]);

        $request = $this->createRequest('PUT', '/events/1');
        $request = $request->withHeader('Authorization', 'Bearer test-token');
        $request = $request->withHeader('Content-Type', 'application/json');
        
        // metadata should be an array, sending a string here should now return 400
        $request->getBody()->write(json_encode([
            'metadata' => 'not an array'
        ]));

        $response = $app->handle($request);
        
        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testUpdateEventWithInvalidDateFormatReturns400()
    {
        $user = new User(1, '123456789', 'admin@example.com', 'Admin User', true, 'active');
        $event = new Event(1, 1, 1, 'Test Event', new DateTime());

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $eventRepository = $this->createMock(EventRepository::class);
        $eventRepository->method('findByIdAndUser')->willReturn($event);

        $categoryRepository = $this->createMock(CategoryRepository::class);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
            EventRepository::class => $eventRepository,
            CategoryRepository::class => $categoryRepository,
        ]);

        $request = $this->createRequest('PUT', '/events/1');
        $request = $request->withHeader('Authorization', 'Bearer test-token');
        $request = $request->withHeader('Content-Type', 'application/json');
        
        // Invalid date format
        $request->getBody()->write(json_encode([
            'eventDate' => 'invalid-date'
        ]));

        $response = $app->handle($request);
        
        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testUpdateEventWithCategoryIdWorks()
    {
        $user = new User(1, '123456789', 'admin@example.com', 'Admin User', true, 'active');
        $event = new Event(1, 1, 1, 'Test Event', new DateTime());
        $category = new Category(2, 'Nova Categoria');

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $eventRepository = $this->createMock(EventRepository::class);
        $eventRepository->method('findByIdAndUser')->willReturn($event);
        $eventRepository->expects($this->once())->method('save');

        $categoryRepository = $this->createMock(CategoryRepository::class);
        $categoryRepository->method('findById')->willReturn($category);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
            EventRepository::class => $eventRepository,
            CategoryRepository::class => $categoryRepository,
        ]);

        $request = $this->createRequest('PUT', '/events/1');
        $request = $request->withHeader('Authorization', 'Bearer test-token');
        $request = $request->withHeader('Content-Type', 'application/json');
        
        $request->getBody()->write(json_encode([
            'categoryId' => 2
        ]));

        $response = $app->handle($request);
        
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals(2, $event->getCategoryId());
    }

    public function testUpdateEventWithNullProfileIdWorks()
    {
        $user = new User(1, '123456789', 'admin@example.com', 'Admin User', true, 'active');
        // Start with a profileId = 10
        $event = new Event(1, 1, 1, 'Test Event', new DateTime(), 10);

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $eventRepository = $this->createMock(EventRepository::class);
        $eventRepository->method('findByIdAndUser')->willReturn($event);
        $eventRepository->expects($this->once())->method('save');

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
            'profileId' => null
        ]));

        $response = $app->handle($request);
        
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertNull($event->getProfileId());
    }
}

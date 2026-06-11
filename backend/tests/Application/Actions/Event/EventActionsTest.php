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

class EventActionsTest extends TestCase
{
    public function testCreateRefuelingEventWithPartialData()
    {
        $user = new User(1, '123456789', 'admin@example.com', 'Admin User', true, 'active');
        $category = new Category(1, 1, 'Abastecimento');

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $categoryRepository = $this->createMock(CategoryRepository::class);
        $categoryRepository->method('findByNameAndUser')->willReturn($category);

        $eventRepository = $this->createMock(EventRepository::class);
        $eventRepository->method('save')->willReturn(1);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
            CategoryRepository::class => $categoryRepository,
            EventRepository::class => $eventRepository,
        ]);

        $request = $this->createRequest('POST', '/events');
        $request = $request->withHeader('Authorization', 'Bearer test-token');
        $request = $request->withHeader('Content-Type', 'application/json');
        $request->getBody()->write(json_encode([
            'categoryName' => 'Abastecimento',
            'title' => 'Abastecimento Carro',
            'metadata' => [
                'posto' => 'Shell',
                'tipo_combustivel' => 'Gasolina Aditivada'
            ]
        ]));

        $response = $app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertEquals(1, $payload['data']['id']);
    }

    public function testListEvents()
    {
        $user = new User(1, '123456789', 'admin@example.com', 'Admin User', true, 'active');

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $eventRepository = $this->createMock(EventRepository::class);
        // Garante que o repositório seja chamado com o ID do usuário autenticado (1)
        $eventRepository->expects($this->once())
            ->method('findByUser')
            ->with($this->equalTo(1))
            ->willReturn([]);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
            EventRepository::class => $eventRepository,
        ]);

        $request = $this->createRequest('GET', '/events');
        $request = $request->withHeader('Authorization', 'Bearer test-token');

        $response = $app->handle($request);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testUserCannotListOtherUsersEvents()
    {
        $authenticatedUser = new User(1, 'user1', 'user1@example.com', 'User One', false, 'active');
        $otherUserId = 2;

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($authenticatedUser);

        $eventRepository = $this->createMock(EventRepository::class);
        
        // O repositório DEVE ser chamado com o ID 1 (quem está logado)
        // Mesmo que houvesse uma tentativa de passar outro ID via parâmetro (se a API suportasse),
        // o Action deve ignorar e usar o ID da sessão/token.
        $eventRepository->expects($this->once())
            ->method('findByUser')
            ->with($this->equalTo(1)) 
            ->willReturn([]);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
            EventRepository::class => $eventRepository,
        ]);

        $request = $this->createRequest('GET', '/events');
        $request = $request->withHeader('Authorization', 'Bearer test-token');
        
        $response = $app->handle($request);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testDeleteEvent()
    {
        $user = new User(1, '123456789', 'admin@example.com', 'Admin User', true, 'active');
        $event = new Event(1, 1, 1, 'Test Event', new \DateTime());

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $eventRepository = $this->createMock(EventRepository::class);
        $eventRepository->method('findByIdAndUser')->willReturn($event);
        $eventRepository->expects($this->once())->method('delete')->with(1, 1);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
            EventRepository::class => $eventRepository,
        ]);

        $request = $this->createRequest('DELETE', '/events/1');
        $request = $request->withHeader('Authorization', 'Bearer test-token');

        $response = $app->handle($request);
        $this->assertEquals(200, $response->getStatusCode());
    }
}

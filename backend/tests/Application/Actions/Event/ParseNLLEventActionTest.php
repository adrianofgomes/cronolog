<?php

declare(strict_types=1);

namespace App\Tests\Application\Actions\Event;

use App\Tests\TestCase;
use App\Domain\Ai\AiServiceInterface;
use App\Domain\Category\CategoryRepository;
use App\Domain\Category\Category;
use App\Domain\Event\EventRepository;
use App\Domain\User\UserRepository;
use App\Domain\User\User;

class ParseNLLEventActionTest extends TestCase
{
    public function testParseEventSuccess()
    {
        $user = new User(1, '123456789', 'admin@example.com', 'Admin User', true, 'active');
        $category = new Category(1, 'Abastecimento', 'fuel', '#3b82f6', ['fields' => [['name' => 'carro']]]);

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $categoryRepository = $this->createMock(CategoryRepository::class);
        $categoryRepository->method('findAll')->willReturn([$category]);

        $eventRepository = $this->createMock(EventRepository::class);
        $eventRepository->method('findByUser')->willReturn([]);

        $aiService = $this->createMock(AiServiceInterface::class);
        $expectedJson = json_encode([
            'category_id' => 1,
            'date' => '2026-07-05 15:00:00',
            'description' => 'Abastecimento',
            'status' => 'completed',
            'metadata' => ['carro' => 'Carro 1']
        ]);
        $aiService->method('generateContent')->willReturn($expectedJson);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
            CategoryRepository::class => $categoryRepository,
            EventRepository::class => $eventRepository,
            AiServiceInterface::class => $aiService,
        ]);

        $request = $this->createRequest('POST', '/events/parse-nll');
        $request = $request->withHeader('Authorization', 'Bearer test-token');
        $request = $request->withHeader('Content-Type', 'application/json');
        $request->getBody()->write(json_encode([
            'text' => 'Abasteci o Carro 1 hoje'
        ]));

        $response = $app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals(1, $payload['data']['category_id']);
        $this->assertEquals('Carro 1', $payload['data']['metadata']['carro']);
    }
}

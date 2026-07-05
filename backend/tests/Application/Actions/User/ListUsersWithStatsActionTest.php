<?php

declare(strict_types=1);

namespace App\Tests\Application\Actions\User;

use App\Tests\TestCase;
use App\Domain\User\UserRepository;
use App\Domain\User\User;

class ListUsersWithStatsActionTest extends TestCase
{
    public function testListUsersWithStatsSuccess()
    {
        $admin = new User(1, 'admin_google', 'admin@example.com', 'Admin', true, 'active');

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($admin);
        
        $stats = [
            ['id' => 1, 'name' => 'Admin', 'email' => 'admin@example.com', 'status' => 'active', 'event_count' => 10, 'last_event_at' => '2026-07-05 10:00:00']
        ];
        $userRepository->method('findAllWithEventStats')->willReturn($stats);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
        ]);

        $request = $this->createRequest('GET', '/users/admin/stats');
        $request = $request->withHeader('Authorization', 'Bearer test-token');

        $response = $app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertCount(1, $payload['data']);
        $this->assertEquals(10, $payload['data'][0]['event_count']);
    }
}

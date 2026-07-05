<?php

declare(strict_types=1);

namespace App\Tests\Application\Actions\User;

use App\Tests\TestCase;
use App\Domain\User\UserRepository;
use App\Domain\User\User;

class ListPendingUsersActionTest extends TestCase
{
    public function testListPendingUsersSuccess()
    {
        // O usuário autenticado DEVE ser admin para passar no AdminMiddleware
        $user = new User(1, 'google1', 'admin@example.com', 'Admin User', true, 'active');
        $user1 = new User(1, 'google1', 'user1@example.com', 'User One', false, 'pending');
        $user2 = new User(2, 'google2', 'user2@example.com', 'User Two', false, 'pending');

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);
        $userRepository->method('findPendingUsers')->willReturn([$user1, $user2]);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
        ]);

        $request = $this->createRequest('GET', '/users/admin/pending');
        $request = $request->withHeader('Authorization', 'Bearer test-token');

        $response = $app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertCount(2, $payload['data']);
        $this->assertEquals('user1@example.com', $payload['data'][0]['email']);
    }
}

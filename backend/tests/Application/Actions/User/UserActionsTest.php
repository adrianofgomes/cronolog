<?php

declare(strict_types=1);

namespace App\Tests\Application\Actions\User;

use App\Tests\TestCase;
use App\Domain\User\UserRepository;
use App\Domain\User\User;

class UserActionsTest extends TestCase
{
    public function testIsAdminActionUnauthenticated()
    {
        $userRepository = $this->createMock(UserRepository::class);
        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
        ]);
        
        $request = $this->createRequest('GET', '/users/me/is-admin');
        
        $response = $app->handle($request);
        $this->assertEquals(401, $response->getStatusCode());
    }

    public function testIsAdminActionWithMockToken()
    {
        $user = new User(1, '123456789', 'admin@example.com', 'Admin User', true, 'active');
        
        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
        ]);
        
        $request = $this->createRequest('GET', '/users/123456789/is-admin');
        $request = $request->withHeader('Authorization', 'Bearer test-token');
        
        $response = $app->handle($request);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testAdminRouteAccessDeniedForNormalUser()
    {
        $user = new User(2, '987654321', 'newuser@example.com', 'New User', false, 'active');

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
        ]);
        
        $request = $this->createRequest('GET', '/users/admin/pending');
        $request = $request->withHeader('Authorization', 'Bearer new-user-token');
        
        $response = $app->handle($request);
        $this->assertEquals(403, $response->getStatusCode());
    }
}

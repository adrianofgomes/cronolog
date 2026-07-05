<?php

declare(strict_types=1);

namespace App\Tests\Application\Actions\User;

use App\Tests\TestCase;
use App\Domain\User\UserRepository;
use App\Domain\User\User;

class RejectUserActionTest extends TestCase
{
    public function testRejectUserSuccess()
    {
        $admin = new User(1, 'admin_google', 'admin@example.com', 'Admin', true, 'active');

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($admin);
        $userRepository->expects($this->once())->method('updateStatusById')->with(5, 'rejected');

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
        ]);

        $request = $this->createRequest('POST', '/users/admin/5/reject');
        $request = $request->withHeader('Authorization', 'Bearer test-token');

        $response = $app->handle($request);
        $this->assertEquals(200, $response->getStatusCode());
    }
}

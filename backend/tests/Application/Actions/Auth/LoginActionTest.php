<?php

declare(strict_types=1);

namespace App\Tests\Application\Actions\Auth;

use App\Domain\User\User;
use App\Domain\User\UserRepository;
use App\Tests\TestCase;
use Firebase\JWT\JWT;
use App\Application\Settings\SettingsInterface;

class LoginActionTest extends TestCase
{
    public function testAction()
    {
        $app = $this->getAppInstance();
        $container = $app->getContainer();

        // Create a fake ID Token payload
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode([
            'sub' => '123456789',
            'email' => 'test@example.com',
            'name' => 'Test User',
            'picture' => 'http://example.com/pic.jpg'
        ]));
        $fakeIdToken = "$header.$payload.signature";

        // Mock UserRepository
        $mockUserRepository = $this->getMockBuilder(UserRepository::class)->getMock();
        $mockUser = new User(1, '123456789', 'test@example.com', 'Test User', false, 'active');
        
        $mockUserRepository->method('findUserByGoogleId')->willReturn($mockUser);

        // Set dependencies
        $container->set(UserRepository::class, $mockUserRepository);

        // Create request
        $request = $this->createRequest('POST', '/auth/login');
        $request = $request->withParsedBody(['id_token' => $fakeIdToken]);

        // Handle request (Note: in test mode, displayErrorDetails is true, so it uses mock logic inside LoginAction)
        $response = $app->handle($request);

        $payload = (string) $response->getBody();
        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($payload, true)['data'];
        $this->assertArrayHasKey('token', $data);
        $this->assertArrayHasKey('user', $data);
        $this->assertEquals('http://example.com/pic.jpg', $data['user']['picture']);
        
        // Verify the issued token is a valid local JWT
        $settings = $container->get(SettingsInterface::class);
        $decoded = JWT::decode($data['token'], new \Firebase\JWT\Key($settings->get('jwt')['secret'], 'HS256'));
        $this->assertEquals('123456789', $decoded->sub);
    }
}

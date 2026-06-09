<?php

declare(strict_types=1);

namespace App\Application\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Exception\HttpUnauthorizedException;
use Slim\Exception\HttpForbiddenException;
use App\Application\Settings\SettingsInterface;
use App\Domain\User\UserRepository;
use App\Domain\User\User;
use Exception;

class AuthMiddleware implements MiddlewareInterface
{
    private SettingsInterface $settings;
    private UserRepository $userRepository;

    public function __construct(SettingsInterface $settings, UserRepository $userRepository)
    {
        $this->settings = $settings;
        $this->userRepository = $userRepository;
    }

    /**
     * {@inheritdoc}
     */
    public function process(Request $request, Handler $handler): Response
    {
        $authorization = $request->getHeaderLine('Authorization');

        if (empty($authorization)) {
            throw new HttpUnauthorizedException($request, 'Authorization header missing.');
        }

        if (!preg_match('/Bearer\s(\S+)/', $authorization, $matches)) {
            throw new HttpUnauthorizedException($request, 'Invalid Authorization header format.');
        }

        $idToken = $matches[1];
        
        $userPayload = $this->verifyGoogleToken($idToken);

        if (!$userPayload) {
            throw new HttpUnauthorizedException($request, 'Invalid or expired Google Token.');
        }

        // Automatic Registration Logic
        $googleId = $userPayload['sub'];
        $user = $this->userRepository->findUserByGoogleId($googleId);

        if (!$user) {
            // First login: Register the user with pending status
            $user = new User(
                null,
                $googleId,
                $userPayload['email'],
                $userPayload['name'] ?? null,
                false, // Default: not admin
                'pending' // Default: pending approval
            );
            $this->userRepository->save($user);
            
            throw new HttpForbiddenException($request, 'Cadastro em validação. Aguarde a aprovação de um administrador.');
        }

        // Check if user is approved
        if (!$user->isActive()) {
            if ($user->getStatus() === 'pending') {
                throw new HttpForbiddenException($request, 'Cadastro em validação. Aguarde a aprovação de um administrador.');
            } else {
                throw new HttpForbiddenException($request, 'Sua conta está bloqueada. Entre em contato com o suporte.');
            }
        }

        // Add the user object to the request attributes
        $request = $request->withAttribute('authenticated_user', $user);

        return $handler->handle($request);
    }

    /**
     * Verifies the Google ID Token.
     */
    private function verifyGoogleToken(string $idToken): ?array
    {
        try {
            // Mock validation for demonstration
            if ($idToken === 'test-token' || $idToken === 'new-user-token') {
                return [
                    'sub' => $idToken === 'test-token' ? '123456789' : '987654321',
                    'email' => $idToken === 'test-token' ? 'admin@example.com' : 'newuser@example.com',
                    'name' => $idToken === 'test-token' ? 'Admin User' : 'New User'
                ];
            }

            return null;
        } catch (Exception $e) {
            return null;
        }
    }
}

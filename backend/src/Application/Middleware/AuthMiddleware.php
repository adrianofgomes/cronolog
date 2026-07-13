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
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware implements MiddlewareInterface
{
    private SettingsInterface $settings;
    private UserRepository $userRepository;
    private \Psr\Log\LoggerInterface $logger;

    public function __construct(SettingsInterface $settings, UserRepository $userRepository, \Psr\Log\LoggerInterface $logger)
    {
        $this->settings = $settings;
        $this->userRepository = $userRepository;
        $this->logger = $logger;
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

        $token = $matches[1];
        
        // 1. Verify Local JWT
        $userPayload = $this->verifyLocalToken($token);

        if (!$userPayload) {
            throw new HttpUnauthorizedException($request, 'Invalid or expired session.');
        }

        // 2. Fetch User from DB
        $googleId = $userPayload['sub'];
        $user = $this->userRepository->findUserByGoogleId($googleId);

        if (!$user) {
             throw new HttpUnauthorizedException($request, 'Usuário não encontrado.');
        }

        // 3. Check if user is approved
        $isMeRoute = strpos($request->getUri()->getPath(), '/users/me') !== false;

        if (!$user->isActive() && !$isMeRoute) {
            if ($user->getStatus() === 'pending') {
                throw new HttpForbiddenException($request, 'Cadastro em validação. Aguarde a aprovação de um administrador.');
            } elseif ($user->getStatus() === 'rejected') {
                throw new HttpForbiddenException($request, 'Infelizmente não foi possível realizar o seu cadastro no momento.');
            } else {
                throw new HttpForbiddenException($request, 'Sua conta está bloqueada. Entre em contato com o suporte.');
            }
        }

        // Add the user object to the request attributes
        $request = $request->withAttribute('authenticated_user', $user);

        return $handler->handle($request);
    }

    /**
     * Verifies the Local long-lived JWT.
     */
    private function verifyLocalToken(string $token): ?array
    {
        // Support for test tokens in non-production environments
        if ($this->settings->get('enableTestTokens') === true) {
            if ($token === 'test-token' || $token === 'new-user-token') {
                return [
                    'sub' => $token === 'test-token' ? '123456789' : '987654321',
                    'email' => $token === 'test-token' ? 'admin@example.com' : 'newuser@example.com',
                ];
            }
        }

        try {
            $jwtSettings = $this->settings->get('jwt');
            $decoded = JWT::decode($token, new Key($jwtSettings['secret'], 'HS256'));
            return (array) $decoded;
        } catch (Exception $e) {
            $this->logger->error('JWT Verification Error: ' . $e->getMessage(), [
                'token_length' => strlen($token),
                'error_type' => get_class($e)
            ]);
            return null;
        }
    }
}

<?php

declare(strict_types=1);

namespace App\Application\Actions\Auth;

use App\Application\Actions\Action;
use App\Application\Settings\SettingsInterface;
use App\Domain\User\User;
use App\Domain\User\UserRepository;
use App\Infrastructure\Notification\WebPushService;
use Firebase\JWT\JWT;
use Google\Auth\AccessToken;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpUnauthorizedException;
use Exception;

class LoginAction extends Action
{
    private UserRepository $userRepository;
    private SettingsInterface $settings;
    private WebPushService $webPushService;

    public function __construct(
        LoggerInterface $logger,
        UserRepository $userRepository,
        SettingsInterface $settings,
        WebPushService $webPushService
    ) {
        parent::__construct($logger);
        $this->userRepository = $userRepository;
        $this->settings = $settings;
        $this->webPushService = $webPushService;
    }

    protected function action(): Response
    {
        try {
            $idToken = $this->request->getParsedBody()['id_token'] ?? null;
            if (!$idToken) {
                throw new HttpBadRequestException($this->request, 'ID Token is required.');
            }

            // 1. Verify Google ID Token
            $payload = $this->verifyGoogleToken($idToken);
            if (!$payload) {
                throw new HttpUnauthorizedException($this->request, 'Invalid Google Token.');
            }

            $googleId = $payload['sub'];
            $email = $payload['email'];
            $name = $payload['name'] ?? null;
            $picture = $payload['picture'] ?? null;

            // 2. Find or Register User
            $user = $this->userRepository->findUserByGoogleId($googleId);
            
            if (!$user) {
                // Check if there is a pre-approved user with this email
                $user = $this->userRepository->findUserByEmail($email);
                
                if ($user && $user->getStatus() === 'rejected') {
                    throw new HttpUnauthorizedException($this->request, 'Infelizmente não foi possível realizar o seu cadastro no momento.');
                }
                
                if ($user && $user->getStatus() === 'pre_approved') {
                    // Activate pre-approved user
                    $user = new User(
                        $user->getId(),
                        $googleId,
                        $email,
                        $name,
                        $user->isAdmin(),
                        'active'
                    );
                    $this->userRepository->update($user);
                } else if (!$user) {
                    // Normal auto-registration
                    $user = new User(null, $googleId, $email, $name, false, 'pending');
                    $this->userRepository->save($user);
                    
                    // Notifica administradores sobre novo usuário pendente
                    try {
                        $this->webPushService->notifyAdmins(
                            "Novo Usuário Pendente",
                            "O usuário $name ($email) acabou de se cadastrar e aguarda aprovação.",
                            "/admin"
                        );
                    } catch (Exception $e) {
                        $this->logger->error("Erro ao notificar admins: " . $e->getMessage());
                    }
                }
                
                // Re-fetch to ensure we have the ID and all fields
                $user = $this->userRepository->findUserByGoogleId($googleId);
            } else if ($user->getStatus() === 'rejected') {
                throw new HttpUnauthorizedException($this->request, 'Infelizmente não foi possível realizar o seu cadastro no momento.');
            }

            // 3. Generate Long-Lived Cronolog JWT
            $jwtSettings = $this->settings->get('jwt');
            $issuedAt = time();
            $expire = $issuedAt + ($jwtSettings['expires_days'] * 86400);

            $tokenPayload = [
                'iat' => $issuedAt,
                'exp' => $expire,
                'sub' => $googleId,
                'email' => $email,
                'iss' => 'cronolog'
            ];

            $cronologToken = JWT::encode($tokenPayload, $jwtSettings['secret'], 'HS256');

            return $this->respondWithData([
                'token' => $cronologToken,
                'user' => array_merge($user->jsonSerialize(), ['picture' => $picture])
            ]);
        } catch (\Throwable $t) {
            $this->logger->error('Internal Login Error: ' . $t->getMessage(), [
                'file' => $t->getFile(),
                'line' => $t->getLine(),
                'trace' => $t->getTraceAsString()
            ]);
            throw $t;
        }
    }

    private function verifyGoogleToken(string $idToken): ?array
    {
        // Support for test tokens in non-production environments
        if ($this->settings->get('enableTestTokens') === true) {
            if ($idToken === 'test-token' || $idToken === 'new-user-token' || str_contains($idToken, '.signature')) {
                // If it's our fake test token from PHPUnit
                if (str_contains($idToken, '.signature')) {
                    $payload = json_decode(base64_decode(explode('.', $idToken)[1]), true);
                    return $payload;
                }

                return [
                    'sub' => $idToken === 'test-token' ? '123456789' : '987654321',
                    'email' => $idToken === 'test-token' ? 'admin@example.com' : 'newuser@example.com',
                    'name' => $idToken === 'test-token' ? 'Admin User' : 'New User'
                ];
            }
        }

        try {
            $clientId = $this->settings->get('google')['client_id'];
            $tokenVerifier = new AccessToken();
            $payload = $tokenVerifier->verify($idToken, [
                'audience' => $clientId
            ]);
            return $payload ? (array) $payload : null;
        } catch (Exception $e) {
            $segments = explode('.', $idToken);
            $segmentCount = count($segments);
            $tokenLength = strlen($idToken);
            $tokenStart = substr($idToken, 0, 10);
            $tokenEnd = substr($idToken, -10);
            
            $this->logger->error('Google Token Verification Error (Login): ' . $e->getMessage(), [
                'segment_count' => $segmentCount,
                'token_length' => $tokenLength,
                'token_preview' => "$tokenStart...$tokenEnd",
                'client_id_configured' => !empty($clientId)
            ]);
            return null;
        }
    }
}

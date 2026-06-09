<?php

declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Application\Actions\Action;
use App\Domain\User\User;
use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpNotFoundException;

class IsAdminAction extends Action
{
    private UserRepository $userRepository;

    public function __construct(LoggerInterface $logger, UserRepository $userRepository)
    {
        parent::__construct($logger);
        $this->userRepository = $userRepository;
    }

    /**
     * {@inheritdoc}
     */
    protected function action(): Response
    {
        $googleId = (string) $this->resolveArg('google_id');
        
        // Option to check 'me' for the currently authenticated user
        if ($googleId === 'me') {
            /** @var User $authenticatedUser */
            $authenticatedUser = $this->request->getAttribute('authenticated_user');
            $googleId = $authenticatedUser->getGoogleId();
            $user = $authenticatedUser;
        } else {
            $user = $this->userRepository->findUserByGoogleId($googleId);
        }

        if (!$user) {
            throw new HttpNotFoundException($this->request, "User with Google ID `{$googleId}` not found.");
        }

        return $this->respondWithData([
            'googleId' => $user->getGoogleId(),
            'isAdmin' => $user->isAdmin(),
            'status' => $user->getStatus(),
        ]);
    }
}

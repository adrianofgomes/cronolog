<?php

declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Application\Actions\Action;
use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;

class RejectUserAction extends Action
{
    private UserRepository $userRepository;

    public function __construct(LoggerInterface $logger, UserRepository $userRepository)
    {
        parent::__construct($logger);
        $this->userRepository = $userRepository;
    }

    protected function action(): Response
    {
        $userId = (int) $this->resolveArg('id');
        
        $this->userRepository->deleteUser($userId);
        $this->logger->info("Admin rejected and deleted user: $userId");

        return $this->respondWithData(['message' => 'User rejected and deleted successfully.'], 200);
    }
}

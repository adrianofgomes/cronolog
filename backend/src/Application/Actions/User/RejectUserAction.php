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
        try {
            $userId = (int) $this->resolveArg('id');
            
            $this->userRepository->updateStatusById($userId, 'rejected');
            $this->logger->info("Admin rejected user: $userId");

            return $this->respondWithData(['message' => 'User rejected successfully.'], 200);
        } catch (\Exception $e) {
            $this->logger->error("Erro ao rejeitar usuário: " . $e->getMessage());
            throw new \RuntimeException("Erro ao processar rejeição: " . $e->getMessage());
        }
    }
}

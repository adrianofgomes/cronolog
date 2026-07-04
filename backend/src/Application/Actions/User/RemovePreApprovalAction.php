<?php

declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Application\Actions\Action;
use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;

class RemovePreApprovalAction extends Action
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
        $email = $this->resolveArg('email');

        if (empty($email)) {
            throw new HttpBadRequestException($this->request, 'Email is required.');
        }

        $this->userRepository->deletePreApproved($email);
        $this->logger->info("Admin removed pre-approval for email: $email");

        return $this->respondWithData(['message' => 'Pre-approval removed successfully.']);
    }
}

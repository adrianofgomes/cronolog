<?php

declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Application\Actions\Action;
use App\Domain\User\User;
use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;

class PreApproveEmailAction extends Action
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
        $data = $this->getFormData();
        $email = $data['email'] ?? null;

        if (empty($email)) {
            throw new HttpBadRequestException($this->request, 'Email is required.');
        }

        // Check if user already exists
        $existingUser = $this->userRepository->findUserByEmail($email);
        if ($existingUser) {
            if ($existingUser->getStatus() === 'pre_approved') {
                return $this->respondWithData($existingUser);
            }
            throw new HttpBadRequestException($this->request, 'User with this email already exists or is active/pending.');
        }

        $user = new User(null, null, $email, null, false, 'pre_approved');
        $this->userRepository->save($user);
        
        $this->logger->info("Admin pre-approved email: $email");

        return $this->respondWithData($user, 201);
    }
}

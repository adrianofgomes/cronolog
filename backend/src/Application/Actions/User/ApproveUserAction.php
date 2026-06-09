<?php

declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Application\Actions\Action;
use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;

class ApproveUserAction extends Action
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
        $data = $this->getFormData();
        
        $status = $data['status'] ?? 'active';

        if (!in_array($status, ['active', 'blocked'])) {
            throw new HttpBadRequestException($this->request, "Status inválido. Use 'active' ou 'blocked'.");
        }

        $this->userRepository->updateStatus($googleId, $status);
        $this->logger->info("Admin updated status for user `{$googleId}` to `{$status}`.");

        return $this->respondWithData([
            'message' => "Usuário `{$googleId}` atualizado para `{$status}` com sucesso."
        ]);
    }
}

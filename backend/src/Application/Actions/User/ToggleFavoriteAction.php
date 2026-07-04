<?php

declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Application\Actions\Action;
use App\Domain\User\UserFavoriteRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;

class ToggleFavoriteAction extends Action
{
    private UserFavoriteRepository $favoriteRepository;

    public function __construct(LoggerInterface $logger, UserFavoriteRepository $favoriteRepository)
    {
        parent::__construct($logger);
        $this->favoriteRepository = $favoriteRepository;
    }

    protected function action(): Response
    {
        $data = $this->getFormData();
        $categoryId = isset($data['categoryId']) ? (int)$data['categoryId'] : null;

        if (!$categoryId) {
            throw new HttpBadRequestException($this->request, 'Category ID is required.');
        }

        $user = $this->request->getAttribute('authenticated_user');
        
        if ($this->favoriteRepository->isFavorite($user->getId(), $categoryId)) {
            $this->favoriteRepository->removeFavorite($user->getId(), $categoryId);
            $action = 'removed';
        } else {
            $this->favoriteRepository->addFavorite($user->getId(), $categoryId);
            $action = 'added';
        }

        return $this->respondWithData(['action' => $action]);
    }
}

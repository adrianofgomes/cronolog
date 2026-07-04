<?php

declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Application\Actions\Action;
use App\Domain\User\UserFavoriteRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;

class ListFavoritesAction extends Action
{
    private UserFavoriteRepository $favoriteRepository;

    public function __construct(LoggerInterface $logger, UserFavoriteRepository $favoriteRepository)
    {
        parent::__construct($logger);
        $this->favoriteRepository = $favoriteRepository;
    }

    protected function action(): Response
    {
        $user = $this->request->getAttribute('authenticated_user');
        $favorites = $this->favoriteRepository->getFavoriteCategoryIds($user->getId());

        return $this->respondWithData($favorites);
    }
}

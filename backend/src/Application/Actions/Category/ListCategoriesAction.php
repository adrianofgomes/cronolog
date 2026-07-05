<?php

declare(strict_types=1);

namespace App\Application\Actions\Category;

use App\Application\Actions\Action;
use App\Domain\Category\CategoryRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;

class ListCategoriesAction extends Action
{
    private CategoryRepository $categoryRepository;

    public function __construct(LoggerInterface $logger, CategoryRepository $categoryRepository)
    {
        parent::__construct($logger);
        $this->categoryRepository = $categoryRepository;
    }

    protected function action(): Response
    {
        $categories = $this->categoryRepository->findAll();

        return $this->respondWithData($categories);
    }
}

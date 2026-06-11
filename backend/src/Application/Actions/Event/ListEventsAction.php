<?php

declare(strict_types=1);

namespace App\Application\Actions\Event;

use App\Application\Actions\Action;
use App\Domain\Event\EventRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;

class ListEventsAction extends Action
{
    private EventRepository $eventRepository;

    public function __construct(LoggerInterface $logger, EventRepository $eventRepository)
    {
        parent::__construct($logger);
        $this->eventRepository = $eventRepository;
    }

    protected function action(): Response
    {
        $user = $this->request->getAttribute('authenticated_user');
        $params = $this->request->getQueryParams();
        $categoryId = $params['categoryId'] ?? null;
        $categoryName = $params['categoryName'] ?? null;

        $events = $this->eventRepository->findByUser(
            $user->getId(), 
            $categoryId ? (int) $categoryId : null,
            $categoryName
        );

        return $this->respondWithData($events);
    }
}

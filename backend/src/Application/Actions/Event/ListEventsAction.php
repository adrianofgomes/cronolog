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
        
        $categoryIds = null;
        if (isset($params['categoryIds'])) {
            if (is_array($params['categoryIds'])) {
                $categoryIds = array_map('intval', $params['categoryIds']);
            } else {
                $categoryIds = array_map('intval', explode(',', $params['categoryIds']));
            }
        } else if (isset($params['categoryId'])) {
            $categoryIds = [(int) $params['categoryId']];
        }

        $categoryName = $params['categoryName'] ?? null;
        $status = $params['status'] ?? null;
        $searchTerm = $params['q'] ?? null;
        
        // Date filters
        $startDate = $params['startDate'] ?? null;
        $endDate = $params['endDate'] ?? null;
        
        // Pagination
        $limit = isset($params['limit']) ? (int) $params['limit'] : null;
        $page = isset($params['page']) ? (int) $params['page'] : 1;
        $offset = ($limit !== null) ? ($page - 1) * $limit : null;

        $events = $this->eventRepository->findByUser(
            $user->getId(), 
            $categoryIds,
            $categoryName,
            $status,
            $startDate,
            $endDate,
            $limit,
            $offset,
            $searchTerm
        );

        return $this->respondWithData($events);
    }
}

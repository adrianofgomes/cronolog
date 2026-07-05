<?php

declare(strict_types=1);

namespace App\Application\Actions\Event;

use App\Application\Actions\Action;
use App\Domain\Event\Event;
use App\Domain\Event\EventRepository;
use App\Domain\Category\CategoryRepository;
use App\Domain\Category\Category;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use DateTime;
use Slim\Exception\HttpBadRequestException;

class CreateEventAction extends Action
{
    private EventRepository $eventRepository;
    private CategoryRepository $categoryRepository;

    public function __construct(
        LoggerInterface $logger,
        EventRepository $eventRepository,
        CategoryRepository $categoryRepository
    ) {
        parent::__construct($logger);
        $this->eventRepository = $eventRepository;
        $this->categoryRepository = $categoryRepository;
    }

    protected function action(): Response
    {
        $user = $this->request->getAttribute('authenticated_user');
        $data = $this->getFormData();

        $categoryId = $data['categoryId'] ?? null;
        $categoryName = $data['categoryName'] ?? null;
        
        if (!$categoryId && !$categoryName) {
            throw new HttpBadRequestException($this->request, 'Category ID or Category Name is required.');
        }

        // Find or Create Category
        if ($categoryId) {
            $category = $this->categoryRepository->findById((int) $categoryId);
            if (!$category) {
                throw new HttpBadRequestException($this->request, 'Invalid Category ID.');
            }
        } else {
            $category = $this->categoryRepository->findByName($categoryName);
            if (!$category) {
                // Create basic category if not exists
                $category = new Category(null, $categoryName);
                $id = $this->categoryRepository->save($category);
                $category = $this->categoryRepository->findById($id);
            }
        }

        $title = $data['title'] ?? $category->getName();
        $eventDateStr = $data['eventDate'] ?? null;
        $eventDate = $eventDateStr ? new DateTime($eventDateStr) : new DateTime();
        
        $profileId = isset($data['profileId']) ? (int) $data['profileId'] : null;
        $description = $data['description'] ?? null;
        $metadata = $data['metadata'] ?? [];
        $tags = $data['tags'] ?? [];
        $source = $data['source'] ?? 'manual';
        $rawInput = $data['rawInput'] ?? null;
        $status = $data['status'] ?? 'completed';
        $isRecurring = isset($data['isRecurring']) ? (bool) $data['isRecurring'] : false;
        $recurrenceInterval = isset($data['recurrenceInterval']) ? (int) $data['recurrenceInterval'] : null;
        $recurrenceType = $data['recurrenceType'] ?? null;

        $event = new Event(
            null,
            $user->getId(),
            $category->getId(),
            $title,
            $eventDate,
            $profileId,
            $description,
            $metadata,
            $tags,
            $source,
            $rawInput,
            null,
            [],
            $status,
            $isRecurring,
            $recurrenceInterval,
            $recurrenceType
        );

        $eventId = $this->eventRepository->save($event);
        
        return $this->respondWithData(['id' => $eventId, 'message' => 'Event created successfully.'], 201);
    }
}

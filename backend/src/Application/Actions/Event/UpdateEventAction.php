<?php

declare(strict_types=1);

namespace App\Application\Actions\Event;

use App\Application\Actions\Action;
use App\Domain\Event\Event;
use App\Domain\Event\EventRepository;
use App\Domain\Category\CategoryRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use DateTime;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpNotFoundException;

class UpdateEventAction extends Action
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
        $id = (int) $this->resolveArg('id');
        $data = $this->getFormData();

        $event = $this->eventRepository->findByIdAndUser($id, $user->getId());
        if (!$event) {
            throw new HttpNotFoundException($this->request, 'Event not found.');
        }

        if (isset($data['categoryId'])) {
            $category = $this->categoryRepository->findById((int) $data['categoryId']);
            if (!$category) {
                throw new HttpBadRequestException($this->request, 'Invalid Category ID.');
            }
            $event->setCategoryId($category->getId());
        }

        if (isset($data['title'])) {
            $event->setTitle($data['title']);
        }

        if (isset($data['eventDate'])) {
            try {
                $event->setEventDate(new DateTime($data['eventDate']));
            } catch (\Exception $e) {
                throw new HttpBadRequestException($this->request, 'Invalid event date format.');
            }
        }

        if (array_key_exists('profileId', $data)) {
            $event->setProfileId($data['profileId'] !== null ? (int) $data['profileId'] : null);
        }

        if (array_key_exists('description', $data)) {
            $event->setDescription($data['description']);
        }

        if (array_key_exists('metadata', $data)) {
            if ($data['metadata'] !== null && !is_array($data['metadata'])) {
                throw new HttpBadRequestException($this->request, 'Metadata must be an array or null.');
            }
            $event->setMetadata($data['metadata']);
        }

        if (array_key_exists('tags', $data)) {
            if ($data['tags'] !== null && !is_array($data['tags'])) {
                throw new HttpBadRequestException($this->request, 'Tags must be an array or null.');
            }
            $event->setTags($data['tags']);
        }

        $oldStatus = $event->getStatus();
        if (isset($data['status'])) {
            $event->setStatus($data['status']);
        }

        if (isset($data['isRecurring'])) {
            $event->setIsRecurring((bool) $data['isRecurring']);
        }

        if (array_key_exists('recurrenceInterval', $data)) {
            $event->setRecurrenceInterval($data['recurrenceInterval'] !== null ? (int) $data['recurrenceInterval'] : null);
        }

        if (array_key_exists('recurrenceType', $data)) {
            $event->setRecurrenceType($data['recurrenceType']);
        }

        $this->eventRepository->save($event);

        // Recurrence Logic: If status changed from pending to completed and it's recurring
        if ($oldStatus === 'pending' && $event->getStatus() === 'completed' && $event->isRecurring()) {
            $this->createNextRecurringEvent($event);
        }
        
        return $this->respondWithData(['message' => 'Event updated successfully.']);
    }

    private function createNextRecurringEvent(Event $event): void
    {
        $interval = $event->getRecurrenceInterval();
        $type = $event->getRecurrenceType();
        
        if (!$interval || !$type) {
            return;
        }

        $nextDate = clone $event->getEventDate();
        $modifyString = "+{$interval} {$type}";
        $nextDate->modify($modifyString);

        $nextEvent = new Event(
            null,
            $event->getUserId(),
            $event->getCategoryId(),
            $event->getTitle(),
            $nextDate,
            $event->getProfileId(),
            $event->getDescription(),
            $event->getMetadata(),
            $event->getTags(),
            $event->getSource(),
            $event->getRawInput(),
            null,
            [],
            'pending',
            true,
            $interval,
            $type
        );

        $this->eventRepository->save($nextEvent);
    }
}

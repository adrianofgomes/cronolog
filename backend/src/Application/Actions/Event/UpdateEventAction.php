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
            $category = $this->categoryRepository->findByIdAndUser((int) $data['categoryId'], $user->getId());
            if (!$category) {
                throw new HttpBadRequestException($this->request, 'Invalid Category ID.');
            }
            $event->setCategoryId($category->getId());
        }

        if (isset($data['title'])) {
            $event->setTitle($data['title']);
        }

        if (isset($data['eventDate'])) {
            $event->setEventDate(new DateTime($data['eventDate']));
        }

        if (isset($data['profileId'])) {
            $event->setProfileId((int) $data['profileId']);
        }

        if (array_key_exists('description', $data)) {
            $event->setDescription($data['description']);
        }

        if (isset($data['metadata'])) {
            $event->setMetadata($data['metadata']);
        }

        if (isset($data['tags'])) {
            $event->setTags($data['tags']);
        }

        $this->eventRepository->save($event);
        
        return $this->respondWithData(['message' => 'Event updated successfully.']);
    }
}

<?php

declare(strict_types=1);

namespace App\Application\Actions\Event;

use App\Application\Actions\Action;
use App\Domain\Event\EventRepository;
use App\Domain\Attachment\AttachmentRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpNotFoundException;

class DeleteEventAction extends Action
{
    private EventRepository $eventRepository;
    private AttachmentRepository $attachmentRepository;

    public function __construct(LoggerInterface $logger, EventRepository $eventRepository, AttachmentRepository $attachmentRepository)
    {
        parent::__construct($logger);
        $this->eventRepository = $eventRepository;
        $this->attachmentRepository = $attachmentRepository;
    }

    protected function action(): Response
    {
        $id = (int) $this->resolveArg('id');
        $user = $this->request->getAttribute('authenticated_user');

        $event = $this->eventRepository->findByIdAndUser($id, $user->getId());
        if (!$event) {
            throw new HttpNotFoundException($this->request, 'Event not found.');
        }

        // Delete physical files
        $attachments = $this->attachmentRepository->findByEventId($id);
        $directory = __DIR__ . '/../../../data/uploads/';
        
        foreach ($attachments as $attachment) {
            $filePath = $directory . $attachment->getFilename();
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        $this->eventRepository->delete($id, $user->getId());

        return $this->respondWithData(['message' => 'Event deleted successfully.'], 200);
    }
}

<?php

declare(strict_types=1);

namespace App\Application\Actions\Attachment;

use App\Application\Actions\Action;
use App\Domain\Attachment\AttachmentRepository;
use App\Domain\Event\EventRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpNotFoundException;

class DeleteAttachmentAction extends Action
{
    private AttachmentRepository $attachmentRepository;
    private EventRepository $eventRepository;

    public function __construct(
        LoggerInterface $logger,
        AttachmentRepository $attachmentRepository,
        EventRepository $eventRepository
    ) {
        parent::__construct($logger);
        $this->attachmentRepository = $attachmentRepository;
        $this->eventRepository = $eventRepository;
    }

    protected function action(): Response
    {
        $eventId = (int) $this->resolveArg('id');
        $attId = (int) $this->resolveArg('attId');
        
        $this->logger->info("Delete request: EventID $eventId, AttID $attId");

        $user = $this->request->getAttribute('authenticated_user');
        
        // Verify event ownership
        $event = $this->eventRepository->findByIdAndUser($eventId, $user->getId());
        if (!$event) {
            $this->logger->error("Event not found or access denied for EventID $eventId, UserID " . $user->getId());
            throw new HttpNotFoundException($this->request, 'Event not found or access denied.');
        }

        // Find the attachment
        $attachments = $this->attachmentRepository->findByEventId($eventId);
        $attachmentToDelete = null;
        foreach ($attachments as $attachment) {
            if ($attachment->getId() === $attId) {
                $attachmentToDelete = $attachment;
                break;
            }
        }

        if (!$attachmentToDelete) {
            throw new HttpNotFoundException($this->request, 'Attachment not found.');
        }

        // Delete physical file
        $filename = $attachmentToDelete->getFilename();
        $filePath = __DIR__ . '/../../../../data/uploads/' . $filename;
        
        if (file_exists($filePath)) {
            unlink($filePath);
            $this->logger->info("File deleted: $filePath");
        }

        // Delete attachment from database
        $this->attachmentRepository->delete($attId, $eventId);
        $this->logger->info("Attachment $attId deleted successfully for Event $eventId.");

        return $this->respondWithData(['message' => 'Attachment deleted successfully.'], 200);
    }
}

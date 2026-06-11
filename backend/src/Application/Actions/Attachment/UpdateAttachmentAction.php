<?php

declare(strict_types=1);

namespace App\Application\Actions\Attachment;

use App\Application\Actions\Action;
use App\Domain\Attachment\AttachmentRepository;
use App\Domain\Event\EventRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpNotFoundException;

class UpdateAttachmentAction extends Action
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
        $data = $this->getFormData();
        
        $description = $data['description'] ?? '';

        $user = $this->request->getAttribute('authenticated_user');
        
        // Verify event ownership
        $event = $this->eventRepository->findByIdAndUser($eventId, $user->getId());
        if (!$event) {
            throw new HttpNotFoundException($this->request, 'Event not found or access denied.');
        }

        // Find the attachment
        $attachments = $this->attachmentRepository->findByEventId($eventId);
        $attachmentToUpdate = null;
        foreach ($attachments as $attachment) {
            if ($attachment->getId() === $attId) {
                $attachmentToUpdate = $attachment;
                break;
            }
        }

        if (!$attachmentToUpdate) {
            throw new HttpNotFoundException($this->request, 'Attachment not found.');
        }

        // Update attachment description in database
        $this->attachmentRepository->updateDescription($attId, $eventId, $description);

        return $this->respondWithData(['message' => 'Attachment updated successfully.'], 200);
    }
}

<?php

declare(strict_types=1);

namespace App\Application\Actions\Attachment;

use App\Application\Actions\Action;
use App\Domain\Attachment\Attachment;
use App\Domain\Attachment\AttachmentRepository;
use App\Domain\Event\EventRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;

class UploadAttachmentAction extends Action
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
        $user = $this->request->getAttribute('authenticated_user');
        
        // Verify event ownership
        $event = $this->eventRepository->findByIdAndUser($eventId, $user->getId());
        if (!$event) {
            throw new HttpBadRequestException($this->request, 'Event not found or access denied.');
        }

        $uploadedFiles = $this->request->getUploadedFiles();
        if (empty($uploadedFiles['file'])) {
            throw new HttpBadRequestException($this->request, 'No file uploaded.');
        }

        $file = $uploadedFiles['file'];
        
        // Secure file handling: store outside of public_html
        $directory = __DIR__ . '/../../../../data/uploads';
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filename = bin2hex(random_bytes(8)) . '_' . $file->getClientFilename();
        $file->moveTo($directory . DIRECTORY_SEPARATOR . $filename);
        // The URL is now an API route that will be handled by GetAttachmentAction

        $description = $this->request->getParsedBody()['description'] ?? null;
        $fileType = (strpos($file->getClientMediaType(), 'pdf') !== false) ? 'pdf' : 'image';

        $attachment = new Attachment(null, $eventId, $filename, $description, $fileType);
        $id = $this->attachmentRepository->save($attachment);

        return $this->respondWithData([
            'message' => 'Attachment uploaded successfully.',
            'id' => $id,
            'filename' => $filename,
            'description' => $description,
            'fileType' => $fileType,
            'url' => '/events/' . $eventId . '/attachments/' . $filename
        ], 201);
    }
}

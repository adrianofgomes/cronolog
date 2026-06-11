<?php

declare(strict_types=1);

namespace App\Application\Actions\Attachment;

use App\Application\Actions\Action;
use App\Domain\Event\EventRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpNotFoundException;

class GetAttachmentAction extends Action
{
    private EventRepository $eventRepository;

    public function __construct(
        LoggerInterface $logger,
        EventRepository $eventRepository
    ) {
        parent::__construct($logger);
        $this->eventRepository = $eventRepository;
    }

    protected function action(): Response
    {
        $eventId = (int) $this->resolveArg('id');
        $filename = $this->resolveArg('filename');
        $user = $this->request->getAttribute('authenticated_user');
        
        // Verify event ownership
        $event = $this->eventRepository->findByIdAndUser($eventId, $user->getId());
        if (!$event) {
            throw new HttpNotFoundException($this->request, 'Attachment not found or access denied.');
        }

        $filePath = __DIR__ . '/../../../../data/uploads/' . $filename;
        if (!file_exists($filePath)) {
            throw new HttpNotFoundException($this->request, 'File not found on server.');
        }

        $contentType = mime_content_type($filePath);
        
        $response = $this->response
            ->withHeader('Content-Type', $contentType)
            ->withHeader('Content-Disposition', 'inline; filename="' . $filename . '"');
            
        $response->getBody()->write(file_get_contents($filePath));
        
        return $response;
    }
}

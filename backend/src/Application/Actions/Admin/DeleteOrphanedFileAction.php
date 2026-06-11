<?php

declare(strict_types=1);

namespace App\Application\Actions\Admin;

use App\Application\Actions\Action;
use App\Domain\Attachment\AttachmentRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;

class DeleteOrphanedFileAction extends Action
{
    private AttachmentRepository $attachmentRepository;

    public function __construct(LoggerInterface $logger, AttachmentRepository $attachmentRepository)
    {
        parent::__construct($logger);
        $this->attachmentRepository = $attachmentRepository;
    }

    protected function action(): Response
    {
        $filename = $this->resolveArg('filename');
        $dbFilenames = $this->attachmentRepository->getAllFilenames();

        // Safety check: don't delete if it's in the database
        if (in_array($filename, $dbFilenames)) {
            throw new HttpBadRequestException($this->request, 'File is referenced in database.');
        }

        $filePath = __DIR__ . '/../../../../data/uploads/' . $filename;
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        return $this->respondWithData(['message' => 'Orphaned file deleted.'], 200);
    }
}

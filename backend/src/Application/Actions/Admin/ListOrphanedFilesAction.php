<?php

declare(strict_types=1);

namespace App\Application\Actions\Admin;

use App\Application\Actions\Action;
use App\Domain\Attachment\AttachmentRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;

class ListOrphanedFilesAction extends Action
{
    private AttachmentRepository $attachmentRepository;

    public function __construct(LoggerInterface $logger, AttachmentRepository $attachmentRepository)
    {
        parent::__construct($logger);
        $this->attachmentRepository = $attachmentRepository;
    }

    protected function action(): Response
    {
        $directory = __DIR__ . '/../../../../data/uploads/';
        if (!is_dir($directory)) {
            return $this->respondWithData([]);
        }

        $allFiles = array_diff(scandir($directory), ['.', '..']);
        $dbFilenames = $this->attachmentRepository->getAllFilenames();

        $orphanedFiles = array_diff($allFiles, $dbFilenames);

        return $this->respondWithData(array_values($orphanedFiles));
    }
}

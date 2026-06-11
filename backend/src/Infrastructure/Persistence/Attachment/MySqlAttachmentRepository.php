<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Attachment;

use App\Domain\Attachment\Attachment;
use App\Domain\Attachment\AttachmentRepository;
use PDO;

class MySqlAttachmentRepository implements AttachmentRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function save(Attachment $attachment): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO attachments (event_id, filename, description, file_type) VALUES (:event_id, :filename, :description, :file_type)'
        );
        $stmt->execute([
            'event_id' => $attachment->getEventId(),
            'filename' => $attachment->getFilename(),
            'description' => $attachment->getDescription(),
            'file_type' => $attachment->getFileType(),
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function findByEventId(int $eventId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM attachments WHERE event_id = :event_id');
        $stmt->execute(['event_id' => $eventId]);
        
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $attachments = [];
        foreach ($rows as $row) {
            $attachments[] = new Attachment(
                (int) $row['id'],
                (int) $row['event_id'],
                $row['filename'],
                $row['description'],
                $row['file_type']
            );
        }
        return $attachments;
    }

    public function getAllFilenames(): array
    {
        $stmt = $this->db->query('SELECT filename FROM attachments');
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    public function updateDescription(int $attId, int $eventId, string $description): void
    {
        $stmt = $this->db->prepare(
            'UPDATE attachments SET description = :description WHERE id = :id AND event_id = :event_id'
        );
        $stmt->execute([
            'description' => $description,
            'id' => $attId,
            'event_id' => $eventId,
        ]);
    }

    public function delete(int $attId, int $eventId): void
    {
        $stmt = $this->db->prepare('DELETE FROM attachments WHERE id = :id AND event_id = :event_id');
        $stmt->execute(['id' => $attId, 'event_id' => $eventId]);
    }
}

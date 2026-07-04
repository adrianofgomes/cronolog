<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Event;

use App\Domain\Event\Event;
use App\Domain\Event\EventRepository;
use App\Infrastructure\Persistence\MySqlRepository;
use DateTime;

class MySqlEventRepository extends MySqlRepository implements EventRepository
{
    public function save(Event $event): int
    {
        if ($event->getId() !== null) {
            $query = "
                UPDATE events 
                SET profile_id = :profile_id, category_id = :category_id, title = :title, 
                    event_date = :event_date, description = :description, metadata = :metadata, 
                    tags = :tags, source = :source, raw_input = :raw_input,
                    status = :status, is_recurring = :is_recurring, 
                    recurrence_interval = :recurrence_interval, recurrence_type = :recurrence_type
                WHERE id = :id AND user_id = :user_id
            ";
            $params = [
                'id' => $event->getId(),
                'user_id' => $event->getUserId(),
                'profile_id' => $event->getProfileId(),
                'category_id' => $event->getCategoryId(),
                'title' => $event->getTitle(),
                'event_date' => $event->getEventDate()->format('Y-m-d H:i:s'),
                'description' => $event->getDescription(),
                'metadata' => json_encode($event->getMetadata()),
                'tags' => json_encode($event->getTags()),
                'source' => $event->getSource(),
                'raw_input' => $event->getRawInput(),
                'status' => $event->getStatus(),
                'is_recurring' => $event->isRecurring() ? 1 : 0,
                'recurrence_interval' => $event->getRecurrenceInterval(),
                'recurrence_type' => $event->getRecurrenceType(),
            ];
            $statement = $this->connection->prepare($query);
            $statement->execute($params);
            return $event->getId();
        }

        $query = "
            INSERT INTO events (user_id, profile_id, category_id, title, event_date, description, metadata, tags, source, raw_input, status, is_recurring, recurrence_interval, recurrence_type)
            VALUES (:user_id, :profile_id, :category_id, :title, :event_date, :description, :metadata, :tags, :source, :raw_input, :status, :is_recurring, :recurrence_interval, :recurrence_type)
        ";
        $params = [
            'user_id' => $event->getUserId(),
            'profile_id' => $event->getProfileId(),
            'category_id' => $event->getCategoryId(),
            'title' => $event->getTitle(),
            'event_date' => $event->getEventDate()->format('Y-m-d H:i:s'),
            'description' => $event->getDescription(),
            'metadata' => json_encode($event->getMetadata()),
            'tags' => json_encode($event->getTags()),
            'source' => $event->getSource(),
            'raw_input' => $event->getRawInput(),
            'status' => $event->getStatus(),
            'is_recurring' => $event->isRecurring() ? 1 : 0,
            'recurrence_interval' => $event->getRecurrenceInterval(),
            'recurrence_type' => $event->getRecurrenceType(),
        ];
        $statement = $this->connection->prepare($query);
        $statement->execute($params);
        return (int) $this->connection->lastInsertId();
    }

    public function findByIdAndUser(int $id, int $userId): ?Event
    {
        $query = "
            SELECT e.*, c.name as category_name 
            FROM events e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.id = :id AND e.user_id = :user_id
        ";
        $statement = $this->connection->prepare($query);
        $statement->execute(['id' => $id, 'user_id' => $userId]);
        $row = $statement->fetch();

        return $row ? $this->mapRowToEvent($row) : null;
    }

    public function findByUser(
        int $userId, 
        ?array $categoryIds = null, 
        ?string $categoryName = null, 
        ?string $status = null,
        ?string $startDate = null,
        ?string $endDate = null,
        ?int $limit = null,
        ?int $offset = null,
        ?string $searchTerm = null
    ): array {
        $query = "
            SELECT e.*, c.name as category_name 
            FROM events e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = :user_id
        ";
        $params = ['user_id' => $userId];

        if (!empty($categoryIds)) {
            $placeholders = [];
            foreach ($categoryIds as $index => $id) {
                $key = "cat_id_" . $index;
                $placeholders[] = ":" . $key;
                $params[$key] = (int) $id;
            }
            $query .= " AND e.category_id IN (" . implode(',', $placeholders) . ")";
        }

        if ($categoryName !== null) {
            $query .= " AND c.name = :category_name";
            $params['category_name'] = $categoryName;
        }

        if ($status !== null) {
            $query .= " AND e.status = :status";
            $params['status'] = $status;
        }

        if ($startDate !== null) {
            $query .= " AND e.event_date >= :start_date";
            $params['start_date'] = $startDate;
        }

        if ($endDate !== null) {
            $query .= " AND e.event_date <= :end_date";
            $params['end_date'] = $endDate;
        }

        if (!empty($searchTerm)) {
            $query .= " AND (e.title LIKE :search OR e.description LIKE :search OR CAST(e.metadata AS CHAR) LIKE :search OR c.name LIKE :search)";
            $params['search'] = '%' . $searchTerm . '%';
        }

        $query .= " ORDER BY e.event_date DESC";

        if ($limit !== null) {
            $query .= " LIMIT :limit";
            $params['limit'] = (int) $limit;
        }

        if ($offset !== null) {
            $query .= " OFFSET :offset";
            $params['offset'] = (int) $offset;
        }

        $statement = $this->connection->prepare($query);
        
        foreach ($params as $key => $value) {
            if (is_int($value)) {
                $statement->bindValue($key, $value, \PDO::PARAM_INT);
            } else {
                $statement->bindValue($key, $value);
            }
        }
        
        $statement->execute();
        $rows = $statement->fetchAll();

        $events = [];
        foreach ($rows as $row) {
            $events[] = $this->mapRowToEvent($row);
        }

        return $events;
    }

    public function delete(int $id, int $userId): void
    {
        // First delete associated attachments to maintain integrity
        $stmt = $this->connection->prepare('DELETE FROM attachments WHERE event_id = :event_id');
        $stmt->execute(['event_id' => $id]);

        $query = "DELETE FROM events WHERE id = :id AND user_id = :user_id";
        $statement = $this->connection->prepare($query);
        $statement->execute(['id' => $id, 'user_id' => $userId]);
    }

    private function mapRowToEvent(array $row): Event
    {
        // Fetch attachments for the event
        $stmt = $this->connection->prepare('SELECT * FROM attachments WHERE event_id = :event_id');
        $stmt->execute(['event_id' => (int) $row['id']]);
        $attachmentRows = $stmt->fetchAll();
        $attachments = [];
        foreach ($attachmentRows as $attRow) {
            $attachments[] = [
                'id' => (int) $attRow['id'],
                'filename' => $attRow['filename'],
                'description' => $attRow['description'],
                'fileType' => $attRow['file_type']
            ];
        }

        return new Event(
            (int) $row['id'],
            (int) $row['user_id'],
            (int) $row['category_id'],
            $row['title'],
            new DateTime($row['event_date']),
            $row['profile_id'] ? (int) $row['profile_id'] : null,
            $row['description'],
            $row['metadata'] ? json_decode($row['metadata'], true) : null,
            $row['tags'] ? json_decode($row['tags'], true) : null,
            $row['source'],
            $row['raw_input'],
            $row['category_name'] ?? null,
            $attachments,
            $row['status'],
            (bool) $row['is_recurring'],
            $row['recurrence_interval'] ? (int) $row['recurrence_interval'] : null,
            $row['recurrence_type']
        );
    }
}

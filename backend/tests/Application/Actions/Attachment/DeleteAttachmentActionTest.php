<?php

declare(strict_types=1);

namespace App\Tests\Application\Actions\Attachment;

use App\Tests\TestCase;
use App\Domain\Attachment\AttachmentRepository;
use App\Domain\Attachment\Attachment;
use App\Domain\Event\EventRepository;
use App\Domain\User\UserRepository;
use App\Domain\User\User;
use App\Domain\Event\Event;
use DateTime;

class DeleteAttachmentActionTest extends TestCase
{
    public function testDeleteAttachmentSuccess()
    {
        $user = new User(1, 'google1', 'user@example.com', 'User', false, 'active');
        $event = new Event(1, 1, 1, 'Test Event', new DateTime());
        $attachment = new Attachment(10, 1, 'test.pdf', 'Test file', 'pdf');

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $eventRepository = $this->createMock(EventRepository::class);
        $eventRepository->method('findByIdAndUser')->willReturn($event);

        $attachmentRepository = $this->createMock(AttachmentRepository::class);
        $attachmentRepository->method('findByEventId')->willReturn([$attachment]);
        $attachmentRepository->expects($this->once())->method('delete')->with(10, 1);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
            EventRepository::class => $eventRepository,
            AttachmentRepository::class => $attachmentRepository,
        ]);

        // Mocking file_exists and unlink is hard without a library,
        // so we'll skip actual file deletion in this unit test.

        $request = $this->createRequest('DELETE', '/events/1/attachments/10');
        $request = $request->withHeader('Authorization', 'Bearer test-token');

        $response = $app->handle($request);
        $this->assertEquals(200, $response->getStatusCode());
    }
}

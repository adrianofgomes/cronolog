<?php

declare(strict_types=1);

namespace App\Tests\Application\Actions\Attachment;

use App\Tests\TestCase;
use App\Domain\Attachment\AttachmentRepository;
use App\Domain\Event\EventRepository;
use App\Domain\User\UserRepository;
use App\Domain\User\User;
use App\Domain\Event\Event;
use Slim\Psr7\UploadedFile;
use DateTime;

class UploadAttachmentActionTest extends TestCase
{
    public function testUploadAttachmentSuccess()
    {
        $user = new User(1, 'google1', 'user@example.com', 'User', false, 'active');
        $event = new Event(1, 1, 1, 'Test Event', new DateTime());

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $eventRepository = $this->createMock(EventRepository::class);
        $eventRepository->method('findByIdAndUser')->willReturn($event);

        $attachmentRepository = $this->createMock(AttachmentRepository::class);
        $attachmentRepository->method('save')->willReturn(10);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
            EventRepository::class => $eventRepository,
            AttachmentRepository::class => $attachmentRepository,
        ]);

        // Mocking UploadedFile is tricky in Slim/PSR7. 
        // We simulate the structure that getUploadedFiles() returns.
        $uploadedFile = $this->createMock(UploadedFile::class);
        $uploadedFile->method('getClientFilename')->willReturn('test.pdf');
        $uploadedFile->method('getClientMediaType')->willReturn('application/pdf');
        
        // Mocking moveTo is needed to avoid actual file system writes
        $uploadedFile->expects($this->once())->method('moveTo');

        $request = $this->createRequest('POST', '/events/1/attachments');
        $request = $request->withHeader('Authorization', 'Bearer test-token');
        
        // Inject the mock file into the request
        $request = $request->withUploadedFiles(['file' => $uploadedFile]);
        $request = $request->withParsedBody(['description' => 'Test file']);

        $response = $app->handle($request);
        $payload = json_decode((string) $response->getBody(), true);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertEquals(10, $payload['data']['id']);
    }
}

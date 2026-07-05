<?php

declare(strict_types=1);

namespace App\Tests\Application\Actions\Admin;

use App\Tests\TestCase;
use App\Domain\Attachment\AttachmentRepository;
use App\Domain\User\UserRepository;
use App\Domain\User\User;

class ListOrphanedFilesActionTest extends TestCase
{
    public function testListOrphanedFilesSuccess()
    {
        $user = new User(1, 'google1', 'admin@example.com', 'Admin User', true, 'active');

        $userRepository = $this->createMock(UserRepository::class);
        $userRepository->method('findUserByGoogleId')->willReturn($user);

        $attachmentRepository = $this->createMock(AttachmentRepository::class);
        // Retorna uma lista de arquivos que existem no DB
        $attachmentRepository->method('getAllFilenames')->willReturn(['file1.pdf']);

        $app = $this->getAppInstance([
            UserRepository::class => $userRepository,
            AttachmentRepository::class => $attachmentRepository,
        ]);

        $request = $this->createRequest('GET', '/users/admin/attachments/orphaned');
        $request = $request->withHeader('Authorization', 'Bearer test-token');

        // Note: O teste não pode validar a lista real de arquivos no disco facilmente.
        // A Action usa __DIR__ para acessar os arquivos.
        $response = $app->handle($request);
        $this->assertEquals(200, $response->getStatusCode());
    }
}

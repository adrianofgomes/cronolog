<?php

declare(strict_types=1);

use App\Domain\User\UserRepository;
use App\Infrastructure\Persistence\User\MySqlUserRepository;
use App\Domain\User\UserFavoriteRepository;
use App\Infrastructure\Persistence\User\MySqlUserFavoriteRepository;
use App\Domain\Event\EventRepository;
use App\Infrastructure\Persistence\Event\MySqlEventRepository;
use App\Domain\Category\CategoryRepository;
use App\Infrastructure\Persistence\Category\MySqlCategoryRepository;
use App\Domain\Attachment\AttachmentRepository;
use App\Infrastructure\Persistence\Attachment\MySqlAttachmentRepository;
use App\Domain\Notification\PushSubscriptionRepository;
use App\Infrastructure\Persistence\Notification\MySqlPushSubscriptionRepository;
use App\Domain\Ai\AiServiceInterface;
use App\Infrastructure\Ai\GoogleAiService;
use App\Application\Settings\SettingsInterface;
use DI\ContainerBuilder;

return function (ContainerBuilder $containerBuilder) {
    // Here we map our UserInterface to its MySQL implementation
    $containerBuilder->addDefinitions([
        UserRepository::class => \DI\autowire(MySqlUserRepository::class),
        UserFavoriteRepository::class => \DI\autowire(MySqlUserFavoriteRepository::class),
        EventRepository::class => \DI\autowire(MySqlEventRepository::class),
        CategoryRepository::class => \DI\autowire(MySqlCategoryRepository::class),
        AttachmentRepository::class => \DI\autowire(MySqlAttachmentRepository::class),
        PushSubscriptionRepository::class => \DI\autowire(MySqlPushSubscriptionRepository::class),
        AiServiceInterface::class => function (\Psr\Container\ContainerInterface $c) {
            $settings = $c->get(SettingsInterface::class);
            return new GoogleAiService($settings->get('google')['ai_key']);
        },
    ]);
};

<?php

declare(strict_types=1);

use App\Application\Settings\Settings;
use App\Application\Settings\SettingsInterface;
use DI\ContainerBuilder;
use Monolog\Logger;

return function (ContainerBuilder $containerBuilder) {
    // Global Settings Object
    $containerBuilder->addDefinitions([
        SettingsInterface::class => function () {
            $debug = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';
            $testTokens = ($_ENV['ENABLE_TEST_TOKENS'] ?? 'false') === 'true';

            return new Settings([
                'displayErrorDetails' => $debug,
                'logError'            => true,
                'logErrorDetails'     => $debug,
                'enableTestTokens'    => $testTokens,
                'logger' => [
                    'name' => 'slim-app',
                    'path' => isset($_ENV['docker']) ? 'php://stdout' : __DIR__ . '/../logs/app.log',
                    'level' => Logger::DEBUG,
                ],
                'db' => [
                    'host' => $_ENV['DB_HOST'] ?? 'localhost',
                    'port' => $_ENV['DB_PORT'] ?? '3306',
                    'database' => $_ENV['DB_NAME'] ?? 'cronolog',
                    'username' => $_ENV['DB_USER'] ?? 'root',
                    'password' => $_ENV['DB_PASS'] ?? '',
                    'charset' => $_ENV['DB_CHARSET'] ?? 'utf8mb4',
                ],
                'google' => [
                    'client_id' => $_ENV['GOOGLE_CLIENT_ID'] ?? '',
                    'ai_key' => $_ENV['GEMINI_API_KEY'] ?? '',
                ],
                'jwt' => [
                    'secret' => $_ENV['JWT_SECRET'] ?? 'default_secret_change_me',
                    'expires_days' => (int) ($_ENV['JWT_EXPIRES_DAYS'] ?? 30),
                ],
                'vapid' => [
                    'public_key' => $_ENV['VAPID_PUBLIC_KEY'] ?? '',
                    'private_key' => $_ENV['VAPID_PRIVATE_KEY'] ?? '',
                    'subject' => $_ENV['VAPID_SUBJECT'] ?? 'mailto:admin@cronolog.com.br',
                ],
            ]);
        }
    ]);
};

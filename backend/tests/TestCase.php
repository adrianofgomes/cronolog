<?php

declare(strict_types=1);

namespace App\Tests;

use DI\ContainerBuilder;
use PHPUnit\Framework\TestCase as PHPUnitTestCase;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Factory\AppFactory;
use Slim\Psr7\Factory\StreamFactory;
use Slim\Psr7\Headers;
use Slim\Psr7\Request as SlimRequest;
use Slim\Psr7\Uri;

abstract class TestCase extends PHPUnitTestCase
{
    /**
     * @param array $definitions
     * @return App
     */
    protected function getAppInstance(array $definitions = []): App
    {
        $containerBuilder = new ContainerBuilder();

        // Settings
        $settings = require __DIR__ . '/../app/settings.php';
        $settings($containerBuilder);
        
        // Force enable test tokens for tests
        $containerBuilder->addDefinitions([
            \App\Application\Settings\SettingsInterface::class => function (\Psr\Container\ContainerInterface $c) {
                // Get original settings
                $settingsData = (require __DIR__ . '/../app/settings.php');
                // We need to build a temporary container to get the original settings if we want to be surgical,
                // but since we want to OVERRIDE, we can just recreate the Settings object with our tweak.
                
                // Redefining the factory to ensure test tokens are enabled
                $data = [
                    'displayErrorDetails' => true,
                    'logError'            => false,
                    'logErrorDetails'     => false,
                    'enableTestTokens'    => true, // CRITICAL FOR TESTS
                    'logger' => [
                        'name' => 'slim-app',
                        'path' => 'php://stdout',
                        'level' => \Monolog\Logger::DEBUG,
                    ],
                    'db' => [
                        'host' => 'localhost',
                        'port' => '3306',
                        'database' => 'cronolog_test',
                        'username' => 'root',
                        'password' => '',
                        'charset' => 'utf8mb4',
                    ],
                    'google' => [
                        'client_id' => 'test-client-id',
                    ],
                    'jwt' => [
                        'secret' => 'test_secret_must_be_at_least_32_chars_long_for_security',
                        'expires_days' => 30,
                    ],
                ];
                return new \App\Application\Settings\Settings($data);
            },
        ]);

        // Dependencies
        $dependencies = require __DIR__ . '/../app/dependencies.php';
        $dependencies($containerBuilder);

        // Repositories
        $repositories = require __DIR__ . '/../app/repositories.php';
        $repositories($containerBuilder);
        
        // Logger mock
        $containerBuilder->addDefinitions([
            \Psr\Log\LoggerInterface::class => $this->createMock(\Psr\Log\LoggerInterface::class),
        ]);

        if (!empty($definitions)) {
            $containerBuilder->addDefinitions($definitions);
        }

        $container = $containerBuilder->build();

        AppFactory::setContainer($container);
        $app = AppFactory::create();

        // Add Routing Middleware
        $app->addRoutingMiddleware();

        // Add Body Parsing Middleware
        $app->addBodyParsingMiddleware();

        // Add Error Middleware
        $app->addErrorMiddleware(true, false, false);

        // Register routes
        $routes = require __DIR__ . '/../app/routes.php';
        $routes($app);

        return $app;
    }

    /**
     * @param string $method
     * @param string $path
     * @param array  $headers
     * @param array  $cookies
     * @param array  $serverParams
     * @return Request
     */
    protected function createRequest(
        string $method,
        string $path,
        array $headers = ['HTTP_ACCEPT' => 'application/json'],
        array $cookies = [],
        array $serverParams = []
    ): Request {
        $uri = new Uri('', '', 80, $path);
        $handle = fopen('php://temp', 'w+');
        $stream = (new StreamFactory())->createStreamFromResource($handle);

        $h = new Headers();
        foreach ($headers as $name => $value) {
            $h->addHeader($name, $value);
        }

        return new SlimRequest($method, $uri, $h, $cookies, $serverParams, $stream);
    }
}

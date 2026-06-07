<?php

declare(strict_types=1);

use App\Application\Actions\StatusAction;
use App\Application\Actions\User\IsAdminAction;
use App\Application\Actions\User\ListPendingUsersAction;
use App\Application\Actions\User\ApproveUserAction;
use App\Application\Middleware\AuthMiddleware;
use App\Application\Middleware\AdminMiddleware;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Interfaces\RouteCollectorProxyInterface as Group;

return function (App $app) {
    // Detectar o Base Path automaticamente para suportar subpastas (HostGator)
    // Desativado em CLI (testes) para evitar caminhos incorretos
    if (PHP_SAPI !== 'cli') {
        $scriptName = $_SERVER['SCRIPT_NAME'];
        $basePath = str_replace('\\', '/', dirname($scriptName));
        if ($basePath !== '/' && $basePath !== '.') {
            $app->setBasePath($basePath);
        }
    }

    // Middleware de Headers de Segurança
    $app->add(function (Request $request, $handler) {
        $response = $handler->handle($request);
        return $response
            ->withHeader('X-Content-Type-Options', 'nosniff')
            ->withHeader('X-Frame-Options', 'DENY')
            ->withHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    });

    $app->options('/{routes:.*}', function (Request $request, Response $response) {
        // CORS Pre-Flight OPTIONS Request Handler
        return $response;
    });

    // Rota de teste pública (Health Check)
    $app->get('/status', StatusAction::class);

    $app->get('/', function (Request $request, Response $response) {
        $response->getBody()->write('Hello world!');
        return $response;
    });

    // Authenticated Routes
    $app->group('/users', function (Group $group) {
        $group->get('/{google_id}/is-admin', IsAdminAction::class);
        
        // Admin Only Routes
        $group->group('/admin', function (Group $adminGroup) {
            $adminGroup->get('/pending', ListPendingUsersAction::class);
            $adminGroup->post('/{google_id}/approve', ApproveUserAction::class);
        })->add(AdminMiddleware::class);
        
    })->add(AuthMiddleware::class);
};

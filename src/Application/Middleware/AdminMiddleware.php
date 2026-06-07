<?php

declare(strict_types=1);

namespace App\Application\Middleware;

use App\Domain\User\User;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Exception\HttpForbiddenException;

class AdminMiddleware implements MiddlewareInterface
{
    /**
     * {@inheritdoc}
     */
    public function process(Request $request, Handler $handler): Response
    {
        /** @var User|null $user */
        $user = $request->getAttribute('authenticated_user');

        if (!$user || !$user->isAdmin()) {
            throw new HttpForbiddenException($request, 'Acesso restrito a administradores.');
        }

        return $handler->handle($request);
    }
}

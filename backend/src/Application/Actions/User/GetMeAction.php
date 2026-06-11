<?php

declare(strict_types=1);

namespace App\Application\Actions\User;

use App\Application\Actions\Action;
use Psr\Http\Message\ResponseInterface as Response;

class GetMeAction extends Action
{
    protected function action(): Response
    {
        $user = $this->request->getAttribute('authenticated_user');
        return $this->respondWithData($user);
    }
}

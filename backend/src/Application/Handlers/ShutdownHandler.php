<?php

declare(strict_types=1);

namespace App\Application\Handlers;

use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Exception\HttpInternalServerErrorException;
use Slim\ResponseEmitter;

class ShutdownHandler
{
    private Request $request;

    private HttpErrorHandler $errorHandler;

    private bool $displayErrorDetails;

    public function __construct(
        Request $request,
        HttpErrorHandler $errorHandler,
        bool $displayErrorDetails
    ) {
        $this->request = $request;
        $this->errorHandler = $errorHandler;
        $this->displayErrorDetails = $displayErrorDetails;
    }

    public function __invoke()
    {
        $error = error_get_last();
        if ($error) {
            $errorFile = $error['file'];
            $errorLine = $error['line'];
            $errorMessage = $error['message'];
            $errorType = $error['type'];

            if ($this->displayErrorDetails) {
                $message = "Fatal error: $errorMessage in $errorFile on line $errorLine";
            } else {
                $message = 'An error occurred while processing your request. Please try again later.';
            }

            if (in_array($errorType, [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
                $exception = new HttpInternalServerErrorException($this->request, $message);
                $response = $this->errorHandler->__invoke(
                    $this->request,
                    $exception,
                    $this->displayErrorDetails,
                    false,
                    false
                );

                if (ob_get_contents()) {
                    ob_clean();
                }

                $responseEmitter = new ResponseEmitter();
                $responseEmitter->emit($response);
            }
        }
    }
}

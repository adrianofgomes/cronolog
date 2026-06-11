<?php

declare(strict_types=1);

namespace App\Application\Actions;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Application\Settings\SettingsInterface;
use PDO;
use Exception;

class StatusAction
{
    private PDO $db;
    private SettingsInterface $settings;

    public function __construct(PDO $db, SettingsInterface $settings)
    {
        $this->db = $db;
        $this->settings = $settings;
    }

    public function __invoke(Request $request, Response $response): Response
    {
        $dbStatus = 'ok';
        try {
            $this->db->query('SELECT 1');
        } catch (Exception $e) {
            $dbStatus = 'error: ' . $e->getMessage();
        }

        $googleClientId = $this->settings->get('google')['client_id'] ?? null;
        $googleConfig = (!empty($googleClientId)) ? 'configured' : 'missing';

        $data = [
            'status' => 'online',
            'database' => $dbStatus,
            'google_auth' => $googleConfig,
            'environment' => $_ENV['APP_ENV'] ?? 'production',
            'php_version' => PHP_VERSION,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        $statusCode = ($dbStatus === 'ok') ? 200 : 500;

        $response->getBody()->write(json_encode($data, JSON_PRETTY_PRINT));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($statusCode);
    }
}
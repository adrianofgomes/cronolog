<?php

declare(strict_types=1);

namespace App\Application\Actions\Admin;

use App\Application\Actions\Action;
use App\Application\Settings\SettingsInterface;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Exception;

class SystemInfoAction extends Action
{
    private PDO $db;
    private SettingsInterface $settings;

    public function __construct(LoggerInterface $logger, PDO $db, SettingsInterface $settings)
    {
        parent::__construct($logger);
        $this->db = $db;
        $this->settings = $settings;
    }

    protected function action(): Response
    {
        $dbStatus = 'Conectado';
        try {
            $this->db->query('SELECT 1');
        } catch (Exception $e) {
            $dbStatus = 'Erro: ' . $e->getMessage();
        }

        $versionInfo = ['version' => 'Desconhecida', 'build' => 0, 'date' => '-'];
        
        // Try multiple paths to find version.json
        $possiblePaths = [
            __DIR__ . '/../../../../version.json', // In production (root of core)
            __DIR__ . '/../../../../../version.json', // In local dev (root of project)
        ];

        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $content = file_get_contents($path);
                if ($content) {
                    $versionInfo = json_decode($content, true) ?: $versionInfo;
                    break;
                }
            }
        }

        $systemInfo = [
            'app_version' => $versionInfo['version'],
            'app_build' => $versionInfo['build'],
            'app_date' => $versionInfo['date'],
            'php_version' => PHP_VERSION,
            'db_status' => $dbStatus,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Desconhecido',
            'os' => PHP_OS,
            'debug_mode' => $this->settings->get('displayErrorDetails'),
            'test_tokens' => $this->settings->get('enableTestTokens'),
            'max_upload_size' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'memory_limit' => ini_get('memory_limit'),
        ];

        return $this->respondWithData($systemInfo);
    }
}

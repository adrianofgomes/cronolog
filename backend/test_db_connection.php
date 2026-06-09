<?php

declare(strict_types=1);

use App\Application\Settings\SettingsInterface;
use DI\ContainerBuilder;

require __DIR__ . '/vendor/autoload.php';

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
    echo "✅ .env file loaded successfully.\n";
} else {
    die("❌ .env file not found.\n");
}

// Instantiate PHP-DI ContainerBuilder
$containerBuilder = new ContainerBuilder();

// Set up settings
$settings = require __DIR__ . '/app/settings.php';
$settings($containerBuilder);

// Set up dependencies
$dependencies = require __DIR__ . '/app/dependencies.php';
$dependencies($containerBuilder);

try {
    // Build Container
    $container = $containerBuilder->build();

    echo "⏳ Attempting to connect to the database...\n";
    
    /** @var PDO $pdo */
    $pdo = $container->get(PDO::class);
    
    echo "✅ Connection successful!\n";
    
    // Test a simple query
    $query = $pdo->query("SELECT version() as version");
    $result = $query->fetch();
    
    echo "🖥️ MySQL Version: " . $result['version'] . "\n";
    
    // Check if users table exists
    $query = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($query->fetch()) {
        echo "✅ Table 'users' exists.\n";
    } else {
        echo "⚠️ Table 'users' NOT found. Did you run database.sql?\n";
    }

} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ General Error: " . $e->getMessage() . "\n";
}

<?php
header('Content-Type: text/plain');

echo "--- Cronolog Backend Debug ---\n";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Interface: " . php_sapi_name() . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Current Directory: " . __DIR__ . "\n";

$corePath = __DIR__ . '/../../../cronolog';
echo "\nChecking Core Path: $corePath\n";
if (is_dir($corePath)) {
    echo "✅ Core directory exists.\n";
    
    $autoload = $corePath . '/vendor/autoload.php';
    if (file_exists($autoload)) {
        echo "✅ Autoload exists.\n";
    } else {
        echo "❌ Autoload MISSING at: $autoload\n";
        echo "   (Did you run deploy with --full?)\n";
    }

    $envFile = $corePath . '/.env';
    if (file_exists($envFile)) {
        echo "✅ .env file exists.\n";
    } else {
        echo "❌ .env file MISSING at: $envFile\n";
    }
} else {
    echo "❌ Core directory NOT FOUND at: $corePath\n";
    echo "   Relative from: " . __DIR__ . "\n";
}

echo "\n--- End of Debug ---\n";

<?php

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;

// --- CONFIGURATION ---
// Change this to the URL where your Slim app is running
// Remote URL on HostGator
$baseUrl = 'https://pogger.com.br/php_template'; 

$client = new Client([
    'base_uri' => $baseUrl,
    'timeout'  => 5.0,
]);

echo "🚀 Starting API Authentication Tests...\n\n";

/**
 * Helper to call the API and print results
 */
$testEndpoint = function (string $name, string $token, string $endpoint) use ($client) {
    echo "--- Test: $name ---\n";
    echo "Endpoint: $endpoint\n";
    echo "Token: $token\n";
    
    try {
        $response = $client->get($endpoint, [
            'headers' => [
                'Authorization' => "Bearer $token",
                'Accept'        => 'application/json',
            ]
        ]);
        
        echo "✅ Status: " . $response->getStatusCode() . "\n";
        echo "📦 Body: " . $response->getBody() . "\n";
    } catch (ClientException $e) {
        echo "❌ Status: " . $e->getResponse()->getStatusCode() . "\n";
        echo "📦 Error Body: " . $e->getResponse()->getBody() . "\n";
    } catch (Exception $e) {
        echo "💥 Unexpected Error: " . $e->getMessage() . "\n";
    }
    echo "\n";
};

// 1. Test without token (Should return 401)
echo "1️⃣ Testing WITHOUT token:\n";
try {
    $client->get('/users/me/is-admin');
} catch (ClientException $e) {
    echo "✅ Expected 401/403: " . $e->getResponse()->getStatusCode() . "\n\n";
}

// 2. Test with New User Token (Should trigger Auto-Registration and return 403 Pending)
// Note: 'new-user-token' is a mock token I added in AuthMiddleware.php
$testEndpoint("New User (Auto-Registration)", "new-user-token", "/users/me/is-admin");

// 3. Test with Admin Token (Mocked as 'test-token' in AuthMiddleware.php)
// If you haven't approved this user in DB, it will return 403.
// After manual approval in DB, it should return 200.
$testEndpoint("Existing/Admin User", "test-token", "/users/me/is-admin");

echo "💡 NOTE: For the 'Existing/Admin User' test to return 200,\n";
echo "you must manually update the user in the database:\n";
echo "UPDATE users SET status = 'active', is_admin = 1 WHERE google_id = '123456789';\n";

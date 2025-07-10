<?php
/**
 * TrendyX AI Level 5 Enterprise - Website Integration Handler (PHP)
 * 
 * This PHP script handles secure communication between your website and TrendyX AI platform.
 * It creates TrendyX AI accounts when users sign up on your main website.
 * 
 * INSTALLATION:
 * 1. Save this file as: trendyx-integration.php
 * 2. Place in your website's API directory (e.g., /api/trendyx-integration.php)
 * 3. Update the TRENDYX_API_KEY and TRENDYX_API_BASE_URL constants
 * 4. Ensure your server has cURL enabled
 * 5. Update your website-integration-script.js to point to this file
 */

// Configuration
define('TRENDYX_API_BASE_URL', 'https://trendyx-level5-enterprise-production.up.railway.app');
define('TRENDYX_API_KEY', 'website-integration-key-2024');
define('TRENDYX_CREATE_USER_ENDPOINT', '/api/integration/create-user');
define('TRENDYX_VERIFY_USER_ENDPOINT', '/api/integration/verify-user');

// Security settings
define('ALLOWED_ORIGINS', [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'http://localhost:3000', // For development
    'http://localhost:8000'  // For development
]);

/**
 * TrendyX AI Integration Handler Class
 */
class TrendyXIntegrationHandler {
    
    private $apiBaseUrl;
    private $apiKey;
    
    public function __construct() {
        $this->apiBaseUrl = TRENDYX_API_BASE_URL;
        $this->apiKey = TRENDYX_API_KEY;
        
        // Set CORS headers
        $this->setCorsHeaders();
        
        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
    
    /**
     * Set CORS headers for cross-origin requests
     */
    private function setCorsHeaders() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if (in_array($origin, ALLOWED_ORIGINS)) {
            header("Access-Control-Allow-Origin: $origin");
        }
        
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization');
        header('Access-Control-Allow-Credentials: true');
        header('Content-Type: application/json');
    }
    
    /**
     * Main handler method
     */
    public function handleRequest() {
        try {
            // Validate request method
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Only POST requests are allowed', 405);
            }
            
            // Get and validate input
            $input = $this->getJsonInput();
            $action = $input['action'] ?? '';
            
            switch ($action) {
                case 'create_trendyx_account':
                    return $this->createTrendyXAccount($input['userData'] ?? []);
                    
                case 'verify_trendyx_user':
                    return $this->verifyTrendyXUser($input['token'] ?? '');
                    
                default:
                    throw new Exception('Invalid action specified', 400);
            }
            
        } catch (Exception $e) {
            return $this->sendErrorResponse($e->getMessage(), $e->getCode() ?: 500);
        }
    }
    
    /**
     * Create TrendyX AI account for user
     */
    private function createTrendyXAccount($userData) {
        // Validate required fields
        $this->validateUserData($userData);
        
        // Prepare data for TrendyX AI API
        $trendyxData = [
            'username' => $userData['username'],
            'password' => $userData['password'],
            'email' => $userData['email'] ?? ''
        ];
        
        // Call TrendyX AI API
        $response = $this->callTrendyXAPI(TRENDYX_CREATE_USER_ENDPOINT, $trendyxData);
        
        if ($response['success']) {
            // Log successful integration
            $this->logIntegration($userData['username'], 'account_created', $response['data']);
            
            return $this->sendSuccessResponse([
                'message' => 'TrendyX AI account created successfully',
                'trendyxUserId' => $response['data']['userId'] ?? null,
                'trendyxUrl' => $this->apiBaseUrl . '/auth?username=' . urlencode($userData['username']),
                'integrationTime' => date('Y-m-d H:i:s')
            ]);
        } else {
            throw new Exception($response['message'] ?? 'Failed to create TrendyX AI account', 400);
        }
    }
    
    /**
     * Verify TrendyX AI user token
     */
    private function verifyTrendyXUser($token) {
        if (empty($token)) {
            throw new Exception('Token is required', 400);
        }
        
        $verifyData = ['token' => $token];
        $response = $this->callTrendyXAPI(TRENDYX_VERIFY_USER_ENDPOINT, $verifyData);
        
        if ($response['success']) {
            return $this->sendSuccessResponse([
                'valid' => true,
                'user' => $response['data']['user'] ?? null,
                'verificationTime' => date('Y-m-d H:i:s')
            ]);
        } else {
            return $this->sendSuccessResponse([
                'valid' => false,
                'message' => $response['message'] ?? 'Invalid token'
            ]);
        }
    }
    
    /**
     * Validate user data before sending to TrendyX AI
     */
    private function validateUserData($userData) {
        $required = ['username', 'password'];
        $missing = [];
        
        foreach ($required as $field) {
            if (empty($userData[$field])) {
                $missing[] = $field;
            }
        }
        
        if (!empty($missing)) {
            throw new Exception('Missing required fields: ' . implode(', ', $missing), 400);
        }
        
        // Validate username
        if (!preg_match('/^[a-zA-Z0-9_]{3,20}$/', $userData['username'])) {
            throw new Exception('Username must be 3-20 characters, alphanumeric and underscores only', 400);
        }
        
        // Validate password
        if (strlen($userData['password']) < 6) {
            throw new Exception('Password must be at least 6 characters long', 400);
        }
        
        // Validate email if provided
        if (!empty($userData['email']) && !filter_var($userData['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format', 400);
        }
    }
    
    /**
     * Call TrendyX AI API
     */
    private function callTrendyXAPI($endpoint, $data) {
        $url = $this->apiBaseUrl . $endpoint;
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-API-Key: ' . $this->apiKey
            ],
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_FOLLOWLOCATION => true
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception('cURL error: ' . $error, 500);
        }
        
        if ($httpCode >= 400) {
            $errorData = json_decode($response, true);
            $errorMessage = $errorData['message'] ?? 'HTTP error ' . $httpCode;
            throw new Exception($errorMessage, $httpCode);
        }
        
        $responseData = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON response from TrendyX AI API', 500);
        }
        
        return [
            'success' => $httpCode >= 200 && $httpCode < 300,
            'data' => $responseData,
            'message' => $responseData['message'] ?? null
        ];
    }
    
    /**
     * Get JSON input from request body
     */
    private function getJsonInput() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON input', 400);
        }
        
        return $data ?: [];
    }
    
    /**
     * Send success response
     */
    private function sendSuccessResponse($data) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    /**
     * Send error response
     */
    private function sendErrorResponse($message, $code = 500) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
    }
    
    /**
     * Log integration events
     */
    private function logIntegration($username, $event, $data = null) {
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'username' => $username,
            'event' => $event,
            'data' => $data,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];
        
        // Log to file (create logs directory if it doesn't exist)
        $logDir = __DIR__ . '/logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $logFile = $logDir . '/trendyx-integration-' . date('Y-m-d') . '.log';
        file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
    }
}

/**
 * Health check endpoint
 */
function healthCheck() {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'ok',
        'service' => 'TrendyX AI Integration Handler',
        'version' => '1.0.0',
        'timestamp' => date('Y-m-d H:i:s'),
        'trendyx_api_url' => TRENDYX_API_BASE_URL
    ]);
    exit();
}

// Handle health check requests
if (isset($_GET['health']) || $_SERVER['REQUEST_URI'] === '/api/trendyx-integration.php?health') {
    healthCheck();
}

// Initialize and handle request
$handler = new TrendyXIntegrationHandler();
$handler->handleRequest();

?>

<?php
/**
 * USAGE EXAMPLES:
 * 
 * 1. Test the integration handler:
 * 
 * curl -X POST https://yourdomain.com/api/trendyx-integration.php \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "action": "create_trendyx_account",
 *     "userData": {
 *       "username": "testuser123",
 *       "password": "securepassword",
 *       "email": "test@example.com"
 *     }
 *   }'
 * 
 * 2. Health check:
 * 
 * curl https://yourdomain.com/api/trendyx-integration.php?health
 * 
 * 3. Verify user token:
 * 
 * curl -X POST https://yourdomain.com/api/trendyx-integration.php \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "action": "verify_trendyx_user",
 *     "token": "your-jwt-token-here"
 *   }'
 * 
 * SECURITY NOTES:
 * - Update ALLOWED_ORIGINS with your actual domain(s)
 * - Keep TRENDYX_API_KEY secure and never expose it in client-side code
 * - Consider implementing rate limiting for production use
 * - Monitor the integration logs for suspicious activity
 * - Use HTTPS in production for all communications
 */
?>


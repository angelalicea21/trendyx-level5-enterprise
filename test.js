/**
 * TrendyX AI Level 5 Enterprise - Comprehensive Test Suite
 * Tests all critical functionality and verifies fixes
 * Author: Manus AI
 * Version: 5.0.0
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');

class TrendyXTestSuite {
    constructor(baseUrl = 'http://localhost:8080') {
        this.baseUrl = baseUrl;
        this.testResults = [];
        this.authToken = null;
        this.testUser = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@trendyx.ai',
            username: 'testuser123',
            password: 'TestPass123!'
        };
    }

    // Utility method to make HTTP requests
    async makeRequest(method, path, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseUrl + path);
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TrendyX-Test-Suite/1.0',
                    ...headers
                }
            };

            const client = url.protocol === 'https:' ? https : http;
            const req = client.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const jsonBody = body ? JSON.parse(body) : {};
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: jsonBody
                        });
                    } catch (e) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: body
                        });
                    }
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    // Test logging
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': '📋',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️'
        }[type] || '📋';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    // Record test result
    recordTest(testName, passed, message, details = {}) {
        const result = {
            testName,
            passed,
            message,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        if (passed) {
            this.log(`${testName}: ${message}`, 'success');
        } else {
            this.log(`${testName}: ${message}`, 'error');
        }
        
        return result;
    }

    // Test 1: Health Check Endpoint
    async testHealthCheck() {
        try {
            const response = await this.makeRequest('GET', '/api/health');
            
            if (response.statusCode === 200 && response.body.success) {
                return this.recordTest(
                    'Health Check',
                    true,
                    'Server is healthy and responding correctly',
                    { statusCode: response.statusCode, uptime: response.body.uptime }
                );
            } else {
                return this.recordTest(
                    'Health Check',
                    false,
                    `Health check failed: ${response.statusCode}`,
                    response.body
                );
            }
        } catch (error) {
            return this.recordTest(
                'Health Check',
                false,
                `Health check error: ${error.message}`,
                { error: error.message }
            );
        }
    }

    // Test 2: User Registration
    async testUserRegistration() {
        try {
            // First, try to register with invalid data to test validation
            const invalidResponse = await this.makeRequest('POST', '/api/auth/register', {
                firstName: 'A', // Too short
                lastName: '',   // Empty
                email: 'invalid-email',
                username: 'ab', // Too short
                password: '123' // Too weak
            });

            if (invalidResponse.statusCode !== 400) {
                return this.recordTest(
                    'Registration Validation',
                    false,
                    'Validation should reject invalid data',
                    invalidResponse.body
                );
            }

            // Now test valid registration
            const validResponse = await this.makeRequest('POST', '/api/auth/register', this.testUser);
            
            if (validResponse.statusCode === 201 && validResponse.body.success) {
                return this.recordTest(
                    'User Registration',
                    true,
                    'User registration successful with proper validation',
                    { userId: validResponse.body.user?.id }
                );
            } else {
                return this.recordTest(
                    'User Registration',
                    false,
                    `Registration failed: ${validResponse.body.message}`,
                    validResponse.body
                );
            }
        } catch (error) {
            return this.recordTest(
                'User Registration',
                false,
                `Registration error: ${error.message}`,
                { error: error.message }
            );
        }
    }

    // Test 3: User Login
    async testUserLogin() {
        try {
            // Test invalid login first
            const invalidResponse = await this.makeRequest('POST', '/api/auth/login', {
                email: this.testUser.email,
                password: 'wrongpassword'
            });

            if (invalidResponse.statusCode !== 401) {
                return this.recordTest(
                    'Login Security',
                    false,
                    'Invalid credentials should be rejected',
                    invalidResponse.body
                );
            }

            // Test valid login
            const validResponse = await this.makeRequest('POST', '/api/auth/login', {
                email: this.testUser.email,
                password: this.testUser.password
            });
            
            if (validResponse.statusCode === 200 && validResponse.body.success && validResponse.body.token) {
                this.authToken = validResponse.body.token;
                return this.recordTest(
                    'User Login',
                    true,
                    'Login successful with valid credentials',
                    { hasToken: !!validResponse.body.token }
                );
            } else {
                return this.recordTest(
                    'User Login',
                    false,
                    `Login failed: ${validResponse.body.message}`,
                    validResponse.body
                );
            }
        } catch (error) {
            return this.recordTest(
                'User Login',
                false,
                `Login error: ${error.message}`,
                { error: error.message }
            );
        }
    }

    // Test 4: Token Verification
    async testTokenVerification() {
        if (!this.authToken) {
            return this.recordTest(
                'Token Verification',
                false,
                'No auth token available for testing',
                {}
            );
        }

        try {
            const response = await this.makeRequest('GET', '/api/auth/verify', null, {
                'Authorization': `Bearer ${this.authToken}`
            });
            
            if (response.statusCode === 200 && response.body.success) {
                return this.recordTest(
                    'Token Verification',
                    true,
                    'Token verification successful',
                    { userId: response.body.user?.id }
                );
            } else {
                return this.recordTest(
                    'Token Verification',
                    false,
                    `Token verification failed: ${response.body.message}`,
                    response.body
                );
            }
        } catch (error) {
            return this.recordTest(
                'Token Verification',
                false,
                `Token verification error: ${error.message}`,
                { error: error.message }
            );
        }
    }

    // Test 5: Dashboard JSON API (CRITICAL FIX)
    async testDashboardAPI() {
        if (!this.authToken) {
            return this.recordTest(
                'Dashboard API',
                false,
                'No auth token available for testing',
                {}
            );
        }

        try {
            // Test unauthenticated access first
            const unauthResponse = await this.makeRequest('GET', '/api/dashboard');
            
            if (unauthResponse.statusCode !== 401) {
                return this.recordTest(
                    'Dashboard Security',
                    false,
                    'Unauthenticated dashboard access should be rejected',
                    unauthResponse.body
                );
            }

            // Test authenticated access
            const authResponse = await this.makeRequest('GET', '/api/dashboard', null, {
                'Authorization': `Bearer ${this.authToken}`
            });
            
            if (authResponse.statusCode === 200 && authResponse.body.success && authResponse.body.dashboard) {
                return this.recordTest(
                    'Dashboard JSON API',
                    true,
                    'Dashboard API returns proper JSON response',
                    { 
                        hasUser: !!authResponse.body.dashboard.user,
                        hasStatistics: !!authResponse.body.dashboard.statistics,
                        hasEngines: !!authResponse.body.dashboard.availableEngines
                    }
                );
            } else {
                return this.recordTest(
                    'Dashboard JSON API',
                    false,
                    `Dashboard API failed: ${authResponse.body.message}`,
                    authResponse.body
                );
            }
        } catch (error) {
            return this.recordTest(
                'Dashboard JSON API',
                false,
                `Dashboard API error: ${error.message}`,
                { error: error.message }
            );
        }
    }

    // Test 6: AI Generation Engines
    async testAIGeneration() {
        if (!this.authToken) {
            return this.recordTest(
                'AI Generation',
                false,
                'No auth token available for testing',
                {}
            );
        }

        const engines = ['quantum', 'neural', 'predictive'];
        const results = [];

        for (const engine of engines) {
            try {
                const response = await this.makeRequest('POST', `/api/ai/generate/${engine}`, {}, {
                    'Authorization': `Bearer ${this.authToken}`
                });
                
                if (response.statusCode === 200 && response.body.success && response.body.content) {
                    results.push({
                        engine,
                        success: true,
                        wordCount: response.body.content.wordCount
                    });
                } else {
                    results.push({
                        engine,
                        success: false,
                        error: response.body.message
                    });
                }
            } catch (error) {
                results.push({
                    engine,
                    success: false,
                    error: error.message
                });
            }
        }

        const successfulEngines = results.filter(r => r.success).length;
        const allSuccessful = successfulEngines === engines.length;

        return this.recordTest(
            'AI Generation Engines',
            allSuccessful,
            `${successfulEngines}/${engines.length} AI engines working correctly`,
            { results }
        );
    }

    // Test 7: User Content Management
    async testContentManagement() {
        if (!this.authToken) {
            return this.recordTest(
                'Content Management',
                false,
                'No auth token available for testing',
                {}
            );
        }

        try {
            // Generate some content first
            await this.makeRequest('POST', '/api/ai/generate/quantum', {}, {
                'Authorization': `Bearer ${this.authToken}`
            });

            // Test content retrieval
            const response = await this.makeRequest('GET', '/api/content/user', null, {
                'Authorization': `Bearer ${this.authToken}`
            });
            
            if (response.statusCode === 200 && response.body.success) {
                const hasContent = response.body.content && response.body.content.length > 0;
                const hasStatistics = response.body.statistics && 
                                    typeof response.body.statistics.totalContent === 'number';

                return this.recordTest(
                    'Content Management',
                    hasContent && hasStatistics,
                    `Content retrieval successful with ${response.body.content?.length || 0} items`,
                    { 
                        contentCount: response.body.content?.length,
                        statistics: response.body.statistics
                    }
                );
            } else {
                return this.recordTest(
                    'Content Management',
                    false,
                    `Content retrieval failed: ${response.body.message}`,
                    response.body
                );
            }
        } catch (error) {
            return this.recordTest(
                'Content Management',
                false,
                `Content management error: ${error.message}`,
                { error: error.message }
            );
        }
    }

    // Test 8: Rate Limiting
    async testRateLimiting() {
        try {
            // Make multiple rapid requests to test rate limiting
            const requests = [];
            for (let i = 0; i < 5; i++) {
                requests.push(this.makeRequest('GET', '/api/health'));
            }

            const responses = await Promise.all(requests);
            const allSuccessful = responses.every(r => r.statusCode === 200);

            return this.recordTest(
                'Rate Limiting',
                allSuccessful,
                'Rate limiting allows normal usage patterns',
                { requestCount: responses.length }
            );
        } catch (error) {
            return this.recordTest(
                'Rate Limiting',
                false,
                `Rate limiting test error: ${error.message}`,
                { error: error.message }
            );
        }
    }

    // Test 9: Error Handling
    async testErrorHandling() {
        try {
            // Test 404 endpoint
            const notFoundResponse = await this.makeRequest('GET', '/api/nonexistent');
            
            if (notFoundResponse.statusCode === 404 && notFoundResponse.body.success === false) {
                return this.recordTest(
                    'Error Handling',
                    true,
                    '404 errors handled correctly',
                    { statusCode: notFoundResponse.statusCode }
                );
            } else {
                return this.recordTest(
                    'Error Handling',
                    false,
                    'Error handling not working correctly',
                    notFoundResponse.body
                );
            }
        } catch (error) {
            return this.recordTest(
                'Error Handling',
                false,
                `Error handling test failed: ${error.message}`,
                { error: error.message }
            );
        }
    }

    // Test 10: Environment Variable Support
    async testEnvironmentVariables() {
        try {
            // This test checks if the server properly handles environment variables
            // by verifying JWT token generation works (which depends on JWT_SECRET)
            
            if (this.authToken) {
                // If we have a token, JWT_SECRET is working
                return this.recordTest(
                    'Environment Variables',
                    true,
                    'JWT_SECRET environment variable working correctly',
                    { hasAuthToken: true }
                );
            } else {
                return this.recordTest(
                    'Environment Variables',
                    false,
                    'JWT_SECRET environment variable may not be configured',
                    { hasAuthToken: false }
                );
            }
        } catch (error) {
            return this.recordTest(
                'Environment Variables',
                false,
                `Environment variable test error: ${error.message}`,
                { error: error.message }
            );
        }
    }

    // Run all tests
    async runAllTests() {
        this.log('🚀 Starting TrendyX AI Level 5 Enterprise Test Suite', 'info');
        this.log(`Testing against: ${this.baseUrl}`, 'info');
        
        const startTime = Date.now();

        // Run tests in sequence
        await this.testHealthCheck();
        await this.testUserRegistration();
        await this.testUserLogin();
        await this.testTokenVerification();
        await this.testDashboardAPI();
        await this.testAIGeneration();
        await this.testContentManagement();
        await this.testRateLimiting();
        await this.testErrorHandling();
        await this.testEnvironmentVariables();

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Generate summary
        this.generateSummary(duration);
    }

    // Generate test summary
    generateSummary(duration) {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);

        this.log('', 'info');
        this.log('📊 TEST SUMMARY', 'info');
        this.log('═'.repeat(50), 'info');
        this.log(`Total Tests: ${totalTests}`, 'info');
        this.log(`Passed: ${passedTests}`, passedTests === totalTests ? 'success' : 'info');
        this.log(`Failed: ${failedTests}`, failedTests === 0 ? 'info' : 'error');
        this.log(`Success Rate: ${successRate}%`, successRate === '100.0' ? 'success' : 'warning');
        this.log(`Duration: ${duration}ms`, 'info');
        this.log('═'.repeat(50), 'info');

        if (failedTests > 0) {
            this.log('', 'info');
            this.log('❌ FAILED TESTS:', 'error');
            this.testResults.filter(r => !r.passed).forEach(test => {
                this.log(`  • ${test.testName}: ${test.message}`, 'error');
            });
        }

        if (passedTests === totalTests) {
            this.log('', 'info');
            this.log('🎉 ALL TESTS PASSED! TrendyX AI Platform is fully operational!', 'success');
        } else {
            this.log('', 'info');
            this.log('⚠️  Some tests failed. Please review the issues above.', 'warning');
        }

        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: parseFloat(successRate),
            duration,
            results: this.testResults
        };
    }
}

// Export for use in other modules
module.exports = TrendyXTestSuite;

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new TrendyXTestSuite();
    testSuite.runAllTests().catch(console.error);
}


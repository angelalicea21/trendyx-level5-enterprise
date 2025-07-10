/**
 * TrendyX AI Level 5 Enterprise - Website Integration Script
 * 
 * This script handles the integration between your main website and TrendyX AI platform.
 * It automatically creates TrendyX AI accounts when users sign up on your main website.
 * 
 * INSTALLATION:
 * 1. Save this file as: website-integration-script.js
 * 2. Include in your main website's HTML: <script src="website-integration-script.js"></script>
 * 3. Update the TRENDYX_API_BASE_URL if needed
 * 4. Ensure your backend integration handler is set up (see website-integration-handler.php)
 */

// Configuration
const TRENDYX_CONFIG = {
    // Your TrendyX AI production URL
    API_BASE_URL: 'https://trendyx-level5-enterprise-production.up.railway.app',
    
    // Your website's backend integration handler URL
    INTEGRATION_HANDLER_URL: '/api/trendyx-integration.php', // Update this path as needed
    
    // UI Configuration
    REDIRECT_DELAY: 2000, // 2 seconds delay before redirect
    SHOW_SUCCESS_MESSAGE: true,
    SUCCESS_MESSAGE: '🚀 Welcome to TrendyX AI! Redirecting to your AI dashboard...'
};

/**
 * TrendyX AI Integration Class
 * Handles all communication between your website and TrendyX AI platform
 */
class TrendyXIntegration {
    constructor(config = TRENDYX_CONFIG) {
        this.config = config;
        this.isProcessing = false;
    }

    /**
     * Main integration function - call this when a user signs up on your website
     * @param {Object} userData - User registration data
     * @param {string} userData.username - User's chosen username
     * @param {string} userData.password - User's password
     * @param {string} userData.email - User's email address
     * @param {string} userData.firstName - User's first name (optional)
     * @param {string} userData.lastName - User's last name (optional)
     * @returns {Promise<Object>} Integration result
     */
    async createTrendyXAccount(userData) {
        if (this.isProcessing) {
            throw new Error('Integration already in progress');
        }

        this.isProcessing = true;

        try {
            // Validate required fields
            this.validateUserData(userData);

            // Show loading state
            this.showLoadingState();

            // Create TrendyX AI account via your backend
            const result = await this.callIntegrationHandler(userData);

            if (result.success) {
                // Show success message
                this.showSuccessMessage(result);

                // Redirect to TrendyX AI platform
                await this.redirectToTrendyX(result.trendyxUrl || this.config.API_BASE_URL);

                return {
                    success: true,
                    message: 'TrendyX AI account created successfully',
                    trendyxUserId: result.trendyxUserId,
                    redirectUrl: result.trendyxUrl
                };
            } else {
                throw new Error(result.message || 'Failed to create TrendyX AI account');
            }

        } catch (error) {
            this.showErrorMessage(error.message);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Validate user data before sending to TrendyX AI
     * @param {Object} userData - User data to validate
     */
    validateUserData(userData) {
        const required = ['username', 'password', 'email'];
        const missing = required.filter(field => !userData[field]);

        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            throw new Error('Invalid email format');
        }

        // Validate username (alphanumeric, 3-20 characters)
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(userData.username)) {
            throw new Error('Username must be 3-20 characters, alphanumeric and underscores only');
        }

        // Validate password strength (minimum 6 characters)
        if (userData.password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
    }

    /**
     * Call your backend integration handler
     * @param {Object} userData - User data to send
     * @returns {Promise<Object>} Backend response
     */
    async callIntegrationHandler(userData) {
        const response = await fetch(this.config.INTEGRATION_HANDLER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                action: 'create_trendyx_account',
                userData: userData
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    }

    /**
     * Show loading state during integration
     */
    showLoadingState() {
        // Create or update loading message
        let loadingElement = document.getElementById('trendyx-loading');
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'trendyx-loading';
            loadingElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
            `;
            document.body.appendChild(loadingElement);
        }

        loadingElement.innerHTML = '🔄 Creating your TrendyX AI account...';
        loadingElement.style.display = 'block';
    }

    /**
     * Show success message
     * @param {Object} result - Integration result
     */
    showSuccessMessage(result) {
        if (!this.config.SHOW_SUCCESS_MESSAGE) return;

        const loadingElement = document.getElementById('trendyx-loading');
        if (loadingElement) {
            loadingElement.style.background = '#4CAF50';
            loadingElement.innerHTML = this.config.SUCCESS_MESSAGE;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showErrorMessage(message) {
        let errorElement = document.getElementById('trendyx-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'trendyx-error';
            errorElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                cursor: pointer;
            `;
            document.body.appendChild(errorElement);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 5000);

            // Hide on click
            errorElement.addEventListener('click', () => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            });
        }

        errorElement.innerHTML = `❌ ${message} (Click to dismiss)`;
        errorElement.style.display = 'block';

        // Hide loading message if present
        const loadingElement = document.getElementById('trendyx-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * Redirect user to TrendyX AI platform
     * @param {string} url - TrendyX AI URL
     */
    async redirectToTrendyX(url) {
        return new Promise((resolve) => {
            setTimeout(() => {
                window.open(url, '_blank');
                resolve();
            }, this.config.REDIRECT_DELAY);
        });
    }

    /**
     * Clean up UI elements
     */
    cleanup() {
        const elements = ['trendyx-loading', 'trendyx-error'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    }
}

// Create global instance
window.TrendyXIntegration = new TrendyXIntegration();

/**
 * USAGE EXAMPLES:
 * 
 * 1. Basic Integration (call this in your signup form handler):
 * 
 * document.getElementById('signup-form').addEventListener('submit', async (e) => {
 *     e.preventDefault();
 *     
 *     const userData = {
 *         username: document.getElementById('username').value,
 *         password: document.getElementById('password').value,
 *         email: document.getElementById('email').value,
 *         firstName: document.getElementById('firstName').value,
 *         lastName: document.getElementById('lastName').value
 *     };
 *     
 *     try {
 *         const result = await TrendyXIntegration.createTrendyXAccount(userData);
 *         console.log('TrendyX AI account created:', result);
 *         // Continue with your normal signup process
 *     } catch (error) {
 *         console.error('TrendyX AI integration failed:', error);
 *         // Handle error (user can still complete signup on your site)
 *     }
 * });
 * 
 * 2. Custom Configuration:
 * 
 * const customIntegration = new TrendyXIntegration({
 *     API_BASE_URL: 'https://your-custom-trendyx-url.com',
 *     INTEGRATION_HANDLER_URL: '/custom/integration/handler.php',
 *     REDIRECT_DELAY: 3000,
 *     SHOW_SUCCESS_MESSAGE: false
 * });
 * 
 * 3. Manual Integration (without automatic redirect):
 * 
 * async function createTrendyXAccountOnly(userData) {
 *     try {
 *         const integration = new TrendyXIntegration({
 *             ...TRENDYX_CONFIG,
 *             SHOW_SUCCESS_MESSAGE: false,
 *             REDIRECT_DELAY: 0
 *         });
 *         
 *         const result = await integration.createTrendyXAccount(userData);
 *         
 *         // Handle success manually
 *         alert('TrendyX AI account created! Visit: ' + TRENDYX_CONFIG.API_BASE_URL);
 *         
 *         return result;
 *     } catch (error) {
 *         console.error('Integration failed:', error);
 *         throw error;
 *     }
 * }
 */

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TrendyXIntegration, TRENDYX_CONFIG };
}


/**
 * TrendyX AI Level 5 Enterprise - Minimal Server Entry Point
 * This file redirects to the main server.js to fix Railway deployment issues
 */

console.log('🔄 TrendyX AI Level 5 Enterprise - Redirecting to main server...');
console.log('📍 Entry point: server-minimal.js → server.js');

// Simply require and start the main server
require('./server.js');


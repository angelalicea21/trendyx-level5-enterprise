const fs = require('fs');
const path = require('path');

const CONTENT_FILE = path.join(__dirname, 'user-content.json');

// Initialize content file if it doesn't exist
function initializeContentDatabase() {
    if (!fs.existsSync(CONTENT_FILE)) {
        fs.writeFileSync(CONTENT_FILE, JSON.stringify([]));
    }
}

// Load all content from file
function loadContent() {
    try {
        initializeContentDatabase();
        const data = fs.readFileSync(CONTENT_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading content:', error);
        return [];
    }
}

// Save content to file
function saveContent(contentArray) {
    try {
        fs.writeFileSync(CONTENT_FILE, JSON.stringify(contentArray, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving content:', error);
        return false;
    }
}

// Store new content generation
function storeContent(userId, contentData) {
    try {
        const allContent = loadContent();
        
        const newContent = {
            id: Date.now().toString(),
            userId: userId,
            type: contentData.type || 'general',
            title: contentData.title || 'Untitled',
            content: contentData.content,
            prompt: contentData.prompt || '',
            aiProvider: contentData.aiProvider || 'trendyx',
            model: contentData.model || 'quantum-neural',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            wordCount: contentData.content ? contentData.content.split(' ').length : 0,
            characterCount: contentData.content ? contentData.content.length : 0,
            tags: contentData.tags || [],
            favorite: false,
            exported: false
        };
        
        allContent.push(newContent);
        
        if (saveContent(allContent)) {
            return newContent;
        } else {
            throw new Error('Failed to save content');
        }
    } catch (error) {
        console.error('Error storing content:', error);
        return null;
    }
}

// Get content by user ID
function getUserContent(userId, options = {}) {
    try {
        const allContent = loadContent();
        let userContent = allContent.filter(content => content.userId === userId);
        
        // Apply filters
        if (options.type) {
            userContent = userContent.filter(content => content.type === options.type);
        }
        
        if (options.search) {
            const searchTerm = options.search.toLowerCase();
            userContent = userContent.filter(content => 
                content.title.toLowerCase().includes(searchTerm) ||
                content.content.toLowerCase().includes(searchTerm) ||
                content.prompt.toLowerCase().includes(searchTerm)
            );
        }
        
        if (options.favorite) {
            userContent = userContent.filter(content => content.favorite);
        }
        
        // Apply sorting
        const sortBy = options.sortBy || 'createdAt';
        const sortOrder = options.sortOrder || 'desc';
        
        userContent.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }
            
            if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });
        
        // Apply pagination
        if (options.limit) {
            const offset = options.offset || 0;
            userContent = userContent.slice(offset, offset + options.limit);
        }
        
        return userContent;
    } catch (error) {
        console.error('Error getting user content:', error);
        return [];
    }
}

// Get single content by ID
function getContentById(contentId, userId = null) {
    try {
        const allContent = loadContent();
        const content = allContent.find(c => c.id === contentId);
        
        if (!content) {
            return null;
        }
        
        // Verify user ownership if userId provided
        if (userId && content.userId !== userId) {
            return null;
        }
        
        return content;
    } catch (error) {
        console.error('Error getting content by ID:', error);
        return null;
    }
}

// Update content
function updateContent(contentId, userId, updateData) {
    try {
        const allContent = loadContent();
        const contentIndex = allContent.findIndex(c => c.id === contentId && c.userId === userId);
        
        if (contentIndex === -1) {
            return null;
        }
        
        // Update allowed fields
        const allowedFields = ['title', 'content', 'tags', 'favorite', 'type'];
        allowedFields.forEach(field => {
            if (updateData.hasOwnProperty(field)) {
                allContent[contentIndex][field] = updateData[field];
            }
        });
        
        // Update metadata
        allContent[contentIndex].updatedAt = new Date().toISOString();
        if (updateData.content) {
            allContent[contentIndex].wordCount = updateData.content.split(' ').length;
            allContent[contentIndex].characterCount = updateData.content.length;
        }
        
        if (saveContent(allContent)) {
            return allContent[contentIndex];
        } else {
            throw new Error('Failed to update content');
        }
    } catch (error) {
        console.error('Error updating content:', error);
        return null;
    }
}

// Delete content
function deleteContent(contentId, userId) {
    try {
        const allContent = loadContent();
        const contentIndex = allContent.findIndex(c => c.id === contentId && c.userId === userId);
        
        if (contentIndex === -1) {
            return false;
        }
        
        allContent.splice(contentIndex, 1);
        return saveContent(allContent);
    } catch (error) {
        console.error('Error deleting content:', error);
        return false;
    }
}

// Get content statistics for user
function getUserContentStats(userId) {
    try {
        const userContent = getUserContent(userId);
        
        const stats = {
            totalContent: userContent.length,
            totalWords: userContent.reduce((sum, content) => sum + (content.wordCount || 0), 0),
            totalCharacters: userContent.reduce((sum, content) => sum + (content.characterCount || 0), 0),
            favoriteCount: userContent.filter(content => content.favorite).length,
            contentByType: {},
            contentByProvider: {},
            recentActivity: userContent.slice(0, 5).map(content => ({
                id: content.id,
                title: content.title,
                type: content.type,
                createdAt: content.createdAt
            }))
        };
        
        // Count by type
        userContent.forEach(content => {
            stats.contentByType[content.type] = (stats.contentByType[content.type] || 0) + 1;
        });
        
        // Count by AI provider
        userContent.forEach(content => {
            stats.contentByProvider[content.aiProvider] = (stats.contentByProvider[content.aiProvider] || 0) + 1;
        });
        
        return stats;
    } catch (error) {
        console.error('Error getting user content stats:', error);
        return {
            totalContent: 0,
            totalWords: 0,
            totalCharacters: 0,
            favoriteCount: 0,
            contentByType: {},
            contentByProvider: {},
            recentActivity: []
        };
    }
}

// Mark content as exported
function markAsExported(contentId, userId, exportType) {
    try {
        const allContent = loadContent();
        const contentIndex = allContent.findIndex(c => c.id === contentId && c.userId === userId);
        
        if (contentIndex === -1) {
            return false;
        }
        
        allContent[contentIndex].exported = true;
        allContent[contentIndex].lastExported = new Date().toISOString();
        allContent[contentIndex].exportType = exportType;
        
        return saveContent(allContent);
    } catch (error) {
        console.error('Error marking content as exported:', error);
        return false;
    }
}

// Search content across all users (admin function)
function searchAllContent(searchTerm, options = {}) {
    try {
        const allContent = loadContent();
        const searchTermLower = searchTerm.toLowerCase();
        
        let results = allContent.filter(content =>
            content.title.toLowerCase().includes(searchTermLower) ||
            content.content.toLowerCase().includes(searchTermLower) ||
            content.prompt.toLowerCase().includes(searchTermLower)
        );
        
        // Apply filters
        if (options.type) {
            results = results.filter(content => content.type === options.type);
        }
        
        if (options.aiProvider) {
            results = results.filter(content => content.aiProvider === options.aiProvider);
        }
        
        // Sort by relevance (simple scoring)
        results.forEach(content => {
            let score = 0;
            if (content.title.toLowerCase().includes(searchTermLower)) score += 3;
            if (content.content.toLowerCase().includes(searchTermLower)) score += 2;
            if (content.prompt.toLowerCase().includes(searchTermLower)) score += 1;
            content.relevanceScore = score;
        });
        
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        return results;
    } catch (error) {
        console.error('Error searching all content:', error);
        return [];
    }
}

// Get database statistics
function getDatabaseStats() {
    try {
        const allContent = loadContent();
        
        const stats = {
            totalContent: allContent.length,
            totalUsers: [...new Set(allContent.map(c => c.userId))].length,
            totalWords: allContent.reduce((sum, content) => sum + (content.wordCount || 0), 0),
            totalCharacters: allContent.reduce((sum, content) => sum + (content.characterCount || 0), 0),
            contentByType: {},
            contentByProvider: {},
            recentContent: allContent
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10)
                .map(content => ({
                    id: content.id,
                    userId: content.userId,
                    title: content.title,
                    type: content.type,
                    createdAt: content.createdAt
                }))
        };
        
        // Count by type and provider
        allContent.forEach(content => {
            stats.contentByType[content.type] = (stats.contentByType[content.type] || 0) + 1;
            stats.contentByProvider[content.aiProvider] = (stats.contentByProvider[content.aiProvider] || 0) + 1;
        });
        
        return stats;
    } catch (error) {
        console.error('Error getting database stats:', error);
        return {
            totalContent: 0,
            totalUsers: 0,
            totalWords: 0,
            totalCharacters: 0,
            contentByType: {},
            contentByProvider: {},
            recentContent: []
        };
    }
}

module.exports = {
    initializeContentDatabase,
    storeContent,
    getUserContent,
    getContentById,
    updateContent,
    deleteContent,
    getUserContentStats,
    markAsExported,
    searchAllContent,
    getDatabaseStats
};


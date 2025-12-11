const crypto = require('crypto');

/**
 * Generate SHA256 hash from text content
 * Uses minimal normalization to preserve content uniqueness
 * @param {string} text - Text content to hash
 * @returns {string} - SHA256 hash
 */
function generateHash(text) {
    if (!text || typeof text !== 'string') {
        return crypto.createHash('sha256').update('').digest('hex');
    }

    // Minimal normalization - only trim whitespace at start/end
    // Preserve internal whitespace, case, and formatting to maintain uniqueness
    const normalizedText = text.trim();
    
    return crypto.createHash('sha256')
        .update(normalizedText)
        .digest('hex');
}

/**
 * Generate combined hash for resume + job description analysis
 * @param {string} resumeText - Resume content
 * @param {string} jdText - Job description content
 * @returns {string} - Combined SHA256 hash
 */
function generateCombinedHash(resumeText, jdText) {
    const resumeHash = generateHash(resumeText);
    const jdHash = generateHash(jdText);
    
    // Create deterministic combined hash
    const combinedInput = `resume:${resumeHash}|jd:${jdHash}`;
    
    return crypto.createHash('sha256')
        .update(combinedInput)
        .digest('hex');
}

/**
 * Generate hash for file content with filename
 * @param {Buffer|string} content - File content
 * @param {string} filename - Original filename
 * @returns {string} - SHA256 hash including filename
 */
function generateFileHash(content, filename) {
    const contentHash = generateHash(content.toString());
    const filenameHash = generateHash(filename || 'unnamed');
    
    const combinedInput = `file:${contentHash}|name:${filenameHash}`;
    
    return crypto.createHash('sha256')
        .update(combinedInput)
        .digest('hex');
}

/**
 * Generate content hash for duplicate prevention
 * Alias for generateHash with simpler interface (no normalization)
 * @param {string} content - Content to hash
 * @returns {string} SHA256 hash
 */
function generateContentHash(content) {
    if (!content || typeof content !== 'string') {
        return crypto.createHash('sha256').update('').digest('hex');
    }
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Hash a token (e.g., verification token, reset token)
 * Simple SHA256 hash without normalization
 * @param {string} token - Token to hash
 * @returns {string} SHA256 hash
 */
function hashToken(token) {
    if (!token || typeof token !== 'string') {
        return crypto.createHash('sha256').update('').digest('hex');
    }
    return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
    generateHash,
    generateCombinedHash,
    generateFileHash,
    generateContentHash,
    hashToken
};

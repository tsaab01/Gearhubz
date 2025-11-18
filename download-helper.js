// download-helper.js - Universal download solution for Tools Hub

class DownloadHelper {
    constructor() {
        this.supportedFormats = {
            'image/jpeg': 'jpg',
            'image/png': 'png', 
            'image/webp': 'webp',
            'image/gif': 'gif',
            'application/pdf': 'pdf',
            'text/plain': 'txt',
            'application/json': 'json'
        };
    }

    /**
     * Universal download function for all tools
     * @param {string} data - Data URL or blob data
     * @param {string} filename - Original filename
     * @param {string} format - Target format (jpeg, png, pdf, etc.)
     * @param {object} options - Additional options like quality
     */
    async downloadFile(data, filename, format, options = {}) {
        try {
            // Validate inputs
            if (!data || !filename || !format) {
                throw new Error('Missing required parameters for download');
            }

            // Get file extension
            const fileExtension = this.getFileExtension(format);
            const mimeType = this.getMimeType(format);
            
            // Clean filename and create download name
            const cleanName = this.cleanFilename(filename);
            const downloadName = `${cleanName}-converted.${fileExtension}`;

            let downloadData = data;

            // If it's canvas data, convert properly
            if (typeof data === 'string' && data.startsWith('data:')) {
                // It's already a data URL
                downloadData = data;
            } else if (data instanceof HTMLCanvasElement) {
                // Handle canvas element
                downloadData = this.canvasToDataURL(data, mimeType, options.quality || 0.8);
            } else if (data instanceof Blob) {
                // Handle blob data
                downloadData = URL.createObjectURL(data);
            } else {
                // Convert other data types to blob
                const blob = new Blob([data], { type: mimeType });
                downloadData = URL.createObjectURL(blob);
            }

            // Create and trigger download
            const link = document.createElement('a');
            link.href = downloadData;
            link.download = downloadName;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up object URL if we created one
            if (downloadData.startsWith('blob:')) {
                setTimeout(() => URL.revokeObjectURL(downloadData), 100);
            }

            return { success: true, filename: downloadName };

        } catch (error) {
            console.error('Download error:', error);
            return { 
                success: false, 
                error: error.message,
                suggestion: this.getErrorSuggestion(error)
            };
        }
    }

    /**
     * Convert canvas to data URL with proper error handling
     */
    canvasToDataURL(canvas, mimeType, quality = 0.8) {
        try {
            // For PNG, ignore quality (it's lossless)
            if (mimeType === 'image/png') {
                return canvas.toDataURL(mimeType);
            }
            
            // For other formats, use quality
            return canvas.toDataURL(mimeType, quality);
            
        } catch (error) {
            // Fallback for unsupported formats
            if (error.name === 'SecurityError' || error.message.includes('supported')) {
                console.warn(`Format ${mimeType} not supported, falling back to JPEG`);
                return canvas.toDataURL('image/jpeg', quality);
            }
            throw error;
        }
    }

    /**
     * Get file extension for format
     */
    getFileExtension(format) {
        const extensions = {
            'jpeg': 'jpg',
            'jpg': 'jpg',
            'png': 'png',
            'webp': 'webp',
            'gif': 'gif',
            'pdf': 'pdf',
            'txt': 'txt',
            'text': 'txt',
            'json': 'json'
        };
        
        return extensions[format.toLowerCase()] || 'file';
    }

    /**
     * Get MIME type for format
     */
    getMimeType(format) {
        const mimeTypes = {
            'jpeg': 'image/jpeg',
            'jpg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp',
            'gif': 'image/gif',
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'text': 'text/plain',
            'json': 'application/json'
        };
        
        return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
    }

    /**
     * Clean filename for safe download
     */
    cleanFilename(filename) {
        return filename
            .replace(/\.[^/.]+$/, "") // Remove extension
            .replace(/[^a-zA-Z0-9-_]/g, "_") // Replace special chars
            .substring(0, 50); // Limit length
    }

    /**
     * Get user-friendly error suggestions
     */
    getErrorSuggestion(error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('security') || errorMsg.includes('cross-origin')) {
            return 'Please try a different image or check browser security settings.';
        } else if (errorMsg.includes('supported') || errorMsg.includes('format')) {
            return 'This format may not be supported by your browser. Try a different format.';
        } else if (errorMsg.includes('size') || errorMsg.includes('large')) {
            return 'The file might be too large. Try a smaller image or lower quality.';
        } else {
            return 'Please try again or use a different file.';
        }
    }

    /**
     * Validate file before processing
     */
    validateFile(file, maxSizeMB = 5) {
        const errors = [];
        
        if (!file) {
            errors.push('No file selected');
            return { isValid: false, errors };
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            errors.push(`File size must be less than ${maxSizeMB}MB`);
        }

        if (!file.type) {
            errors.push('Unable to determine file type');
        }

        return {
            isValid: errors.length === 0,
            errors,
            fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type,
                extension: this.getFileExtension(file.name.split('.').pop())
            }
        };
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }

    /**
     * Show status message (universal)
     */
    showStatus(element, message, type = '') {
        if (!element) return;
        
        element.textContent = message;
        element.className = 'status-message';
        
        if (type) {
            element.classList.add(type);
        }
    }
}

// Create global instance
window.DownloadHelper = new DownloadHelper();

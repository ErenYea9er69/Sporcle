// Quiz Battle - Utilities
import { logError } from './error-handler.js';

export function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function showVisualFeedback(text, className) {
    const feedback = document.createElement('div');
    feedback.className = `visual-feedback ${className}`;
    feedback.textContent = text;
    document.body.appendChild(feedback);

    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 600);
}

export function getLowestAvailablePoint(usedPoints, totalPoints) {
    for (let i = 1; i <= totalPoints; i++) {
        if (!usedPoints.includes(i)) {
            return i;
        }
    }
    return 1;
}

export function calculateLevenshteinRatio(str1, str2) {
    try {
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;

        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;

        for (let i = 0; i <= len2; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len1; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= len2; i++) {
            for (let j = 1; j <= len1; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        const distance = matrix[len2][len1];
        const maxLength = Math.max(len1, len2);
        return 1 - (distance / maxLength);
    } catch (error) {
        logError('Levenshtein calculation failed', { error: error.message });
        return 0;
    }
}
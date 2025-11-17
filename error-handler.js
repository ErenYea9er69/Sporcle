// Quiz Battle - Error Handler
import { QuizDatabase } from './database.js';
import { currentRoom, currentPlayer } from './config.js';

export function logError(message, context = {}) {
    const error = {
        message,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        roomCode: currentRoom ? currentRoom.code : null,
        playerId: currentPlayer ? currentPlayer.id : null
    };

    const errors = QuizDatabase.load('errors') || [];
    errors.push(error);
    if (errors.length > 50) errors.shift();
    QuizDatabase.save('errors', errors);

    const indicator = document.getElementById('errorIndicator');
    if (indicator) {
        indicator.textContent = '⚠️ Error logged';
        indicator.classList.add('show');
        indicator.onclick = () => {
            console.error('Quiz Battle Error:', error);
            alert(`Error: ${message}\nCheck console for details.`);
        };
    }

    console.error('Quiz Battle Error:', error);
}

export function initErrorHandlers() {
    window.addEventListener('error', (event) => {
        logError(event.message || 'Unhandled error', {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error ? event.error.stack : null
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        logError('Unhandled promise rejection', {
            reason: event.reason
        });
    });
}
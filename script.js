// Quiz Battle - Main Entry Point
import { 
    setCurrentRoom, setCurrentPlayer, setIsHost, setGameInterval, setTimeLeft,
    setCurrentQuestion, setHasAnswered, setAutoNextEnabled, setHeartbeatInterval
} from './config.js';
import { initErrorHandlers, logError } from './error-handler.js';
import { QuizDatabase } from './database.js';
import { backToHome, startSoloGame, createRoom, joinRoom, startGame, submitAnswer, nextRound, playAgain, toggleAutoNext } from './game.js';
import { updateLobbyDisplay, updateGameDisplay, renderCategories, toggleCategory } from './ui.js';

// Initialize error handlers
initErrorHandlers();

// Add input validation
document.addEventListener('DOMContentLoaded', () => {
    try {
        const rooms = QuizDatabase.findAllRooms();
        console.log(`Found ${rooms.length} active rooms`);
        
        const errors = QuizDatabase.load('errors') || [];
        if (errors.length > 0) {
            console.log(`Found ${errors.length} stored errors`);
        }

        const version = '2.2.0-modular';
        document.documentElement.dataset.version = version;
        
        console.log('Quiz Battle initialized successfully (Modular Mode)');
    } catch (error) {
        logError('App initialization failed', { error: error.message });
    }
});

// Input validation
document.getElementById('joinRoomCode')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
});

document.getElementById('hostName')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20);
});

document.getElementById('playerName')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20);
});

document.getElementById('answerInput')?.addEventListener('input', (e) => {
    const { currentQuestion, hasAnswered } = await import('./config.js');
    if (currentQuestion && !hasAnswered) {
        const { fuzzyMatch } = await import('./questions.js');
        const matchScore = fuzzyMatch(e.target.value, currentQuestion.answer);
        if (matchScore > 0.7) {
            e.target.style.borderColor = '#27ae60';
        } else if (matchScore > 0.4) {
            e.target.style.borderColor = '#f39c12';
        } else {
            e.target.style.borderColor = '#ddd';
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('answerInput') === document.activeElement && !hasAnswered) {
        e.preventDefault();
        submitAnswer();
    }

    if (e.key === ' ' && isHost && document.getElementById('lobbyScreen').classList.contains('active')) {
        e.preventDefault();
        startGame();
    }

    if (e.key === 'Escape' && !document.getElementById('homeScreen').classList.contains('active')) {
        e.preventDefault();
        if (confirm('Are you sure you want to leave? Your progress will be lost.')) {
            backToHome();
        }
    }
});

// Room cleanup every 10 minutes
setInterval(() => {
    try {
        const rooms = QuizDatabase.findAllRooms();
        const now = Date.now();
        let cleanedCount = 0;
        
        rooms.forEach(room => {
            if (room.expires < now) {
                QuizDatabase.remove(`room_${room.code}`);
                cleanedCount++;
            }
        });
        
        if (cleanedCount > 0) {
            console.log(`Cleaned up ${cleanedCount} expired rooms`);
        }
    } catch (error) {
        logError('Room cleanup failed', { error: error.message });
    }
}, 10 * 60 * 1000);

// Expose functions to global scope for HTML onclick handlers
window.QuizBattle = {
    createRoom,
    joinRoom,
    startGame,
    submitAnswer,
    nextRound,
    endGame: () => import('./game.js').then(m => m.endGame()),
    backToHome,
    playAgain,
    startSoloGame,
    toggleCategory,
    selectPoint: (value) => import('./ui.js').then(m => m.selectPoint(value)),
    toggleAutoNext
};

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (currentRoom && currentRoom.code && !currentRoom.isSolo) {
        if (currentPlayer) {
            currentPlayer.lastSeen = Date.now() - 30000;
            QuizDatabase.save(`player_${currentPlayer.id}`, currentPlayer);
        }
    }
});
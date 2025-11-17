// Quiz Battle - Main Entry Point
import { 
    currentRoom, currentPlayer, isHost, gameInterval, timeLeft, currentQuestion, hasAnswered, autoNextEnabled, heartbeatInterval,
    setCurrentRoom, setCurrentPlayer, setIsHost, setGameInterval, setTimeLeft,
    setCurrentQuestion, setHasAnswered, setAutoNextEnabled, setHeartbeatInterval
} from './config.js';
import { initErrorHandlers, logError } from './error-handler.js';
import { QuizDatabase } from './database.js';
import { backToHome, startSoloGame, createRoom, joinRoom, startGame, submitAnswer, nextRound, playAgain, toggleAutoNext, endGame } from './game.js';
import { updateLobbyDisplay, updateGameDisplay, renderCategories, toggleCategory, showCreateRoom, hideCreateRoom, showJoinRoom, hideJoinRoom, showLobby } from './ui.js';
import { fuzzyMatch } from './questions.js';

// Initialize error handlers
initErrorHandlers();

// Expose all functions to global scope for HTML onclick handlers
window.QuizBattle = {
    // UI functions
    showCreateRoom,
    hideCreateRoom,
    showJoinRoom,
    hideJoinRoom,
    toggleCategory,
    selectPoint: (value) => import('./ui.js').then(m => m.selectPoint(value)),
    
    // Game functions
    createRoom,
    joinRoom,
    startGame,
    submitAnswer,
    nextRound,
    endGame: () => import('./game.js').then(m => m.endGame()),
    backToHome,
    playAgain,
    startSoloGame,
    toggleAutoNext
};

// DOM ready initialization
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
    if (currentQuestion && !hasAnswered) {
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

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (currentRoom && currentRoom.code && !currentRoom.isSolo) {
        if (currentPlayer) {
            currentPlayer.lastSeen = Date.now() - 30000;
            QuizDatabase.save(`player_${currentPlayer.id}`, currentPlayer);
        }
    }
});
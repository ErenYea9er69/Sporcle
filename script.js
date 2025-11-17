// Quiz Battle - Main Entry Point
import { 
    currentRoom, currentPlayer, isHost, gameInterval, timeLeft, currentQuestion, hasAnswered, autoNextEnabled, heartbeatInterval,
    setCurrentRoom, setCurrentPlayer, setIsHost, setGameInterval, setTimeLeft,
    setCurrentQuestion, setHasAnswered, setAutoNextEnabled, setHeartbeatInterval
} from './config.js';
import { initErrorHandlers, logError } from './error-handler.js';
import { QuizDatabase } from './database.js';
import { backToHome, startSoloGame, createRoom, joinRoom, startGame, submitAnswer, nextRound, playAgain, toggleAutoNext, endGame } from './game.js';
import { updateLobbyDisplay, updateGameDisplay, renderCategories, toggleCategory, showCreateRoom, hideCreateRoom, showJoinRoom, hideJoinRoom, showLobby, selectPoint } from './ui.js';
import { fuzzyMatch } from './questions.js';

// Initialize error handlers
initErrorHandlers();

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

        // Setup all event listeners
        setupEventListeners();
        
    } catch (error) {
        logError('App initialization failed', { error: error.message });
    }
});

function setupEventListeners() {
    // Home screen buttons
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', showCreateRoom);
    }

    const joinRoomBtn = document.getElementById('joinRoomBtn');
    if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', showJoinRoom);
    }

    const soloModeBtn = document.getElementById('soloModeBtn');
    if (soloModeBtn) {
        soloModeBtn.addEventListener('click', startSoloGame);
    }

    // Create room form
    const createRoomSubmitBtn = document.getElementById('createRoomSubmitBtn');
    if (createRoomSubmitBtn) {
        createRoomSubmitBtn.addEventListener('click', createRoom);
    }

    const hideCreateRoomBtn = document.getElementById('hideCreateRoomBtn');
    if (hideCreateRoomBtn) {
        hideCreateRoomBtn.addEventListener('click', hideCreateRoom);
    }

    // Join room form
    const joinRoomSubmitBtn = document.getElementById('joinRoomSubmitBtn');
    if (joinRoomSubmitBtn) {
        joinRoomSubmitBtn.addEventListener('click', joinRoom);
    }

    const hideJoinRoomBtn = document.getElementById('hideJoinRoomBtn');
    if (hideJoinRoomBtn) {
        hideJoinRoomBtn.addEventListener('click', hideJoinRoom);
    }

    // Lobby screen
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', startGame);
    }

    // Game screen
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitAnswer);
    }

    const nextRoundBtn = document.getElementById('nextRoundBtn');
    if (nextRoundBtn) {
        nextRoundBtn.addEventListener('click', nextRound);
    }

    const autoNextToggle = document.getElementById('autoNextToggle');
    if (autoNextToggle) {
        autoNextToggle.addEventListener('click', toggleAutoNext);
    }

    const endGameBtn = document.getElementById('endGameBtn');
    if (endGameBtn) {
        endGameBtn.addEventListener('click', endGame);
    }

    // Game over screen
    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', playAgain);
    }

    const backToHomeBtn = document.getElementById('backToHomeBtn');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', backToHome);
    }

    // Input validation
    const joinRoomCode = document.getElementById('joinRoomCode');
    if (joinRoomCode) {
        joinRoomCode.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
    }

    const hostName = document.getElementById('hostName');
    if (hostName) {
        hostName.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20);
        });
    }

    const playerName = document.getElementById('playerName');
    if (playerName) {
        playerName.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20);
        });
    }

    const answerInput = document.getElementById('answerInput');
    if (answerInput) {
        answerInput.addEventListener('input', (e) => {
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
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    const answerInput = document.getElementById('answerInput');
    
    if (e.key === 'Enter' && answerInput === document.activeElement && !hasAnswered) {
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

// Expose functions to window for debugging (optional)
window.QuizBattle = {
    currentRoom: () => currentRoom,
    currentPlayer: () => currentPlayer,
    database: QuizDatabase
};
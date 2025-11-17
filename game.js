// Quiz Battle - Game Engine
import { 
    currentRoom, currentPlayer, isHost, setCurrentRoom, setCurrentPlayer, setIsHost,
    gameInterval, setGameInterval, timeLeft, setTimeLeft, currentQuestion, setCurrentQuestion,
    hasAnswered, setHasAnswered, autoNextEnabled, setAutoNextEnabled, heartbeatInterval, setHeartbeatInterval
} from './config.js';
import { QuizDatabase } from './database.js';
import { logError } from './error-handler.js';
import { loadQuestionsFromCategories, createFallbackData, fuzzyMatch } from './questions.js';
import { 
    hideAllScreens, showLobby, updateLobbyDisplay, updateGameDisplay, 
    renderPointsGrid, showVisualFeedback, updateTimerDisplay 
} from './ui.js';
import { generateRoomCode, getLowestAvailablePoint, showVisualFeedback as showFeedback } from './utils.js';

export function backToHome() {
    if (gameInterval) {
        clearInterval(gameInterval);
        setGameInterval(null);
    }

    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        setHeartbeatInterval(null);
    }

    setCurrentRoom(null);
    setCurrentPlayer(null);
    setIsHost(false);
    setHasAnswered(false);
    setAutoNextEnabled(false);
    setCurrentQuestion(null);

    hideAllScreens();
    document.getElementById('homeScreen').classList.add('active');
    
    // Hide forms
    document.getElementById('createRoomForm').classList.add('hidden');
    document.getElementById('joinRoomForm').classList.add('hidden');

    // Clear inputs
    document.getElementById('hostName').value = '';
    document.getElementById('joinRoomCode').value = '';
    document.getElementById('playerName').value = '';
}

export function startHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }

    setHeartbeatInterval(setInterval(() => {
        try {
            if (currentRoom && currentPlayer) {
                currentPlayer.lastSeen = Date.now();
                QuizDatabase.save(`player_${currentPlayer.id}`, currentPlayer);

                const freshRoom = QuizDatabase.load(`room_${currentRoom.code}`);
                if (freshRoom) {
                    freshRoom.players = freshRoom.players.filter(p => {
                        const playerData = QuizDatabase.load(`player_${p.id}`);
                        return playerData && (Date.now() - playerData.lastSeen < 10000);
                    });

                    setCurrentRoom(freshRoom);
                    QuizDatabase.save(`room_${currentRoom.code}`, currentRoom);

                    const stillInRoom = currentRoom.players.some(p => p.id === currentPlayer.id);
                    if (!stillInRoom) {
                        clearInterval(heartbeatInterval);
                        alert('You have been disconnected from the room.');
                        backToHome();
                        return;
                    }

                    if (document.getElementById('lobbyScreen').classList.contains('active')) {
                        updateLobbyDisplay();
                    } else if (document.getElementById('gameScreen').classList.contains('active')) {
                        updateGameDisplay();
                    }
                } else {
                    clearInterval(heartbeatInterval);
                    alert('Room no longer exists.');
                    backToHome();
                }
            }
        } catch (error) {
            logError('Heartbeat failed', { error: error.message });
        }
    }, 2000));
}

export function createRoom() {
    try {
        const hostName = document.getElementById('hostName').value.trim();
        const selectedCategories = JSON.parse(document.getElementById('createRoomForm').dataset.selectedCategories || '[]');
        const timerDuration = parseInt(document.getElementById('timerSelect').value);
        const questionCount = parseInt(document.getElementById('questionCountSelect').value);

        if (!hostName) {
            alert('Please enter your name');
            return;
        }

        if (selectedCategories.length === 0) {
            alert('Please select at least one category');
            return;
        }

        const questionData = loadQuestionsFromCategories(selectedCategories);

        const room = {
            code: generateRoomCode(),
            categories: selectedCategories,
            timerDuration: timerDuration,
            questionCount: questionCount,
            questions: questionData.questions.slice(0, questionCount),
            players: [],
            currentRound: 0,
            isActive: false,
            expires: Date.now() + (6 * 60 * 60 * 1000),
            created: Date.now(),
            autoNext: false,
            usedQuestions: []
        };

        const player = {
            id: QuizDatabase.generateId(),
            name: hostName,
            score: 0,
            isHost: true,
            answers: [],
            lastSeen: Date.now(),
            usedPoints: [],
            selectedPoint: null
        };

        room.players.push(player);
        setCurrentRoom(room);
        setCurrentPlayer(player);
        setIsHost(true);

        QuizDatabase.save(`room_${room.code}`, room);
        QuizDatabase.save(`player_${player.id}`, player);

        showLobby();
        startHeartbeat();

        setTimeout(() => {
            updateLobbyDisplay();
        }, 500);

    } catch (error) {
        logError('Failed to create room', { error: error.message });
        alert(`Failed to create room: ${error.message}`);
    }
}

export function joinRoom() {
    try {
        const roomCode = document.getElementById('joinRoomCode').value.trim().toUpperCase();
        const playerName = document.getElementById('playerName').value.trim();

        if (!roomCode || roomCode.length < 4) {
            alert('Please enter a valid room code');
            return;
        }

        if (!playerName) {
            alert('Please enter your name');
            return;
        }

        const room = QuizDatabase.load(`room_${roomCode}`);
        
        if (!room) {
            alert('Room not found. Check the code and try again.');
            return;
        }

        if (room.isActive) {
            alert('Game is already in progress. Cannot join now.');
            return;
        }

        if (room.players.length >= 10) {
            alert('Room is full (max 10 players).');
            return;
        }

        const player = {
            id: QuizDatabase.generateId(),
            name: playerName,
            score: 0,
            isHost: false,
            answers: [],
            lastSeen: Date.now(),
            usedPoints: [],
            selectedPoint: null
        };

        room.players.push(player);
        setCurrentRoom(room);
        setCurrentPlayer(player);
        setIsHost(false);

        QuizDatabase.save(`room_${room.code}`, room);
        QuizDatabase.save(`player_${player.id}`, player);

        showLobby();
        startHeartbeat();
        updateLobbyDisplay();

    } catch (error) {
        logError('Failed to join room', { error: error.message });
        alert('Failed to join room. Please try again.');
    }
}

export function startGame() {
    if (!currentRoom || !isHost) return;

    try {
        if (currentRoom.players.length < 2) {
            if (!confirm('Start game with only 1 player? (Solo mode)')) {
                return;
            }
        }

        currentRoom.isActive = true;
        currentRoom.currentRound = 0;
        currentRoom.started = Date.now();
        currentRoom.usedQuestions = [];
        
        currentRoom.players.forEach(player => {
            player.score = 0;
            player.answers = [];
            player.hasAnswered = false;
            player.usedPoints = [];
            player.selectedPoint = null;
        });

        QuizDatabase.save(`room_${currentRoom.code}`, currentRoom);
        
        hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');
        nextRound();

    } catch (error) {
        logError('Failed to start game', { error: error.message });
        alert('Failed to start game. Please try again.');
    }
}

export function nextRound() {
    try {
        if (!currentRoom || !currentPlayer) return;

        if (gameInterval) {
            clearInterval(gameInterval);
            setGameInterval(null);
        }

        setHasAnswered(false);
        document.getElementById('answerInput').value = '';
        document.getElementById('answerInput').disabled = false;
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('answersReveal').classList.add('hidden');
        document.getElementById('hostNextControls').classList.add('hidden');

        if (currentRoom.currentRound >= currentRoom.questionCount || currentRoom.currentRound >= currentRoom.questions.length) {
            endGame();
            return;
        }

        currentRoom.currentRound++;
        QuizDatabase.save(`room_${currentRoom.code}`, currentRoom);

        // Filter out questions that have already been used
        const availableQuestions = currentRoom.questions.filter((q, index) => 
            !currentRoom.usedQuestions.includes(index) &&
            !currentRoom.players.some(p => 
                p.answers.some(a => a.questionIndex === index)
            )
        );

        if (availableQuestions.length === 0) {
            endGame();
            return;
        }

        const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        const questionIndex = currentRoom.questions.indexOf(question);
        
        // Mark this question as used so it won't appear again
        if (!currentRoom.usedQuestions.includes(questionIndex)) {
            currentRoom.usedQuestions.push(questionIndex);
            QuizDatabase.save(`room_${currentRoom.code}`, currentRoom);
        }

        setCurrentQuestion(question);

        document.getElementById('currentRound').textContent = currentRoom.currentRound;
        document.getElementById('totalRounds').textContent = currentRoom.questionCount;
        document.getElementById('questionText').textContent = question.question;
        
        currentRoom.players.forEach(player => {
            player.hasAnswered = false;
            player.currentAnswer = null;
            player.selectedPoint = null;
        });

        // Reset and show points selection
        renderPointsGrid();

        setTimeLeft(currentRoom.timerDuration);
        updateTimerDisplay(currentRoom.timerDuration);
        
        setGameInterval(setInterval(() => {
            setTimeLeft(timeLeft - 1);
            updateTimerDisplay(currentRoom.timerDuration);
            
            if (timeLeft <= 0) {
                clearInterval(gameInterval);
                timeUp();
            }
        }, 1000));

        updateGameDisplay();

    } catch (error) {
        logError('Failed to start new round', { error: error.message });
        alert('Error starting new round. Returning to home.');
        backToHome();
    }
}

export function timeUp() {
    try {
        if (!currentPlayer.selectedPoint) {
            currentPlayer.selectedPoint = getLowestAvailablePoint(currentPlayer.usedPoints, currentRoom.questionCount);
        }
        
        currentPlayer.usedPoints.push(currentPlayer.selectedPoint);
        
        const questionIndex = currentRoom.questions.indexOf(currentQuestion);
        currentPlayer.answers.push({
            questionIndex: questionIndex,
            answer: '',
            isCorrect: false,
            points: 0,
            timestamp: Date.now(),
            selectedPoint: currentPlayer.selectedPoint
        });
        
        currentPlayer.hasAnswered = true;
        QuizDatabase.save(`player_${currentPlayer.id}`, currentPlayer);

        const playerIndex = currentRoom.players.findIndex(p => p.id === currentPlayer.id);
        if (playerIndex !== -1) {
            currentRoom.players[playerIndex] = currentPlayer;
            QuizDatabase.save(`room_${currentRoom.code}`, currentRoom);
        }

        showAnswers();
    } catch (error) {
        logError('Time up handling failed', { error: error.message });
    }
}

export function submitAnswer() {
    if (hasAnswered || !currentQuestion || !currentPlayer) return;

    try {
        const answerInput = document.getElementById('answerInput');
        const answer = answerInput.value.trim();
        
        if (!answer) {
            alert('Please enter an answer');
            return;
        }

        // Auto-select lowest point if none selected
        if (!currentPlayer.selectedPoint) {
            currentPlayer.selectedPoint = getLowestAvailablePoint(currentPlayer.usedPoints, currentRoom.questionCount);
        }

        setHasAnswered(true);
        answerInput.disabled = true;
        document.getElementById('submitBtn').disabled = true;

        const matchScore = fuzzyMatch(answer, currentQuestion.answer);
        const isCorrect = matchScore >= 0.8;
        
        // Use selected point value instead of fixed question points
        const basePoints = currentPlayer.selectedPoint;
        const timeBonus = Math.floor((timeLeft / currentRoom.timerDuration) * 5);
        const totalPoints = isCorrect ? basePoints + timeBonus : 0;

        // Mark point as used
        currentPlayer.usedPoints.push(currentPlayer.selectedPoint);

        const questionIndex = currentRoom.questions.indexOf(currentQuestion);
        currentPlayer.answers.push({
            questionIndex: questionIndex,
            answer: answer,
            isCorrect: isCorrect,
            points: totalPoints,
            matchScore: matchScore,
            timestamp: Date.now(),
            selectedPoint: currentPlayer.selectedPoint
        });

        if (isCorrect) {
            currentPlayer.score += totalPoints;
        }

        currentPlayer.hasAnswered = true;
        QuizDatabase.save(`player_${currentPlayer.id}`, currentPlayer);

        const playerIndex = currentRoom.players.findIndex(p => p.id === currentPlayer.id);
        if (playerIndex !== -1) {
            currentRoom.players[playerIndex] = currentPlayer;
            QuizDatabase.save(`room_${currentRoom.code}`, currentRoom);
        }

        showFeedback(isCorrect ? '✓' : '✗', isCorrect ? 'feedback-correct' : 'feedback-wrong');

        if (currentRoom.players.every(p => p.hasAnswered)) {
            clearInterval(gameInterval);
            setTimeout(showAnswers, 1000);
        }

        updateGameDisplay();

    } catch (error) {
        logError('Answer submission failed', { error: error.message });
        alert('Failed to submit answer. Please try again.');
        setHasAnswered(false);
        document.getElementById('answerInput').disabled = false;
        document.getElementById('submitBtn').disabled = false;
    }
}

export function showAnswers() {
    try {
        const answersReveal = document.getElementById('answersReveal');
        const answersList = document.getElementById('answersList');
        const correctAnswerDisplay = document.getElementById('correctAnswerDisplay');
        
        answersReveal.classList.remove('hidden');
        answersList.innerHTML = '';

        if (currentQuestion && currentQuestion.answer && currentQuestion.answer.length > 0) {
            correctAnswerDisplay.innerHTML = `<strong>Correct Answer:</strong> ${currentQuestion.answer.join(' OR ')}`;
            correctAnswerDisplay.classList.remove('hidden');
        } else {
            correctAnswerDisplay.classList.add('hidden');
        }

        const sortedPlayers = [...currentRoom.players].sort((a, b) => b.score - a.score);

        sortedPlayers.forEach(player => {
            const answer = player.answers.find(a => a.questionIndex === currentRoom.questions.indexOf(currentQuestion));
            if (!answer) return;

            const answerItem = document.createElement('div');
            answerItem.className = 'answer-item';
            
            const isCorrect = answer.isCorrect;
            const verdictText = isCorrect ? '✓' : '✗';
            const pointValue = answer.selectedPoint || 0;
            
            answerItem.innerHTML = `
                <div class="answer-player">${player.name}</div>
                <div class="answer-text">${answer.answer || '(No answer)'}</div>
                <div class="answer-point-value">Point: ${pointValue}</div>
                <div class="answer-verdict">
                    <span style="font-size: 1.5em; font-weight: bold; ${isCorrect ? 'color: #27ae60' : 'color: #e74c3c'}">${verdictText}</span>
                    <span style="font-weight: bold; color: #f39c12;">${answer.points} pts</span>
                </div>
            `;

            if (isHost && !answer.isCorrect) {
                const correctBtn = document.createElement('button');
                correctBtn.className = 'verdict-btn verdict-correct';
                correctBtn.textContent = 'Mark Correct';
                correctBtn.onclick = () => overrideAnswer(player.id, true);
                
                const wrongBtn = document.createElement('button');
                wrongBtn.className = 'verdict-btn verdict-wrong';
                wrongBtn.textContent = 'Confirm Wrong';
                wrongBtn.onclick = () => overrideAnswer(player.id, false);
                
                const controlDiv = document.createElement('div');
                controlDiv.style.display = 'flex';
                controlDiv.style.gap = '10px';
                controlDiv.appendChild(correctBtn);
                controlDiv.appendChild(wrongBtn);
                
                answerItem.appendChild(controlDiv);
            }

            answersList.appendChild(answerItem);
        });

        if (isHost) {
            document.getElementById('hostNextControls').classList.remove('hidden');
            
            if (autoNextEnabled) {
                setTimeout(() => {
                    if (autoNextEnabled) {
                        nextRound();
                    }
                }, 3000);
            }
        }

        updateGameDisplay();

    } catch (error) {
        logError('Failed to show answers', { error: error.message });
    }
}

export function overrideAnswer(playerId, markAsCorrect) {
    try {
        const player = currentRoom.players.find(p => p.id === playerId);
        if (!player) return;

        const answer = player.answers.find(a => a.questionIndex === currentRoom.questions.indexOf(currentQuestion));
        if (!answer) return;

        if (answer.isCorrect) {
            player.score -= answer.points;
        }

        answer.isCorrect = markAsCorrect;
        if (markAsCorrect) {
            const basePoints = answer.selectedPoint || 1;
            const timeBonus = Math.floor((answer.timeLeft || 0) / currentRoom.timerDuration * 5);
            answer.points = basePoints + timeBonus;
            player.score += answer.points;
        } else {
            answer.points = 0;
        }

        QuizDatabase.save(`player_${player.id}`, player);
        QuizDatabase.save(`room_${currentRoom.code}`, currentRoom);

        showAnswers();
        updateGameDisplay();

        showFeedback(markAsCorrect ? 'Updated to ✓' : 'Confirmed ✗', 'feedback-correct');

    } catch (error) {
        logError('Failed to override answer', { error: error.message });
        alert('Failed to update answer. Please try again.');
    }
}

export function toggleAutoNext() {
    if (!isHost) return;
    
    setAutoNextEnabled(!autoNextEnabled);
    currentRoom.autoNext = autoNextEnabled;
    QuizDatabase.save(`room_${currentRoom.code}`, currentRoom);
    
    document.getElementById('autoNextToggle').classList.toggle('active', autoNextEnabled);
    
    if (autoNextEnabled && !document.getElementById('answersReveal').classList.contains('hidden')) {
        setTimeout(() => {
            if (autoNextEnabled && !document.getElementById('answersReveal').classList.contains('hidden')) {
                nextRound();
            }
        }, 3000);
    }
}

export function endGame() {
    try {
        if (gameInterval) {
            clearInterval(gameInterval);
            setGameInterval(null);
        }

        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            setHeartbeatInterval(null);
        }

        if (currentRoom) {
            currentRoom.isActive = false;
            QuizDatabase.save(`room_${currentRoom.code}`, currentRoom);
        }

        hideAllScreens();
        document.getElementById('gameOverScreen').classList.add('active');

        const finalScores = document.getElementById('finalScores');
        finalScores.innerHTML = '';

        const sortedPlayers = [...currentRoom.players].sort((a, b) => b.score - a.score);
        sortedPlayers.forEach((player, index) => {
            const rank = index + 1;
            const rankEmoji = rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            scoreItem.innerHTML = `
                <span class="score-rank">${rankEmoji}</span>
                <span class="score-name">${player.name}</span>
                <span class="score-points">${player.score} pts</span>
            `;
            finalScores.appendChild(scoreItem);
        });

        setTimeout(() => {
            if (currentRoom && currentRoom.code) {
                QuizDatabase.remove(`room_${currentRoom.code}`);
            }
        }, 60 * 60 * 1000);

    } catch (error) {
        logError('Failed to end game properly', { error: error.message });
    }
}

export function playAgain() {
    if (currentRoom && currentPlayer) {
        if (isHost) {
            currentRoom.isActive = false;
            currentRoom.currentRound = 0;
            currentRoom.usedQuestions = [];
            currentRoom.players.forEach(player => {
                player.score = 0;
                player.answers = [];
                player.usedPoints = [];
                player.selectedPoint = null;
            });
            QuizDatabase.save(`room_${currentRoom.code}`, currentRoom);
            
            hideAllScreens();
            document.getElementById('lobbyScreen').classList.add('active');
            updateLobbyDisplay();
        } else {
            backToHome();
        }
    } else {
        backToHome();
    }
}

export function startSoloGame() {
    try {
        const roomCode = 'SOLO_' + generateRoomCode();
        const player = {
            id: QuizDatabase.generateId(),
            name: 'Player',
            score: 0,
            isHost: true,
            answers: [],
            lastSeen: Date.now(),
            usedPoints: [],
            selectedPoint: null
        };

        const questionData = loadQuestionsFromCategories(['knowledge']);

        const room = {
            code: roomCode,
            categories: ['knowledge'],
            timerDuration: 30,
            questionCount: 10,
            questions: questionData.questions.slice(0, 10),
            players: [player],
            currentRound: 0,
            isActive: false,
            expires: Date.now() + (2 * 60 * 60 * 1000),
            created: Date.now(),
            autoNext: false,
            isSolo: true,
            usedQuestions: []
        };

        setCurrentRoom(room);
        setCurrentPlayer(player);
        setIsHost(true);

        QuizDatabase.save(`room_${room.code}`, room);
        QuizDatabase.save(`player_${player.id}`, player);

        hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');
        startHeartbeat();
        nextRound();

    } catch (error) {
        logError('Failed to start solo game', { error: error.message });
        alert('Failed to start solo game. Please try again.');
    }
}
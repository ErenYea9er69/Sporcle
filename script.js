// Quiz Battle - Combined JavaScript File

// ========== CONFIG.JS ==========
let currentRoom = null;
let currentPlayer = null;
let isHost = false;
let gameInterval = null;
let timeLeft = 30;
let currentQuestion = null;
let hasAnswered = false;
let autoNextEnabled = false;
let heartbeatInterval = null;

function setCurrentRoom(room) { currentRoom = room; }
function setCurrentPlayer(player) { currentPlayer = player; }
function setIsHost(value) { isHost = value; }
function setGameInterval(interval) { gameInterval = interval; }
function setTimeLeft(value) { timeLeft = value; }
function setCurrentQuestion(question) { currentQuestion = question; }
function setHasAnswered(value) { hasAnswered = value; }
function setAutoNextEnabled(value) { autoNextEnabled = value; }
function setHeartbeatInterval(interval) { heartbeatInterval = interval; }

// ========== DATA.JS ==========
const EMBEDDED_QUESTIONS = {
    anime: {
        questions: [
            { question: "What is the name of Goku's signature energy attack?", answer: ["kamehameha", "kame hame ha"], points: 10 },
            { question: "Which anime features a notebook that can kill people?", answer: ["death note", "deathnote"], points: 10 },
            { question: "What is the name of the pirate crew led by Monkey D. Luffy?", answer: ["straw hat pirates", "strawhat pirates", "straw hats"], points: 10 },
            { question: "In 'Naruto', what is the name of Naruto's tailed beast?", answer: ["kurama", "nine tails", "nine-tails"], points: 10 },
            { question: "Which anime features giant humanoid creatures called Titans?", answer: ["attack on titan", "shingeki no kyojin"], points: 10 }
        ]
    },
    football: {
        questions: [
            { question: "Which country won the FIFA World Cup in 2018?", answer: ["france"], points: 10 },
            { question: "How many players are on a football team on the field?", answer: ["11", "eleven"], points: 10 },
            { question: "Which player has won the most Ballon d'Or awards?", answer: ["lionel messi", "messi"], points: 10 },
            { question: "What is the distance of a penalty kick from the goal line?", answer: ["12 yards", "11 meters", "eleven meters", "twelve yards"], points: 10 },
            { question: "Which English club has won the most Premier League titles?", answer: ["manchester united", "man united", "man utd"], points: 10 }
        ]
    },
    history: {
        questions: [
            { question: "Who was the first President of the United States?", answer: ["george washington", "washington"], points: 10 },
            { question: "In which year did Christopher Columbus reach the Americas?", answer: ["1492"], points: 10 },
            { question: "Which ancient wonder of the world still stands today?", answer: ["great pyramid of giza", "pyramids of giza", "great pyramid"], points: 10 },
            { question: "Who wrote the Declaration of Independence?", answer: ["thomas jefferson", "jefferson"], points: 10 },
            { question: "Which empire built Machu Picchu?", answer: ["inca", "incan", "inca empire"], points: 10 }
        ]
    },
    knowledge: {
        questions: [
            { question: "What is the capital of Japan?", answer: ["tokyo"], points: 10 },
            { question: "How many continents are there on Earth?", answer: ["7", "seven"], points: 10 },
            { question: "What is the largest planet in our solar system?", answer: ["jupiter"], points: 10 },
            { question: "What is the chemical symbol for gold?", answer: ["au"], points: 10 },
            { question: "In which year did World War II end?", answer: ["1945"], points: 10 }
        ]
    },
    manga: {
        questions: [
            { question: "Who is the creator of One Piece?", answer: ["eiichiro oda", "oda"], points: 10 },
            { question: "What is the name of the training manga about a weak boy becoming a hero?", answer: ["one punch man", "one-punch man"], points: 10 },
            { question: "Which manga features alchemy as its main power system?", answer: ["fullmetal alchemist", "full metal alchemist"], points: 10 },
            { question: "What is the name of Guts' massive sword in Berserk?", answer: ["dragonslayer", "dragon slayer"], points: 10 },
            { question: "Which manga features a world where everyone has superpowers called 'quirks'?", answer: ["my hero academia", "boku no hero academia"], points: 10 }
        ]
    },
    tv: {
        questions: [
            { question: "What is the name of the coffee shop in Friends?", answer: ["central perk"], points: 10 },
            { question: "Which TV series features a high school chemistry teacher turned drug lord?", answer: ["breaking bad"], points: 10 },
            { question: "What is the name of the fictional continent in Game of Thrones?", answer: ["westeros"], points: 10 },
            { question: "Which animated series features a talking baby and a diabolical dog?", answer: ["family guy"], points: 10 },
            { question: "What is the name of the main character in The Office (US)?", answer: ["michael scott"], points: 10 }
        ]
    }
};

// ========== DATABASE.JS ==========
const QuizDatabase = {
    memoryStorage: {},

    generateId: () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36),

    save: (key, data) => {
        try {
            QuizDatabase.memoryStorage[key] = JSON.parse(JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Database save failed:', { key, error: error.message });
            return false;
        }
    },

    load: (key) => {
        try {
            const data = QuizDatabase.memoryStorage[key];
            return data ? JSON.parse(JSON.stringify(data)) : null;
        } catch (error) {
            console.error('Database load failed:', { key, error: error.message });
            return null;
        }
    },

    remove: (key) => {
        try {
            delete QuizDatabase.memoryStorage[key];
            return true;
        } catch (error) {
            console.error('Database remove failed:', { key, error: error.message });
            return false;
        }
    },

    findAllRooms: () => {
        try {
            const rooms = [];
            Object.keys(QuizDatabase.memoryStorage).forEach(key => {
                if (key.startsWith('room_')) {
                    const room = QuizDatabase.memoryStorage[key];
                    if (room && room.expires > Date.now()) {
                        rooms.push(room);
                    } else if (room) {
                        delete QuizDatabase.memoryStorage[key];
                    }
                }
            });
            return rooms;
        } catch (error) {
            console.error('Find all rooms failed:', { error: error.message });
            return [];
        }
    }
};

// ========== UTILS.JS ==========
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function showVisualFeedback(text, className) {
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

function getLowestAvailablePoint(usedPoints, totalPoints) {
    for (let i = 1; i <= totalPoints; i++) {
        if (!usedPoints.includes(i)) {
            return i;
        }
    }
    return 1;
}

function calculateLevenshteinRatio(str1, str2) {
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
        console.error('Levenshtein calculation failed:', { error: error.message });
        return 0;
    }
}

// ========== QUESTIONS.JS ==========
function fuzzyMatch(answer, correctAnswers) {
    try {
        const normalizedAnswer = answer.toLowerCase().trim().replace(/[^\w\s]/g, '');
        
        for (let correctAnswer of correctAnswers) {
            const normalizedCorrect = correctAnswer.toLowerCase().trim().replace(/[^\w\s]/g, '');
            
            if (normalizedAnswer === normalizedCorrect) return 1;
            
            if (normalizedAnswer.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedAnswer)) {
                return 0.9;
            }
            
            const answerWords = normalizedAnswer.split(/\s+/);
            const correctWords = normalizedCorrect.split(/\s+/);
            
            let matchedWords = 0;
            for (let word of answerWords) {
                if (correctWords.some(cw => cw.includes(word) || word.includes(cw))) {
                    matchedWords++;
                }
            }
            
            const wordMatchRatio = matchedWords / correctWords.length;
            if (wordMatchRatio >= 0.8) return 0.85;
            
            const levenshteinRatio = calculateLevenshteinRatio(normalizedAnswer, normalizedCorrect);
            if (levenshteinRatio > 0.85) return levenshteinRatio;
        }
        
        return 0;
    } catch (error) {
        console.error('Fuzzy match failed', { answer, correctAnswers, error: error.message });
        return 0;
    }
}

function loadQuestionsFromCategories(categories) {
    const allQuestions = [];

    for (const category of categories) {
        if (EMBEDDED_QUESTIONS[category]) {
            const questionsWithCategory = EMBEDDED_QUESTIONS[category].questions.map(q => ({
                ...q,
                category: category
            }));
            allQuestions.push(...questionsWithCategory);
            console.log(`✅ Loaded ${questionsWithCategory.length} questions from ${category}`);
        } else {
            console.warn(`⚠️ Category ${category} not found`);
        }
    }

    if (allQuestions.length === 0) {
        console.error('No questions loaded!');
        return createFallbackData();
    }

    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    
    return {
        questions: shuffled
    };
}

function createFallbackData() {
    return {
        questions: [
            { question: "What is 2 + 2?", answer: ["4", "four"], points: 10, category: "knowledge" },
            { question: "What color is the sky?", answer: ["blue"], points: 10, category: "knowledge" },
            { question: "How many days in a week?", answer: ["7", "seven"], points: 10, category: "knowledge" }
        ]
    };
}

// ========== ERROR-HANDLER.JS ==========
function logError(message, context = {}) {
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

function initErrorHandlers() {
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

// ========== UI.JS ==========
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

function showCreateRoom() {
    document.getElementById('createRoomForm').classList.remove('hidden');
    document.getElementById('joinRoomForm').classList.add('hidden');
    renderCategories();
}

function hideCreateRoom() {
    document.getElementById('createRoomForm').classList.add('hidden');
}

function showJoinRoom() {
    document.getElementById('joinRoomForm').classList.remove('hidden');
    document.getElementById('createRoomForm').classList.add('hidden');
}

function hideJoinRoom() {
    document.getElementById('joinRoomForm').classList.add('hidden');
}

function renderCategories() {
    const categories = {
        anime: { name: "Anime", icon: "🎌" },
        football: { name: "Football", icon: "⚽" },
        knowledge: { name: "General Knowledge", icon: "🧠" },
        history: { name: "History", icon: "📚" },
        tv: { name: "TV Shows", icon: "📺" },
        manga: { name: "Manga", icon: "📖" }
    };

    const selector = document.getElementById('categorySelector');
    selector.innerHTML = '';

    Object.keys(categories).forEach(key => {
        const btn = document.createElement('div');
        btn.className = 'category-btn';
        btn.dataset.category = key;
        btn.innerHTML = `
            <div class="category-icon">${categories[key].icon}</div>
            <div>${categories[key].name}</div>
        `;
        btn.addEventListener('click', () => toggleCategory(key));
        selector.appendChild(btn);
    });

    document.getElementById('createRoomForm').dataset.selectedCategories = JSON.stringify([]);
}

function toggleCategory(category) {
    const form = document.getElementById('createRoomForm');
    let selectedCategories = JSON.parse(form.dataset.selectedCategories || '[]');
    
    const btn = document.querySelector(`[data-category="${category}"]`);
    
    if (selectedCategories.includes(category)) {
        selectedCategories = selectedCategories.filter(c => c !== category);
        btn.classList.remove('selected');
    } else {
        selectedCategories.push(category);
        btn.classList.add('selected');
    }
    
    form.dataset.selectedCategories = JSON.stringify(selectedCategories);
}

function updateLobbyDisplay() {
    if (!currentRoom || !document.getElementById('lobbyScreen').classList.contains('active')) return;

    try {
        document.getElementById('lobbyRoomCode').textContent = currentRoom.code;
        document.getElementById('playerCount').textContent = currentRoom.players.length;
        
        const categoriesSpan = document.getElementById('lobbyCategories');
        if (currentRoom.categories && currentRoom.categories.length > 0) {
            categoriesSpan.textContent = currentRoom.categories.join(', ').toUpperCase();
        } else {
            categoriesSpan.textContent = 'MIXED';
        }

        const lobbyQuestionCount = document.getElementById('lobbyQuestionCount');
        if (lobbyQuestionCount) {
            lobbyQuestionCount.textContent = currentRoom.questionCount;
        }
        
        const playerList = document.getElementById('lobbyPlayerList');
        playerList.innerHTML = '';
        
        const sortedPlayers = [...currentRoom.players].sort((a, b) => {
            if (a.isHost && !b.isHost) return -1;
            if (!a.isHost && b.isHost) return 1;
            return b.score - a.score;
        });

        sortedPlayers.forEach(player => {
            const tag = document.createElement('div');
            tag.className = 'player-tag';
            if (player.id === currentPlayer.id) {
                tag.style.background = 'linear-gradient(to right, #667eea, #764ba2)';
            }
            tag.textContent = player.name + (player.isHost ? ' (Host)' : '');
            playerList.appendChild(tag);
        });

        if (isHost) {
            document.getElementById('hostControlsLobby').classList.remove('hidden');
            document.getElementById('playerWaitingMessage').classList.add('hidden');
        } else {
            document.getElementById('hostControlsLobby').classList.add('hidden');
            document.getElementById('playerWaitingMessage').classList.remove('hidden');
        }
    } catch (error) {
        logError('Lobby display update failed', { error: error.message });
    }
}

function updateGameDisplay() {
    if (!currentRoom || !document.getElementById('gameScreen').classList.contains('active')) return;

    try {
        const scoreboardContent = document.getElementById('scoreboardContent');
        scoreboardContent.innerHTML = '';

        const sortedPlayers = [...currentRoom.players].sort((a, b) => b.score - a.score);
        sortedPlayers.forEach((player, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            
            const rank = index + 1;
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            
            scoreItem.innerHTML = `
                <span class="score-rank">${rankEmoji}</span>
                <span class="score-name">${player.name}</span>
                <span class="score-points">${player.score} pts</span>
            `;
            
            if (player.id === currentPlayer.id) {
                scoreItem.style.background = 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(13, 148, 136, 0.2))';
                scoreItem.style.borderRadius = '8px';
                scoreItem.style.padding = '12px 10px';
            }
            
            scoreboardContent.appendChild(scoreItem);
        });

        if (isHost) {
            document.getElementById('hostControls').classList.remove('hidden');
            const toggle = document.getElementById('autoNextToggle');
            if (autoNextEnabled) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        } else {
            document.getElementById('hostControls').classList.add('hidden');
        }

    } catch (error) {
        logError('Game display update failed', { error: error.message });
    }
}

function renderPointsGrid() {
    const pointsGrid = document.getElementById('pointsGrid');
    pointsGrid.innerHTML = '';
    
    const totalPoints = currentRoom.questionCount;
    
    for (let i = 1; i <= totalPoints; i++) {
        const btn = document.createElement('div');
        btn.className = 'point-btn';
        btn.textContent = i;
        btn.dataset.value = i;
        
        if (currentPlayer.usedPoints.includes(i)) {
            btn.classList.add('used');
        } else if (currentPlayer.selectedPoint === i) {
            btn.classList.add('selected');
        }
        
        if (!btn.classList.contains('used')) {
            btn.addEventListener('click', () => selectPoint(i));
        }
        
        pointsGrid.appendChild(btn);
    }
}

function selectPoint(value) {
    if (hasAnswered || currentPlayer.usedPoints.includes(value)) return;
    
    currentPlayer.selectedPoint = value;
    QuizDatabase.save(`player_${currentPlayer.id}`, currentPlayer);
    
    renderPointsGrid();
}

function showLobby() {
    hideAllScreens();
    document.getElementById('lobbyScreen').classList.add('active');
}

function updateTimerDisplay(timerDuration) {
    const timerDisplay = document.getElementById('timerDisplay');
    const timerProgress = document.getElementById('timerProgress');
    
    timerDisplay.textContent = timeLeft;
    timerDisplay.style.color = timeLeft <= 10 ? '#e74c3c' : '#333';
    
    const progressPercent = (timeLeft / timerDuration) * 100;
    timerProgress.style.width = progressPercent + '%';
    timerProgress.style.background = timeLeft <= 10 ? 
        'linear-gradient(to right, #e74c3c, #c0392b)' : 
        'linear-gradient(to right, #667eea, #764ba2)';
}

// ========== GAME.JS ==========
function backToHome() {
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

function startHeartbeat() {
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

function createRoom() {
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

function joinRoom() {
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

function startGame() {
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

function nextRound() {
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

function timeUp() {
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

function submitAnswer() {
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

        showVisualFeedback(isCorrect ? '✓' : '✗', isCorrect ? 'feedback-correct' : 'feedback-wrong');

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

function showAnswers() {
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

function overrideAnswer(playerId, markAsCorrect) {
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

        showVisualFeedback(markAsCorrect ? 'Updated to ✓' : 'Confirmed ✗', 'feedback-correct');

    } catch (error) {
        logError('Failed to override answer', { error: error.message });
        alert('Failed to update answer. Please try again.');
    }
}

function toggleAutoNext() {
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

function endGame() {
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

function playAgain() {
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

function startSoloGame() {
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

// ========== SCRIPT.JS ==========
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

        const version = '2.2.0-combined';
        document.documentElement.dataset.version = version;
        
        console.log('Quiz Battle initialized successfully (Combined Mode)');

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
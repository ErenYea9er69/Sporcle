// Quiz Battle - UI Renderer
import { currentRoom, currentPlayer, isHost, currentQuestion, hasAnswered, timeLeft, autoNextEnabled } from './config.js';
import { QuizDatabase } from './database.js';
import { logError } from './error-handler.js';

export function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

export function showCreateRoom() {
    document.getElementById('createRoomForm').classList.remove('hidden');
    document.getElementById('joinRoomForm').classList.add('hidden');
    renderCategories();
}

export function hideCreateRoom() {
    document.getElementById('createRoomForm').classList.add('hidden');
}

export function showJoinRoom() {
    document.getElementById('joinRoomForm').classList.remove('hidden');
    document.getElementById('createRoomForm').classList.add('hidden');
}

export function hideJoinRoom() {
    document.getElementById('joinRoomForm').classList.add('hidden');
}

export function renderCategories() {
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

export function toggleCategory(category) {
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

export function updateLobbyDisplay() {
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

export function updateGameDisplay() {
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

export function renderPointsGrid() {
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

export function selectPoint(value) {
    if (hasAnswered || currentPlayer.usedPoints.includes(value)) return;
    
    currentPlayer.selectedPoint = value;
    QuizDatabase.save(`player_${currentPlayer.id}`, currentPlayer);
    
    renderPointsGrid();
}

export function showLobby() {
    hideAllScreens();
    document.getElementById('lobbyScreen').classList.add('active');
}

export function updateTimerDisplay(timerDuration) {
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
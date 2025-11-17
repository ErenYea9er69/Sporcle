// Quiz Battle - Global State
export let currentRoom = null;
export let currentPlayer = null;
export let isHost = false;
export let gameInterval = null;
export let timeLeft = 30;
export let currentQuestion = null;
export let hasAnswered = false;
export let autoNextEnabled = false;
export let heartbeatInterval = null;

export function setCurrentRoom(room) { currentRoom = room; }
export function setCurrentPlayer(player) { currentPlayer = player; }
export function setIsHost(value) { isHost = value; }
export function setGameInterval(interval) { gameInterval = interval; }
export function setTimeLeft(value) { timeLeft = value; }
export function setCurrentQuestion(question) { currentQuestion = question; }
export function setHasAnswered(value) { hasAnswered = value; }
export function setAutoNextEnabled(value) { autoNextEnabled = value; }
export function setHeartbeatInterval(interval) { heartbeatInterval = interval; }
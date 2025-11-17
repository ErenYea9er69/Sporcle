// Quiz Battle - In-Memory Database
export const QuizDatabase = {
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
// Quiz Battle - Question Processing
import { EMBEDDED_QUESTIONS } from './data.js';
import { logError } from './error-handler.js';
import { calculateLevenshteinRatio } from './utils.js';

export function fuzzyMatch(answer, correctAnswers) {
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
        logError('Fuzzy match failed', { answer, correctAnswers, error: error.message });
        return 0;
    }
}

export function loadQuestionsFromCategories(categories) {
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

export function createFallbackData() {
    return {
        questions: [
            { question: "What is 2 + 2?", answer: ["4", "four"], points: 10, category: "knowledge" },
            { question: "What color is the sky?", answer: ["blue"], points: 10, category: "knowledge" },
            { question: "How many days in a week?", answer: ["7", "seven"], points: 10, category: "knowledge" }
        ]
    };
}
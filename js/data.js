let books = [];
let readingHistory = [];
let dailyGoal = 30;
let nextBookId = 1;

function loadDataFromStorage() {
    const savedBooks = localStorage.getItem(STORAGE_KEYS.BOOKS);
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const savedGoal = localStorage.getItem(STORAGE_KEYS.DAILY_GOAL);
    const savedId = localStorage.getItem(STORAGE_KEYS.NEXT_ID);
    
    if (savedBooks) books = JSON.parse(savedBooks);
    if (savedHistory) readingHistory = JSON.parse(savedHistory);
    if (savedGoal) dailyGoal = parseInt(savedGoal);
    if (savedId) nextBookId = parseInt(savedId);
    
    if (books.length > 0) {
        const maxId = Math.max(...books.map(b => b.id || 0), 0);
        if (maxId >= nextBookId) nextBookId = maxId + 1;
    }
}

function saveDataToStorage() {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(readingHistory));
    localStorage.setItem(STORAGE_KEYS.DAILY_GOAL, dailyGoal);
    localStorage.setItem(STORAGE_KEYS.NEXT_ID, nextBookId);
}

// Пустая функция для совместимости (демо-данные не добавляем)
function initDemoData() {
    // Демо-данные не добавляются, чтобы не засорять существующие данные
}

loadDataFromStorage();
initDemoData();
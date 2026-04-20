
let books = [];
let readingHistory = [];
let dailyGoal = 30;
let nextBookId = 1;

function loadDataFromStorage() {
    const savedBooks = localStorage.getItem(STORAGE_KEYS.BOOKS);
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const savedGoal = localStorage.getItem(STORAGE_KEYS.DAILY_GOAL);
    const savedId = localStorage.getItem(STORAGE_KEYS.NEXT_ID);
    
    if (savedBooks) books = JSON.parse(savedBooks); //Если в savedBooks есть данные, преобразует JSON‑строку обратно в массив и присваивает ему переменую books
    if (savedHistory) readingHistory = JSON.parse(savedHistory); //Если в savedBooks есть данные, преобразует JSON‑строку обратно в массив и присваивает ему переменую readingHistory
    if (savedGoal) dailyGoal = parseInt(savedGoal); //ли savedGoal существует, преобразует строку в число с помощью parseInt() и обновляет значение dailyGoal
    if (savedId) nextBookId = parseInt(savedId);  //ли savedId существует, преобразует строку в число и обновляет значение nextBookId
    
    if (books.length > 0) { //есть ли книги 
        const maxId = Math.max(...books.map(b => b.id || 0), 0); //создаёт массив всех id книг
        if (maxId >= nextBookId) nextBookId = maxId + 1; 
    }
}
//сохранение обнавлёных данных 
function saveDataToStorage() {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(readingHistory));
    localStorage.setItem(STORAGE_KEYS.DAILY_GOAL, dailyGoal);
    localStorage.setItem(STORAGE_KEYS.NEXT_ID, nextBookId);
}

loadDataFromStorage();
initDemoData();
// Статусы книг
const BOOK_STATUS = {
    READING: 'reading',
    COMPLETED: 'completed',
    POSTPONED: 'postponed'
};

// Текстовое представление статусов
const STATUS_TEXT = {
    [BOOK_STATUS.READING]: ' Читаю',
    [BOOK_STATUS.COMPLETED]: ' Закончил',
    [BOOK_STATUS.POSTPONED]: ' Отложил'
};

// CSS классы для статусов
const STATUS_CLASS = {
    [BOOK_STATUS.READING]: 'status-reading',
    [BOOK_STATUS.COMPLETED]: 'status-completed',
    [BOOK_STATUS.POSTPONED]: 'status-postponed'
};

// Мотивационные цитаты
const QUOTES = [
    " «Книга — это мечта, которую ты держишь в руках.» — Нил Гейман",
    " «Чтение — это путешествие без границ.»",
    " «Читающий человек живёт тысячу жизней.» — Джордж Р.Р. Мартин",
    " «Книги — это корабли мысли.» — Фрэнсис Бэкон",
    " «Чтение делает человека знающим, беседа — находчивым.» — Фрэнклин",
    " «В книгах — вся мудрость веков.»",
    " «Читай каждый день — становись лучше!»"
];

// Ключи для localStorage
const STORAGE_KEYS = {
    BOOKS: 'bookTracker_books',
    HISTORY: 'bookTracker_history', 
    DAILY_GOAL: 'bookTracker_dailyGoal',
    NEXT_ID: 'bookTracker_nextId'
};
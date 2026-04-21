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

function saveBadgesState() {
    const badgesState = {};
    const badges = document.querySelectorAll('.badge');
    badges.forEach(badge => {
        const type = badge.dataset.badge;
        badgesState[type] = !badge.classList.contains('locked');
    });
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badgesState));
}

function loadBadgesState() {
    const savedBadges = localStorage.getItem(STORAGE_KEYS.BADGES);
    if (!savedBadges) return;
    
    const badgesState = JSON.parse(savedBadges);
    const badges = document.querySelectorAll('.badge');
    
    badges.forEach(badge => {
        const type = badge.dataset.badge;
        if (badgesState[type] === true && badge.classList.contains('locked')) {
            badge.classList.remove('locked');
            if (type === 'first_book') {
                badge.style.background = '#f1c40f';
            } else if (type === 'streak_7') {
                badge.style.background = '#e67e22';
            } else if (type === 'pages_1000') {
                badge.style.background = '#9b59b6';
            }
        }
    });
}

function initDemoData() {
}

loadDataFromStorage();
initDemoData();
// добавляем эл в массив
const DOM = {
    bookForm: null,
    bookTitle: null,
    bookAuthor: null,
    bookPages: null,
    booksList: null,
    dailyGoalInput: null,
    setGoalBtn: null,
    dailyProgressFill: null,
    goalStatusText: null,
    motivationMessage: null,
    totalCompleted: null,
    totalPagesRead: null,
    avgSpeed: null,
    currentStreak: null,
    progressChart: null,
    dailyQuote: null,
    filterBtns: null,
    modal: null,
    modalBookTitle: null,
    progressPages: null,
    saveProgressBtn: null,
    closeModal: null
};

let currentFilter = 'all';
let currentBookId = null;
let chartInstance = null;

// иницилизация эл по айди
function initDOM() {
    DOM.bookForm = document.getElementById('bookForm');
    DOM.bookTitle = document.getElementById('bookTitle');
    DOM.bookAuthor = document.getElementById('bookAuthor');
    DOM.bookPages = document.getElementById('bookPages');
    DOM.booksList = document.getElementById('booksList');
    DOM.dailyGoalInput = document.getElementById('dailyGoalInput');
    DOM.setGoalBtn = document.getElementById('setGoalBtn');
    DOM.dailyProgressFill = document.getElementById('dailyProgressFill');
    DOM.goalStatusText = document.getElementById('goalStatusText');
    DOM.motivationMessage = document.getElementById('motivationMessage');
    DOM.totalCompleted = document.getElementById('totalCompleted');
    DOM.totalPagesRead = document.getElementById('totalPagesRead');
    DOM.avgSpeed = document.getElementById('avgSpeed');
    DOM.currentStreak = document.getElementById('currentStreak');
    DOM.progressChart = document.getElementById('progressChart');
    DOM.dailyQuote = document.getElementById('dailyQuote');
    DOM.filterBtns = document.querySelectorAll('.filter-btn');
    DOM.modal = document.getElementById('progressModal');
    DOM.modalBookTitle = document.getElementById('modalBookTitle');
    DOM.progressPages = document.getElementById('progressPages');
    DOM.saveProgressBtn = document.getElementById('saveProgressBtn');
    DOM.closeModal = document.querySelector('.close');
}

// добавление данных 
function addBook(title, author, totalPages) {
    const newBook = {
        id: nextBookId++,
        title: title.trim(),
        author: author.trim(),
        totalPages: parseInt(totalPages),
        readPages: 0,
        status: BOOK_STATUS.READING,
        startDate: getTodayDate(),
        lastUpdate: new Date().toISOString()
    };
    books.push(newBook);
    saveDataToStorage();
    renderAll();
}

function updateProgress(bookId, pagesRead) {
    const book = books.find(b => b.id === bookId);
    if (!book) return false;
    
    const pagesToAdd = parseInt(pagesRead);
    const newReadPages = book.readPages + pagesToAdd;
    
    if (newReadPages > book.totalPages) {
        showNotification(`Нельзя прочитать больше ${book.totalPages} стр.`, false);
        return false;
    }
    
    book.readPages = newReadPages;
    book.lastUpdate = new Date().toISOString();
    
    if (book.readPages === book.totalPages && book.status !== BOOK_STATUS.COMPLETED) {
        book.status = BOOK_STATUS.COMPLETED;
        showNotification(`Вы закончили "${book.title}"!`, true);
        checkBadges();
    }
    
    addToReadingHistory(pagesToAdd);
    saveDataToStorage();
    renderAll();
    checkDailyGoalCompletion(pagesToAdd);
    return true;
}

function changeBookStatus(bookId, newStatus) {
    const book = books.find(b => b.id === bookId);
    if (book) {
        book.status = newStatus;
        saveDataToStorage();
        renderAll();
        showNotification(`Статус "${book.title}" изменён на "${STATUS_TEXT[newStatus]}"`);
    }
}

function addToReadingHistory(pages) {
    const today = getTodayDate();
    const existingIndex = readingHistory.findIndex(h => h.date === today);
    
    if (existingIndex !== -1) {
        readingHistory[existingIndex].pages += pages;
    } else {
        readingHistory.push({ date: today, pages: pages });
    }
    
    // Сортируем историю по дате (от старых к новым)
    readingHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// статистика 
function calculateStreak() {
    if (readingHistory.length === 0) return 0;
    
    // Получаем отсортированные дни с чтением (от новых к старым)
    const sorted = [...readingHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let streak = 0;
    // Начинаем с сегодняшней даты
    let expectedDate = new Date();
    expectedDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sorted.length; i++) {
        const entryDate = new Date(sorted[i].date);
        entryDate.setHours(0, 0, 0, 0);
        
        // Если дата записи совпадает с ожидаемой датой
        if (entryDate.getTime() === expectedDate.getTime() && sorted[i].pages > 0) {
            streak++;
            // Сдвигаем ожидаемую дату на один день назад
            expectedDate.setDate(expectedDate.getDate() - 1);
        } 
        // Если дата записи меньше ожидаемой (пропущен день) - прерываем серию
        else if (entryDate.getTime() < expectedDate.getTime()) {
            break;
        }
        // Если дата записи больше ожидаемой - игнорируем (дубликат или будущая дата)
    }
    
    return streak;
}

function calculateAverageSpeed() {
    // Получаем последние 7 дней с чтением (не календарных, а фактических записей)
    const last7Entries = readingHistory.slice(-7);
    if (last7Entries.length === 0) return 0;
    
    const totalPagesLast7 = last7Entries.reduce((sum, entry) => sum + entry.pages, 0);
    return Math.round(totalPagesLast7 / last7Entries.length);
}

function getTotalPagesRead() {
    return books.reduce((s, b) => s + b.readPages, 0);
}

function getCompletedBooksCount() {
    return books.filter(b => b.status === BOOK_STATUS.COMPLETED).length;
}

function updateStatistics() {
    if (DOM.totalCompleted) DOM.totalCompleted.textContent = getCompletedBooksCount();
    if (DOM.totalPagesRead) DOM.totalPagesRead.textContent = getTotalPagesRead();
    if (DOM.avgSpeed) DOM.avgSpeed.textContent = calculateAverageSpeed();
    if (DOM.currentStreak) DOM.currentStreak.textContent = calculateStreak();
    updateChart();
}

// график
function updateChart() {
    if (!DOM.progressChart) return;
    const ctx = DOM.progressChart.getContext('2d');
    
    // Получаем последние 7 календарных дней (включая сегодня)
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        labels.push(dateStr.slice(5)); // Показываем только день и месяц (MM-DD)
        
        const entry = readingHistory.find(h => h.date === dateStr);
        data.push(entry ? entry.pages : 0);
    }
    
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { 
            labels, 
            datasets: [{ 
                label: 'Прочитано страниц', 
                data, 
                borderColor: '#3498db', 
                backgroundColor: 'rgba(52,152,219,0.1)', 
                fill: true, 
                tension: 0.3 
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Страниц'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Дата (ММ-ДД)'
                    }
                }
            }
        }
    });
}

// условие цели и мотивации 
function setDailyGoal(goal) {
    const newGoal = parseInt(goal);
    if (newGoal > 0) {
        dailyGoal = newGoal;
        saveDataToStorage();
        showNotification(`Дневная цель: ${dailyGoal} стр./день`);
        renderDailyGoalProgress();
    } else {
        showNotification('Цель от 1 страницы', false);
    }
}

function getTodayReadPages() {
    const today = getTodayDate();
    const entry = readingHistory.find(h => h.date === today);
    return entry ? entry.pages : 0;
}

function renderDailyGoalProgress() {
    const todayRead = getTodayReadPages();
    const percent = Math.min(100, (todayRead / dailyGoal) * 100);
    if (DOM.dailyProgressFill) DOM.dailyProgressFill.style.width = `${percent}%`;
    if (DOM.goalStatusText) DOM.goalStatusText.textContent = `${todayRead} / ${dailyGoal} стр.`;
}

function checkDailyGoalCompletion(added) {
    const todayRead = getTodayReadPages();
    const wasCompleted = (todayRead - added) >= dailyGoal;
    const isCompleted = todayRead >= dailyGoal;
    if (isCompleted && !wasCompleted) {
        showNotification(`Выполнена дневная норма ${dailyGoal} стр.!`, true);
    }
}

function showNotification(msg, isSuccess = true) {
    if (!DOM.motivationMessage) return;
    DOM.motivationMessage.textContent = msg;
    // Автоматически очищаем сообщение через 3 секунды
    setTimeout(() => {
        if (DOM.motivationMessage && DOM.motivationMessage.textContent === msg) {
            DOM.motivationMessage.textContent = 'Установи цель, чтобы начать!';
        }
    }, 3000);
}

function updateDailyQuote() {
    if (DOM.dailyQuote) {
        const idx = Math.floor(Math.random() * QUOTES.length);
        DOM.dailyQuote.textContent = QUOTES[idx];
    }
}

function checkBadges() {
    const completed = getCompletedBooksCount();
    const totalPages = getTotalPagesRead();
    const streak = calculateStreak();
    const badges = document.querySelectorAll('.badge');
    badges.forEach(b => {
        const type = b.dataset.badge;
        if (type === 'first_book' && completed >= 1 && b.classList.contains('locked')) {
            b.classList.remove('locked'); 
            b.style.background = '#f1c40f';
            showNotification('Достижение: Первая книга!');
        }
        if (type === 'streak_7' && streak >= 7 && b.classList.contains('locked')) {
            b.classList.remove('locked'); 
            b.style.background = '#e67e22';
            showNotification('Достижение: 7 дней чтения!');
        }
        if (type === 'pages_1000' && totalPages >= 1000 && b.classList.contains('locked')) {
            b.classList.remove('locked'); 
            b.style.background = '#9b59b6';
            showNotification('Достижение: 1000 страниц!');
        }
    });
}

// обнова
function renderBooksList() {
    if (!DOM.booksList) return;
    let filtered = currentFilter === 'all' ? books : books.filter(b => b.status === currentFilter);
    DOM.booksList.innerHTML = '';
    if (filtered.length === 0) {
        DOM.booksList.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">Нет книг</td></tr>';
        return;
    }
    filtered.forEach(book => {
        const percent = calculatePercent(book.readPages, book.totalPages);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${escapeHtml(book.title)}</strong></td>
            <td>${escapeHtml(book.author)}</td>
            <td><div class="progress-text">${book.readPages}/${book.totalPages} (${percent}%)</div>
                <div class="progress-bar" style="height:6px;margin-top:5px;"><div class="progress-fill" style="width:${percent}%;background:#3498db;height:100%;border-radius:4px;"></div></div></td>
            <td><span class="status-badge ${STATUS_CLASS[book.status]}">${STATUS_TEXT[book.status]}</span></td>
            <td><button class="action-btn" onclick="openProgressModal(${book.id})"> +стр</button>
                <select class="action-btn" onchange="changeBookStatus(${book.id}, this.value)" style="width:auto;">
                    <option value="${BOOK_STATUS.READING}" ${book.status === BOOK_STATUS.READING ? 'selected' : ''}>Читаю</option>
                    <option value="${BOOK_STATUS.COMPLETED}" ${book.status === BOOK_STATUS.COMPLETED ? 'selected' : ''}>Закончил</option>
                    <option value="${BOOK_STATUS.POSTPONED}" ${book.status === BOOK_STATUS.POSTPONED ? 'selected' : ''}>Отложил</option>
                </select></td>
        `;
        DOM.booksList.appendChild(row);
    });
}

// Функция для экранирования HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function updateFilterButtons() {
    DOM.filterBtns.forEach(btn => {
        if (btn.dataset.filter === currentFilter) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function renderAll() {
    renderBooksList();
    updateStatistics();
    renderDailyGoalProgress();
    updateDailyQuote();
    updateFilterButtons();
}

// всплывающие окно
window.openProgressModal = function(bookId) {
    const book = books.find(b => b.id === bookId);
    if (book && DOM.modal) {
        currentBookId = bookId;
        DOM.modalBookTitle.textContent = `${book.title} — ${book.author}`;
        DOM.progressPages.value = '';
        DOM.modal.style.display = 'flex';
    }
};

function closeModal() {
    if (DOM.modal) DOM.modal.style.display = 'none';
}

function saveProgressFromModal() {
    const pages = parseInt(DOM.progressPages.value);
    if (isNaN(pages) || pages <= 0) showNotification('Введите корректное число', false);
    else if (currentBookId) { 
        updateProgress(currentBookId, pages);
        closeModal();
    }
}

// событие
function initEvents() {
    if (DOM.bookForm) DOM.bookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleErr = validateString(DOM.bookTitle.value, 'Название');
        const authorErr = validateString(DOM.bookAuthor.value, 'Автор');
        const pagesErr = validatePages(DOM.bookPages.value);
        if (titleErr) showNotification(titleErr, false);
        else if (authorErr) showNotification(authorErr, false);
        else if (pagesErr) showNotification(pagesErr, false);
        else addBook(DOM.bookTitle.value, DOM.bookAuthor.value, DOM.bookPages.value);
        DOM.bookForm.reset();
    });
    if (DOM.setGoalBtn) DOM.setGoalBtn.addEventListener('click', () => setDailyGoal(DOM.dailyGoalInput.value));
    DOM.filterBtns.forEach(btn => btn.addEventListener('click', () => { 
        currentFilter = btn.dataset.filter; 
        renderBooksList(); 
        updateFilterButtons(); 
    }));
    if (DOM.saveProgressBtn) DOM.saveProgressBtn.onclick = saveProgressFromModal;
    if (DOM.closeModal) DOM.closeModal.onclick = closeModal;
    window.onclick = (e) => { if (e.target === DOM.modal) closeModal(); };
}

// запуск всех элем.
function init() {
    initDOM();
    initEvents();
    renderAll();
    if (DOM.dailyGoalInput) DOM.dailyGoalInput.value = dailyGoal;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
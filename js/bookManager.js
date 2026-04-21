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

// ГЛАВНАЯ ФУНКЦИЯ ПРИНУДИТЕЛЬНОЙ ПРОВЕРКИ ДАТЫ
function syncDateAndRefresh() {
    // Получаем текущую системную дату
    const systemDate = getTodayDate();
    
    // Получаем сохранённую дату из localStorage
    let storedDate = localStorage.getItem('lastVisitDate');
    
    // Для отладки (можно посмотреть в консоли F12)
    console.log('System date:', systemDate);
    console.log('Stored date:', storedDate);
    
    // Если сохранённой даты нет или она отличается от системной
    if (!storedDate || storedDate !== systemDate) {
        console.log('Date mismatch! Updating...');
        
        // Обновляем сохранённую дату
        localStorage.setItem('lastVisitDate', systemDate);
        
        // ПРИНУДИТЕЛЬНО ОБНОВЛЯЕМ ВСЕ ДАННЫЕ
        
        // 1. Обновляем статистику
        if (DOM.currentStreak) DOM.currentStreak.textContent = calculateStreak();
        if (DOM.totalPagesRead) DOM.totalPagesRead.textContent = getTotalPagesRead();
        if (DOM.avgSpeed) DOM.avgSpeed.textContent = calculateAverageSpeed();
        if (DOM.totalCompleted) DOM.totalCompleted.textContent = getCompletedBooksCount();
        
        // 2. Обновляем дневную цель
        renderDailyGoalProgress();
        
        // 3. Обновляем график
        updateChart();
        
        // 4. Перерисовываем таблицу
        renderBooksList();
        
        // 5. Показываем уведомление
        showNotification(`Дата синхронизирована: ${systemDate}`);
        
        return true;
    }
    return false;
}

// добавление данные книги
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
    books.push(newBook); // добавление книги в массив
    saveDataToStorage(); // data.js
    renderAll();
}

function updateProgress(bookId, pagesRead) {
    const book = books.find(b => b.id === bookId); // поиск книги по id
    if (!book) return false;
    
    const pagesToAdd = parseInt(pagesRead);
    const newReadPages = book.readPages + pagesToAdd;
    
    if (newReadPages > book.totalPages) { //валидация
        showNotification(`Нельзя прочитать больше ${book.totalPages} стр.`, false);
        return false;
    }
    
    book.readPages = newReadPages;
    book.lastUpdate = new Date().toISOString();
    
    if (book.readPages === book.totalPages && book.status !== BOOK_STATUS.COMPLETED) { // проверка на возможность завершения книги
        book.status = BOOK_STATUS.COMPLETED;
        showNotification(`Вы закончили "${book.title}"!`, true);
        checkBadges(); //bookManager.js
    }
    
    addToReadingHistory(pagesToAdd); //bookManager.js
    saveDataToStorage(); //data.js
    renderAll();
    checkDailyGoalCompletion(pagesToAdd);
    return true;
}

function changeBookStatus(bookId, newStatus) { //меняю статус книги
    const book = books.find(b => b.id === bookId);
    if (book) {
        book.status = newStatus;
        saveDataToStorage();
        renderAll();
        showNotification(`Статус "${book.title}" изменён на "${STATUS_TEXT[newStatus]}"`);
    }
}

function addToReadingHistory(pages) {
    const today = getTodayDate(); //utils.js
    const existingIndex = readingHistory.findIndex(h => h.date === today); //поиск записи за сегодняшний день (если нету будет -1)
    if (existingIndex !== -1) { //обновление существующей записи
        readingHistory[existingIndex].pages += pages;
    } else { //если записи нет (создаёт новую запись)
        readingHistory.push({ date: today, pages: pages });
    }
    
    readingHistory.sort((a, b) => new Date(a.date) - new Date(b.date)); // сортируем историю по дате (от старых к новым)
}

// статистика 
function calculateStreak() {
    if (readingHistory.length === 0) return 0; //если стрика нету 
    
    const sorted = [...readingHistory].sort((a, b) => new Date(b.date) - new Date(a.date)); // Получаем отсортированные дни с чтением (от новых к старым)
    
    let streak = 0;
    let expectedDate = new Date();     // Начинаем с сегодняшней даты
    expectedDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sorted.length; i++) { //цикл по отсортированным записям
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
    const last7Entries = readingHistory.slice(-7); //тот же массив только отсчёт идёт с конца
    if (last7Entries.length === 0) return 0;
    
    const totalPagesLast7 = last7Entries.reduce((sum, entry) => sum + entry.pages, 0); //cуммирование страниц за последние 7 записей
    return Math.round(totalPagesLast7 / last7Entries.length); // находим стр/д за неделю
}

function getTotalPagesRead() { //суммирование прочитанных страниц всех книг
    return books.reduce((s, b) => s + b.readPages, 0);
}

function getCompletedBooksCount() { //подсчёт законченных книг
    return books.filter(b => b.status === BOOK_STATUS.COMPLETED).length;
}

function updateStatistics() { //обновление данных
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
    
    // Получаем последние 7 календарных дней (включая сегодня) в ЛОКАЛЬНОМ времени
    const labels = [];
    const data = [];
    
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Форматируем дату в локальный формат ГГГГ-ММ-ДД
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
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
        saveDataToStorage(); //data.js
        showNotification(`Дневная цель: ${dailyGoal} стр./день`);
        renderDailyGoalProgress(); //bookManager.js
    } else {
        showNotification('Цель от 1 страницы', false);
    }
}

function getTodayReadPages() {
    const today = getTodayDate();
    const entry = readingHistory.find(h => h.date === today); //поиск записи за сегодняшний день
    return entry ? entry.pages : 0; //возврат количества страниц
}

function renderDailyGoalProgress() { //кол вол странци за сегодня
    const todayRead = getTodayReadPages();
    const percent = Math.min(100, (todayRead / dailyGoal) * 100); // расчёт процента выполнения цели это нужно для прогрес барра ежедневной цели
    if (DOM.dailyProgressFill) DOM.dailyProgressFill.style.width = `${percent}%`;
    if (DOM.goalStatusText) DOM.goalStatusText.textContent = `${todayRead} / ${dailyGoal} стр.`;
}

function checkDailyGoalCompletion(added) {
    const todayRead = getTodayReadPages();
    if (todayRead >= dailyGoal && (todayRead - added) < dailyGoal) {
        showNotification(`Выполнена дневная норма ${dailyGoal} стр.!`);
    }
}

function showNotification(msg, isSuccess = true) {
    if (!DOM.motivationMessage) return;
    DOM.motivationMessage.textContent = msg;
    setTimeout(() => { // Автоматически очищаем сообщение через 6 секунды
        if (DOM.motivationMessage && DOM.motivationMessage.textContent === msg) {
            DOM.motivationMessage.textContent = 'Установи цель, чтобы начать!';
        }
    }, 6000);
}

function updateDailyQuote() { //обновление цитаты
    if (DOM.dailyQuote) {
        const idx = Math.floor(Math.random() * QUOTES.length);
        DOM.dailyQuote.textContent = QUOTES[idx]; //цитата из массива по случайному индексу
    }
}

function checkBadges() { //достижение
    const completed = getCompletedBooksCount();
    const totalPages = getTotalPagesRead();
    const streak = calculateStreak();
    const badges = document.querySelectorAll('.badge');
    let changed = false;
    
    badges.forEach(b => {
        const type = b.dataset.badge;
        if (type === 'first_book' && completed >= 1 && b.classList.contains('locked')) {
            b.classList.remove('locked'); 
            b.style.background = '#f1c40f';
            showNotification('Достижение: Первая книга!');
            changed = true;
        }
        if (type === 'streak_7' && streak >= 7 && b.classList.contains('locked')) {
            b.classList.remove('locked'); 
            b.style.background = '#e67e22';
            showNotification('Достижение: 7 дней чтения!');
            changed = true;
        }
        if (type === 'pages_1000' && totalPages >= 1000 && b.classList.contains('locked')) {
            b.classList.remove('locked'); 
            b.style.background = '#9b59b6';
            showNotification('Достижение: 1000 страниц!');
            changed = true;
        }
    });
    
    if (changed) {
        saveBadgesState();
    }
}

function restoreBadgesOnLoad() {
    const completed = getCompletedBooksCount();
    const totalPages = getTotalPagesRead();
    const streak = calculateStreak();
    const badges = document.querySelectorAll('.badge');
    
    const savedBadges = localStorage.getItem(STORAGE_KEYS.BADGES);
    
    if (savedBadges) {
        const badgesState = JSON.parse(savedBadges);
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
    } else {
        let changed = false;
        badges.forEach(b => {
            const type = b.dataset.badge;
            if (type === 'first_book' && completed >= 1 && b.classList.contains('locked')) {
                b.classList.remove('locked'); 
                b.style.background = '#f1c40f';
                changed = true;
            }
            if (type === 'streak_7' && streak >= 7 && b.classList.contains('locked')) {
                b.classList.remove('locked'); 
                b.style.background = '#e67e22';
                changed = true;
            }
            if (type === 'pages_1000' && totalPages >= 1000 && b.classList.contains('locked')) {
                b.classList.remove('locked'); 
                b.style.background = '#9b59b6';
                changed = true;
            }
        });
        if (changed) {
            saveBadgesState();
        }
    }
}

// обновление
function renderBooksList() {
    if (!DOM.booksList) return;
    let filtered = currentFilter === 'all' ? books : books.filter(b => b.status === currentFilter); //фильтрация книг
    DOM.booksList.innerHTML = ''; // очистка таблицы
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
    // КРИТИЧЕСКИ ВАЖНО: синхронизируем дату ПЕРЕД каждым обновлением
    syncDateAndRefresh();
    
    renderBooksList();
    updateStatistics();
    renderDailyGoalProgress();
    updateDailyQuote();
    updateFilterButtons();
    checkBadges();
}

// всплывающие окно
window.openProgressModal = function(bookId) {
    const book = books.find(b => b.id === bookId); //поиск книги
    if (!book || !DOM.modal) return;
    currentBookId = bookId;
    DOM.modalBookTitle.textContent = `${book.title} — ${book.author}`;
    DOM.progressPages.value = '';
    DOM.modal.style.display = 'flex';
};

function closeModal() {
    if (DOM.modal) DOM.modal.style.display = 'none';
}

function saveProgressFromModal() { //валидация
    const pages = parseInt(DOM.progressPages.value);
    if (isNaN(pages) || pages <= 0) showNotification('Введите корректное число', false);
    else if (currentBookId) { 
        updateProgress(currentBookId, pages);
        closeModal();
    }
}

// обработчик событий
function initEvents() { //добавление книги  
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
    if (DOM.setGoalBtn) DOM.setGoalBtn.addEventListener('click', () => setDailyGoal(DOM.dailyGoalInput.value)); // обработка нажатия кнопки дневной цели
    DOM.filterBtns.forEach(btn => btn.addEventListener('click', () => {  // обработка нажатие на кнопки статуса все/читаю/закончил/отложил
        currentFilter = btn.dataset.filter; 
        renderBooksList(); 
        updateFilterButtons(); 
    }));
    if (DOM.saveProgressBtn) DOM.saveProgressBtn.onclick = saveProgressFromModal;// модальное окно
    if (DOM.closeModal) DOM.closeModal.onclick = closeModal; // модальное окно закрытие 
    window.onclick = (e) => { if (e.target === DOM.modal) closeModal(); };
}

// запуск всех элем.
function init() {
    initDOM();
    initEvents();
    // ПЕРВОЕ ДЕЛО: синхронизируем дату при загрузке страницы
    syncDateAndRefresh();
    renderAll();
    if (DOM.dailyGoalInput) DOM.dailyGoalInput.value = dailyGoal;
    restoreBadgesOnLoad();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
// Функция возвращает текущую дату в формате ГГГГ-ММ-ДД
function getTodayDate() {
    return new Date().toISOString().split('T')[0]; // [0] - берет первый элемент массива (только дату без времени)
}

// Функция проверяет строку на пустоту и длину
function validateString(str, fieldName) {
    if (!str || str.trim() === '') 
        return `${fieldName} не может быть пустым`;
    if (str.length > 100) 
        return `${fieldName} слишком длинный`;
    return null;
}

function validatePages(pages) {
    const num = parseInt(pages);
    if (isNaN(num) || num <= 0) 
        return 'Количество страниц должно быть положительным числом';
    if (num > 10000) 
        return 'Количество страниц не может превышать 10000';
    return null;
}

//вычисляет процент прочитанных страниц
function calculatePercent(readPages, totalPages) {
    if (totalPages === 0) return 0;
    return Math.round((readPages / totalPages) * 100);     // Math.round() - округляет число до ближайшего целого
}
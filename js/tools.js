// js/tools.js

// Функция для расчета КБЖУ (Формула Миффлина-Сан Жеора)
function calculateTDEE() {
    const gender = document.getElementById('calc-gender').value;
    const age = parseInt(document.getElementById('calc-age').value);
    const height = parseInt(document.getElementById('calc-height').value);
    const weight = parseInt(document.getElementById('calc-weight').value);
    const activity = parseFloat(document.getElementById('calc-activity').value);
    const goal = parseInt(document.getElementById('calc-goal').value);

    if (!age || !height || !weight) {
        alert('Пожалуйста, заполните все поля');
        return;
    }

    let bmr; // Базовый обмен веществ
    if (gender === 'male') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    let tdee = bmr * activity; // Норма калорий для поддержания веса
    let finalCalories = tdee + goal;

    // Расчет БЖУ (Белки, Жиры, Углеводы)
    // Стандартная схема: 30% белки, 30% жиры, 40% углеводы
    let protein = Math.round((finalCalories * 0.30) / 4); // 1г белка = 4 ккал
    let fats = Math.round((finalCalories * 0.30) / 9);    // 1г жира = 9 ккал
    let carbs = Math.round((finalCalories * 0.40) / 4);   // 1г углев = 4 ккал

    // Вывод результатов
    const resultBlock = document.getElementById('calc-results');
    document.getElementById('res-calories').innerText = Math.round(finalCalories);
    document.getElementById('res-protein').innerText = protein;
    document.getElementById('res-fats').innerText = fats;
    document.getElementById('res-carbs').innerText = carbs;
    
    resultBlock.style.display = 'block';
}

// Функция расчета ИМТ (Индекса Массы Тела)
function calculateBMI() {
    const weight = parseFloat(document.getElementById('bmi-weight').value);
    const height = parseFloat(document.getElementById('bmi-height').value) / 100; // в метрах

    if (!weight || !height) {
        alert('Введите вес и рост');
        return;
    }

    const bmi = weight / (height * height);
    let category = '';
    let color = '';

    if (bmi < 18.5) { category = 'Дефицит массы'; color = 'var(--accent-tertiary)'; }
    else if (bmi < 25) { category = 'Норма'; color = 'var(--accent-secondary)'; }
    else if (bmi < 30) { category = 'Избыточный вес'; color = 'var(--accent-primary)'; }
    else { category = 'Ожирение'; color = '#FF3B30'; }

    document.getElementById('bmi-value').innerText = bmi.toFixed(1);
    document.getElementById('bmi-category').innerText = category;
    document.getElementById('bmi-category').style.color = color;
    document.getElementById('bmi-result').style.display = 'block';
}

// Состояние игры
let coins = 100;
let wheatHarvested = 0;
let fields = [
    { state: "empty", timer: null },   // empty, growing, ready
    { state: "empty", timer: null },
    { state: "empty", timer: null },
    { state: "empty", timer: null },
    { state: "empty", timer: null },
    { state: "empty", timer: null }
];

const GROW_TIME = 5000; // 5 секунд

// DOM элементы
const coinSpan = document.getElementById("coinCounter");
const wheatSpan = document.getElementById("wheatCounter");
const gridContainer = document.getElementById("farmGrid");

// Функция обновления UI ресурсов
function updateResourcesUI() {
    coinSpan.textContent = coins;
    wheatSpan.textContent = wheatHarvested;
}

// Функция отрисовки полей
function renderFarm() {
    gridContainer.innerHTML = "";
    fields.forEach((field, index) => {
        const cell = document.createElement("div");
        cell.classList.add("field");
        
        if (field.state === "empty") {
            cell.classList.add("empty");
            cell.textContent = "🌱";
        } else if (field.state === "growing") {
            cell.classList.add("wheat-growing");
            cell.textContent = "";
        } else if (field.state === "ready") {
            cell.classList.add("wheat-ready");
            cell.textContent = "";
        }
        
        cell.addEventListener("click", () => onFieldClick(index));
        gridContainer.appendChild(cell);
    });
}

// Посадка пшеницы
function plantWheat(fieldIndex) {
    if (fields[fieldIndex].state !== "empty") return false;
    if (coins < 10) {
        alert("😢 Недостаточно монет! Продай урожай.");
        return false;
    }
    
    coins -= 10;
    fields[fieldIndex].state = "growing";
    
    // Устанавливаем таймер созревания
    const timer = setTimeout(() => {
        if (fields[fieldIndex].state === "growing") {
            fields[fieldIndex].state = "ready";
            fields[fieldIndex].timer = null;
            renderFarm();
        }
    }, GROW_TIME);
    
    fields[fieldIndex].timer = timer;
    
    updateResourcesUI();
    renderFarm();
    return true;
}

// Сбор урожая
function harvestWheat(fieldIndex) {
    if (fields[fieldIndex].state !== "ready") return false;
    
    // Убираем таймер на всякий случай
    if (fields[fieldIndex].timer) {
        clearTimeout(fields[fieldIndex].timer);
        fields[fieldIndex].timer = null;
    }
    
    // Награда: 15 монет + 1 пшеница
    coins += 15;
    wheatHarvested += 1;
    
    fields[fieldIndex].state = "empty";
    
    updateResourcesUI();
    renderFarm();
    return true;
}

// Обработка клика по полю
function onFieldClick(index) {
    const field = fields[index];
    if (field.state === "empty") {
        plantWheat(index);
    } else if (field.state === "ready") {
        harvestWheat(index);
    } else if (field.state === "growing") {
        // Ничего не делаем, но можно добавить подсказку
        // alert("🌱 Пшеница ещё растёт! Подожди немного.");
    }
}

// Покупка семян (отдельная кнопка)
function buySeeds() {
    if (coins >= 10) {
        coins -= 10;
        updateResourcesUI();
        alert("✅ Куплены семена пшеницы! Нажми на пустое поле, чтобы посадить.");
    } else {
        alert("💰 Не хватает монет! Собери урожай.");
    }
}

// Инициализация игры
function initGame() {
    updateResourcesUI();
    renderFarm();
    
    document.getElementById("buyWheatSeedBtn").addEventListener("click", buySeeds);
}

// Запуск
initGame();

// ==================== НАЧАЛЬНЫЕ ДАННЫЕ ====================
let gameState = {
    level: 1,
    xp: 0,
    coins: 500,
    diamonds: 30,
    wheat: 0,
    corn: 0,
    barn: { capacity: 20, items: { wheat: 0, corn: 0, bread: 0, egg: 0, milk: 0, plank: 0, nail: 0, bolt: 0 } },
    silo: { capacity: 15, items: { chickenFeed: 0, cowFeed: 0 } },
    fields: [],
    roadsideSlots: [],
    newspaperAds: [],
    orders: [],
    shipOrder: null,
    lastSave: Date.now()
};

// Конфиг растений
const crops = {
    wheat: { name: "🌾 Пшеница", growTime: 5000, price: 10, sellPrice: 15, xp: 5, levelReq: 1 },
    corn: { name: "🌽 Кукуруза", growTime: 10000, price: 20, sellPrice: 30, xp: 8, levelReq: 2 }
};

// Конфиг магазина
const shopItems = {
    crops: [
        { id: "wheat", name: "🌾 Грядка пшеницы", price: 10, type: "field" },
        { id: "corn", name: "🌽 Грядка кукурузы", price: 20, type: "field" }
    ],
    animals: [
        { id: "chicken", name: "🐔 Курятник", price: 100, type: "building" },
        { id: "cow", name: "🐄 Корова", price: 250, type: "building" }
    ],
    buildings: [
        { id: "bakery", name: "🍞 Пекарня", price: 300, type: "production" }
    ],
    decor: [
        { id: "fence", name: "🚧 Забор", price: 15, type: "decor" }
    ]
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
function initGame() {
    loadGame();
    if (gameState.fields.length === 0) {
        for (let i = 0; i < 6; i++) {
            gameState.fields.push({ crop: null, plantedAt: null, state: "empty" });
        }
    }
    if (gameState.roadsideSlots.length === 0) {
        gameState.roadsideSlots = [null, null, null, null];
    }
    generateNewspaper();
    generateOrders();
    generateShipOrder();
    renderFarm();
    updateUI();
    startTimers();
    attachEventListeners();
}

function loadGame() {
    const saved = localStorage.getItem("dreamFarm");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState = { ...gameState, ...parsed };
        } catch(e) {}
    }
}

function saveGame() {
    gameState.lastSave = Date.now();
    localStorage.setItem("dreamFarm", JSON.stringify(gameState));
}

function updateUI() {
    document.getElementById("levelValue").innerText = gameState.level;
    document.getElementById("coinDisplay").innerText = gameState.coins;
    document.getElementById("diamondDisplay").innerText = gameState.diamonds;
    document.getElementById("wheatDisplay").innerText = gameState.wheat;
    const xpPercent = (gameState.xp / (gameState.level * 100)) * 100;
    document.getElementById("xpBarFill").style.width = `${Math.min(100, xpPercent)}%`;
    document.getElementById("barnCapacity").innerText = `${Object.values(gameState.barn.items).reduce((a,b)=>a+b,0)}/${gameState.barn.capacity}`;
    document.getElementById("siloCapacity").innerText = `${Object.values(gameState.silo.items).reduce((a,b)=>a+b,0)}/${gameState.silo.capacity}`;
}

// ==================== ПОЛЕ И ГРЯДКИ ====================
function renderFarm() {
    const grid = document.getElementById("farmGrid");
    grid.innerHTML = "";
    gameState.fields.forEach((field, idx) => {
        const cell = document.createElement("div");
        cell.classList.add("field");
        if (!field.crop || field.state === "empty") {
            cell.classList.add("empty");
            cell.innerHTML = "🌱";
        } else if (field.state === "growing") {
            cell.classList.add("wheat-growing");
            cell.innerHTML = "🌱🌱";
        } else if (field.state === "ready") {
            cell.classList.add("wheat-ready");
            cell.innerHTML = field.crop === "wheat" ? "🌾" : "🌽";
        }
        cell.onclick = () => onFieldClick(idx);
        grid.appendChild(cell);
    });
}

function onFieldClick(idx) {
    const field = gameState.fields[idx];
    if (field.state === "empty") {
        // Открыть выбор культуры
        const crop = prompt("Что сажаем? 1 - Пшеница(10💰) 2 - Кукуруза(20💰)");
        if (crop === "1" && gameState.coins >= 10) {
            gameState.coins -= 10;
            field.crop = "wheat";
            field.plantedAt = Date.now();
            field.state = "growing";
            setTimeout(() => growComplete(idx), crops.wheat.growTime);
        } else if (crop === "2" && gameState.coins >= 20) {
            gameState.coins -= 20;
            field.crop = "corn";
            field.plantedAt = Date.now();
            field.state = "growing";
            setTimeout(() => growComplete(idx), crops.corn.growTime);
        } else alert("Не хватает монет!");
    } 
    else if (field.state === "ready") {
        harvestField(idx);
    }
    renderFarm();
    updateUI();
    saveGame();
}

function growComplete(idx) {
    if (gameState.fields[idx] && gameState.fields[idx].state === "growing") {
        gameState.fields[idx].state = "ready";
        renderFarm();
        saveGame();
    }
}

function harvestField(idx) {
    const field = gameState.fields[idx];
    const crop = crops[field.crop];
    if (!crop) return;
    gameState.coins += crop.sellPrice;
    gameState[field.crop] = (gameState[field.crop] || 0) + 1;
    gameState.barn.items[field.crop] = (gameState.barn.items[field.crop] || 0) + 1;
    gameState.xp += crop.xp;
    checkLevelUp();
    field.crop = null;
    field.state = "empty";
    renderFarm();
    updateUI();
    saveGame();
}

function checkLevelUp() {
    const neededXP = gameState.level * 100;
    if (gameState.xp >= neededXP) {
        gameState.level++;
        gameState.xp -= neededXP;
        gameState.diamonds += 5; // награда за уровень
        alert(`🎉 ПОЗДРАВЛЯЮ! УРОВЕНЬ ${gameState.level}! +5💎`);
        updateUI();
        saveGame();
    }
}

// ==================== МАГАЗИН ====================
function openShop() {
    const modal = document.getElementById("shopModal");
    renderShopTab("crops");
    modal.style.display = "flex";
}

function renderShopTab(tab) {
    const container = document.getElementById("shopItemsList");
    container.innerHTML = "";
    shopItems[tab].forEach(item => {
        const card = document.createElement("div");
        card.className = "shop-card";
        card.innerHTML = `<div>${item.name}</div><div>💰${item.price}</div>`;
        card.onclick = () => buyShopItem(item);
        container.appendChild(card);
    });
}

function buyShopItem(item) {
    if (gameState.coins >= item.price) {
        gameState.coins -= item.price;
        alert(`Куплено: ${item.name}`);
        saveGame();
        updateUI();
    } else alert("Не хватает монет!");
}

// ==================== АМБАР ====================
function openBarn() {
    const modal = document.getElementById("barnModal");
    const container = document.getElementById("barnItems");
    container.innerHTML = "";
    for (let [key, val] of Object.entries(gameState.barn.items)) {
        if (val > 0) {
            const div = document.createElement("div");
            div.className = "shop-card";
            div.innerHTML = `${key}: ${val}`;
            container.appendChild(div);
        }
    }
    modal.style.display = "flex";
}

function upgradeBarn() {
    if (gameState.barn.items.plank >= 10 && gameState.barn.items.nail >= 5) {
        gameState.barn.items.plank -= 10;
        gameState.barn.items.nail -= 5;
        gameState.barn.capacity += 10;
        alert(`Амбар улучшен! Теперь вместимость: ${gameState.barn.capacity}`);
        saveGame();
        updateUI();
        openBarn();
    } else alert("Нужно 10 досок и 5 гвоздей!");
}

// ==================== ГАЗЕТА (NPC объявления) ====================
function generateNewspaper() {
    gameState.newspaperAds = [];
    const npcNames = ["Фермер Джо", "Миссис Грин", "Дядя Боб", "Фрекен Бок", "Петрович"];
    for (let i = 0; i < 12; i++) {
        const items = ["wheat", "corn", "bread", "egg", "milk"];
        const randomItem = items[Math.floor(Math.random() * items.length)];
        gameState.newspaperAds.push({
            name: npcNames[Math.floor(Math.random() * npcNames.length)],
            item: randomItem,
            qty: Math.floor(Math.random() * 5) + 1,
            price: Math.floor(Math.random() * 50) + 10
        });
    }
    renderNewspaper();
}

function renderNewspaper() {
    const container = document.getElementById("newspaperAds");
    if (!container) return;
    container.innerHTML = "";
    gameState.newspaperAds.forEach(ad => {
        const card = document.createElement("div");
        card.className = "shop-card";
        card.innerHTML = `<b>${ad.name}</b><br>${ad.item} x${ad.qty}<br>💰${ad.price}`;
        card.onclick = () => buyFromNewspaper(ad);
        container.appendChild(card);
    });
}

function buyFromNewspaper(ad) {
    if (gameState.coins >= ad.price) {
        gameState.coins -= ad.price;
        gameState.barn.items[ad.item] = (gameState.barn.items[ad.item] || 0) + ad.qty;
        alert(`Куплено: ${ad.item} x${ad.qty}`);
        updateUI();
        saveGame();
    } else alert("Нет монет!");
}

// ==================== ПРИДОРОЖНЫЙ КИОСК ====================
function openRoadside() {
    const modal = document.getElementById("roadsideModal");
    const container = document.getElementById("roadsideSlots");
    container.innerHTML = "";
    gameState.roadsideSlots.forEach((slot, idx) => {
        const slotDiv = document.createElement("div");
        slotDiv.className = "roadside-slot";
        if (slot) {
            slotDiv.innerHTML = `${slot.item}<br>x${slot.qty}<br>💰${slot.price}<br><button onclick="removeFromRoadside(${idx})">❌</button>`;
        } else {
            slotDiv.innerHTML = "➕ ВЫСТАВИТЬ";
            slotDiv.onclick = () => addToRoadside(idx);
        }
        container.appendChild(slotDiv);
    });
    modal.style.display = "flex";
}

function addToRoadside(slotIdx) {
    const item = prompt("Что продаёшь? (wheat/corn/egg/milk)");
    const qty = parseInt(prompt("Количество?"));
    const price = parseInt(prompt("Цена за штуку?"));
    if (gameState.barn.items[item] >= qty) {
        gameState.barn.items[item] -= qty;
        gameState.roadsideSlots[slotIdx] = { item, qty, price };
        alert("Товар выставлен!");
        saveGame();
        openRoadside();
    } else alert("Нет столько в амбаре!");
}

function removeFromRoadside(idx) {
    gameState.roadsideSlots[idx] = null;
    saveGame();
    openRoadside();
}

// ==================== ЗАКАЗЫ И КОРАБЛЬ ====================
function generateOrders() {
    gameState.orders = [];
    for (let i = 0; i < 6; i++) {
        gameState.orders.push({
            item: ["wheat", "corn", "bread", "egg"][Math.floor(Math.random() * 4)],
            qty: Math.floor(Math.random() * 3) + 1,
            reward: Math.floor(Math.random() * 50) + 20,
            xp: Math.floor(Math.random() * 10) + 5
        });
    }
    renderOrders();
}

function renderOrders() {
    const container = document.getElementById("ordersList");
    if (!container) return;
    container.innerHTML = "";
    gameState.orders.forEach(order => {
        const card = document.createElement("div");
        card.className = "shop-card";
        card.innerHTML = `${order.item} x${order.qty}<br>🏆 ${order.reward}💰 +${order.xp} XP`;
        card.onclick = () => completeOrder(order);
        container.appendChild(card);
    });
}

function completeOrder(order) {
    if (gameState.barn.items[order.item] >= order.qty) {
        gameState.barn.items[order.item] -= order.qty;
        gameState.coins += order.reward;
        gameState.xp += order.xp;
        alert("Заказ выполнен!");
        updateUI();
        saveGame();
        generateOrders(); // обновить доску
    } else alert(`Не хватает ${order.item} в амбаре!`);
}

function generateShipOrder() {
    gameState.shipOrder = {
        items: [
            { name: "wheat", qty: 5 },
            { name: "corn", qty: 3 }
        ],
        reward: 150,
        xp: 30
    };
    renderShipOrder();
}

function renderShipOrder() {
    const container = document.getElementById("shipOrder");
    if (!container) return;
    container.innerHTML = "";
    gameState.shipOrder.items.forEach(item => {
        const div = document.createElement("div");
        div.className = "shop-card";
        div.innerHTML = `${item.name} x${item.qty}`;
        container.appendChild(div);
    });
}

// ==================== ТАЙМЕРЫ И АВТОСОХРАНЕНИЕ ====================
function startTimers() {
    setInterval(() => {
        saveGame();
        updateUI();
    }, 5000);
    setInterval(() => {
        generateNewspaper();
        const timerSpan = document.getElementById("newspaperTimer");
        if (timerSpan) timerSpan.innerText = "05:00";
    }, 300000);
}

function attachEventListeners() {
    document.getElementById("shopBtn").onclick = openShop;
    document.getElementById("barnBtn").onclick = openBarn;
    document.getElementById("siloBtn").onclick = () => alert("СИЛОС: корм для животных");
    document.getElementById("newspaperBtn").onclick = () => document.getElementById("newspaperModal").style.display = "flex";
    document.getElementById("roadsideBtn").onclick = openRoadside;
    document.getElementById("ordersBtn").onclick = () => document.getElementById("ordersModal").style.display = "flex";
    document.getElementById("upgradeBarnBtn").onclick = upgradeBarn;
    document.querySelectorAll(".close").forEach(btn => {
        btn.onclick = () => btn.closest(".modal").style.display = "none";
    });
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.onclick = () => renderShopTab(btn.dataset.tab);
    });
}

// ЗАПУСК
initGame();

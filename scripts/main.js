document.addEventListener("DOMContentLoaded", () => {
    const vipBtn = document.getElementById("vipBtn");
    const vipIndicator = document.getElementById("vipIndicator");

    // Проверяем, был ли просмотрен VIP
    const viewed = localStorage.getItem("vipViewed");

    if (!viewed) {
        vipIndicator.style.display = "block";
    }

    vipBtn.addEventListener("click", () => {
        // Здесь будет открытие попапа
        vipIndicator.style.display = "none";
        localStorage.setItem("vipViewed", "true");
    });
});

let state = {
    pair: null,
    time: null,
    model: null
};

function selectField(field) {
    // Здесь потом будут попапы
    const value = prompt(`Выбери значение для: ${field}`);
    if (!value) return;

    state[field] = value;
    document.getElementById(`${field}Field`).value = value;

    checkReady();
}

function checkReady() {
    const btn = document.getElementById('getSignalBtn');
    const allFilled = state.pair && state.time && state.model;

    if (allFilled) {
        btn.classList.add('active');
        btn.removeAttribute('disabled');
    } else {
        btn.classList.remove('active');
        btn.setAttribute('disabled', 'true');
    }
}

// Для демонстрации: временно подставим название модели вручную
document.addEventListener('DOMContentLoaded', () => {
    const model = state.model || 'NeuralEdge V1';
    document.getElementById('selectedModel').innerText = model;
});

function toggleFAQ(button) {
    const item = button.closest('.faq-item');
    item.classList.toggle('open');
}

const SUP_LANGS = [
    { code: "ru", label: "Русский", short: "RU" },
    { code: "en", label: "English", short: "EN" },
    { code: "hi", label: "हिंदी", short: "HI" },
    { code: "ar", label: "العربية", short: "AR" },
    { code: "es", label: "Español", short: "ES" },
    { code: "fr", label: "Français", short: "FR" },
    { code: "ro", label: "Română", short: "RO" }
];

const langWrap = document.getElementById("langDropdown");
const langBtn  = document.getElementById("langBtn");
const langMenu = document.getElementById("langMenu");
const langFlag = document.getElementById("langFlag");
const langCode = document.getElementById("langCode");

function setCurrentLang(code) {
    const found = SUP_LANGS.find(l => l.code === code) || SUP_LANGS[0];
    langFlag.src = `images/flags/${found.code}.svg`;
    langFlag.alt = found.short;
    langCode.textContent = found.short;
}

function renderLangMenu() {
    langMenu.innerHTML = "";
    SUP_LANGS.forEach(({ code, label, short }) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.innerHTML = `<img class="lang-flag" src="images/flags/${code}.svg" alt="${short}"> ${label} (${short})`;
        btn.addEventListener("click", () => {
            setCurrentLang(code);
            langMenu.classList.remove("open");
            langWrap.classList.remove("open");
        });
        li.appendChild(btn);
        langMenu.appendChild(li);
    });
}

langBtn?.addEventListener("click", () => {
    const isOpen = langMenu.classList.contains("open");
    langMenu.classList.toggle("open", !isOpen);
    langWrap.classList.toggle("open", !isOpen);
});

document.addEventListener("click", (e) => {
    if (!langWrap.contains(e.target)) {
        langMenu.classList.remove("open");
        langWrap.classList.remove("open");
    }
});

renderLangMenu();
setCurrentLang("ru");


// =============================
// VIP индикатор
// =============================
// VIP: открытие нижней шторки + индикатор
document.addEventListener("DOMContentLoaded", () => {
    const vipBtn = document.getElementById("vipBtn");
    const vipIndicator = document.getElementById("vipIndicator");
    const sheet = document.getElementById("vipSheet");

    const viewed = localStorage.getItem("vipViewed");
    if (!viewed && vipIndicator) vipIndicator.style.display = "block";

    function openVip(){
        if (vipIndicator) { vipIndicator.style.display = "none"; localStorage.setItem("vipViewed","true"); }
        sheet?.setAttribute("aria-hidden","false");
        document.body.style.overflow = "hidden";
    }
    function closeVip(){
        sheet?.setAttribute("aria-hidden","true");
        document.body.style.overflow = "";
    }

    vipBtn?.addEventListener("click", openVip);

    // общие закрытия
    sheet?.addEventListener("click", (e) => {
        const t = e.target;
        if (t.matches("[data-close]") || t.closest("#vipClose")) closeVip();
    });
    document.getElementById("vipClose")?.addEventListener("click", closeVip);
    document.getElementById("vipLater")?.addEventListener("click", closeVip);

    // ESC
    document.addEventListener("keydown", (e)=>{ if (e.key === "Escape" && sheet && sheet.getAttribute("aria-hidden")==="false") closeVip(); });

    // Свайп вниз (очень простой)
    let startY = null;
    sheet?.addEventListener("touchstart", (e)=>{ startY = e.touches[0].clientY; }, {passive:true});
    sheet?.addEventListener("touchmove",  (e)=>{ /* no-op */ }, {passive:true});
    sheet?.addEventListener("touchend",   (e)=>{
        if (startY == null) return;
        const dy = (e.changedTouches[0].clientY - startY);
        if (dy > 80) closeVip();
        startY = null;
    });

    // CTA
    document.getElementById("vipGet")?.addEventListener("click", ()=>{
        // Здесь можно дернуть оплату/страницу тарифа
        // Пока просто закрываем и помечаем интерес
        localStorage.setItem("vipIntent","1");
        closeVip();
    });
});


// =============================
// Глобальный стейт (форма)
// =============================
let state = {
    pair: null,
    time: null,            // "S5/M1/..."
    expiry: null,          // дублирующая метка
    expirySeconds: null,   // число секунд
    model: null
};

// =============================
// Персистентность
// =============================
const STATE_KEY  = "ps_state_v1";          // состояние формы (пара, время, модель)
const RESULT_KEY = "ps_last_result_v1";    // последний показанный результат
const LANG_KEY   = "ps_lang_v1";           // выбранный язык

function saveState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) {}
}

function restoreState() {
    try {
        const raw = localStorage.getItem(STATE_KEY);
        if (!raw) return;
        const s = JSON.parse(raw) || {};

        state.pair = s.pair ?? null;
        state.time = s.time ?? null;
        state.expiry = s.expiry ?? null;
        state.expirySeconds = Number.isFinite(s.expirySeconds) ? s.expirySeconds : null;
        state.model = s.model ?? null;

        const setVal = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
        setVal("pairField",  state.pair);
        setVal("timeField",  state.time);
        setVal("modelField", state.model);

        const mSpan = document.getElementById("selectedModel");
        if (mSpan && state.model) mSpan.textContent = state.model;

        checkReady();
    } catch(_) {}
}

function saveResult(res) {
    try { localStorage.setItem(RESULT_KEY, JSON.stringify(res)); } catch (_) {}
}

function restoreResult() {
    try {
        const raw = localStorage.getItem(RESULT_KEY);
        if (!raw) return;
        const r = JSON.parse(raw);

        // 1) Направление + иконка
        const dirEl = document.getElementById("sigDirection");
        if (dirEl) {
            dirEl.textContent = r.isBuy ? "ПОКУПКА" : "ПРОДАЖА";
            dirEl.classList.toggle("buy",  !!r.isBuy);
            dirEl.classList.toggle("sell", !r.isBuy);
        }
        const iconBox = document.getElementById("sigDirIcon");
        if (iconBox) iconBox.innerHTML = r.isBuy ? BUY_SVG : SELL_SVG;

        // 2) Параметры
        const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v ?? "—"; };
        setText("sigPair",     r.pair);
        setText("sigConf",     r.conf);
        setText("sigAcc",      r.acc);
        setText("sigMarket",   r.market);
        setText("sigStrength", r.strRu);
        setText("sigVol",      r.volRu);
        setText("sigTime",     r.time);
        setText("sigValid",    r.valid);

        // 3) Показать экран результата и поднять карточку
        const viewA = document.getElementById("sigAnalysis");
        const viewR = document.getElementById("sigResult");
        if (viewA && viewR) {
            viewA.style.display = "none";
            viewR.hidden = false;
        }

        const form = document.querySelector(".glass-card");
        if (form) {
            const raise = Math.ceil(form.getBoundingClientRect().height + 16);
            document.body.style.setProperty("--raise", `${raise}px`);
        }
        document.body.classList.add("analysis-open");
    } catch(_) {}
}

// =============================
// Вспомогательное UI
// =============================
function selectField(field) {
    if (field === "pair")   { CurrencyPairPopup.open();   return; }
    if (field === "expiry") { CurrencyExpiryPopup.open(); return; }
    if (field === "model")  { CurrencyModelPopup.open();  return; }

    const value = prompt(`Выбери значение для: ${field}`);
    if (!value) return;
    state[field] = value;
    const el = document.getElementById(`${field}Field`);
    if (el) el.value = value;
    checkReady();
    saveState();
}

function checkReady() {
    const btn = document.getElementById("getSignalBtn");
    const allFilled = !!(state.pair && state.time && state.model);
    if (!btn) return;
    if (allFilled) {
        btn.classList.add("active");
        btn.removeAttribute("disabled");
    } else {
        btn.classList.remove("active");
        btn.setAttribute("disabled", "true");
    }
}

// Показ текущей модели при первом рендере
document.addEventListener("DOMContentLoaded", () => {
    const model = state.model || document.getElementById("modelField")?.value || "NeuralEdge V1";
    const span = document.getElementById("selectedModel");
    if (span) span.innerText = model;
});

// =============================
// FAQ
// =============================
function toggleFAQ(button) {
    const item = button.closest(".faq-item");
    item.classList.toggle("open");
}

// =============================
// Языки
// =============================
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
    if (langFlag) { langFlag.src = `images/flags/${found.code}.svg`; langFlag.alt = found.short; }
    if (langCode) langCode.textContent = found.short;
    try { localStorage.setItem(LANG_KEY, found.code); } catch(_) {}
}

function renderLangMenu() {
    if (!langMenu) return;
    langMenu.innerHTML = "";
    SUP_LANGS.forEach(({ code, label, short }) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.innerHTML = `<img class="lang-flag" src="images/flags/${code}.svg" alt="${short}"> ${label} (${short})`;
        btn.addEventListener("click", () => {
            setCurrentLang(code);
            langMenu.classList.remove("open");
            langWrap?.classList.remove("open");
        });
        li.appendChild(btn);
        langMenu.appendChild(li);
    });
}

langBtn?.addEventListener("click", () => {
    const isOpen = langMenu?.classList.contains("open");
    langMenu?.classList.toggle("open", !isOpen);
    langWrap?.classList.toggle("open", !isOpen);
});

document.addEventListener("click", (e) => {
    if (!langWrap || !langMenu) return;
    if (!langWrap.contains(e.target)) {
        langMenu.classList.remove("open");
        langWrap.classList.remove("open");
    }
});

renderLangMenu();
// восстановим язык
setCurrentLang(localStorage.getItem(LANG_KEY) || "ru");

// =============================
// Direction icons (inline SVG)
// =============================
const SELL_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <title>Download-loop SVG Icon</title>
  <g stroke="#ff0000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
    <path fill="none" stroke-dasharray="14" stroke-dashoffset="14" d="M6 19h12">
      <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="14;0"/>
    </path>
    <path fill="#ff0000" d="M12 4 h2 v6 h2.5 L12 14.5M12 4 h-2 v6 h-2.5 L12 14.5">
      <animate attributeName="d" calcMode="linear" dur="1.5s" keyTimes="0;0.7;1" repeatCount="indefinite"
               values="M12 4 h2 v6 h2.5 L12 14.5M12 4 h-2 v6 h-2.5 L12 14.5;
                       M12 4 h2 v3 h2.5 L12 11.5M12 4 h-2 v3 h-2.5 L12 11.5;
                       M12 4 h2 v6 h2.5 L12 14.5M12 4 h-2 v6 h-2.5 L12 14.5"/>
    </path>
  </g>
</svg>`;

const BUY_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <title>Upload-loop SVG Icon</title>
  <g stroke="#32ac41" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
    <path fill="none" stroke-dasharray="14" stroke-dashoffset="14" d="M6 19h12">
      <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="14;0"/>
    </path>
    <path fill="#32ac41" d="M12 15 h2 v-6 h2.5 L12 4.5M12 15 h-2 v-6 h-2.5 L12 4.5">
      <animate attributeName="d" calcMode="linear" dur="1.5s" keyTimes="0;0.7;1" repeatCount="indefinite"
               values="M12 15 h2 v-6 h2.5 L12 4.5M12 15 h-2 v-6 h-2.5 L12 4.5;
                       M12 15 h2 v-3 h2.5 L12 7.5M12 15 h-2 v-3 h-2.5 L12 7.5;
                       M12 15 h2 v-6 h2.5 L12 4.5M12 15 h-2 v-6 h-2.5 L12 4.5"/>
    </path>
  </g>
</svg>`;

// Сразу после инициализации — восстановим форму/результат
restoreState();
restoreResult();

// ===============================
// Currency Pair Popup
// ===============================
(function(){
    const DATA = {
        fiat: [
            {id:"AUD_CAD_OTC",name:"AUD/CAD OTC",market:"OTC"},
            {id:"EUR_CHF_OTC",name:"EUR/CHF OTC",market:"OTC"},
            {id:"EUR_USD_OTC",name:"EUR/USD OTC",market:"OTC"},
            {id:"GBP_AUD_OTC",name:"GBP/AUD OTC",market:"OTC"},
            {id:"LBP_USD_OTC",name:"LBP/USD OTC",market:"OTC"},
            {id:"NZD_JPY_OTC",name:"NZD/JPY OTC",market:"OTC"},
            {id:"OMR_CNY_OTC",name:"OMR/CNY OTC",market:"OTC"},
            {id:"USD_BDT_OTC",name:"USD/BDT OTC",market:"OTC"},
            {id:"USD_CNH_OTC",name:"USD/CNH OTC",market:"OTC"},
            {id:"USD_COP_OTC",name:"USD/COP OTC",market:"OTC"},
            {id:"USD_IDR_OTC",name:"USD/IDR OTC",market:"OTC"},
            {id:"USD_INR_OTC",name:"USD/INR OTC",market:"OTC"},
            {id:"USD_PHP_OTC",name:"USD/PHP OTC",market:"OTC"},
            {id:"USD_VND_OTC",name:"USD/VND OTC",market:"OTC"},
            {id:"ZAR_USD_OTC",name:"ZAR/USD OTC",market:"OTC"},
            {id:"EUR_HUF_OTC",name:"EUR/HUF OTC",market:"OTC"},
            {id:"EUR_USD",name:"EUR/USD",market:""},
            {id:"NGN_USD_OTC",name:"NGN/USD OTC",market:"OTC"},
            {id:"USD_CLP_OTC",name:"USD/CLP OTC",market:"OTC"},
            {id:"AUD_USD_OTC",name:"AUD/USD OTC",market:"OTC"},
            {id:"EUR_NZD_OTC",name:"EUR/NZD OTC",market:"OTC"},
            {id:"YER_USD_OTC",name:"YER/USD OTC",market:"OTC"},
            {id:"AED_CNY_OTC",name:"AED/CNY OTC",market:"OTC"},
            {id:"AUD_USD",name:"AUD/USD",market:""},
            {id:"GBP_CAD",name:"GBP/CAD",market:""},
            {id:"USD_EGP_OTC",name:"USD/EGP OTC",market:"OTC"},
            {id:"AUD_CAD",name:"AUD/CAD",market:""},
            {id:"CAD_CHF",name:"CAD/CHF",market:""},
            {id:"EUR_CAD",name:"EUR/CAD",market:""},
            {id:"EUR_CHF",name:"EUR/CHF",market:""},
            {id:"EUR_GBP_OTC",name:"EUR/GBP OTC",market:"OTC"},
            {id:"GBP_USD",name:"GBP/USD",market:""},
            {id:"USD_JPY",name:"USD/JPY",market:""},
            {id:"EUR_JPY_OTC",name:"EUR/JPY OTC",market:"OTC"},
            {id:"AUD_CHF",name:"AUD/CHF",market:""},
            {id:"AUD_JPY_OTC",name:"AUD/JPY OTC",market:"OTC"},
            {id:"GBP_JPY",name:"GBP/JPY",market:""},
            {id:"GBP_USD_OTC",name:"GBP/USD OTC",market:"OTC"},
            {id:"USD_SGD_OTC",name:"USD/SGD OTC",market:"OTC"},
            {id:"EUR_TRY_OTC",name:"EUR/TRY OTC",market:"OTC"},
            {id:"USD_MXN_OTC",name:"USD/MXN OTC",market:"OTC"},
            {id:"CHF_JPY",name:"CHF/JPY",market:""},
            {id:"UAH_USD_OTC",name:"UAH/USD OTC",market:"OTC"},
            {id:"GBP_AUD",name:"GBP/AUD",market:""},
            {id:"JOD_CNY_OTC",name:"JOD/CNY OTC",market:"OTC"},
            {id:"EUR_AUD",name:"EUR/AUD",market:""},
            {id:"CAD_CHF_OTC",name:"CAD/CHF OTC",market:"OTC"},
            {id:"CAD_JPY",name:"CAD/JPY",market:""},
            {id:"EUR_RUB_OTC",name:"EUR/RUB OTC",market:"OTC"},
            {id:"QAR_CNY_OTC",name:"QAR/CNY OTC",market:"OTC"},
            {id:"USD_DZD_OTC",name:"USD/DZD OTC",market:"OTC"},
            {id:"USD_CHF_OTC",name:"USD/CHF OTC",market:"OTC"},
            {id:"CHF_NOK_OTC",name:"CHF/NOK OTC",market:"OTC"},
            {id:"GBP_JPY_OTC",name:"GBP/JPY OTC",market:"OTC"},
            {id:"AUD_NZD_OTC",name:"AUD/NZD OTC",market:"OTC"},
            {id:"USD_BRL_OTC",name:"USD/BRL OTC",market:"OTC"},
            {id:"USD_ARS_OTC",name:"USD/ARS OTC",market:"OTC"},
            {id:"AUD_CHF_OTC",name:"AUD/CHF OTC",market:"OTC"},
            {id:"SAR_CNY_OTC",name:"SAR/CNY OTC",market:"OTC"},
            {id:"CHF_JPY_OTC",name:"CHF/JPY OTC",market:"OTC"},
            {id:"USD_CHF",name:"USD/CHF",market:""},
            {id:"EUR_JPY",name:"EUR/JPY",market:""},
            {id:"MAD_USD_OTC",name:"MAD/USD OTC",market:"OTC"},
            {id:"NZD_USD_OTC",name:"NZD/USD OTC",market:"OTC"},
            {id:"AUD_JPY",name:"AUD/JPY",market:""},
            {id:"USD_JPY_OTC",name:"USD/JPY OTC",market:"OTC"},
            {id:"USD_MYR_OTC",name:"USD/MYR OTC",market:"OTC"},
            {id:"EUR_GBP",name:"EUR/GBP",market:""},
            {id:"KES_USD_OTC",name:"KES/USD OTC",market:"OTC"},
            {id:"USD_RUB_OTC",name:"USD/RUB OTC",market:"OTC"},
            {id:"BHD_CNY_OTC",name:"BHD/CNY OTC",market:"OTC"},
            {id:"USD_CAD",name:"USD/CAD",market:""},
            {id:"USD_PKR_OTC",name:"USD/PKR OTC",market:"OTC"},
            {id:"USD_THB_OTC",name:"USD/THB OTC",market:"OTC"},
            {id:"GBP_CHF",name:"GBP/CHF",market:""},
            {id:"TND_USD_OTC",name:"TND/USD OTC",market:"OTC"},
            {id:"CAD_JPY_OTC",name:"CAD/JPY OTC",market:"OTC"},
            {id:"USD_CAD_OTC",name:"USD/CAD OTC",market:"OTC"}
        ],
        crypto: [
            {id:"Avalanche_OTC",name:"Avalanche OTC",market:"OTC"},
            {id:"Bitcoin_ETF_OTC",name:"Bitcoin ETF OTC",market:"OTC"},
            {id:"BNB_OTC",name:"BNB OTC",market:"OTC"},
            {id:"Bitcoin_OTC",name:"Bitcoin OTC",market:"OTC"},
            {id:"Dogecoin_OTC",name:"Dogecoin OTC",market:"OTC"},
            {id:"Solana_OTC",name:"Solana OTC",market:"OTC"},
            {id:"TRON_OTC",name:"TRON OTC",market:"OTC"},
            {id:"Polkadot_OTC",name:"Polkadot OTC",market:"OTC"},
            {id:"Cardano_OTC",name:"Cardano OTC",market:"OTC"},
            {id:"Polygon_OTC",name:"Polygon OTC",market:"OTC"},
            {id:"Ethereum_OTC",name:"Ethereum OTC",market:"OTC"},
            {id:"Litecoin_OTC",name:"Litecoin OTC",market:"OTC"},
            {id:"Toncoin_OTC",name:"Toncoin OTC",market:"OTC"},
            {id:"Chainlink_OTC",name:"Chainlink OTC",market:"OTC"},
            {id:"Bitcoin",name:"Bitcoin",market:""},
            {id:"Ethereum",name:"Ethereum",market:""},
            {id:"Dash",name:"Dash",market:""},
            {id:"BCH_EUR",name:"BCH/EUR",market:""},
            {id:"BCH_GBP",name:"BCH/GBP",market:""},
            {id:"BCH_JPY",name:"BCH/JPY",market:""},
            {id:"BTC_GBP",name:"BTC/GBP",market:""},
            {id:"BTC_JPY",name:"BTC/JPY",market:""},
            {id:"Chainlink",name:"Chainlink",market:""}
        ],
        commod: [
            {id:"Brent_Oil_OTC",name:"Brent Oil OTC",market:"OTC"},
            {id:"WTI_Crude_Oil_OTC",name:"WTI Crude Oil OTC",market:"OTC"},
            {id:"Silver_OTC",name:"Silver OTC",market:"OTC"},
            {id:"Gold_OTC",name:"Gold OTC",market:"OTC"},
            {id:"Natural_Gas_OTC",name:"Natural Gas OTC",market:"OTC"},
            {id:"Palladium_spot_OTC",name:"Palladium spot OTC",market:"OTC"},
            {id:"Platinum_spot_OTC",name:"Platinum spot OTC",market:"OTC"},
            {id:"Brent_Oil",name:"Brent Oil",market:""},
            {id:"WTI_Crude_Oil",name:"WTI Crude Oil",market:""},
            {id:"XAG_EUR",name:"XAG/EUR",market:""},
            {id:"Silver",name:"Silver",market:""},
            {id:"XAU_EUR",name:"XAU/EUR",market:""},
            {id:"Gold",name:"Gold",market:""},
            {id:"Natural_Gas",name:"Natural Gas",market:""},
            {id:"Palladium_spot",name:"Palladium spot",market:""},
            {id:"Platinum_spot",name:"Platinum spot",market:""}
        ],
        stocks: [
            {id:"American_Express_OTC",name:"American Express OTC",market:"OTC"},
            {id:"Microsoft_OTC",name:"Microsoft OTC",market:"OTC"},
            {id:"Amazon_OTC",name:"Amazon OTC",market:"OTC"},
            {id:"FedEx_OTC",name:"FedEx OTC",market:"OTC"},
            {id:"Intel_OTC",name:"Intel OTC",market:"OTC"},
            {id:"FACEBOOK_INC_OTC",name:"FACEBOOK INC OTC",market:"OTC"},
            {id:"GameStop_Corp_OTC",name:"GameStop Corp OTC",market:"OTC"},
            {id:"Marathon_Digital_Holdings_OTC",name:"Marathon Digital Holdings OTC",market:"OTC"},
            {id:"Johnson_Johnson_OTC",name:"Johnson & Johnson OTC",market:"OTC"},
            {id:"McDonalds_OTC",name:"McDonald's OTC",market:"OTC"},
            {id:"Apple_OTC",name:"Apple OTC",market:"OTC"},
            {id:"Citigroup_Inc_OTC",name:"Citigroup Inc OTC",market:"OTC"},
            {id:"Tesla_OTC",name:"Tesla OTC",market:"OTC"},
            {id:"AMD_OTC",name:"Advanced Micro Devices OTC",market:"OTC"},
            {id:"ExxonMobil_OTC",name:"ExxonMobil OTC",market:"OTC"},
            {id:"Palantir_Technologies_OTC",name:"Palantir Technologies OTC",market:"OTC"},
            {id:"Alibaba_OTC",name:"Alibaba OTC",market:"OTC"},
            {id:"VISA_OTC",name:"VISA OTC",market:"OTC"},
            {id:"Boeing_Company_OTC",name:"Boeing Company OTC",market:"OTC"},
            {id:"Pfizer_Inc_OTC",name:"Pfizer Inc OTC",market:"OTC"},
            {id:"Netflix_OTC",name:"Netflix OTC",market:"OTC"},
            {id:"VIX_OTC",name:"VIX OTC",market:"OTC"},
            {id:"Cisco_OTC",name:"Cisco OTC",market:"OTC"},
            {id:"Coinbase_Global_OTC",name:"Coinbase Global OTC",market:"OTC"},
            {id:"Apple",name:"Apple",market:""},
            {id:"American_Express",name:"American Express",market:""},
            {id:"Boeing_Company",name:"Boeing Company",market:""},
            {id:"FACEBOOK_INC",name:"FACEBOOK INC",market:""},
            {id:"Johnson_Johnson",name:"Johnson & Johnson",market:""},
            {id:"JPMorgan",name:"JPMorgan Chase & Co",market:""},
            {id:"McDonalds",name:"McDonald's",market:""},
            {id:"Microsoft",name:"Microsoft",market:""},
            {id:"Pfizer_Inc",name:"Pfizer Inc",market:""},
            {id:"Tesla",name:"Tesla",market:""},
            {id:"Alibaba",name:"Alibaba",market:""},
            {id:"Citigroup_Inc",name:"Citigroup Inc",market:""},
            {id:"Netflix",name:"Netflix",market:""},
            {id:"Cisco",name:"Cisco",market:""},
            {id:"ExxonMobil",name:"ExxonMobil",market:""},
            {id:"Intel",name:"Intel",market:""}
        ],
        docs: [
            {id:"AUS_200_OTC",name:"AUS 200 OTC",market:"OTC"},
            {id:"100GBP_OTC",name:"100GBP OTC",market:"OTC"},
            {id:"CAC_40",name:"CAC 40",market:""},
            {id:"D30EUR_OTC",name:"D30EUR OTC",market:"OTC"},
            {id:"E35EUR",name:"E35EUR",market:""},
            {id:"E35EUR_OTC",name:"E35EUR OTC",market:"OTC"},
            {id:"E50EUR_OTC",name:"E50EUR OTC",market:"OTC"},
            {id:"F40EUR_OTC",name:"F40EUR OTC",market:"OTC"},
            {id:"US100",name:"US100",market:""},
            {id:"SMI_20",name:"SMI 20",market:""},
            {id:"SP500",name:"SP500",market:""},
            {id:"SP500_OTC",name:"SP500 OTC",market:"OTC"},
            {id:"100GBP",name:"100GBP",market:""},
            {id:"AEX_25",name:"AEX 25",market:""},
            {id:"D30_EUR",name:"D30/EUR",market:""},
            {id:"DJI30",name:"DJI30",market:""},
            {id:"DJI30_OTC",name:"DJI30 OTC",market:"OTC"},
            {id:"E50_EUR",name:"E50/EUR",market:""},
            {id:"F40_EUR",name:"F40/EUR",market:""},
            {id:"HONG_KONG_33",name:"HONG KONG 33",market:""},
            {id:"JPN225",name:"JPN225",market:""},
            {id:"JPN225_OTC",name:"JPN225 OTC",market:"OTC"},
            {id:"US100_OTC",name:"US100 OTC",market:"OTC"},
            {id:"AUS_200",name:"AUS 200",market:""}
        ]
    };

    const CP_TAB_TITLES = {
        fiat: "Валюты",
        crypto: "Криптовалюта",
        commod: "Сырьевые товары",
        stocks: "Акции",
        docs: "Индексы",
        fav: "Избранное",
        search: "Поиск"
    };

    const favKey = "pair_favorites_v1";
    const favSet = new Set(JSON.parse(localStorage.getItem(favKey) || "[]"));

    let currentTab = "fiat";
    let favOnly = false;
    let query = "";

    const overlay     = document.getElementById("cpPopup");
    const list        = document.getElementById("cpList");
    const leftTitle   = document.getElementById("cpLeftTitle");
    const searchInput = document.getElementById("cpSearch");
    const favOnlyBtn  = document.getElementById("cpFavOnly");

    function open(){ overlay.setAttribute("aria-hidden","false"); render(); }
    function close(){ overlay.setAttribute("aria-hidden","true"); }
    function poolAll(){ return [].concat(DATA.fiat||[], DATA.crypto||[], DATA.commod||[], DATA.stocks||[], DATA.docs||[]); }

    function render(){
        const q = query.trim().toLowerCase();
        let raw;
        if (q) {
            leftTitle.textContent = CP_TAB_TITLES.search;
            favOnlyBtn.style.display = "none";
            raw = poolAll().filter(x => x.name.toLowerCase().includes(q));
        } else if (currentTab === "fav") {
            leftTitle.textContent = CP_TAB_TITLES.fav;
            favOnlyBtn.style.display = "none";
            raw = poolAll().filter(x => favSet.has(x.id));
        } else {
            leftTitle.textContent = CP_TAB_TITLES[currentTab] || "—";
            favOnlyBtn.style.display = "";
            raw = DATA[currentTab] || [];
        }

        const filtered = raw.filter(item => (currentTab === "fav" || q) ? true : (favOnly ? favSet.has(item.id) : true));

        list.innerHTML = filtered.map(it => `
      <div class="cp-item" data-id="${it.id}">
        <div class="cp-title">
          <img class="cp-star" data-star data-id="${it.id}" src="images/icons/StarFilled.svg" alt="★" style="opacity:${favSet.has(it.id)?1:.25}" />
          <div class="cp-name">${it.name}</div>
        </div>
        <div class="cp-market">${it.market||""}</div>
      </div>
    `).join("") || `<div style="padding:24px;color:var(--cp-muted);">Ничего не найдено</div>`;

        list.querySelectorAll("[data-star]").forEach(btn=>{
            btn.addEventListener("click", (e)=>{
                e.stopPropagation();
                const id = btn.dataset.id;
                if (favSet.has(id)) favSet.delete(id); else favSet.add(id);
                localStorage.setItem(favKey, JSON.stringify([...favSet]));
                render();
            });
        });

        list.querySelectorAll(".cp-item").forEach(row=>{
            row.addEventListener("click", ()=>{
                const id = row.dataset.id;
                const item = poolAll().find(x=>x.id===id);
                if (!item) return;
                state.pair = item.name;
                const field = document.getElementById("pairField");
                if (field) field.value = item.name;
                checkReady();
                saveState();
                close();
            });
        });
    }

    document.getElementById("cpTabs").addEventListener("click", (e)=>{
        const tab = e.target.closest(".cp-tab");
        if (!tab) return;
        document.querySelectorAll(".cp-tab").forEach(t=>t.setAttribute("aria-selected","false"));
        tab.setAttribute("aria-selected","true");
        currentTab = tab.dataset.tab;
        render();
    });

    searchInput.addEventListener("input", ()=>{ query = searchInput.value; render(); });
    favOnlyBtn.addEventListener("click", ()=>{ favOnly = !favOnly; favOnlyBtn.setAttribute("aria-pressed", String(favOnly)); render(); });
    overlay.addEventListener("click", (e)=>{ if (e.target === overlay) close(); });

    window.CurrencyPairPopup = { open, close, render };
})();

// =========================
// Expiry Popup
// =========================
(function(){
    const PRESETS = [
        { id:"S5",  label:"S5",  seconds:5 },
        { id:"S15", label:"S15", seconds:15 },
        { id:"S30", label:"S30", seconds:30 },
        { id:"M1",  label:"M1",  seconds:60 },
        { id:"M3",  label:"M3",  seconds:180 },
        { id:"M5",  label:"M5",  seconds:300 },
        { id:"M30", label:"M30", seconds:1800 },
        { id:"H1",  label:"H1",  seconds:3600 },
        { id:"H4",  label:"H4",  seconds:14400 }
    ];

    const overlay = document.getElementById("exPopup");
    const grid    = document.getElementById("exGrid");

    let selectedId = null;

    function open(){
        const field = document.getElementById("timeField");
        const current = (field && field.value) ? field.value : (state.expiry || state.time || null);
        selectedId = current && PRESETS.some(p => p.label === current) ? current : null;

        overlay.setAttribute("aria-hidden","false");
        render();
    }
    function close(){ overlay.setAttribute("aria-hidden","true"); }

    function render(){
        grid.innerHTML = PRESETS.map(p => `
      <button class="ex-chip" data-id="${p.id}" aria-selected="${p.label===selectedId}">
        ${p.label}
      </button>
    `).join("");

        grid.querySelectorAll(".ex-chip").forEach(btn=>{
            btn.addEventListener("click", ()=>{
                const id = btn.dataset.id;
                const item = PRESETS.find(x=>x.id===id);
                if (!item) return;
                selectedId = item.label;
                setExpiryUI(item);
                close();
            });
        });
    }

    function setExpiryUI(item){
        state.time = item.label;
        state.expiry = item.label;
        state.expirySeconds = item.seconds;

        const targets = [
            document.getElementById("timeField"),
            document.getElementById("expiryField"),
            document.querySelector('[data-field="expiry"]'),
            document.querySelector(".js-expiry"),
            document.querySelector('input[name="expiry"]')
        ].filter(Boolean);

        targets.forEach(el => {
            if ("value" in el) el.value = item.label; else el.textContent = item.label;
            try {
                el.dispatchEvent(new Event("input",  { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
            } catch(_) {}
        });

        checkReady();
        saveState();
    }

    overlay.addEventListener("click", (e)=>{ if (e.target === overlay) close(); });

    window.CurrencyExpiryPopup = { open, close };
})();

// ========================
// Model Popup
// ========================
(function(){
    const MODELS = [
        { id: "NE_V1", label: "NeuralEdge V1", disabled: false },
        { id: "NE_V2", label: "NeuralEdge V2", disabled: true, note: "Только для VIP" }
    ];

    const overlay = document.getElementById("mdPopup");
    const grid    = document.getElementById("mdGrid");

    let selectedId = null;

    function open(){
        const field = document.getElementById("modelField");
        const current = (field && field.value) ? field.value : (state.model || null);
        selectedId = current && MODELS.some(m => m.label === current) ? current : null;

        overlay.setAttribute("aria-hidden","false");
        render();
    }
    function close(){ overlay.setAttribute("aria-hidden","true"); }

    function render(){
        grid.innerHTML = MODELS.map(m => `
      <button
        class="md-chip${m.disabled ? " is-disabled" : ""}"
        data-id="${m.id}"
        ${m.disabled ? 'aria-disabled="true" disabled' : ""}
        aria-selected="${m.label===selectedId}">
        <span>${m.label}</span>
        ${m.note ? `<span class="md-badge">${m.note}</span>` : ""}
      </button>
    `).join("");

        grid.querySelectorAll(".md-chip").forEach(btn=>{
            btn.addEventListener("click", ()=>{
                const id = btn.dataset.id;
                const item = MODELS.find(x=>x.id===id);
                if (!item || item.disabled) return;
                selectedId = item.label;
                setModelUI(item);
                close();
            });
        });
    }

    function setModelUI(item){
        state.model = item.label;

        const targets = [
            document.getElementById("modelField"),
            document.getElementById("selectedModel"),
            document.querySelector('[data-field="model"]'),
            document.querySelector(".js-model"),
            document.querySelector('input[name="model"]')
        ].filter(Boolean);

        targets.forEach(el => {
            if ("value" in el) el.value = item.label; else el.textContent = item.label;
            try {
                el.dispatchEvent(new Event("input",  { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
            } catch(_) {}
        });

        checkReady();
        saveState();
    }

    overlay.addEventListener("click", (e)=>{ if (e.target === overlay) close(); });

    window.CurrencyModelPopup = { open, close };
})();

// ===============================================
// Поток сигнала (анализ -> результат)
// ===============================================
(function(){
    const steps = ["A","B","C","D","E"];

    const list   = document.getElementById("sigSteps");
    const bar    = document.getElementById("sigProgress");
    const viewA  = document.getElementById("sigAnalysis");
    const viewR  = document.getElementById("sigResult");

    const q = (id) => document.getElementById(id);

    // Кнопки
    q("getSignalBtn")?.addEventListener("click", start);
    q("sigRepeat")?.addEventListener("click", start);
    q("sigReset")?.addEventListener("click", resetAll);

    function start(){
        const pair  = q("pairField")?.value.trim();
        const time  = q("timeField")?.value.trim();
        const model = q("modelField")?.value.trim();
        if (!pair || !time || !model) return;

        const mSpan = document.getElementById("selectedModel");
        if (mSpan) mSpan.textContent = model;

        const form = document.querySelector(".glass-card");
        if (form) {
            const raise = Math.ceil(form.getBoundingClientRect().height + 16);
            document.body.style.setProperty("--raise", `${raise}px`);
        }

        document.body.classList.add("analysis-open");
        viewR.hidden = true;
        viewA.style.display = "";

        resetSigSteps();
        setSigStepsState(0);

        const totalMs = 3400;
        const perStep = Math.floor(totalMs / steps.length);
        const t0 = performance.now();

        const timer = setInterval(()=>{
            const elapsed = performance.now() - t0;
            const p = Math.min(1, elapsed / totalMs);
            const idx = Math.min(steps.length-1, Math.floor(elapsed / perStep));
            setSigStepsState(idx);

            if (p >= 1){
                clearInterval(timer);
                setSigStepsState(_sigSteps.length);
                if (_sigBar) _sigBar.style.width = "100%";
                showResult(pair, time);
            }
        }, 60);
    }

    function showResult(pair, time){
        // демо-данные
        const dir  = Math.random() < 0.5 ? "DOWN" : "UP";
        const conf = rand(72, 96);
        const acc  = rand(40, 88);

        const strength = (Math.random() < 0.65 ? "High" : "Medium");
        const strengthRu = strength === "High" ? "Сильный" : "Средний";

        const volEn = ["Low","Medium","High"][rand(0,2)];
        const volRu = volEn === "Low" ? "Низкий" : (volEn === "High" ? "Высокий" : "Средний");

        const market = /OTC/i.test(pair) ? "OTC" : "—";

        let valid = "—";
        try{
            const secs = state.expirySeconds;
            if (secs) {
                const d = new Date(Date.now() + secs*1000);
                valid = d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
            }
        }catch(_){}

        // направление + иконка
        const dirEl = document.getElementById("sigDirection");
        const isBuy = dir === "UP";
        if (dirEl) {
            dirEl.textContent = isBuy ? "ПОКУПКА" : "ПРОДАЖА";
            dirEl.classList.toggle("buy",  isBuy);
            dirEl.classList.toggle("sell", !isBuy);
        }
        const iconBox = document.getElementById("sigDirIcon");
        if (iconBox) iconBox.innerHTML = isBuy ? BUY_SVG : SELL_SVG;

        // значения
        document.getElementById("sigMarket").textContent   = market;
        document.getElementById("sigConf").textContent     = conf + "%";
        document.getElementById("sigTime").textContent     = time;
        document.getElementById("sigStrength").textContent = strengthRu;
        document.getElementById("sigPair").textContent     = pair;
        document.getElementById("sigValid").textContent    = valid;
        document.getElementById("sigAcc").textContent      = acc + "%";
        document.getElementById("sigVol").textContent      = volRu;

        // показать экран результата
        document.getElementById("sigAnalysis").style.display = "none";
        document.getElementById("sigResult").hidden = false;

        // сохранить результат для восстановления
        saveResult({
            isBuy,
            pair,
            conf: conf + "%",
            acc:  acc  + "%",
            market,
            strRu: strengthRu,
            volRu,
            time,
            valid
        });
    }

    function resetAll(){
        document.body.classList.remove("analysis-open");
        document.body.style.removeProperty("--raise");

        if (viewA) viewA.style.display = "";
        if (viewR) viewR.hidden = true;

        resetSigSteps();

        const clear = id => { const el = q(id); if (el) el.value=""; };
        clear("pairField"); clear("timeField"); clear("modelField");

        state.pair = null;
        state.time = null;
        state.expiry = null;
        state.expirySeconds = null;
        state.model = null;

        try { localStorage.removeItem(STATE_KEY); } catch(_) {}
        try { localStorage.removeItem(RESULT_KEY); } catch(_) {}

        const iconBox = document.getElementById("sigDirIcon");
        if (iconBox) iconBox.innerHTML = "";

        checkReady();
    }

    function rand(a,b){ return Math.floor(a + Math.random()*(b-a+1)); }
})();

// ===============================================
// Шаги анализа — классы и прогресс
// ===============================================
const _sigSteps = Array.from(document.querySelectorAll("#sigSteps .sig-step"));
const _sigBar   = document.getElementById("sigProgress");

function setSigStepsState(currentIndex){
    _sigSteps.forEach((el, i)=>{
        el.classList.remove("is-done","is-active","is-next");
        if(i < currentIndex){ el.classList.add("is-done"); }
        else if(i === currentIndex){ el.classList.add("is-active"); }
        else { el.classList.add("is-next"); }
    });
    if(_sigBar){
        const ratio = Math.min(1, currentIndex / _sigSteps.length);
        const jitter = Math.random()*1.2;
        _sigBar.style.width = Math.min(100, ratio*100 + jitter) + "%";
    }
}

function resetSigSteps(){
    _sigSteps.forEach(el=>el.classList.remove("is-done","is-active","is-next"));
    if(_sigSteps.length){ _sigSteps[0].classList.add("is-active"); }
    if(_sigBar){ _sigBar.style.width = "0%"; }
}

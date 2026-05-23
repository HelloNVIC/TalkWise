const API_BASE = "/api";

const QUOTES = {
    translate: [
        "老板说看着办 = 你别办",
        "我说的是心里话，但嘴上得说场面话",
        "职场第一法则：话里有话才是正常的话",
        "高情商就是把「滚」说成「您先忙」",
        "每个打工人都是兼职翻译官",
        "会说的人，把不行说成有待优化",
        "情商高的人，骂你都像在夸你",
        "职场翻译三原则：不直说、不全说、反着说",
        "「我这个人说话直」= 我准备说难听的了",
        "真正的职场高手，拒绝你都让你觉得被夸了",
        "话到嘴边留三分，剩下七分用邮件发",
        "打工人三大技能：翻译、润色、假装听懂",
        "会说话的人，把「没戏」说成「有挑战」",
        "职场语言艺术的精髓：说了等于没说，没说等于说了",
        "你以为是夸你，其实是在点你",
        "同样一句话，换种说法工资就能涨",
        "直说叫得罪人，绕着说叫情商高",
        "会说话的人，甩锅都像在赋能",
        "职场上，说得对不如说得好",
        "「建议你考虑一下」= 你最好别考虑",
        "把「我不想」翻译成「我建议」就是职场成长",
        "最高的境界是：骂他他还谢谢你",
        "话不是不说，是要换个姿势说",
        "真诚是必杀技，但场面话是保命技",
        "「你觉得呢」= 你最好同意我",
        "职场生存第一课：学会把废话翻译成黑话",
        "委婉不是虚伪，是给别人也是给自己留退路",
        "说「好」不一定是好，说「行」不一定真行",
        "会说话的人，把「我不知道」说成「我去了解一下」",
        "翻译的艺术：让真相穿一件漂亮的外衣",
    ],
    decode: [
        "领导说「原则上不行」= 可以",
        "领导说「原则上可以」= 不行",
        "说「你看着办」是最难办的",
        "夸你「有潜力」意味着你现在不行",
        "「我再考虑考虑」= 不行，但我不想直说",
        "「这个事不急」= 别给我忘了",
        "「你很有想法」= 但别按你说的来",
        "「回头再说」= 再也不说",
        "「你看着办吧」= 办砸了你负责",
        "「不是你的问题」= 就是你有问题",
        "「大家随意」= 谁随意谁社死",
        "「我跟你说句实话」= 前面都是场面话",
        "「年轻人要多锻炼」= 活都给你干",
        "「这个项目很重要」= 加班吧",
        "「我这个人不爱记仇」= 我都记着呢",
        "「你最近忙不忙」= 我有事找你",
        "「我们是一个团队」= 锅大家一起背",
        "「你说了算」= 你最好按我说的算",
        "「这件事你知道就行」= 别跟任何人说",
        "「你的意见很重要」= 但我不会采纳",
        "「我们改天再聊」= 今天就到这吧",
        "「这不是批评」= 这就是批评",
        "「你先做做看」= 做不好就换人",
        "「公司不会亏待你」= 暂时不会涨薪",
        "「你在团队里很关键」= 你走不了",
        "「这件事我来协调」= 你别插手了",
        "「我们不提倡加班」= 但也不禁止自愿加班",
        "「你可以信任我」= 你最好留一手",
        "「简单说两句」= 准备听半小时",
        "「你自己体会」= 我不能明说",
    ],
};

const EXAMPLES = {
    translate: ["这需求太离谱了", "工资太低了", "不想加班", "这锅我不背"],
    decode: ["你看着办吧", "这个事情你再想想", "原则上是可以的", "我这个人不爱记仇"],
};

// Track auto-explain progress per tab
const explainProgress = {
    translate: { pending: new Set(), done: false },
    decode: { pending: new Set(), done: false },
};

const state = {
    activeTab: "translate",
    selectedStyle: "委婉",
    styles: [],
    translateOriginal: "",
    decodeOriginal: "",
    translateStyle: "",
    _gotItTab: "translate",
    _quoteTimers: {},
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
    try {
        const res = await fetch(`${API_BASE}/styles`);
        state.styles = await res.json();
        renderStyleChips();
    } catch {
        state.styles = [
            { key: "委婉", name: "委婉得体", description: "温婉含蓄，给足面子" },
            { key: "正式", name: "正式规范", description: "公文风格，严谨专业" },
            { key: "简洁", name: "简洁精炼", description: "言简意赅，一针见血" },
            { key: "幽默", name: "幽默风趣", description: "诙谐有趣，化解尴尬" },
            { key: "IT行业", name: "IT黑话", description: "互联网术语，对齐颗粒度" },
        ];
        renderStyleChips();
    }

    bindTabEvents();
    bindSubmitEvents();
    bindCopyEvents();
    bindAutoResize();
    renderQuote("translate");
    renderExamples("translate");
    renderQuote("decode");
    renderExamples("decode");
}

function renderStyleChips() {
    const container = document.getElementById("style-chips");
    container.innerHTML = "";
    state.styles.forEach((s) => {
        const chip = document.createElement("button");
        chip.className = "style-chip" + (s.key === state.selectedStyle ? " selected" : "");
        chip.textContent = s.name;
        chip.title = s.description;
        chip.dataset.key = s.key;
        chip.addEventListener("click", () => selectStyle(s.key));
        container.appendChild(chip);
    });
}

function selectStyle(key) {
    state.selectedStyle = key;
    document.querySelectorAll(".style-chip").forEach((c) => {
        c.classList.toggle("selected", c.dataset.key === key);
    });
}

function bindTabEvents() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
}

function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll(".tab-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.tab === tab);
    });
    document.querySelectorAll(".tab-content").forEach((s) => {
        s.classList.toggle("active", s.id === tab);
    });
    renderQuote(tab);
}

function renderQuote(tab) {
    const el = document.getElementById(`quote-${tab}`);
    const quotes = QUOTES[tab];
    el.style.animation = "none";
    el.offsetHeight;
    el.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    el.style.animation = "";
    clearInterval(state._quoteTimers[tab]);
    state._quoteTimers[tab] = setInterval(() => renderQuote(tab), 10000);
}

function renderExamples(tab) {
    const container = document.getElementById(`examples-${tab}`);
    container.innerHTML = "";
    EXAMPLES[tab].forEach((text) => {
        const card = document.createElement("div");
        card.className = "example-card";
        card.textContent = text;
        card.addEventListener("click", () => {
            const ta = document.getElementById(`${tab}-input`);
            ta.value = text;
            autoResize(ta);
            ta.focus();
        });
        container.appendChild(card);
    });
}

function bindSubmitEvents() {
    document.getElementById("translate-btn").addEventListener("click", handleTranslate);
    document.getElementById("decode-btn").addEventListener("click", handleDecode);
    document.getElementById("translate-back").addEventListener("click", () => showInputArea("translate"));
    document.getElementById("decode-back").addEventListener("click", () => showInputArea("decode"));
    document.getElementById("got-it-translate").addEventListener("click", () => handleGotIt("translate"));
    document.getElementById("got-it-decode").addEventListener("click", () => handleGotIt("decode"));
    document.getElementById("modal-nope").addEventListener("click", closeModal);
    document.getElementById("modal-win").addEventListener("click", () => {
        closeModal();
        showInputArea(state._gotItTab);
    });
}

function bindAutoResize() {
    document.querySelectorAll("textarea").forEach((ta) => {
        ta.addEventListener("input", () => autoResize(ta));
        autoResize(ta);
    });
}

function autoResize(ta) {
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
}

function bindCopyEvents() {
    document.getElementById("copy-translate").addEventListener("click", () => {
        const el = document.getElementById("translate-translated");
        copyToClipboard(el.textContent);
    });
    document.getElementById("copy-decode").addEventListener("click", () => {
        const el = document.getElementById("decode-decoded");
        copyToClipboard(el.textContent);
    });
}

function hideInputArea(tab) {
    document.getElementById(`${tab}-input-area`).classList.add("hidden");
    document.getElementById(`${tab}-back`).style.display = "flex";
    document.getElementById(`${tab}-result`).style.display = "none";
    document.getElementById(`${tab}-error`).style.display = "none";
    const tip = document.getElementById(`tip-banner-${tab}`);
    if (tip) tip.remove();
}

function showInputArea(tab) {
    document.getElementById(`${tab}-input-area`).classList.remove("hidden");
    document.getElementById(`${tab}-back`).style.display = "none";
    document.getElementById(`${tab}-result`).style.display = "none";
    document.getElementById(`${tab}-error`).style.display = "none";
    const tip = document.getElementById(`tip-banner-${tab}`);
    if (tip) tip.remove();
    const ta = document.getElementById(`${tab}-input`);
    ta.value = "";
    autoResize(ta);
}

/**
 * SSE streaming helper — reads SSE events from a POST request.
 */
async function* readSSE(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "请求失败");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            if (line.startsWith("data: ")) {
                try {
                    yield JSON.parse(line.slice(6));
                } catch {
                    // skip malformed lines
                }
            }
        }
    }
}

async function handleTranslate() {
    const input = document.getElementById("translate-input").value.trim();
    if (!input) {
        showError("translate", "请输入你的真心话");
        return;
    }

    hideInputArea("translate");
    setLoading("translate-btn", true, "翻译中...");
    hideError("translate");
    prepareResultCard("translate");

    const originalEl = document.getElementById("translate-original");
    const translatedEl = document.getElementById("translate-translated");
    const thinkingBar = document.getElementById("translate-thinking-bar");
    const thinkingEl = document.getElementById("translate-thinking");

    originalEl.textContent = input;
    translatedEl.innerHTML = "";
    thinkingBar.style.display = "block";
    thinkingBar.classList.remove("done");
    thinkingEl.textContent = "等待模型响应...";

    let fullContent = "";
    let fullThinking = "";
    let hasThinking = false;

    try {
        for await (const event of readSSE(`${API_BASE}/translate`, {
            text: input,
            style: state.selectedStyle,
        })) {
            if (event.type === "error") {
                showError("translate", event.message);
                break;
            }

            if (event.type === "meta") {
                state.translateOriginal = event.original;
                state.translateStyle = event.style;
                continue;
            }

            if (event.type === "thinking") {
                hasThinking = true;
                fullThinking += event.content;
                thinkingBar.style.display = "block";
                thinkingEl.textContent = fullThinking;
                thinkingEl.scrollTop = thinkingEl.scrollHeight;
                continue;
            }

            if (event.type === "content") {
                // Hide thinking bar as soon as content starts arriving
                if (!fullContent) {
                    thinkingBar.classList.add("done");
                }
                fullContent += event.content;
                translatedEl.textContent = fullContent;
                translatedEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
                continue;
            }

            if (event.type === "done") {
                break;
            }
        }
    } catch (e) {
        showError("translate", e.message);
    } finally {
        setLoading("translate-btn", false, "翻译一下");
    }

    // If no content was produced (only thinking), still hide the thinking bar
    if (!fullContent) {
        thinkingBar.classList.add("done");
    }

    // After translation completes, render as clickable sentences
    // and auto-explain each sentence
    if (fullContent) {
        renderSentences(translatedEl, fullContent, "translate");
        autoExplainSentences("translate", fullContent);
        showTipBanner("translate");
        document.getElementById("translate-result").querySelector(".result-actions").style.display = "flex";
    }
}

async function handleDecode() {
    const input = document.getElementById("decode-input").value.trim();
    if (!input) {
        showError("decode", "请输入老板说的话");
        return;
    }

    hideInputArea("decode");
    setLoading("decode-btn", true, "解码中...");
    hideError("decode");
    prepareResultCard("decode");

    const originalEl = document.getElementById("decode-original");
    const decodedEl = document.getElementById("decode-decoded");
    const thinkingBar = document.getElementById("decode-thinking-bar");
    const thinkingEl = document.getElementById("decode-thinking");

    originalEl.textContent = input;
    decodedEl.innerHTML = "";
    thinkingBar.style.display = "block";
    thinkingBar.classList.remove("done");
    thinkingEl.textContent = "等待模型响应...";

    let fullContent = "";
    let fullThinking = "";
    let hasThinking = false;

    try {
        for await (const event of readSSE(`${API_BASE}/decode`, {
            text: input,
        })) {
            if (event.type === "error") {
                showError("decode", event.message);
                break;
            }

            if (event.type === "meta") {
                state.decodeOriginal = event.original;
                continue;
            }

            if (event.type === "thinking") {
                hasThinking = true;
                fullThinking += event.content;
                thinkingBar.style.display = "block";
                thinkingEl.textContent = fullThinking;
                thinkingEl.scrollTop = thinkingEl.scrollHeight;
                continue;
            }

            if (event.type === "content") {
                if (!fullContent) {
                    thinkingBar.classList.add("done");
                }
                fullContent += event.content;
                decodedEl.textContent = fullContent;
                decodedEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
                continue;
            }

            if (event.type === "done") {
                break;
            }
        }
    } catch (e) {
        showError("decode", e.message);
    } finally {
        setLoading("decode-btn", false, "解码");
    }

    if (!fullContent) {
        thinkingBar.classList.add("done");
    }

    if (fullContent) {
        renderSentences(decodedEl, fullContent, "decode");
        autoExplainSentences("decode", fullContent);
        showTipBanner("decode");
        document.getElementById("decode-result").querySelector(".result-actions").style.display = "flex";
    }
}

function prepareResultCard(tab) {
    const card = document.getElementById(`${tab}-result`);
    card.style.display = "block";
    card.querySelector(".result-actions").style.display = "none";
    card.style.animation = "none";
    card.offsetHeight;
    card.style.animation = "";
}

/**
 * Split text into sentences and render as clickable spans with explain panels.
 */
function renderSentences(container, text, tab) {
    container.innerHTML = "";
    const sentences = text.split(/(?<=[。！？；\n])/g).filter((s) => s.trim());

    sentences.forEach((sentence, idx) => {
        const span = document.createElement("span");
        span.className = "sentence";
        span.textContent = sentence.trim();
        span.dataset.tab = tab;
        span.dataset.index = idx;
        span.addEventListener("click", () => toggleExplain(span, idx, tab));

        container.appendChild(span);

        const explainDiv = document.createElement("div");
        explainDiv.className = "sentence-explain";
        explainDiv.id = `explain-${tab}-${idx}`;
        container.appendChild(explainDiv);
    });
}

/**
 * Toggle explain panel on click (manual).
 * If auto-explain is still loading this sentence, show "正在分析" hint.
 */
async function toggleExplain(span, idx, tab) {
    const explainDiv = document.getElementById(`explain-${tab}-${idx}`);

    if (explainDiv.classList.contains("visible")) {
        explainDiv.classList.remove("visible");
        span.classList.remove("active");
        return;
    }

    // Close others
    const container = span.parentElement;
    container.querySelectorAll(".sentence.active").forEach((s) => s.classList.remove("active"));
    container.querySelectorAll(".sentence-explain.visible").forEach((d) => d.classList.remove("visible"));

    span.classList.add("active");
    explainDiv.classList.add("visible");

    // Already loaded
    if (explainDiv.dataset.loaded) return;

    // Auto-explain is still working on this sentence
    if (explainProgress[tab].pending.has(idx) && !explainDiv.dataset.loaded) {
        explainDiv.innerHTML = '<span class="explain-spinner"></span>请稍后，正在分析...';
        return;
    }

    // Not started yet (user clicked before auto-explain kicked in), load manually
    await loadExplain(span, idx, tab);
}

/**
 * Load explanation for a sentence via SSE streaming.
 */
async function loadExplain(span, idx, tab) {
    const explainDiv = document.getElementById(`explain-${tab}-${idx}`);
    const original = tab === "translate" ? state.translateOriginal : state.decodeOriginal;
    const style = tab === "translate" ? state.translateStyle : "";
    const sentence = span.textContent;

    explainDiv.innerHTML = '<span class="explain-spinner"></span>正在分析...';

    let fullText = "";

    try {
        for await (const event of readSSE(`${API_BASE}/explain`, {
            original,
            translated: sentence,
            style,
        })) {
            if (event.type === "error") {
                explainDiv.innerHTML = `<div style="color:#dc2626">${event.message}</div>`;
                return;
            }
            if (event.type === "content") {
                fullText += event.content;
                explainDiv.innerHTML = `<div class="explain-label">为什么这样翻译</div>${fullText}`;
            }
            if (event.type === "done") break;
        }
        explainDiv.dataset.loaded = "true";
    } catch (e) {
        explainDiv.innerHTML = `<div style="color:#dc2626">${e.message}</div>`;
    }
}

/**
 * After translation completes, auto-explain all sentences in background.
 * Tracks progress so user clicks on pending sentences show "请稍后" hint.
 */
function autoExplainSentences(tab, fullContent) {
    const sentences = fullContent.split(/(?<=[。！？；\n])/g).filter((s) => s.trim());
    if (sentences.length === 0) return;

    // Reset progress
    explainProgress[tab] = { pending: new Set(), done: false };
    sentences.forEach((_, idx) => explainProgress[tab].pending.add(idx));

    // Add loading indicator
    const card = document.getElementById(`${tab}-result`);
    let loadingEl = document.getElementById(`auto-explain-loading-${tab}`);
    if (!loadingEl) {
        loadingEl = document.createElement("div");
        loadingEl.className = "explain-loading";
        loadingEl.id = `auto-explain-loading-${tab}`;
        card.appendChild(loadingEl);
    }
    loadingEl.innerHTML = '<span class="explain-spinner"></span>正在分析缘由...';

    const original = tab === "translate" ? state.translateOriginal : state.decodeOriginal;
    const style = tab === "translate" ? state.translateStyle : "";

    (async () => {
        for (let idx = 0; idx < sentences.length; idx++) {
            const explainDiv = document.getElementById(`explain-${tab}-${idx}`);
            if (!explainDiv) {
                explainProgress[tab].pending.delete(idx);
                continue;
            }

            let fullText = "";
            try {
                for await (const event of readSSE(`${API_BASE}/explain`, {
                    original,
                    translated: sentences[idx].trim(),
                    style,
                })) {
                    if (event.type === "error") break;
                    if (event.type === "content") {
                        fullText += event.content;
                        explainDiv.innerHTML = `<div class="explain-label">为什么这样翻译</div>${fullText}`;
                        explainDiv.dataset.loaded = "true";
                    }
                    if (event.type === "done") break;
                }
            } catch {
                // silently skip
            }

            explainProgress[tab].pending.delete(idx);
        }

        explainProgress[tab].done = true;
        const indicator = document.getElementById(`auto-explain-loading-${tab}`);
        if (indicator) indicator.remove();
    })();
}

/**
 * Show tip banner after translation, unless user opted out.
 */
function showTipBanner(tab) {
    if (!document.getElementById(`${tab}-result`)) return;

    const existing = document.getElementById(`tip-banner-${tab}`);
    if (existing) existing.remove();

    const card = document.getElementById(`${tab}-result`);

    const banner = document.createElement("div");
    banner.className = "tip-banner";
    banner.id = `tip-banner-${tab}`;
    banner.innerHTML = `
        <div class="tip-icon">?</div>
        <div class="tip-text">点击译文中的句子，查看为什么这样翻译</div>
    `;

    card.appendChild(banner);
}

function setLoading(btnId, isLoading, text) {
    const btn = document.getElementById(btnId);
    btn.disabled = isLoading;
    btn.innerHTML = isLoading ? `<span class="spinner"></span>${text}` : text;
    btn.classList.toggle("loading", isLoading);
}

function showError(tab, message) {
    const el = document.getElementById(`${tab}-error`);
    el.textContent = message;
    el.style.display = "block";
}

function hideError(tab) {
    document.getElementById(`${tab}-error`).style.display = "none";
}

function handleGotIt(tab) {
    state._gotItTab = tab;
    const el = document.getElementById(tab === "translate" ? "translate-translated" : "decode-decoded");
    copyToClipboard(el.textContent);
    document.getElementById("got-it-modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("got-it-modal").style.display = "none";
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("已复制到剪贴板");
    }).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("已复制到剪贴板");
    });
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.display = "block";
    toast.style.animation = "none";
    toast.offsetHeight;
    toast.style.animation = "";
    setTimeout(() => {
        toast.style.display = "none";
    }, 1500);
}

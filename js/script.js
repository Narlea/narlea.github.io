
document.addEventListener("DOMContentLoaded", function () {
const postList = document.getElementById("post-list");
// 获取所有的文章卡片（排除系统欢迎词，如果你想让欢迎词永远在第一位）
const cards = Array.from(postList.querySelectorAll(".post-card"));

// 执行排序逻辑
cards.sort((a, b) => {
    // 提取日期字符串，例如 "2026.03.12"
    const dateA = a
    .querySelector(".post-meta")
    .innerText.match(/\d{4}\.\d{2}\.\d{2}/)[0];
    const dateB = b
    .querySelector(".post-meta")
    .innerText.match(/\d{4}\.\d{2}\.\d{2}/)[0];

    // 转换为时间戳进行比较 (降序：新的在前)
    return (
    new Date(dateB.replace(/\./g, "/")) -
    new Date(dateA.replace(/\./g, "/"))
    );
});

// 清空旧列表（保留系统消息 system-msg，如果你想让欢迎词雷打不动）
const systemMsg = postList.querySelector(".system-msg");
postList.innerHTML = "";
if (systemMsg) postList.appendChild(systemMsg);

// 将排序后的卡片重新插入
cards.forEach((card) => postList.appendChild(card));
});
// 统一图标路径
// --- [1. 全局配置与状态] ---
let audioCtx, analyser, dataArray, source;
const ICON_PLAY = "M8 5v14l11-7z";
const ICON_PAUSE = "M6 19h4V5H6v14zm8-14v14h4V5h-4z";

// --- [2. 核心功能函数] ---
// 这些必须放在外面，HTML 里的按钮才能点得动

window.adjustVolume = function (val) {
const player = document.getElementById("cyber-player");
if (player) {
    player.volume = val;
    player.muted = val == 0;
}
const vBtn = document.getElementById("volume-btn");
if (vBtn) vBtn.style.opacity = val == 0 ? "0.3" : "0.7";
};

window.toggleMute = function () {
const player = document.getElementById("cyber-player");
const slider = document.getElementById("volume-slider");
if (!player) return;
player.muted = !player.muted;
if (slider) slider.value = player.muted ? 0 : player.volume;
const vBtn = document.getElementById("volume-btn");
if (vBtn) vBtn.style.opacity = player.muted ? "0.3" : "0.7";
};

window.seek = function (e) {
const player = document.getElementById("cyber-player");
if (!player) return;
const container = e.currentTarget;
const rect = container.getBoundingClientRect();
const pos = (e.clientX - rect.left) / rect.width;
if (player.duration) {
    player.currentTime = pos * player.duration;
}
};

// --- [3. 可视化渲染引擎] ---

function initVisualizer() {
const player = document.getElementById("cyber-player");
if (!audioCtx && player) {
    try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(player);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 64;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    renderVisuals();
    } catch (e) {
    console.error("Visualizer error:", e);
    }
}
}

function renderVisuals() {
requestAnimationFrame(renderVisuals);
if (!analyser) return;

const canvas = document.getElementById("visualizer-canvas");
const ctx = canvas.getContext("2d");

if (canvas.width !== window.innerWidth) {
    canvas.width = window.innerWidth;
    canvas.height = 200;
}

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
analyser.getByteFrequencyData(dataArray);

ctx.clearRect(0, 0, canvas.width, canvas.height);

// --- 调整：让矩形更大、更清晰 ---
const segmentHeight = 8; // 增加矩形高度 (从5到8)
const segmentGap = 2; // 增加垂直间距 (从1.5到2)
const barWidth = 15; // 显著增加柱子宽度 (从8到15)
const barGap = 5; // 增加柱子间距 (从3到5)

const totalBars = Math.floor(canvas.width / (barWidth + barGap));

for (let i = 0; i < totalBars; i++) {
    // 对称索引映射
    let index;
    if (i < totalBars / 2) {
    index = Math.floor(i * (bufferLength / totalBars));
    } else {
    index = Math.floor((totalBars - i) * (bufferLength / totalBars));
    }

    // --- 核心改进：解决全满问题 ---
    // 1. 使用 Math.pow 降低灵敏度，让低能量和高能量拉开差距
    let rawData = dataArray[index] / 255; // 归一化到 0-1
    let compressedData = Math.pow(rawData, 1.5); // 指数压缩，防止容易全满

    // 2. 计算高度，增加中间权重
    const distanceFromCenter = Math.abs(i - totalBars / 2);
    const centerBoost = 1.4 - distanceFromCenter / (totalBars / 2);
    const barHeight = compressedData * canvas.height * 1.2 * centerBoost;

    const numSegments = Math.floor(
    barHeight / (segmentHeight + segmentGap),
    );
    const x = i * (barWidth + barGap);

    for (let j = 0; j < numSegments; j++) {
    // 越往上颜色越亮
    const opacity = j / 20 + 0.3; // 20个左右的矩形就足够了
    ctx.fillStyle = `rgba(0, 242, 255, ${Math.min(opacity, 0.8)})`;

    const y = canvas.height - j * (segmentHeight + segmentGap);

    // 绘制圆角矩形（可选，增加科技感）或标准矩形
    ctx.fillRect(x, y, barWidth, -segmentHeight);
    }
}
}

// --- [4. 播放控制逻辑] ---

window.togglePlay = function () {
const player = document.getElementById("cyber-player");
const path = document.getElementById("play-icon-path");
if (!player) return;

if (
    !player.src ||
    player.src === window.location.href ||
    player.src === ""
) {
    window.playTrack("ClearText.mp3", "CLEAR_TEXT");
    return;
}

if (player.paused) {
    player.play().then(() => {
    if (path) path.setAttribute("d", ICON_PAUSE);
    });
} else {
    player.pause();
    if (path) path.setAttribute("d", ICON_PLAY);
}
};

window.playTrack = function (fileName, trackTitle) {
const player = document.getElementById("cyber-player");
const path = document.getElementById("play-icon-path");
const trackDisplay = document.getElementById("current-track-name");
if (!player) return;

// 1. 必须在设置 src 前开启跨域，否则分析器拿不到数据
player.crossOrigin = "anonymous";

// 2. 初始化可视化（如果还没初始化）
initVisualizer();
if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();

// 3. 构建 URL
const cdnUrl = `https://cdn.jsdelivr.net/gh/Narlea/narlea.github.io@main/music/${encodeURIComponent(fileName)}`;

// 4. 先更新 UI 状态，给用户反馈
if (trackDisplay)
    trackDisplay.innerText = `> LOADING: ${trackTitle}...`;

// 5. 切换音频源并重置播放器状态
player.src = cdnUrl;
player.load(); // 显式调用 load() 确保新源被识别

// 6. 执行播放
player
    .play()
    .then(() => {
    // 只有真正播出来了，才更新为 PLAYING 状态
    if (trackDisplay)
        trackDisplay.innerText = `> PLAYING: ${trackTitle}`;
    if (path) path.setAttribute("d", ICON_PAUSE);
    })
    .catch((e) => {
    // 捕获特定错误：如果是还没加载完，不要直接跳 ERR，给它一点重试机会
    if (
        e.name === "NotSupportedError" ||
        e.name === "NotAllowedError"
    ) {
        console.warn("Autoplay blocked or format not supported");
    } else {
        if (trackDisplay) trackDisplay.innerText = `> ERR: LOAD_FAILED`;
    }
    });
};

// --- [5. 进度条自动更新] ---
document.addEventListener("DOMContentLoaded", () => {
const player = document.getElementById("cyber-player");
if (player) {
    player.ontimeupdate = function () {
    const progress = document.getElementById("play-progress");
    if (progress && this.duration) {
        const percent = (this.currentTime / this.duration) * 100;
        progress.style.width = percent + "%";
    }
    };
}
});

// 升级版函数：增加了一个 iconType 参数
const createCard = (url, label, title, iconType = "github") => {
// 预设几种常用的图标路径
const icons = {
    github: `<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>`,
    nvidia: `<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6c-3.314 0-6 2.686-6 6 0 2.21 1.194 4.143 2.964 5.196l-.764 1.324A7.53 7.53 0 0 1 4.5 12c0-4.142 3.358-7.5 7.5-7.5 2.112 0 4.026.87 5.4 2.274l-1.414 1.414A5.965 5.965 0 0 0 12 6z"/><circle cx="12" cy="12" r="2"/>`,
    youtube: `<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>`,
    csdn: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M8.5 14.5c1.1 1.1 2.9 1.1 4 0l1.4 1.4c-1.9 1.9-4.9 1.9-6.8 0-1.9-1.9-1.9-4.9 0-6.8 1.9-1.9 4.9-1.9 6.8 0l-1.4 1.4c-1.1-1.1-2.9-1.1-4 0-1.1 1.1-1.1 2.9 0 4z"/>`,
    link: `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>`,
    bilibili: `<path d="M17.813 4.653h-.854l1.547-1.567a.74.74 0 1 0-1.046-1.047L14.74 4.803H9.26L6.54 2.039a.74.74 0 0 0-1.046 1.047l1.547 1.567h-.854C4.803 4.653 3.66 5.795 3.66 7.204v7.592c0 1.409 1.143 2.55 2.551 2.55h11.578c1.408 0 2.551-1.141 2.551-2.55V7.204c0-1.409-1.143-2.55-2.551-2.55zM9.277 13.541a1.102 1.102 0 0 1-1.102-1.102v-1.055a1.102 1.102 0 0 1 2.204 0v1.055a1.102 1.102 0 0 1-1.102 1.102zm5.446 0a1.102 1.102 0 0 1-1.102-1.102v-1.055a1.102 1.102 0 0 1 2.204 0v1.055a1.102 1.102 0 0 1-1.102 1.102zM15.303 19.346H8.697a.75.75 0 1 0 0 1.5h6.606a.75.75 0 1 0 0-1.5z"></path>`,
    baiduyun: `<path d="M17.3 9.61c-.36-2.76-2.72-4.88-5.57-4.88-2.27 0-4.23 1.33-5.15 3.27-.32-.08-.66-.12-1-.12-2.34 0-4.23 1.9-4.23 4.23 0 2.34 1.9 4.23 4.23 4.23h11.72c2.01 0 3.63-1.63 3.63-3.63.01-1.76-1.24-3.22-2.9-3.57zM9.83 11.72c0 .9-.73 1.63-1.63 1.63s-1.63-.73-1.63-1.63c0-.9.73-1.63 1.63-1.63s1.63.73 1.63 1.63zm4.21 0c0 .9-.73 1.63-1.63 1.63s-1.63-.73-1.63-1.63c0-.9.73-1.63 1.63-1.63s1.63.73 1.63 1.63z"></path>`,
};

return `
    <a href="${url}" target="_blank" class="cyber-link-card">
        <div class="card-inner">
            <div class="link-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${icons[iconType] || icons.link} </svg>
            </div>
            <div class="link-text">
                <span class="label">${label}</span>
                <span class="title">${title}</span>
                <span class="status"><span class="pulse-dot"></span> CONNECTION_LIVE</span>
            </div>
            <div class="link-arrow"><div class="arrow-line"></div></div>
        </div>
    </a>`;
};

// --- 分类筛选逻辑 ---
let currentCategory = null;

function filterPosts(category, element) {
const postCards = document.querySelectorAll(".post-card");
const tags = document.querySelectorAll(".filter-tag");

// 切换逻辑：点击已选中的则取消筛选
if (currentCategory === category) {
    currentCategory = null;
    element.classList.remove("active");
    postCards.forEach((card) => (card.style.display = "block"));
} else {
    currentCategory = category;
    // 更新 UI 样式
    tags.forEach((tag) => tag.classList.remove("active"));
    element.classList.add("active");

    // 执行过滤
    postCards.forEach((card) => {
    if (card.getAttribute("data-category") === category) {
        card.style.display = "block";
    } else {
        card.style.display = "none";
    }
    });
}
// 筛选后更新档案计数
updateStats();
}

// --- 统计数据同步逻辑 ---
function updateStats(isClick = false) {
// 1. 档案数：只统计当前显示的、带 data-category 的卡片
const visibleCards = Array.from(
    document.querySelectorAll(".post-card"),
).filter((el) => el.style.display !== "none");
document.getElementById("stat-post-count").innerText =
    `${visibleCards.length} 档案`;

// 2. 访问数：持久化存储
let visits = localStorage.getItem("narlea_terminal_visits");
if (!visits) {
    // 初始值计算：2026-03-09 至今的天数 * 12
    const startDate = new Date("2026-03-09");
    const diffDays = Math.max(
    0,
    Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24)),
    );
    visits = 0 + diffDays * 12;
}

if (isClick) {
    visits = parseInt(visits) + 1;
}

localStorage.setItem("narlea_terminal_visits", visits);
document.getElementById("stat-visit-count").innerText =
    `${visits} 访问`;
}

// --- 特效控制逻辑 ---
window.onload = () => {
updateStats(); // 初始化统计数据

const bootGate = document.getElementById("boot-gate");
const mainContainer = document.getElementById("main-container");
const traces = document.querySelectorAll(".pcb-trace");
const pads = document.querySelectorAll(".pcb-pad");

// 1. 开始金丝线路充能
traces.forEach((trace) => trace.classList.add("charging"));

// 2. 金色焊盘变亮激活
pads.forEach((pad) => {
    const delay = parseFloat(pad.style.transitionDelay);
    setTimeout(
    () => pad.classList.add("active"),
    delay * 1000 + 200 + Math.random() * 200,
    );
});

// 3. 充能完成后开启闸门
const chargingTime = 4000;
setTimeout(() => {
    bootGate.classList.add("opened");
    mainContainer.classList.add("loaded");
    setTimeout(() => {
    bootGate.style.display = "none";
    }, 2200);
}, chargingTime);
};

// --- 详情页映射 ---
const articles = {
CUDA的核心概念: "articles/ai_infra1.html",
Personal_Blog: "articles/web_frontend1.html",
"OPENCLAW_2026.3.2的两项bug": "articles/openclaw1.html",
SVG图标: "articles/web_frontend2.html",
LATEX基础教程: "articles/latex1.html",
在本地部署Qwen模型: "articles/llm1.html",
"2025数模国赛C题": "articles/data_analysis1.html",
};

function typeWriter(text, element, speed = 50) {
let i = 0;
element.innerHTML = "> ";
function type() {
    if (i < text.length) {
    element.innerHTML += text.charAt(i);
    i++;
    setTimeout(type, speed);
    }
}
type();
}

async function showDetail(title) {
updateStats(true);
document.getElementById("post-list").style.display = "none";
document.getElementById("post-detail").style.display = "block";

const titleEl = document.getElementById("detail-title");
typeWriter(title, titleEl, 70);

const bodyEl = document.getElementById("detail-body");
const filePath = articles[title];

bodyEl.style.transition = "none";
bodyEl.style.opacity = "0";
bodyEl.innerHTML = "<p>LOADING_SYSTEM_DATA...</p>";

try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error("FILE_NOT_FOUND");

    let htmlContent = await response.text();

    // --- 【核心修复：对所有动态脚本生效】 ---
    // 这里的正则会匹配文本中所有的 ${createCard(...)}
    // 并将其替换为真正运行 createCard() 后生成的 HTML 字符串
    htmlContent = htmlContent.replace(
    /\${createCard\((.*?)\)}/g,
    (match, args) => {
        try {
        // 使用 Function 动态执行当前的 createCard 函数
        return new Function(`return createCard(${args})`)();
        } catch (e) {
        console.error("解析内置组件失败:", e);
        return match; // 出错则保留原样，方便排查
        }
    },
    );

    // 注入处理后的真正 HTML
    bodyEl.innerHTML = htmlContent;
    // --- Jupyter 高亮补丁 ---
// 1. 找到所有 Jupyter 转换出来的 pre 标签
const jupyterCodes = bodyEl.querySelectorAll('.highlight pre');
jupyterCodes.forEach(code => {
    // 2. 强行注入 Prism 需要的类名（假设是 python）
    code.classList.add('language-python');
    // 3. 包装一层 <code> 标签（Prism 的标准规范）
    if (!code.querySelector('code')) {
        code.innerHTML = `<code>${code.innerHTML}</code>`;
    }
});

    // 触发代码高亮
    if (window.Prism) {
    Prism.highlightAllUnder(bodyEl);
    }
} catch (error) {
    bodyEl.innerHTML = `<p style="color:red">ERROR: FAILED_TO_FETCH_DATA [${filePath}]</p>`;
}

setTimeout(() => {
    bodyEl.style.transition = "opacity 0.8s ease-out";
    bodyEl.style.opacity = "1";
}, 300);

window.scrollTo(0, 0);
}

function showHome() {
// 返回主页时清除过滤
const postCards = document.querySelectorAll(".post-card");
const tags = document.querySelectorAll(".filter-tag");
currentCategory = null;
tags.forEach((tag) => tag.classList.remove("active"));
postCards.forEach((card) => (card.style.display = "block"));

document.getElementById("post-list").style.display = "block";
document.getElementById("post-detail").style.display = "none";
updateStats();
window.scrollTo(0, 0);
}

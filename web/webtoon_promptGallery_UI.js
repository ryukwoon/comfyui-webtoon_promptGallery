/**
 * WebtoonPromptGallery - 가로 조절, 카드 줌, 다국어 번역, 태그 조립 가중치 제어 최종 UI (v2.0)
 */

import { app } from "../../../scripts/app.js";

const ICO_URL = new URL("image/RyuKwoon_Toon.ico", import.meta.url).href;

let globalIndex = [];
let sidebarEl = null;
let activeGalleryNode = null;
let selectedCategory = "All";
let lastActiveInput = "positive_text";

let sidebarWidth = parseInt(localStorage.getItem("wpg-sidebar-width")) || 380;
let cardSize = parseInt(localStorage.getItem("wpg-card-size")) || 120;
let activeTheme = localStorage.getItem("wpg-theme") || "theme-dark";

let topBarRetryCount = 0;

const style = document.createElement("style");
style.textContent = `
    #wpg-sidebar {
        --wpg-bg-main: #14141f;
        --wpg-bg-side: #1c1c2b;
        --wpg-border: #2d2d3f;
        --wpg-text: #ccc;
        --wpg-accent: #ffaa00;
        --wpg-card-bg: #20202e;
        --wpg-active-bg: #222235;
    }
    #wpg-sidebar.theme-comfy {
        --wpg-bg-main: #202020;
        --wpg-bg-side: #181818;
        --wpg-border: #353535;
        --wpg-text: #dddddd;
        --wpg-accent: #00bfff;
        --wpg-card-bg: #2b2b2b;
        --wpg-active-bg: #2a2a2a;
    }
    #wpg-sidebar.theme-light {
        --wpg-bg-main: #f4f4f9;
        --wpg-bg-side: #e5e5f0;
        --wpg-border: #cfcbdc;
        --wpg-text: #222233;
        --wpg-accent: #0066cc;
        --wpg-card-bg: #ffffff;
        --wpg-active-bg: #d9d9ea;
    }

    #wpg-sidebar {
        position: fixed; top: 0; height: 100%;
        width: ${sidebarWidth}px;
        background: var(--wpg-bg-main); border-left: 2px solid var(--wpg-border);
        box-shadow: -4px 0 16px rgba(0,0,0,0.6);
        z-index: 1000; display: flex; flex-direction: column;
        color: var(--wpg-text); font-family: 'Segoe UI', sans-serif;
        left: auto;
        right: -${sidebarWidth}px; 
        transition: right 0.25s ease-in-out;
    }
    #wpg-sidebar.open { right: 0; }
    
    #wpg-sidebar-resizer {
        position: absolute; left: -4px; top: 0; width: 8px; height: 100%;
        cursor: ew-resize; z-index: 1002;
    }
    #wpg-sidebar-resizer:hover {
        background: rgba(102, 153, 255, 0.4);
    }
    
    #wpg-sidebar-handle {
        position: absolute; left: -24px; top: 50%; transform: translateY(-50%);
        width: 24px; height: 100px;
        background: var(--wpg-bg-side); border: 1px solid var(--wpg-border);
        border-right: none; border-radius: 8px 0 0 8px;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: var(--wpg-accent); font-weight: bold; font-size: 11px;
        user-select: none; box-shadow: -4px 0 8px rgba(0,0,0,0.4);
        z-index: 1001;
    }
    
    #wpg-header {
        padding: 14px; background: var(--wpg-bg-side); border-bottom: 1px solid var(--wpg-border);
        display: flex; justify-content: space-between; align-items: center;
    }
    #wpg-header h3 { margin: 0; font-size: 14px; color: var(--wpg-text); font-weight: bold; }
    
    #wpg-settings-panel {
        max-height: 0px; overflow: hidden; background: var(--wpg-bg-side);
        border-bottom: 0px solid var(--wpg-border); transition: max-height 0.2s ease, padding 0.2s ease;
        padding: 0 14px; font-size: 12px; display: flex; flex-direction: column; gap: 8px;
    }
    #wpg-settings-panel.active {
        max-height: 100px; padding: 12px 14px; border-bottom: 1px solid var(--wpg-border);
    }
    .wpg-setting-row { display: flex; align-items: center; justify-content: space-between; }
    
    #wpg-active-info {
        padding: 8px 12px; background: var(--wpg-active-bg); font-size: 11px; color: var(--wpg-accent);
        border-bottom: 1px solid var(--wpg-border); display: flex; flex-direction: column; gap: 4px;
    }
    .wpg-info-row { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    #wpg-tree-container {
        height: 120px; overflow-y: auto; background: var(--wpg-bg-main);
        border-bottom: 2px solid var(--wpg-border); padding: 4px 0;
    }
    .wpg-tree-item {
        padding: 5px 12px; cursor: pointer; font-size: 12px; color: var(--wpg-text);
        border-bottom: 1px solid var(--wpg-border); opacity: 0.85; transition: background 0.1s;
    }
    .wpg-tree-item:hover { background: var(--wpg-bg-side); opacity: 1; }
    .wpg-tree-item.active { background: var(--wpg-active-bg); font-weight: bold; opacity: 1; border-left: 3px solid var(--wpg-accent); }

    /* 번역 및 태그 에디터(All-in-One) 구역 스타일 */
    #wpg-editor-panel {
        background: var(--wpg-bg-side); padding: 10px;
        border-bottom: 2px solid var(--wpg-border); display: flex; flex-direction: column; gap: 8px;
    }
    #wpg-translate-input {
        width: 100%; padding: 6px 10px; background: var(--wpg-bg-main);
        border: 1px solid var(--wpg-border); border-radius: 4px;
        color: var(--wpg-text); font-size: 11px; outline: none; box-sizing: border-box;
    }
    #wpg-translate-input:focus { border-color: var(--wpg-accent); }
    #wpg-chips-container {
        max-height: 110px; overflow-y: auto; padding: 4px;
        display: flex; flex-wrap: wrap; gap: 4px; background: var(--wpg-bg-main);
        border-radius: 4px; border: 1px solid var(--wpg-border);
    }
    
    /* 비주얼 프롬프트 칩 스타일 */
    .wpg-chip {
        display: inline-flex; align-items: center; gap: 4px;
        background: var(--wpg-card-bg); border: 1px solid var(--wpg-border);
        border-radius: 4px; padding: 2px 6px; font-size: 11px; color: var(--wpg-text);
    }
    .wpg-chip-text { cursor: default; user-select: none; }
    .wpg-chip-btn {
        background: none; border: none; color: var(--wpg-accent);
        font-weight: bold; cursor: pointer; padding: 0 3px; font-size: 11px;
    }
    .wpg-chip-btn:hover { color: #fff; }
    .wpg-chip-del {
        color: #ff5555; cursor: pointer; font-weight: bold; margin-left: 4px;
    }
    .wpg-chip-del:hover { color: #ff0000; }

    #wpg-gallery-container {
        flex: 1; overflow-y: auto; padding: 12px;
        display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start;
        background: var(--wpg-bg-main);
    }
    
    .wpg-card {
        border: 2px solid var(--wpg-border); border-radius: 6px;
        background: var(--wpg-card-bg); cursor: pointer; position: relative;
        overflow: hidden; flex-shrink: 0; transition: border-color 0.15s, width 0.1s;
    }
    .wpg-card:hover { border-color: var(--wpg-accent); }
    .wpg-card.selected { border-color: var(--wpg-accent); box-shadow: 0 0 6px rgba(255,170,0,0.4); }
    .wpg-card img { width: 100%; height: auto; display: block; }
    .wpg-card-label {
        font-size: 10px; text-align: center; padding: 4px 2px; color: var(--wpg-text);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .wpg-card-overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.92); color: #fff; font-size: 10px;
        padding: 8px; box-sizing: border-box; display: none;
        overflow-y: auto; white-space: pre-wrap; line-height: 1.4; pointer-events: none;
    }

    #wpg-footer {
        padding: 10px 14px; background: var(--wpg-bg-side); border-top: 1px solid var(--wpg-border);
        display: flex; flex-direction: column; gap: 8px; font-size: 11px;
    }
    .wpg-footer-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    
    .wpg-btn {
        background: var(--wpg-card-bg); color: var(--wpg-text); border: 1px solid var(--wpg-border);
        border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 11px;
    }
    .wpg-btn:hover { background: var(--wpg-active-bg); }
    
    .wpg-select {
        background: var(--wpg-card-bg); color: var(--wpg-text); border: 1px solid var(--wpg-border);
        border-radius: 4px; padding: 2px 4px; outline: none; font-size: 11px; cursor: pointer;
    }
`;
document.head.appendChild(style);

app.registerExtension({
    name: "WebtoonPromptGallery.Extension",

    async setup() {
        try {
            await loadGlobalIndex();
            createSidebar();
            addTopBarButton();
        } catch (e) {
            console.error("[WebtoonPromptGallery] 로딩 에러:", e);
        }
    },

    async nodeCreated(node) {
        if (node.comfyClass === "Webtoon_Prompt_Gallery") {
            node.title = "🖼 Webtoon Prompt Gallery (Accumulator)";

            const fileWidget = node.widgets?.find(w => w.name === "selected_file");
            if (fileWidget) fileWidget.type = "hidden";

            node.onDblClick = function(e) {
                e.stopPropagation();
                activeGalleryNode = node;
                openSidebar();
            };

            const origOnSelected = node.onSelected;
            node.onSelected = function() {
                origOnSelected?.apply(this, arguments);
                activeGalleryNode = node;
                updateActiveNodeInfo();
                if (sidebarEl && sidebarEl.classList.contains("open")) {
                    renderGallery();
                    renderPromptEditor(); // 노드 선택 시 태그 에디터 갱신
                }
            };
        }
    }
});

// 포커스 필드 식별 및 태그 목록 리프레시
document.addEventListener("focusin", (e) => {
    if (e.target.tagName === "TEXTAREA" && activeGalleryNode) {
        const posWidget = activeGalleryNode.widgets?.find(w => w.name === "positive_text");
        const negWidget = activeGalleryNode.widgets?.find(w => w.name === "negative_text");
        
        if (posWidget && posWidget.inputEl === e.target) {
            lastActiveInput = "positive_text";
            updateActiveNodeInfo();
            renderPromptEditor();
        } else if (negWidget && negWidget.inputEl === e.target) {
            lastActiveInput = "negative_text";
            updateActiveNodeInfo();
            renderPromptEditor();
        }
    }
});

function addTopBarButton() {
    let menuBar = document.querySelector(".comfy-menu-actions-group") 
               || document.querySelector(".comfy-menu")
               || document.querySelector(".comfy-play-button")?.parentElement;
    
    if (!menuBar) {
        if (topBarRetryCount < 10) {
            topBarRetryCount++;
            setTimeout(addTopBarButton, 500);
        } else {
            createFloatingFallbackButton();
        }
        return;
    }

    if (document.getElementById("wpg-topbar-btn")) return;

    const btn = document.createElement("button");
    btn.id = "wpg-topbar-btn";
    btn.className = "wpg-btn comfy-btn";
    btn.innerHTML = `<img src="${ICO_URL}" style="width:13px; height:13px; vertical-align:middle; margin-right:5px;">Webtoon PromptGallery`;
    btn.style.cssText = `
        margin-left: 6px; margin-right: 6px;
        background: #2a2a3e; color: #ffaa00; font-weight: bold;
        border: 1px solid #ffaa00; border-radius: 4px;
        cursor: pointer; padding: 4px 10px; font-size: 11px;
    `;
    
    btn.onclick = () => {
        toggleSidebarViaButton();
    };

    const managerBtn = menuBar.querySelector(".comfy-manager-button") || menuBar.firstChild;
    if (managerBtn) {
        menuBar.insertBefore(btn, managerBtn.nextSibling);
    } else {
        menuBar.appendChild(btn);
    }
}

function createFloatingFallbackButton() {
    if (document.getElementById("wpg-topbar-btn") || document.getElementById("wpg-floating-fallback-btn")) return;

    console.log("[WebtoonPromptGallery] 상단바 미감지 플로팅 비상 버튼 배치");
    
    const floatBtn = document.createElement("button");
    floatBtn.id = "wpg-floating-fallback-btn";
    floatBtn.innerHTML = `<img src="${ICO_URL}" style="width:13px; height:13px; vertical-align:middle; margin-right:5px;">Webtoon PromptGallery`;
    floatBtn.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: #1c1c2b; color: #ffaa00; font-weight: bold;
        border: 2px solid #ffaa00; border-radius: 50px;
        padding: 10px 18px; cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        z-index: 1000; font-family: 'Segoe UI', sans-serif;
        font-size: 12px; transition: transform 0.15s;
    `;
    floatBtn.onmouseenter = () => floatBtn.style.transform = "scale(1.05)";
    floatBtn.onmouseleave = () => floatBtn.style.transform = "scale(1)";
    floatBtn.onclick = () => {
        toggleSidebarViaButton();
    };

    document.body.appendChild(floatBtn);
}

function toggleSidebarViaButton() {
    if (!sidebarEl) return;
    
    const isOpen = sidebarEl.classList.contains("open");
    if (isOpen) {
        closeSidebar();
    } else {
        if (!activeGalleryNode) {
            const galleryNodes = app.graph.findNodesByType("Webtoon_Prompt_Gallery");
            if (galleryNodes && galleryNodes.length > 0) {
                activeGalleryNode = galleryNodes[0];
                app.canvas.selectNode(activeGalleryNode);
            }
        }
        openSidebar();
    }
}

async function loadGlobalIndex() {
    try {
        const res = await fetch("/webtoon_prompt_gallery/index");
        if (!res.ok) throw new Error();
        globalIndex = await res.json();
    } catch {
        globalIndex = [];
    }
}

async function doRescan() {
    const btn = document.getElementById("wpg-rescan-btn");
    if (btn) { btn.textContent = "스캔 중..."; btn.disabled = true; }
    try {
        const res = await fetch("/webtoon_prompt_gallery/rescan", { method: "POST" });
        const json = await res.json();
        await loadGlobalIndex();
        renderTree();
        renderGallery();
        alert(`스캔 성공: ${json.count}개 항목 업데이트 완료`);
    } catch (e) {
        alert("재스캔 실패");
    } finally {
        if (btn) { btn.textContent = "🔄 재스캔"; btn.disabled = false; }
    }
}

function createSidebar() {
    if (document.getElementById("wpg-sidebar")) return;

    sidebarEl = document.createElement("div");
    sidebarEl.id = "wpg-sidebar";
    sidebarEl.className = activeTheme;
    sidebarEl.innerHTML = `
        <div id="wpg-sidebar-resizer"></div>
        <div id="wpg-sidebar-handle">◀</div>
        
        <div id="wpg-header">
            <h3 style="display:flex; align-items:center; gap:6px;">
                <img src="${ICO_URL}" style="width:15px; height:15px; vertical-align:middle; filter:none; margin:0;">
                Webtoon PromptGallery
            </h3>
            <div style="display:flex; gap:6px;">
                <button class="wpg-btn" id="wpg-toggle-settings">⚙️ 설정</button>
                <button class="wpg-btn" id="wpg-close-btn" style="background:#5a2a2a; border-color:#7a3a3a; color:#fff;">✕ 닫기</button>
            </div>
        </div>
        
        <div id="wpg-settings-panel">
            <div class="wpg-setting-row">
                <span>🎨 사이드바 테마 컬러 설정</span>
                <select id="wpg-theme-select" class="wpg-select">
                    <option value="theme-dark" ${activeTheme === "theme-dark" ? "selected" : ""}>Dark (오리지널 우주)</option>
                    <option value="theme-comfy" ${activeTheme === "theme-comfy" ? "selected" : ""}>System (컴피 내장)</option>
                    <option value="theme-light" ${activeTheme === "theme-light" ? "selected" : ""}>Light (밝은 화이트)</option>
                </select>
            </div>
        </div>

        <div id="wpg-active-info">
            <div class="wpg-info-row" id="wpg-active-node-text">선택된 노드가 없습니다.</div>
            <div class="wpg-info-row" id="wpg-focus-text" style="font-weight:bold;">👉 입력 모드: 긍정 프롬프트</div>
        </div>
        <div id="wpg-tree-container"></div>
        
        <!-- [All-in-One 탑재] 한글 자동 번역 입력 및 비주얼 태그 조립 패널 -->
        <div id="wpg-editor-panel">
            <input id="wpg-translate-input" type="text" placeholder="한글 키워드 입력 후 엔터 (영문 자동 번역 추가)...">
            <div id="wpg-chips-container">
                <span style="color:#666; font-size:11px; padding:4px;">대기실이 비어있습니다.</span>
            </div>
        </div>

        <div id="wpg-gallery-container"></div>
        
        <div id="wpg-footer">
            <div class="wpg-footer-row">
                <span>🔍 카드 크기 (<span id="wpg-px-lbl">${cardSize}</span>px):</span>
                <input id="wpg-zoom-slider" type="range" min="80" max="300" value="${cardSize}" style="flex:1; accent-color:var(--wpg-accent);">
            </div>
            <div class="wpg-footer-row">
                <span style="color:#888;">Webtoon Prompt All-in-One v2.0</span>
                <button class="wpg-btn" id="wpg-rescan-btn">🔄 데이터 재스캔</button>
            </div>
        </div>
    `;

    document.body.appendChild(sidebarEl);

    document.getElementById("wpg-close-btn").onclick = closeSidebar;
    document.getElementById("wpg-rescan-btn").onclick = doRescan;
    document.getElementById("wpg-sidebar-handle").onclick = (e) => {
        e.stopPropagation();
        toggleSidebarViaButton();
    };

    document.getElementById("wpg-toggle-settings").onclick = () => {
        document.getElementById("wpg-settings-panel").classList.toggle("active");
    };

    document.getElementById("wpg-theme-select").onchange = function() {
        sidebarEl.className = this.value;
        activeTheme = this.value;
        localStorage.setItem("wpg-theme", activeTheme);
    };

    const zoomSlider = document.getElementById("wpg-zoom-slider");
    zoomSlider.oninput = function() {
        cardSize = parseInt(this.value);
        document.getElementById("wpg-px-lbl").textContent = cardSize;
        localStorage.setItem("wpg-card-size", cardSize);
        document.querySelectorAll(".wpg-card").forEach(c => c.style.width = cardSize + "px");
    };

    // [번역 이벤트 바인딩] 엔터를 치면 한글 ➔ 영어 자동 번역 후 노드에 축적 적재
    const translateInput = document.getElementById("wpg-translate-input");
    translateInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            const query = translateInput.value.trim();
            if (!query) return;
            translateInput.value = "";
            translateInput.placeholder = "번역 중...";
            
            try {
                const res = await fetch(`/webtoon_prompt_gallery/translate?text=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.translated) {
                    injectDirectPromptString(data.translated);
                }
            } catch (err) {
                console.error("번역 오류:", err);
            } finally {
                translateInput.placeholder = "한글 키워드 입력 후 엔터 (영문 자동 번역 추가)...";
            }
        }
    });

    initResizing();
    renderTree();
}

function initResizing() {
    const resizer = document.getElementById("wpg-sidebar-resizer");
    let isDragging = false;

    resizer.addEventListener("mousedown", (e) => {
        isDragging = true;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "ew-resize";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        
        let newWidth = window.innerWidth - e.clientX;
        
        if (newWidth < 300) newWidth = 300;
        if (newWidth > window.innerWidth - 100) newWidth = window.innerWidth - 100;

        sidebarWidth = newWidth;
        sidebarEl.style.width = `${sidebarWidth}px`;
        
        if (!sidebarEl.classList.contains("open")) {
            sidebarEl.style.right = `-${sidebarWidth}px`;
        }
    });

    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
            localStorage.setItem("wpg-sidebar-width", sidebarWidth);
        }
    });
}

function openSidebar() {
    if (sidebarEl) {
        sidebarEl.style.width = `${sidebarWidth}px`;
        sidebarEl.style.right = "0";
        sidebarEl.classList.add("open");
        updateActiveNodeInfo();
        renderGallery();
        renderPromptEditor();
        
        const handle = document.getElementById("wpg-sidebar-handle");
        if (handle) handle.textContent = "▶";
    }
}

function closeSidebar() {
    if (sidebarEl) {
        sidebarEl.style.right = `-${sidebarWidth}px`;
        sidebarEl.classList.remove("open");
        
        const handle = document.getElementById("wpg-sidebar-handle");
        if (handle) handle.textContent = "◀";
    }
}

function updateActiveNodeInfo() {
    const nodeTextEl = document.getElementById("wpg-active-node-text");
    const focusTextEl = document.getElementById("wpg-focus-text");
    if (!nodeTextEl || !focusTextEl) return;

    if (activeGalleryNode) {
        nodeTextEl.textContent = `🟢 연동 노드: ID [${activeGalleryNode.id}] - ${activeGalleryNode.title}`;
        nodeTextEl.style.color = "var(--wpg-accent)";
    } else {
        nodeTextEl.textContent = "🔴 선택된 갤러리 노드가 없습니다.";
        nodeTextEl.style.color = "#ff6666";
    }

    if (lastActiveInput === "negative_text") {
        focusTextEl.textContent = "👉 입력 대기: 🔴 부정 프롬프트 (Negative)";
        focusTextEl.style.color = "#ff8888";
    } else {
        focusTextEl.textContent = "👉 입력 대기: 🟢 긍정 프롬프트 (Positive)";
        focusTextEl.style.color = "var(--wpg-accent)";
    }
}

// ─────────────────────────────────────────
// [All-in-One 코어 엔진] 비주얼 태그 파서, 가중치 분석 및 렌더러
// ─────────────────────────────────────────
function renderPromptEditor() {
    const container = document.getElementById("wpg-chips-container");
    if (!container) return;
    
    if (!activeGalleryNode) {
        container.innerHTML = `<span style="color:#666; font-size:11px; padding:4px;">연동된 노드가 없습니다.</span>`;
        return;
    }

    const widget = activeGalleryNode.widgets?.find(w => w.name === lastActiveInput);
    const rawVal = widget ? widget.value : "";
    
    if (!rawVal || !rawVal.trim()) {
        container.innerHTML = `<span style="color:#666; font-size:11px; padding:4px;">대기실이 비어있습니다.</span>`;
        return;
    }

    // 쉼표(,) 기준 분할하되, 소괄호 안의 쉼표는 건너뛰는 정밀 정규식 스플릿 적용
    const items = rawVal.split(/,(?![^(]*\))/);
    container.innerHTML = "";

    items.forEach((item, index) => {
        const cleanItem = item.trim();
        if (!cleanItem) return;

        // 태그 칩 엘리먼트 생성
        const chip = document.createElement("div");
        chip.className = "wpg-chip";

        // 가중치 감소 버튼 [-]
        const decBtn = document.createElement("button");
        decBtn.className = "wpg-chip-btn";
        decBtn.textContent = "-";
        decBtn.onclick = () => adjustWeight(index, -0.1);

        // 태그 라벨
        const textSpan = document.createElement("span");
        textSpan.className = "wpg-chip-text";
        textSpan.textContent = cleanItem;

        // 가중치 증가 버튼 [+]
        const incBtn = document.createElement("button");
        incBtn.className = "wpg-chip-btn";
        incBtn.textContent = "+";
        incBtn.onclick = () => adjustWeight(index, 0.1);

        // 태그 삭제 버튼 [✕]
        const delBtn = document.createElement("span");
        delBtn.className = "wpg-chip-del";
        delBtn.textContent = "✕";
        delBtn.onclick = () => deleteTag(index);

        chip.appendChild(decBtn);
        chip.appendChild(textSpan);
        chip.appendChild(incBtn);
        chip.appendChild(delBtn);

        container.appendChild(chip);
    });
}

// 가중치 증감 연산 함수
function adjustWeight(index, delta) {
    if (!activeGalleryNode) return;
    const widget = activeGalleryNode.widgets?.find(w => w.name === lastActiveInput);
    if (!widget) return;

    const items = widget.value.split(/,(?![^(]*\))/).map(x => x.trim()).filter(Boolean);
    if (index >= items.length) return;

    let target = items[index];
    
    // (단어:가중치) 패턴 검출 정규식
    const match = target.match(/^\(([^:]+):([0-9.]+)\)$/);
    let word = target;
    let weight = 1.0;

    if (match) {
        word = match[1].trim();
        weight = parseFloat(match[2]);
    } else {
        // 소괄호만 쳐져있는 경우 (word) 대응
        const parenMatch = target.match(/^\(([^)]+)\)$/);
        if (parenMatch) {
            word = parenMatch[1].trim();
            weight = 1.1;
        }
    }

    weight += delta;
    weight = Math.round(weight * 10) / 10; // 소수점 첫째자리 보정

    if (weight <= 0.1) {
        items.splice(index, 1); // 0 이하가 되면 태그 자체를 삭제
    } else if (weight === 1.0) {
        items[index] = word; // 가중치가 1.0이 되면 괄호 제거
    } else {
        items[index] = `(${word}:${weight})`;
    }

    widget.value = items.join(", ") + ",";
    
    activeGalleryNode.setDirtyCanvas(true);
    app.canvas.draw(true, true);
    renderPromptEditor(); // 조립기 즉시 리프레시
}

// 태그 삭제 처리
function deleteTag(index) {
    if (!activeGalleryNode) return;
    const widget = activeGalleryNode.widgets?.find(w => w.name === lastActiveInput);
    if (!widget) return;

    const items = widget.value.split(/,(?![^(]*\))/).map(x => x.trim()).filter(Boolean);
    if (index >= items.length) return;

    items.splice(index, 1);

    widget.value = items.length > 0 ? items.join(", ") + "," : "";
    
    activeGalleryNode.setDirtyCanvas(true);
    app.canvas.draw(true, true);
    renderPromptEditor();
}

// 번역 문장이나 단어 직접 삽입 기능
function injectDirectPromptString(translatedText) {
    if (!activeGalleryNode) return;
    const widget = activeGalleryNode.widgets?.find(w => w.name === lastActiveInput);
    if (!widget) return;

    let currentVal = widget.value ? widget.value.trim() : "";
    const cleanAdd = translatedText.trim();

    if (currentVal) {
        if (!currentVal.endsWith(",")) {
            currentVal += ",";
        }
        widget.value = `${currentVal} ${cleanAdd},`;
    } else {
        widget.value = `${cleanAdd},`;
    }

    activeGalleryNode.setDirtyCanvas(true);
    app.canvas.draw(true, true);
    renderPromptEditor();
}


// ─────────────────────────────────────────
// 카테고리 트리 구조 정의
// ─────────────────────────────────────────
function renderTree() {
    const container = document.getElementById("wpg-tree-container");
    if (!container) return;
    container.innerHTML = "";

    const allItem = document.createElement("div");
    allItem.className = `wpg-tree-item ${selectedCategory === "All" ? "active" : ""}`;
    allItem.textContent = "📋 전체보기 (ALL)";
    allItem.onclick = () => {
        selectedCategory = "All";
        updateActiveTreeItem(allItem);
        renderGallery();
    };
    container.appendChild(allItem);

    const root = { _files: [], _children: {} };
    globalIndex.forEach(item => {
        if (!item.category) { root._files.push(item); return; }
        let cur = root;
        item.category.split("/").forEach(part => {
            if (!cur._children[part]) cur._children[part] = { _files: [], _children: {} };
            cur = cur._children[part];
        });
        cur._files.push(item);
    });

    renderTreeNodes(root, container, 0, "");
}

function renderTreeNodes(node, container, depth, parentPath) {
    for (const key in node._children) {
        const sub = node._children[key];
        const currentPath = parentPath ? `${parentPath}/${key}` : key;
        const count = collectAllFiles(sub).length;

        const item = document.createElement("div");
        item.className = `wpg-tree-item ${selectedCategory === currentPath ? "active" : ""}`;
        item.style.paddingLeft = `${12 + depth * 12}px`;
        item.textContent = `📁 ${key} (${count})`;

        item.onclick = () => {
            selectedCategory = currentPath;
            updateActiveTreeItem(item);
            renderGallery();
        };

        container.appendChild(item);
        renderTreeNodes(sub, container, depth + 1, currentPath);
    }
}

function collectAllFiles(node) {
    let files = [...node._files];
    for (const key in node._children) files = files.concat(collectAllFiles(node._children[key]));
    return files;
}

function updateActiveTreeItem(activeEl) {
    document.querySelectorAll(".wpg-tree-item").forEach(el => el.classList.remove("active"));
    activeEl.classList.add("active");
}

function renderGallery() {
    const container = document.getElementById("wpg-gallery-container");
    if (!container) return;
    container.innerHTML = "";

    const filteredData = filterByCategory(globalIndex, selectedCategory);
    if (filteredData.length === 0) {
        container.innerHTML = `<div style="font-size:11px; color:#666; padding:12px;">등록된 프롬프트가 없습니다.</div>`;
        return;
    }

    const currentSelectedFile = activeGalleryNode?.widgets?.find(w => w.name === "selected_file")?.value;

    filteredData.forEach(item => {
        const card = document.createElement("div");
        const isSelected = (currentSelectedFile === item.file);
        card.className = `wpg-card ${isSelected ? "selected" : ""}`;
        card.style.width = `${cardSize}px`;

        const img = document.createElement("img");
        img.src = `/webtoon_prompt_gallery/card/${item.card}`;
        img.alt = item.name;

        const label = document.createElement("div");
        label.className = "wpg-card-label";
        label.textContent = item.name;

        const overlay = document.createElement("div");
        overlay.className = "wpg-card-overlay";
        
        let overlayText = "";
        if (item.prompt) {
            overlayText += `<b>[긍정 프롬프트]</b><br>${item.prompt}`;
        }
        if (item.negative_prompt) {
            overlayText += `<br><br><b style="color:#ff6666;">[부정 프롬프트]</b><br>${item.negative_prompt}`;
        }
        if (!overlayText) {
            overlayText = "(프롬프트가 비어있습니다)";
        }
        overlay.innerHTML = overlayText;

        card.appendChild(img);
        card.appendChild(label);
        card.appendChild(overlay);

        card.onmouseenter = () => overlay.style.display = "block";
        card.onmouseleave = () => overlay.style.display = "none";

        card.onclick = () => {
            if (!activeGalleryNode) {
                alert("연동된 Webtoon Prompt Gallery 노드가 없습니다. 캔버스의 노드를 선택 후 시도해 주세요.");
                return;
            }
            appendPromptToNode(item);
            document.querySelectorAll(".wpg-card").forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
        };

        container.appendChild(card);
    });
}

function filterByCategory(data, category) {
    if (!category || category === "All") return data;
    return data.filter(item =>
        item.category === category ||
        item.category.startsWith(category + "/")
    );
}

function appendPromptToNode(item) {
    if (!activeGalleryNode) return;

    const fileWidget = activeGalleryNode.widgets?.find(w => w.name === "selected_file");
    if (fileWidget) {
        fileWidget.value = item.file;
    }

    const targetWidgetName = lastActiveInput; 
    const targetWidget = activeGalleryNode.widgets?.find(w => w.name === targetWidgetName);
    const textToInsert = item.prompt ? item.prompt.trim() : "";

    if (targetWidget && textToInsert) {
        let currentText = targetWidget.value ? targetWidget.value.trim() : "";
        
        if (currentText) {
            if (!currentText.endsWith(",")) {
                currentText += ",";
            }
            targetWidget.value = `${currentText} ${textToInsert}`;
        } else {
            targetWidget.value = textToInsert;
        }

        if (!targetWidget.value.endsWith(",")) {
            targetWidget.value += ",";
        }
    }

    if (targetWidgetName === "positive_text" && item.negative_prompt) {
        const negWidget = activeGalleryNode.widgets?.find(w => w.name === "negative_text");
        const negToInsert = item.negative_prompt.trim();

        if (negWidget && negToInsert) {
            let currentNegText = negWidget.value ? negWidget.value.trim() : "";
            if (currentNegText) {
                if (!currentNegText.endsWith(",")) currentNegText += ",";
                negWidget.value = `${currentNegText} ${negToInsert}`;
            } else {
                negWidget.value = negToInsert;
            }
            if (!negWidget.value.endsWith(",")) {
                negWidget.value += ",";
            }
        }
    }

    activeGalleryNode.setDirtyCanvas(true);
    activeGalleryNode.title = `🖼 Prompt Gallery ▶ ${item.name}`;
    app.canvas.draw(true, true);
    renderPromptEditor(); // 썸네일 클릭 누적 시 조립기 즉시 리프레시
}
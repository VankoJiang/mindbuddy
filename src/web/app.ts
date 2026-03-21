export function renderAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MindBuddy</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Outfit:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #f3f0e8;
      --bg-soft: #edf3eb;
      --ink: #162018;
      --muted: #536257;
      --line: rgba(22, 32, 24, 0.14);
      --panel: rgba(255, 255, 255, 0.88);
      --brand: #168f69;
      --brand-ink: #0d5b43;
      --warn: #be5f1a;
      --warn-bg: #fff2e7;
      --user: #167d62;
      --assistant: #ffffff;
      --radius-lg: 18px;
      --radius-md: 12px;
      --shadow: 0 14px 36px rgba(20, 36, 27, 0.1);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      color: var(--ink);
      font-family: "IBM Plex Sans", sans-serif;
      background:
        radial-gradient(circle at 12% 12%, #dcebd8, transparent 38%),
        radial-gradient(circle at 88% 0%, #fff0d9, transparent 42%),
        linear-gradient(160deg, var(--bg), #f8f5ef 56%, var(--bg-soft));
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background:
        repeating-linear-gradient(90deg, rgba(22,32,24,0.015), rgba(22,32,24,0.015) 1px, transparent 1px, transparent 34px);
      mix-blend-mode: multiply;
    }

    .app {
      position: relative;
      z-index: 1;
      width: min(1360px, 100%);
      height: 100%;
      margin: 0 auto;
      padding: 14px;
      display: grid;
      grid-template-columns: 350px minmax(0, 1fr);
      gap: 12px;
      animation: rise 0.45s ease-out;
    }

    .panel {
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: var(--panel);
      box-shadow: var(--shadow);
      backdrop-filter: blur(8px);
      min-height: 0;
    }

    .sidebar {
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      gap: 10px;
      min-height: 0;
    }

    .brand {
      padding: 16px 16px 14px;
      border-bottom: 1px solid var(--line);
      display: grid;
      gap: 8px;
    }

    .brand h1 {
      font-family: "Outfit", sans-serif;
      font-size: 28px;
      letter-spacing: .3px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand p {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
    }

    .chip-row {
      display: flex;
      gap: 7px;
      flex-wrap: wrap;
    }

    .chip {
      font-family: "Outfit", sans-serif;
      font-size: 11px;
      font-weight: 700;
      color: #0f6148;
      border: 1px solid rgba(22, 143, 105, 0.3);
      border-radius: 999px;
      background: #d8f1e9;
      padding: 3px 9px;
    }

    .runtime {
      padding: 12px;
      display: grid;
      gap: 10px;
    }

    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .title {
      font-family: "Outfit", sans-serif;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: .25px;
    }

    .tiny {
      color: var(--muted);
      font-size: 11px;
    }

    .field {
      display: grid;
      gap: 5px;
    }

    .field label {
      font-size: 12px;
      font-weight: 600;
      color: #243227;
    }

    .field select, .field input, .field textarea {
      width: 100%;
      border-radius: 10px;
      border: 1px solid rgba(22, 32, 24, 0.2);
      background: #fff;
      padding: 8px 10px;
      font-size: 13px;
      color: var(--ink);
      outline: none;
      font-family: "IBM Plex Sans", sans-serif;
    }

    .field textarea {
      resize: vertical;
      min-height: 88px;
      line-height: 1.4;
    }

    .field select:focus, .field input:focus, .field textarea:focus {
      border-color: rgba(22, 143, 105, 0.6);
      box-shadow: 0 0 0 3px rgba(22, 143, 105, 0.12);
    }

    .hint {
      border-radius: 10px;
      font-size: 12px;
      line-height: 1.45;
      padding: 8px 9px;
      border: 1px solid var(--line);
      background: #f7faf6;
      color: #31433a;
    }

    .hint.warn {
      border-color: #f2ccae;
      background: var(--warn-bg);
      color: var(--warn);
    }

    .context {
      padding: 12px;
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      gap: 10px;
      min-height: 0;
    }

    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn {
      border: 1px solid rgba(22, 32, 24, 0.2);
      background: #fff;
      color: #203126;
      font-size: 12px;
      font-weight: 600;
      border-radius: 10px;
      padding: 6px 10px;
      cursor: pointer;
    }

    .btn:hover {
      border-color: rgba(22, 143, 105, 0.45);
      color: #0f6349;
    }

    .metric {
      display: grid;
      gap: 5px;
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      padding: 8px 9px;
      background: rgba(255, 255, 255, 0.75);
    }

    .metric strong {
      font-size: 12px;
    }

    .metric span {
      font-size: 12px;
      color: var(--muted);
    }

    .editor {
      padding: 8px 10px 10px;
      display: grid;
      gap: 8px;
    }

    .editor .tiny {
      font-size: 11px;
      color: #5f6e64;
    }

    .sections {
      min-height: 0;
      overflow: auto;
      display: grid;
      gap: 10px;
      align-content: start;
    }

    .block {
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: rgba(255, 255, 255, 0.8);
    }

    .block h3 {
      font-family: "Outfit", sans-serif;
      font-size: 13px;
      letter-spacing: .25px;
      padding: 9px 10px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .count {
      border-radius: 999px;
      padding: 2px 7px;
      font-size: 11px;
      background: rgba(22, 32, 24, 0.08);
      color: #27362b;
    }

    .list {
      list-style: none;
      padding: 8px 10px;
      display: grid;
      gap: 8px;
    }

    .list li {
      border-left: 3px solid #d7e2da;
      padding-left: 7px;
      font-size: 12px;
      line-height: 1.4;
      color: #2b3b31;
    }

    .list li strong {
      display: block;
      font-size: 12px;
      color: #17261d;
      margin-bottom: 2px;
    }

    .empty {
      font-size: 12px;
      color: #6c7a70;
      padding: 8px 10px 10px;
    }

    .chat {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      min-height: 0;
    }

    .chat-head {
      border-bottom: 1px solid var(--line);
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .chat-head h2 {
      font-family: "Outfit", sans-serif;
      font-size: 24px;
      line-height: 1;
    }

    .chat-head p {
      margin-top: 6px;
      font-size: 12px;
      color: var(--muted);
    }

    .status {
      border: 1px solid rgba(22, 143, 105, 0.25);
      color: var(--brand-ink);
      background: rgba(22, 143, 105, 0.1);
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .status.warn {
      border-color: #efcfb4;
      color: var(--warn);
      background: var(--warn-bg);
    }

    .messages {
      min-height: 0;
      overflow: auto;
      padding: 16px;
      display: grid;
      gap: 12px;
      align-content: start;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0)),
        repeating-linear-gradient(90deg, rgba(22,32,24,0.018), rgba(22,32,24,0.018) 1px, transparent 1px, transparent 30px);
    }

    .msg {
      max-width: min(780px, 88%);
      border-radius: 14px;
      padding: 10px 12px;
      border: 1px solid transparent;
      line-height: 1.55;
      font-size: 14px;
      white-space: pre-wrap;
      word-break: break-word;
      animation: pop .18s ease-out;
    }

    .msg.user {
      margin-left: auto;
      color: #fff;
      background: var(--user);
      box-shadow: 0 6px 20px rgba(18, 120, 92, 0.34);
    }

    .msg.assistant {
      color: #1d2b22;
      border-color: rgba(22, 32, 24, 0.12);
      background: var(--assistant);
    }

    .msg.system {
      max-width: 100%;
      font-size: 12px;
      color: #5c6b60;
      background: rgba(255, 255, 255, 0.7);
      border-color: rgba(22, 32, 24, 0.08);
      text-align: center;
    }

    .typing {
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }

    .typing i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #809289;
      animation: blink 1s infinite ease-in-out;
    }

    .typing i:nth-child(2) {
      animation-delay: .15s;
    }

    .typing i:nth-child(3) {
      animation-delay: .3s;
    }

    .composer {
      border-top: 1px solid var(--line);
      background: rgba(255,255,255,0.9);
      padding: 12px;
      display: grid;
      gap: 8px;
    }

    .composer form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 9px;
    }

    .composer textarea {
      resize: none;
      min-height: 52px;
      max-height: 170px;
      border-radius: 12px;
      border: 1px solid rgba(22, 32, 24, 0.2);
      background: #fff;
      color: #1a2920;
      padding: 12px;
      line-height: 1.45;
      font-size: 14px;
      outline: none;
      font-family: "IBM Plex Sans", sans-serif;
    }

    .composer textarea:focus {
      border-color: rgba(22, 143, 105, 0.6);
      box-shadow: 0 0 0 3px rgba(22, 143, 105, 0.12);
    }

    .composer button {
      border: none;
      border-radius: 12px;
      min-width: 96px;
      padding: 0 16px;
      font-size: 13px;
      font-weight: 700;
      font-family: "Outfit", sans-serif;
      color: #183228;
      background: linear-gradient(140deg, #ffcf63, #ecad25);
      cursor: pointer;
      transition: transform .14s ease, filter .14s ease;
    }

    .composer button:hover {
      transform: translateY(-1px);
      filter: brightness(1.03);
    }

    .composer button:disabled {
      cursor: not-allowed;
      opacity: .7;
      transform: none;
    }

    .composer-note {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.45;
    }

    @media (max-width: 1060px) {
      .app {
        grid-template-columns: 1fr;
        gap: 10px;
        padding: 10px;
      }

      .sidebar {
        max-height: 48vh;
      }

      .chat {
        min-height: 52vh;
      }
    }

    @keyframes pop {
      from { transform: translateY(4px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes rise {
      from { transform: translateY(8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes blink {
      0%, 80%, 100% { transform: scale(.72); opacity: .42; }
      40% { transform: scale(1); opacity: 1; }
    }
  </style>
</head>
<body>
  <main class="app">
    <aside class="sidebar">
      <section class="panel brand">
        <h1>MindBuddy <span style="font-size:14px;color:#0f6248;">Phase 1</span></h1>
        <p>先配置模型，再对话；对话中可随时刷新上下文（备忘录 / 日程 / 屏幕时长）。</p>
        <div class="chip-row">
          <span class="chip">LOCAL-FIRST</span>
          <span class="chip">PI-FLOW</span>
          <span class="chip">SOUL-DRIVEN</span>
        </div>
      </section>

      <section class="panel runtime">
        <div class="title-row">
          <div class="title">运行配置</div>
          <div class="tiny" id="session-chip">session</div>
        </div>
        <div class="field">
          <label for="provider">Provider</label>
          <select id="provider"></select>
        </div>
        <div class="field">
          <label for="model">Model ID</label>
          <input id="model" type="text" placeholder="例如 qwen-plus / gpt-4.1 / deepseek-chat" />
        </div>
        <div class="field">
          <label for="base-url">Base URL</label>
          <input id="base-url" type="text" placeholder="当前 Provider 的 API Base URL" />
        </div>
        <div class="field">
          <label for="api-key">API Key（仅本机保存）</label>
          <input id="api-key" type="password" placeholder="留空表示不修改当前 Key" />
        </div>
        <div class="actions">
          <button class="btn" id="save-runtime-btn" type="button">保存运行配置</button>
        </div>
        <div id="runtime-hint" class="hint">加载配置中...</div>
        <div class="actions">
          <button class="btn" id="new-session-btn" type="button">新会话</button>
          <button class="btn" id="refresh-context-btn" type="button">刷新上下文</button>
        </div>
      </section>

      <section class="panel context">
        <div class="title-row">
          <div class="title">上下文快照</div>
          <div class="tiny" id="context-time">尚未同步</div>
        </div>
        <div class="metric">
          <strong>屏幕时长（今日）</strong>
          <span id="screen-total">--</span>
          <span id="screen-top">--</span>
        </div>
        <div class="sections">
          <section class="block">
            <h3>Soul 配置 <span class="count">soul.md</span></h3>
            <div class="editor">
              <div class="tiny" id="soul-path">路径：加载中...</div>
              <div class="field">
                <textarea id="soul-input" placeholder="在这里编辑 soul.md 的人格与陪伴原则..."></textarea>
              </div>
              <div class="actions">
                <button class="btn" id="save-soul-btn" type="button">保存 Soul</button>
              </div>
            </div>
          </section>
          <section class="block">
            <h3>备忘录 <span class="count" id="notes-count">0</span></h3>
            <ul id="notes-list" class="list"></ul>
            <div id="notes-empty" class="empty">暂无备忘录</div>
          </section>
          <section class="block">
            <h3>近期日程 <span class="count" id="calendar-count">0</span></h3>
            <ul id="calendar-list" class="list"></ul>
            <div id="calendar-empty" class="empty">暂无近期日程</div>
          </section>
        </div>
      </section>
    </aside>

    <section class="panel chat">
      <header class="chat-head">
        <div>
          <h2>对话区</h2>
          <p>逻辑：配置运行参数 -> 发送消息 -> 自动更新上下文</p>
        </div>
        <div id="status" class="status">初始化中</div>
      </header>

      <div id="messages" class="messages"></div>

      <footer class="composer">
        <form id="chat-form">
          <textarea id="input" rows="1" placeholder="输入你现在的状态、情绪或问题..."></textarea>
          <button id="send-btn" type="submit">发送</button>
        </form>
        <div class="composer-note" id="composer-note">
          当前会话会保留上下文记忆；可点击“新会话”重置。
        </div>
      </footer>
    </section>
  </main>

  <script>
    const statusEl = document.getElementById('status');
    const messagesEl = document.getElementById('messages');
    const formEl = document.getElementById('chat-form');
    const inputEl = document.getElementById('input');
    const sendBtnEl = document.getElementById('send-btn');
    const providerEl = document.getElementById('provider');
    const modelEl = document.getElementById('model');
    const baseUrlEl = document.getElementById('base-url');
    const apiKeyEl = document.getElementById('api-key');
    const saveRuntimeBtnEl = document.getElementById('save-runtime-btn');
    const runtimeHintEl = document.getElementById('runtime-hint');
    const contextTimeEl = document.getElementById('context-time');
    const notesListEl = document.getElementById('notes-list');
    const notesCountEl = document.getElementById('notes-count');
    const notesEmptyEl = document.getElementById('notes-empty');
    const calendarListEl = document.getElementById('calendar-list');
    const calendarCountEl = document.getElementById('calendar-count');
    const calendarEmptyEl = document.getElementById('calendar-empty');
    const screenTotalEl = document.getElementById('screen-total');
    const screenTopEl = document.getElementById('screen-top');
    const newSessionBtnEl = document.getElementById('new-session-btn');
    const refreshContextBtnEl = document.getElementById('refresh-context-btn');
    const sessionChipEl = document.getElementById('session-chip');
    const soulInputEl = document.getElementById('soul-input');
    const saveSoulBtnEl = document.getElementById('save-soul-btn');
    const soulPathEl = document.getElementById('soul-path');

    const sessionStorageKey = 'mindbuddy_session_id';
    const providerStorageKey = 'mindbuddy_provider';
    const modelStorageKey = 'mindbuddy_model';

    const state = {
      busy: false,
      providers: [],
      sessionId: getOrCreateSessionId(),
      contextLoaded: false,
      soulPath: ''
    };

    function setStatus(text, warn) {
      statusEl.textContent = text;
      statusEl.className = warn ? 'status warn' : 'status';
    }

    function setRuntimeHint(text, warn) {
      runtimeHintEl.textContent = text;
      runtimeHintEl.className = warn ? 'hint warn' : 'hint';
    }

    function addMessage(role, text, isTyping) {
      const node = document.createElement('div');
      node.className = 'msg ' + role;
      if (isTyping) {
        node.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
      } else {
        node.textContent = text;
      }
      messagesEl.appendChild(node);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return node;
    }

    function getRuntimeSelection() {
      return {
        provider: (providerEl.value || '').trim(),
        model: (modelEl.value || '').trim()
      };
    }

    function getSelectedProviderMeta() {
      return state.providers.find(function(item) {
        return item.id === providerEl.value;
      }) || null;
    }

    function persistRuntimeSelection() {
      const current = getRuntimeSelection();
      localStorage.setItem(providerStorageKey, current.provider);
      localStorage.setItem(modelStorageKey, current.model);
    }

    function updateSessionChip() {
      sessionChipEl.textContent = 'session: ' + state.sessionId.slice(0, 14);
    }

    function formatEvent(event) {
      const start = new Date(event.start);
      if (event.isAllDay) {
        const month = String(start.getMonth() + 1).padStart(2, '0');
        const day = String(start.getDate()).padStart(2, '0');
        return month + '/' + day + ' 全天';
      }
      const hh = String(start.getHours()).padStart(2, '0');
      const mm = String(start.getMinutes()).padStart(2, '0');
      const month = String(start.getMonth() + 1).padStart(2, '0');
      const day = String(start.getDate()).padStart(2, '0');
      return month + '/' + day + ' ' + hh + ':' + mm;
    }

    function renderContext(context) {
      const notes = Array.isArray(context.notes) ? context.notes : [];
      const calendar = Array.isArray(context.calendar) ? context.calendar : [];
      const screenTime = context.screenTime || { totalHours: 0, topApps: [] };

      notesCountEl.textContent = String(notes.length);
      calendarCountEl.textContent = String(calendar.length);
      notesListEl.innerHTML = '';
      calendarListEl.innerHTML = '';

      notesEmptyEl.style.display = notes.length > 0 ? 'none' : 'block';
      calendarEmptyEl.style.display = calendar.length > 0 ? 'none' : 'block';

      notes.slice(0, 6).forEach(function(note) {
        const li = document.createElement('li');
        const title = document.createElement('strong');
        const content = document.createElement('span');
        title.textContent = note.title || 'Untitled';
        const snippet = (note.content || '').slice(0, 72).replace(/\\s+/g, ' ');
        const keywords = Array.isArray(note.keywords) && note.keywords.length
          ? ' · ' + note.keywords.slice(0, 3).join(' / ')
          : '';
        content.textContent = snippet + keywords;
        li.appendChild(title);
        li.appendChild(content);
        notesListEl.appendChild(li);
      });

      calendar.slice(0, 8).forEach(function(event) {
        const li = document.createElement('li');
        const title = document.createElement('strong');
        const content = document.createElement('span');
        title.textContent = event.title || 'Untitled Event';
        content.textContent = formatEvent(event) + (event.calendar ? ' · ' + event.calendar : '');
        li.appendChild(title);
        li.appendChild(content);
        calendarListEl.appendChild(li);
      });

      const total = Number(screenTime.totalHours || 0).toFixed(2);
      screenTotalEl.textContent = total + ' 小时';
      const top = Array.isArray(screenTime.topApps) ? screenTime.topApps : [];
      if (top.length > 0) {
        const first = top[0];
        screenTopEl.textContent = 'Top: ' + first.name + ' (' + Number(first.hours || 0).toFixed(2) + 'h)';
      } else {
        screenTopEl.textContent = 'Top: 暂无数据';
      }

      contextTimeEl.textContent = '已同步 ' + new Date().toLocaleTimeString('zh-CN', { hour12: false });
      state.contextLoaded = true;
    }

    async function loadContext() {
      const response = await fetch('/api/context');
      if (!response.ok) {
        throw new Error('context fetch failed');
      }
      const data = await response.json();
      renderContext(data);
      return data;
    }

    function updateRuntimeHintByProvider() {
      const provider = getSelectedProviderMeta();
      if (!provider) {
        setRuntimeHint('请选择 Provider', true);
        return;
      }
      if (provider.configured) {
        setRuntimeHint(provider.name + ' 已就绪，请填写模型 ID 并开始对话。', false);
      } else {
        setRuntimeHint(provider.name + ' 未就绪：缺少 API Key 或必要 Base URL。', true);
      }
    }

    function hydrateProviderSettings() {
      const provider = getSelectedProviderMeta();
      baseUrlEl.value = provider && provider.baseUrl ? provider.baseUrl : '';
      apiKeyEl.value = '';
      updateRuntimeHintByProvider();
    }

    async function loadRuntimeOptions() {
      const response = await fetch('/api/runtime-config');
      if (!response.ok) {
        throw new Error('models fetch failed');
      }

      const payload = await response.json();
      const providers = Array.isArray(payload.providers) ? payload.providers : [];
      const defaults = payload.defaults || {};
      state.providers = providers;

      providerEl.innerHTML = '';
      providers.forEach(function(item) {
        const option = document.createElement('option');
        option.value = item.id || '';
        option.textContent = (item.configured ? '' : '[未就绪] ') + (item.name || item.id || 'unknown');
        providerEl.appendChild(option);
      });

      const savedProvider = localStorage.getItem(providerStorageKey) || '';
      const savedModel = localStorage.getItem(modelStorageKey) || '';
      const defaultProvider = (defaults.provider || '').trim();
      const defaultModel = (defaults.model || '').trim();

      const candidate = [savedProvider, defaultProvider].find(function(id) {
        return id && providers.some(function(item) { return item.id === id; });
      });

      providerEl.value = candidate || (providers[0] ? providers[0].id : '');
      modelEl.value = savedModel || defaultModel;
      hydrateProviderSettings();
    }

    async function loadHealth() {
      const response = await fetch('/health');
      if (!response.ok) {
        throw new Error('health fetch failed');
      }
      const health = await response.json();
      if (health && health.soulPath) {
        state.soulPath = health.soulPath;
        soulPathEl.textContent = '路径：' + health.soulPath;
      }
    }

    async function loadSoul() {
      const response = await fetch('/api/soul');
      if (!response.ok) {
        throw new Error('soul fetch failed');
      }
      const payload = await response.json();
      if (payload.path) {
        state.soulPath = payload.path;
        soulPathEl.textContent = '路径：' + payload.path;
      }
      soulInputEl.value = payload.content || '';
    }

    async function saveRuntimeConfig() {
      const runtime = getRuntimeSelection();
      if (!runtime.provider) {
        setStatus('请选择 Provider', true);
        return;
      }
      if (!runtime.model) {
        setStatus('请输入 Model ID', true);
        return;
      }

      const body = {
        provider: runtime.provider,
        model: runtime.model,
        baseUrl: (baseUrlEl.value || '').trim(),
      };

      const apiKey = (apiKeyEl.value || '').trim();
      if (apiKey) {
        body.apiKey = apiKey;
      }

      const response = await fetch('/api/runtime-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error('runtime save failed');
      }

      const payload = await response.json();
      state.providers = Array.isArray(payload.providers) ? payload.providers : state.providers;
      persistRuntimeSelection();
      apiKeyEl.value = '';
      hydrateProviderSettings();
    }

    async function saveSoul() {
      const content = soulInputEl.value || '';
      if (!content.trim()) {
        setStatus('Soul 内容不能为空', true);
        return;
      }
      const response = await fetch('/api/soul', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content }),
      });
      if (!response.ok) {
        throw new Error('soul save failed');
      }
      const payload = await response.json();
      if (payload.path) {
        soulPathEl.textContent = '路径：' + payload.path;
      }
      if (typeof payload.content === 'string') {
        soulInputEl.value = payload.content;
      }
    }

    function autoresize() {
      inputEl.style.height = '0px';
      const next = Math.min(inputEl.scrollHeight, 170);
      inputEl.style.height = next + 'px';
    }

    function lockUI(locked) {
      state.busy = locked;
      sendBtnEl.disabled = locked;
      refreshContextBtnEl.disabled = locked;
      newSessionBtnEl.disabled = locked;
      saveRuntimeBtnEl.disabled = locked;
      saveSoulBtnEl.disabled = locked;
      providerEl.disabled = locked;
      modelEl.disabled = locked;
      baseUrlEl.disabled = locked;
      apiKeyEl.disabled = locked;
      soulInputEl.disabled = locked;
    }

    async function sendMessage(text) {
      const runtime = getRuntimeSelection();
      if (!runtime.provider) {
        setStatus('请选择 Provider', true);
        addMessage('system', '请先选择 Provider。', false);
        return;
      }
      if (!runtime.model) {
        setStatus('请输入 Model ID', true);
        addMessage('system', '请先填写模型 ID。', false);
        return;
      }

      persistRuntimeSelection();
      addMessage('user', text, false);
      lockUI(true);
      setStatus('思考中 · ' + runtime.provider + '/' + runtime.model, false);
      const typing = addMessage('assistant', '', true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            sessionId: state.sessionId,
            provider: runtime.provider,
            model: runtime.model
          })
        });

        const payload = await response.json();
        typing.remove();

        if (!response.ok || payload.error) {
          const reason = payload.error || '请求失败';
          addMessage('assistant', '请求失败：' + reason, false);
          setStatus('请求失败', true);
          return;
        }

        const replyText = payload.text || '未获得回复。';
        addMessage('assistant', replyText, false);
        if (payload.context) {
          renderContext(payload.context);
        } else {
          await loadContext();
        }
        const failed = /^(⚠️|请求失败：|请求超时|请求已中断)/.test(replyText);
        if (failed) {
          setStatus('调用失败 · ' + runtime.provider + '/' + runtime.model, true);
        } else {
          setStatus('在线 · ' + runtime.provider + '/' + runtime.model, false);
        }
      } catch (error) {
        typing.remove();
        addMessage('assistant', '网络错误，请重试。', false);
        setStatus('网络错误', true);
      } finally {
        lockUI(false);
        inputEl.focus();
      }
    }

    function getOrCreateSessionId() {
      const saved = localStorage.getItem(sessionStorageKey);
      if (saved) {
        return saved;
      }
      const id = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(sessionStorageKey, id);
      return id;
    }

    function resetSession() {
      state.sessionId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(sessionStorageKey, state.sessionId);
      updateSessionChip();
      messagesEl.innerHTML = '';
      addMessage('system', '已创建新会话。历史上下文不会自动回填到本会话。', false);
      addMessage('assistant', '新会话已就绪。你可以继续聊当前状态。', false);
    }

    inputEl.addEventListener('input', autoresize);
    providerEl.addEventListener('change', function() {
      persistRuntimeSelection();
      hydrateProviderSettings();
    });
    modelEl.addEventListener('change', persistRuntimeSelection);
    modelEl.addEventListener('blur', persistRuntimeSelection);
    baseUrlEl.addEventListener('blur', persistRuntimeSelection);

    saveRuntimeBtnEl.addEventListener('click', async function() {
      if (state.busy) {
        return;
      }
      setStatus('保存运行配置中', false);
      try {
        await saveRuntimeConfig();
        const runtime = getRuntimeSelection();
        setStatus('配置已保存 · ' + runtime.provider + '/' + runtime.model, false);
      } catch {
        setStatus('运行配置保存失败', true);
      }
    });

    saveSoulBtnEl.addEventListener('click', async function() {
      if (state.busy) {
        return;
      }
      setStatus('保存 Soul 中', false);
      try {
        await saveSoul();
        const runtime = getRuntimeSelection();
        if (runtime.provider && runtime.model) {
          setStatus('Soul 已保存 · ' + runtime.provider + '/' + runtime.model, false);
        } else {
          setStatus('Soul 已保存', false);
        }
      } catch {
        setStatus('Soul 保存失败', true);
      }
    });

    refreshContextBtnEl.addEventListener('click', async function() {
      if (state.busy) {
        return;
      }
      setStatus('刷新上下文中', false);
      try {
        await loadContext();
        const runtime = getRuntimeSelection();
        if (runtime.provider && runtime.model) {
          setStatus('在线 · ' + runtime.provider + '/' + runtime.model, false);
        } else {
          setStatus('请选择 Provider / Model', true);
        }
      } catch {
        setStatus('上下文刷新失败', true);
      }
    });

    newSessionBtnEl.addEventListener('click', function() {
      if (state.busy) {
        return;
      }
      resetSession();
    });

    formEl.addEventListener('submit', async function(event) {
      event.preventDefault();
      if (state.busy) {
        return;
      }
      const text = inputEl.value.trim();
      if (!text) {
        return;
      }
      inputEl.value = '';
      autoresize();
      await sendMessage(text);
    });

    (async function bootstrap() {
      updateSessionChip();
      addMessage('assistant', 'MindBuddy 已连接。你可以在左侧直接配置 Provider / Model / API Key / Soul。', false);
      setStatus('初始化中', false);

      try {
        await loadRuntimeOptions();
        await loadHealth();
        await loadSoul();
        await loadContext();
        const runtime = getRuntimeSelection();
        if (runtime.provider && runtime.model) {
          setStatus('在线 · ' + runtime.provider + '/' + runtime.model, false);
        } else {
          setStatus('请选择 Provider / Model', true);
        }
      } catch {
        setStatus('初始化失败', true);
        addMessage('system', '初始化失败：请检查服务配置后刷新页面。', false);
      }

      inputEl.focus();
    })();
  </script>
</body>
</html>`;
}

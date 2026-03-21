export function renderAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MindBuddy</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #f6f4ee;
      --bg-2: #e6efe5;
      --ink: #121714;
      --muted: #4e5d55;
      --card: rgba(255, 255, 255, 0.86);
      --line: rgba(18, 23, 20, 0.12);
      --brand: #0d8f6f;
      --brand-soft: #d3f6ea;
      --accent: #f2a900;
      --user: #0f7f66;
      --assistant: #ffffff;
      --radius-lg: 20px;
      --radius-md: 14px;
      --shadow: 0 16px 40px rgba(16, 38, 29, 0.10);
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
      font-family: "Noto Sans SC", sans-serif;
      background: radial-gradient(circle at 10% 20%, var(--bg-2), var(--bg) 46%, #fefcf7 100%);
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background-image: linear-gradient(120deg, rgba(13, 143, 111, 0.06), rgba(242, 169, 0, 0.05));
      mix-blend-mode: multiply;
    }

    .shell {
      position: relative;
      z-index: 1;
      width: min(1240px, 100%);
      height: 100%;
      margin: 0 auto;
      padding: 18px;
      display: grid;
      gap: 14px;
      grid-template-columns: 340px minmax(0, 1fr);
      animation: rise .55s ease-out;
    }

    .panel {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      backdrop-filter: blur(8px);
    }

    .context {
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    .brand {
      padding: 20px 18px 16px;
      border-bottom: 1px solid var(--line);
    }

    .brand h1 {
      font-family: "Space Grotesk", sans-serif;
      font-size: 28px;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand p {
      margin-top: 8px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.4;
    }

    .pill-row {
      margin-top: 14px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .pill {
      font-family: "Space Grotesk", sans-serif;
      font-size: 11px;
      font-weight: 700;
      color: #0b634e;
      background: var(--brand-soft);
      border: 1px solid rgba(13, 143, 111, 0.28);
      border-radius: 999px;
      padding: 5px 10px;
    }

    .context-scroll {
      padding: 14px;
      overflow: auto;
      min-height: 0;
      display: grid;
      gap: 12px;
    }

    .block {
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.82);
      overflow: hidden;
    }

    .block h2 {
      font-family: "Space Grotesk", sans-serif;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: .3px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .count {
      font-size: 11px;
      background: rgba(18, 23, 20, 0.08);
      border-radius: 999px;
      padding: 2px 7px;
      color: #1f2b24;
    }

    .list {
      list-style: none;
      padding: 10px 12px;
      display: grid;
      gap: 9px;
    }

    .list li {
      border-left: 3px solid #d9e5df;
      padding-left: 8px;
      font-size: 13px;
      line-height: 1.4;
      color: #27342e;
    }

    .list li strong {
      display: block;
      font-size: 12px;
      margin-bottom: 3px;
      color: #11241a;
    }

    .empty {
      color: #6f7d77;
      font-size: 12px;
      padding: 10px 12px 12px;
    }

    .chat {
      min-height: 0;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      overflow: hidden;
    }

    .chat-header {
      padding: 18px 20px 14px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .chat-header h2 {
      font-family: "Space Grotesk", sans-serif;
      font-size: 24px;
      font-weight: 700;
    }

    .sub {
      color: var(--muted);
      font-size: 12px;
      margin-top: 4px;
    }

    .status {
      font-size: 12px;
      font-weight: 600;
      color: #115845;
      background: rgba(13, 143, 111, 0.12);
      border: 1px solid rgba(13, 143, 111, 0.28);
      padding: 5px 10px;
      border-radius: 999px;
      white-space: nowrap;
    }

    .runtime-settings {
      border-top: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.78);
      display: grid;
      gap: 8px;
      grid-template-columns: 150px minmax(0, 1fr);
      align-items: center;
    }

    .runtime-settings label {
      font-size: 12px;
      color: #32433b;
      font-weight: 600;
    }

    .runtime-settings select,
    .runtime-settings input {
      width: 100%;
      border: 1px solid rgba(16, 38, 29, 0.2);
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 13px;
      outline: none;
      background: #fff;
      color: #15241f;
    }

    .runtime-settings select:focus,
    .runtime-settings input:focus {
      border-color: rgba(13, 143, 111, 0.62);
      box-shadow: 0 0 0 3px rgba(13, 143, 111, 0.1);
    }

    .messages {
      overflow: auto;
      padding: 22px 20px;
      display: grid;
      gap: 14px;
      align-content: start;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.32), rgba(255,255,255,0)),
        repeating-linear-gradient(90deg, rgba(18,23,20,0.02), rgba(18,23,20,0.02) 1px, transparent 1px, transparent 26px);
    }

    .msg {
      max-width: min(720px, 88%);
      padding: 11px 13px;
      border-radius: 14px;
      line-height: 1.55;
      font-size: 14px;
      word-break: break-word;
      animation: pop .2s ease-out;
      border: 1px solid transparent;
      white-space: pre-wrap;
    }

    .msg.user {
      margin-left: auto;
      background: var(--user);
      color: white;
      border-color: rgba(0, 0, 0, 0.08);
      box-shadow: 0 6px 20px rgba(15, 127, 102, 0.34);
    }

    .msg.assistant {
      background: var(--assistant);
      color: #1b2922;
      border-color: rgba(18, 23, 20, 0.11);
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
      background: #7f9188;
      animation: blink 1s infinite ease-in-out;
    }

    .typing i:nth-child(2) { animation-delay: .15s; }
    .typing i:nth-child(3) { animation-delay: .3s; }

    .composer {
      border-top: 1px solid var(--line);
      padding: 14px;
      background: rgba(255, 255, 255, 0.9);
    }

    .composer form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
    }

    .composer textarea {
      resize: none;
      min-height: 54px;
      max-height: 160px;
      border-radius: 14px;
      border: 1px solid rgba(16, 38, 29, 0.19);
      background: white;
      padding: 13px 14px;
      font-family: "Noto Sans SC", sans-serif;
      font-size: 14px;
      line-height: 1.4;
      color: #15241f;
      outline: none;
    }

    .composer textarea:focus {
      border-color: rgba(13, 143, 111, 0.62);
      box-shadow: 0 0 0 4px rgba(13, 143, 111, 0.12);
    }

    .composer button {
      height: 54px;
      border: none;
      border-radius: 14px;
      padding: 0 20px;
      font-family: "Space Grotesk", sans-serif;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: .4px;
      color: #1f2a23;
      background: linear-gradient(135deg, #ffd157, #f2a900);
      cursor: pointer;
      transition: transform .14s ease, filter .14s ease;
    }

    .composer button:hover {
      transform: translateY(-1px);
      filter: brightness(1.03);
    }

    .composer button:disabled {
      cursor: not-allowed;
      filter: grayscale(30%);
      opacity: .7;
      transform: none;
    }

    @media (max-width: 1000px) {
      .shell {
        grid-template-columns: 1fr;
        padding: 10px;
        gap: 10px;
      }
      .context {
        max-height: 42vh;
      }
      .chat {
        min-height: 52vh;
      }

      .runtime-settings {
        grid-template-columns: 1fr;
      }
    }

    @keyframes pop {
      from { transform: translateY(6px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes rise {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes blink {
      0%, 80%, 100% { transform: scale(.75); opacity: .42; }
      40% { transform: scale(1); opacity: 1; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <aside class="panel context">
      <header class="brand">
        <h1>MindBuddy <span style="font-size:15px;color:#0f7f66;">PI</span></h1>
        <p>感知你的备忘录和日程，再进行对话回应。</p>
        <div class="pill-row">
          <span class="pill">MEMO</span>
          <span class="pill">SCHEDULE</span>
          <span class="pill">LOCAL-FIRST</span>
        </div>
      </header>
      <div class="context-scroll">
        <section class="block">
          <h2>备忘录 <span class="count" id="notes-count">0</span></h2>
          <ul class="list" id="notes-list"></ul>
          <div class="empty" id="notes-empty">暂无备忘录内容</div>
        </section>
        <section class="block">
          <h2>近期日程 <span class="count" id="calendar-count">0</span></h2>
          <ul class="list" id="calendar-list"></ul>
          <div class="empty" id="calendar-empty">暂无近期日程</div>
        </section>
      </div>
    </aside>

    <section class="panel chat">
      <header class="chat-header">
        <div>
          <h2>对话</h2>
          <p class="sub">基于 PI 流程：Perception -> Integration -> Response</p>
        </div>
        <div class="status" id="status">正在连接</div>
      </header>

      <div class="runtime-settings">
        <label for="provider">厂商 Provider</label>
        <select id="provider"></select>
        <label for="model">模型 ID</label>
        <input id="model" type="text" placeholder="例如: qwen-plus / glm-4-air / deepseek-chat" />
      </div>

      <div class="messages" id="messages"></div>

      <footer class="composer">
        <form id="chat-form">
          <textarea id="input" placeholder="输入你现在的状态、担忧或想法..." rows="1"></textarea>
          <button id="send-btn" type="submit">SEND</button>
        </form>
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
    const notesListEl = document.getElementById('notes-list');
    const notesCountEl = document.getElementById('notes-count');
    const notesEmptyEl = document.getElementById('notes-empty');
    const calendarListEl = document.getElementById('calendar-list');
    const calendarCountEl = document.getElementById('calendar-count');
    const calendarEmptyEl = document.getElementById('calendar-empty');
    const sessionId = getOrCreateSessionId();
    const providerStorageKey = 'mindbuddy_provider';
    const modelStorageKey = 'mindbuddy_model';

    const formatter = new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    function setStatus(text) {
      statusEl.textContent = text;
    }

    function getRuntimeSelection() {
      return {
        provider: (providerEl.value || '').trim(),
        model: (modelEl.value || '').trim()
      };
    }

    function saveRuntimeSelection() {
      const selection = getRuntimeSelection();
      localStorage.setItem(providerStorageKey, selection.provider);
      localStorage.setItem(modelStorageKey, selection.model);
    }

    function addMessage(text, role, isTyping) {
      const bubble = document.createElement('div');
      bubble.className = 'msg ' + role;
      if (isTyping) {
        bubble.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
      } else {
        bubble.textContent = text;
      }
      messagesEl.appendChild(bubble);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return bubble;
    }

    function formatEvent(event) {
      const start = new Date(event.start);
      if (event.isAllDay) {
        const day = String(start.getMonth() + 1).padStart(2, '0') + '/' + String(start.getDate()).padStart(2, '0');
        return day + ' 全天';
      }
      return formatter.format(start);
    }

    function renderContext(context) {
      const notes = Array.isArray(context.notes) ? context.notes : [];
      const calendar = Array.isArray(context.calendar) ? context.calendar : [];

      notesCountEl.textContent = String(notes.length);
      calendarCountEl.textContent = String(calendar.length);

      notesListEl.innerHTML = '';
      calendarListEl.innerHTML = '';

      notesEmptyEl.style.display = notes.length ? 'none' : 'block';
      calendarEmptyEl.style.display = calendar.length ? 'none' : 'block';

      notes.slice(0, 6).forEach(function(note) {
        const li = document.createElement('li');
        const title = document.createElement('strong');
        title.textContent = note.title || 'Untitled';
        const body = document.createElement('span');
        body.textContent = (note.content || '').slice(0, 72).replace(/\\s+/g, ' ');
        li.appendChild(title);
        li.appendChild(body);
        notesListEl.appendChild(li);
      });

      calendar.slice(0, 8).forEach(function(event) {
        const li = document.createElement('li');
        const title = document.createElement('strong');
        title.textContent = event.title || 'Untitled Event';
        const body = document.createElement('span');
        body.textContent = formatEvent(event) + (event.calendar ? ' · ' + event.calendar : '');
        li.appendChild(title);
        li.appendChild(body);
        calendarListEl.appendChild(li);
      });
    }

    async function loadContext() {
      const response = await fetch('/api/context');
      if (!response.ok) {
        throw new Error('context fetch failed');
      }
      const payload = await response.json();
      renderContext(payload);
    }

    async function loadModelOptions() {
      const response = await fetch('/api/models');
      if (!response.ok) {
        throw new Error('models fetch failed');
      }
      const payload = await response.json();
      const providers = Array.isArray(payload.providers) ? payload.providers : [];
      const defaults = payload.defaults || {};

      providerEl.innerHTML = '';
      providers.forEach(function(provider) {
        const option = document.createElement('option');
        option.value = provider.id || '';
        const prefix = provider.configured ? '' : '[未就绪] ';
        option.textContent = prefix + (provider.name || provider.id || 'unknown');
        providerEl.appendChild(option);
      });

      const storedProvider = localStorage.getItem(providerStorageKey) || '';
      const storedModel = localStorage.getItem(modelStorageKey) || '';
      const defaultProvider = (defaults.provider || '').trim();
      const defaultModel = (defaults.model || '').trim();

      const providerOrder = [storedProvider, defaultProvider];
      const candidateProvider = providerOrder.find(function(candidate) {
        return candidate && providers.some(function(item) { return item.id === candidate; });
      }) || (providers[0] && providers[0].id) || '';
      providerEl.value = candidateProvider;
      modelEl.value = storedModel || defaultModel;
    }

    function autoresize() {
      inputEl.style.height = '0px';
      const next = Math.min(inputEl.scrollHeight, 160);
      inputEl.style.height = next + 'px';
    }

    inputEl.addEventListener('input', autoresize);
    providerEl.addEventListener('change', saveRuntimeSelection);
    modelEl.addEventListener('change', saveRuntimeSelection);
    modelEl.addEventListener('blur', saveRuntimeSelection);

    function getOrCreateSessionId() {
      const key = 'mindbuddy_session_id';
      const existing = localStorage.getItem(key);
      if (existing) return existing;
      const id = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(key, id);
      return id;
    }

    formEl.addEventListener('submit', async function(event) {
      event.preventDefault();
      const text = inputEl.value.trim();
      if (!text) return;
      const selection = getRuntimeSelection();
      if (!selection.provider) {
        setStatus('请先选择 Provider');
        addMessage('请先选择一个厂商 Provider。', 'assistant', false);
        return;
      }
      if (!selection.model) {
        setStatus('请先填写模型 ID');
        addMessage('请先填写模型 ID，例如 qwen-plus。', 'assistant', false);
        return;
      }
      saveRuntimeSelection();

      addMessage(text, 'user', false);
      inputEl.value = '';
      autoresize();
      sendBtnEl.disabled = true;
      setStatus('MindBuddy 思考中 · ' + selection.provider + '/' + selection.model);

      const typing = addMessage('', 'assistant', true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            sessionId: sessionId,
            provider: selection.provider,
            model: selection.model
          })
        });

        if (!response.ok) {
          throw new Error('chat failed');
        }

        const payload = await response.json();
        typing.remove();
        addMessage(payload.text || '抱歉，暂时没有拿到回复。', 'assistant', false);
        if (payload.context) {
          renderContext(payload.context);
        }
        setStatus('在线 · ' + selection.provider + '/' + selection.model);
      } catch (error) {
        typing.remove();
        addMessage('请求失败，请稍后重试。', 'assistant', false);
        setStatus('请求失败');
      } finally {
        sendBtnEl.disabled = false;
        inputEl.focus();
      }
    });

    (async function bootstrap() {
      addMessage('我是 MindBuddy。你可以说说今天发生了什么。', 'assistant', false);
      try {
        await loadModelOptions();
        await loadContext();
        const selection = getRuntimeSelection();
        if (selection.provider && selection.model) {
          setStatus('在线 · ' + selection.provider + '/' + selection.model);
        } else {
          setStatus('请选择 Provider 和模型');
        }
      } catch (error) {
        setStatus('初始化失败');
      }
      inputEl.focus();
    })();
  </script>
</body>
</html>`;
}

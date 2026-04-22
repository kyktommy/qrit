import type { SharedEntry } from '../lib/files.ts';

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const ICON_DOWNLOAD = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>`;
const ICON_FOLDER = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6a2 2 0 0 1 2-2h3.5l2 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/></svg>`;
const ICON_ARCHIVE = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>`;
const ICON_CHEV = `<svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 8 8-8 8"/></svg>`;

function renderEntryRows(entries: SharedEntry[]): string {
  if (entries.length === 0) {
    return '<div class="empty">No files shared</div>';
  }
  return entries
    .map((e) => {
      const encoded = encodeURIComponent(e.name);
      if (e.kind === 'dir') {
        const count = e.fileCount ?? 0;
        const meta = `${count} file${count === 1 ? '' : 's'} · ${escapeHtml(e.sizeHuman)}`;
        return `
<a class="row" href="/zip/${encoded}" download>
<span class="icon" aria-hidden="true">${ICON_FOLDER}</span>
<span class="label">${escapeHtml(e.name)}</span>
<span class="meta">${meta}</span>
<span class="chev" aria-hidden="true">${ICON_CHEV}</span>
</a>`;
      }
      return `
<a class="row" href="/send/${encoded}" download>
<span class="icon" aria-hidden="true">${ICON_DOWNLOAD}</span>
<span class="label">${escapeHtml(e.name)}</span>
<span class="meta">${escapeHtml(e.sizeHuman)}</span>
<span class="chev" aria-hidden="true">${ICON_CHEV}</span>
</a>`;
    })
    .join('');
}

function renderZipAllRow(entries: SharedEntry[]): string {
  const hasDir = entries.some((e) => e.kind === 'dir');
  if (entries.length < 2 && !hasDir) return '';
  const totalBytes = entries.reduce((s, e) => s + e.size, 0);
  const totalHuman = formatHuman(totalBytes);
  const count = entries.length;
  const label = count === 1 ? 'Download as zip' : `Download all as zip (${count})`;
  return `
<a class="row row--zip" href="/zip" download>
<span class="icon" aria-hidden="true">${ICON_ARCHIVE}</span>
<span class="label">${label}</span>
<span class="meta">${escapeHtml(totalHuman)}</span>
<span class="chev" aria-hidden="true">${ICON_CHEV}</span>
</a>`;
}

function formatHuman(n: number): string {
  const unit = 1024;
  if (n < unit) return `${n} B`;
  const units = ['K', 'M', 'G', 'T'];
  let div = unit;
  let exp = 0;
  for (let x = Math.floor(n / unit); x >= unit; x = Math.floor(x / unit)) {
    div *= unit;
    exp++;
  }
  return `${(n / div).toFixed(1)} ${units[exp] ?? 'T'}B`;
}

export function renderIndex(entries: SharedEntry[]): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#f2f2f7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<title>QRit Share</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap">
<style>
:root {
  color-scheme: light dark;
  --bg: #f2f2f7;
  --card: #ffffff;
  --text: #000000;
  --text-2: #3c3c43;
  --text-3: rgba(60, 60, 67, 0.6);
  --text-4: rgba(60, 60, 67, 0.3);
  --separator: rgba(60, 60, 67, 0.18);
  --accent: #007aff;
  --accent-press: #0062cc;
  --success: #34c759;
  --danger: #ff3b30;
  --radius: 14px;
  --row-h: 44px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #000000;
    --card: #1c1c1e;
    --text: #ffffff;
    --text-2: #ebebf5;
    --text-3: rgba(235, 235, 245, 0.6);
    --text-4: rgba(235, 235, 245, 0.3);
    --separator: rgba(84, 84, 88, 0.65);
    --accent: #0a84ff;
    --accent-press: #0a6fd9;
  }
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: 'Poppins', 'Noto Sans TC', -apple-system, system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  padding: max(12px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
}
.wrap { max-width: 560px; margin: 0 auto; }
.title {
  font-size: 2.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 16px 4px 24px;
}
.section-label {
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--text-3);
  text-transform: uppercase;
  margin: 24px 16px 8px;
}
.card {
  background: var(--card);
  border-radius: var(--radius);
  overflow: hidden;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: var(--row-h);
  padding: 12px 16px;
  color: var(--text);
  text-decoration: none;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.row + .row::before {
  content: '';
  position: absolute;
  left: 16px; right: 0; top: 0;
  height: 1px;
  background: var(--separator);
  transform: scaleY(0.5);
}
.row:active { background: var(--text-4); }
.row .label {
  flex: 1;
  font-size: 1rem;
  font-weight: 500;
  word-break: break-all;
}
.row .meta {
  font-size: 0.9375rem;
  color: var(--text-3);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.row .chev {
  color: var(--text-4);
  flex-shrink: 0;
}
.empty {
  padding: 20px 16px;
  color: var(--text-3);
  font-size: 0.9375rem;
  text-align: center;
}
.hint {
  font-size: 0.8125rem;
  color: var(--text-3);
  margin: 8px 16px 0;
  line-height: 1.45;
}
.row--pick {
  cursor: pointer;
  color: var(--accent);
  font-weight: 500;
}
.row--pick .label { color: var(--accent); font-weight: 500; }
.row--zip .label, .row--zip .icon { color: var(--accent); font-weight: 600; }
.row .icon {
  width: 22px; height: 22px;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}
input[type=file] { display: none; }
.chips {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--separator);
}
.chips:empty { display: none; }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: var(--bg);
  border-radius: 999px;
  font-size: 0.8125rem;
  color: var(--text-2);
  max-width: 100%;
}
.chip .chip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
.chip .chip-size { color: var(--text-3); font-variant-numeric: tabular-nums; }
.actions { margin-top: 16px; padding: 0 4px; }
.btn {
  display: flex; align-items: center; justify-content: center;
  width: 100%;
  min-height: 50px;
  border: 0;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
  font-family: inherit;
  font-size: 1.0625rem;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, transform 0.08s, opacity 0.15s;
}
.btn:active:not(:disabled) { background: var(--accent-press); transform: scale(0.985); }
.btn:disabled { opacity: 0.45; cursor: default; }
.status {
  min-height: 1.2em;
  margin: 12px 16px 0;
  font-size: 0.875rem;
  color: var(--text-3);
  text-align: center;
  white-space: pre-wrap;
}
.status.ok { color: var(--success); }
.status.err { color: var(--danger); }
</style>
</head>
<body>
<div class="wrap">
<h1 class="title">QRit Share</h1>

<div class="section-label">Shared</div>
<div class="card">
${renderEntryRows(entries)}${renderZipAllRow(entries)}
</div>

<div class="section-label">Send to host</div>
<form id="f" method="post" action="/upload" enctype="multipart/form-data">
<div class="card">
<label class="row row--pick" for="file-input">
<span class="icon" aria-hidden="true">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
</span>
<span class="label">Choose files</span>
<span class="chev" aria-hidden="true">
<svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 8 8-8 8"/></svg>
</span>
</label>
<input id="file-input" type="file" name="files" multiple required>
<div id="chips" class="chips"></div>
</div>
<p class="hint">Uploaded files land in the host's ~/Downloads folder.</p>

<div class="actions">
<button id="send" class="btn" type="submit" disabled>Send</button>
</div>
<div id="s" class="status"></div>
</form>
</div>

<script>
(() => {
  const form = document.getElementById('f');
  const input = document.getElementById('file-input');
  const chips = document.getElementById('chips');
  const btn = document.getElementById('send');
  const status = document.getElementById('s');

  const humanSize = (n) => {
    if (n < 1024) return n + ' B';
    const units = ['KB','MB','GB','TB'];
    let u = -1, v = n;
    do { v /= 1024; u++; } while (v >= 1024 && u < units.length - 1);
    return v.toFixed(1) + ' ' + units[u];
  };

  const render = () => {
    chips.innerHTML = '';
    const files = [...input.files];
    files.forEach(f => {
      const el = document.createElement('span');
      el.className = 'chip';
      el.innerHTML =
        '<span class="chip-name"></span><span class="chip-size"></span>';
      el.querySelector('.chip-name').textContent = f.name;
      el.querySelector('.chip-size').textContent = humanSize(f.size);
      chips.appendChild(el);
    });
    btn.disabled = files.length === 0;
    btn.textContent = files.length > 1 ? 'Send ' + files.length + ' files' : 'Send';
  };

  input.addEventListener('change', render);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!input.files.length) return;
    status.className = 'status';
    status.textContent = 'Sending…';
    btn.disabled = true;
    const prevLabel = btn.textContent;
    btn.textContent = 'Sending…';
    try {
      const res = await fetch('/upload', { method: 'POST', body: new FormData(form) });
      const text = (await res.text()).trim();
      if (res.ok) {
        status.className = 'status ok';
        status.textContent = 'Sent ' + input.files.length + ' file' + (input.files.length === 1 ? '' : 's');
        form.reset();
        render();
      } else {
        status.className = 'status err';
        status.textContent = text || ('Error ' + res.status);
        btn.disabled = false;
        btn.textContent = prevLabel;
      }
    } catch (err) {
      status.className = 'status err';
      status.textContent = 'Error: ' + err.message;
      btn.disabled = false;
      btn.textContent = prevLabel;
    }
  });
})();
</script>
</body>
</html>
`;
}

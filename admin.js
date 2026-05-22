import { getFirebaseConfig } from './firebase-config.js';
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, onSnapshot, query, orderBy }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let db = null;
let unsubscribe = null;
let panelOpen = false;

async function getDb() {
  if (db) return db;
  const config = await getFirebaseConfig();
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  db = getFirestore(app);
  return db;
}

function formatTime(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

function timeSince(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const sec = Math.floor((Date.now() - d) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

function renderDevices(devices) {
  const list = document.getElementById('admin-device-list');
  if (!list) return;

  if (devices.length === 0) {
    list.innerHTML = '<div class="admin-empty">No device sessions recorded yet.</div>';
    return;
  }

  const rows = devices
    .sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      const aT = a.lastSeen?.toDate?.() || new Date(0);
      const bT = b.lastSeen?.toDate?.() || new Date(0);
      return bT - aT;
    })
    .map(d => `
      <tr>
        <td><span class="admin-badge ${d.isOnline ? 'online' : 'offline'}">${d.isOnline ? 'Online' : 'Offline'}</span></td>
        <td class="admin-mono">${(d.sessionId || '').slice(0, 8)}…</td>
        <td>${d.browser || '—'}</td>
        <td>${d.os || '—'}</td>
        <td>${d.screenResolution || '—'}</td>
        <td>${d.language || '—'}</td>
        <td>${formatTime(d.firstSeen)}</td>
        <td title="${formatTime(d.lastSeen)}">${timeSince(d.lastSeen)}</td>
        <td>${d.pageUrl || '—'}</td>
      </tr>
    `).join('');

  list.innerHTML = `
    <div class="admin-summary">${devices.length} session${devices.length !== 1 ? 's' : ''} · ${devices.filter(d => d.isOnline).length} online</div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Status</th><th>Session</th><th>Browser</th><th>OS</th>
            <th>Screen</th><th>Lang</th><th>First Seen</th><th>Last Seen</th><th>Page</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

async function openPanel() {
  const panel = document.getElementById('admin-panel');
  if (!panel) return;
  panel.classList.add('open');
  panelOpen = true;

  try {
    const firestore = await getDb();
    const q = query(collection(firestore, 'device_sessions'), orderBy('lastSeen', 'desc'));
    unsubscribe = onSnapshot(q, snap => {
      const devices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderDevices(devices);
    });
  } catch (err) {
    const list = document.getElementById('admin-device-list');
    if (list) list.innerHTML = `<div class="admin-empty admin-error">Failed to connect to Firestore: ${err.message}</div>`;
  }
}

function closePanel() {
  const panel = document.getElementById('admin-panel');
  if (!panel) return;
  panel.classList.remove('open');
  panelOpen = false;
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
}

// Ctrl+Shift+A toggles the panel
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    panelOpen ? closePanel() : openPanel();
  }
});

// Close button
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('admin-close');
  if (btn) btn.addEventListener('click', closePanel);
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && panelOpen) closePanel();
});

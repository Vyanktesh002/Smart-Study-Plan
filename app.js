import * as Firebase from './firebase-service.js';
/* ── Smart Study Planner — app.js ─────────────────────────────────────────── */

"use strict";

// ── State ──────────────────────────────────────────────────────────────────────
const STATE = {
  subjects: [],
  timetable: [],
  progress: {},
  sessions: [],
  charts: { pie: null, bar: null },
  pomodoro: {
    mode: "work",           // work | short_break | long_break
    running: false,
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    cycleCount: 0,          // completed work cycles in current set of 4
    totalCycles: 0,         // all-time completed work cycles
    subjectId: "",
    subjectName: "",
    timer: null,
    DURATIONS: { work: 25 * 60, short_break: 5 * 60, long_break: 15 * 60 },
    MODE_LABELS: { work: "Focus Time", short_break: "Short Break", long_break: "Long Break" }
  }
};

// ── DOM shortcuts ─────────────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupModal();
  setupStars();
  setupColorPicker();
  setupTimetableButtons();
  setupProgressListener();
  setupPomodoro();
  
  // Sample subject helper for demos
  const sampleBtn = $("#add-sample-subject");
  if (sampleBtn) sampleBtn.addEventListener("click", addSampleSubject);

  loadQuote();
  loadStreak();
  loadSubjects();
  loadTimetable();
  loadProgress();
  loadSessions();
});

// ── Navigation ────────────────────────────────────────────────────────────────
function setupNav() {
  $$(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      $$(".nav-item").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      $$(".view").forEach(v => v.classList.remove("active"));
      $(`#view-${view}`).classList.add("active");

      if (view === "analytics") renderAnalytics();
      if (view === "progress") renderProgress();
    });
  });
}

// ── Quote ─────────────────────────────────────────────────────────────────────
async function loadQuote() {
  try {
    const d = await api("/api/quote");
    $("#quote-text").textContent = d.text;
    $("#quote-author").textContent = d.author;
  } catch {}
}

async function loadStreak() {
  try {
    const d = await api("/api/streak");
    $("#streak-count").textContent = d.streak;
  } catch {}
}

// ── Subjects ──────────────────────────────────────────────────────────────────
async function loadSubjects() {
  const d = await api("/api/subjects");
  STATE.subjects = d.subjects || [];
  renderSubjects();
  populatePomodoroSubjectSelect();
}

function renderSubjects() {
  const grid = $("#subject-grid");
  const empty = $("#subjects-empty");

  // Remove old cards (keep empty state)
  $$(".subject-card", grid).forEach(c => c.remove());

  if (STATE.subjects.length === 0) {
    empty.style.display = "";
    return;
  }
  empty.style.display = "none";

  STATE.subjects.forEach(s => {
    const daysLeft = getDaysLeft(s.exam_date);
    const card = el("div", "subject-card");
    card.style.setProperty("--card-color", s.color || "#6366f1");
    card.innerHTML = `
      <div class="subject-card-header">
        <div class="subject-name">${esc(s.name)}</div>
        <div class="subject-card-actions">
          <button class="card-action-btn" data-edit="${s.id}" title="Edit">✎</button>
          <button class="card-action-btn" data-delete="${s.id}" title="Delete">✕</button>
        </div>
      </div>
      <div class="exam-chip">📅 ${fmt(s.exam_date)} · ${daysLeft}d left</div>
      <div class="subject-meta">
        <div class="meta-item">
          <div class="meta-label">Difficulty</div>
          <div class="meta-value star-display">${"★".repeat(s.difficulty)}${"☆".repeat(5 - s.difficulty)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Prep Level</div>
          <div class="meta-value star-display">${"★".repeat(s.prep_level)}${"☆".repeat(5 - s.prep_level)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Required Hours</div>
          <div class="meta-value">${s.required_hours}h</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Days Left</div>
          <div class="meta-value">${daysLeft}</div>
        </div>
      </div>
      <div class="subject-priority">
        <span class="priority-label">Priority Score</span>
        <span class="priority-value">${s.priority_score || "—"}</span>
      </div>
    `;
    card.querySelector(`[data-edit]`).addEventListener("click", () => openEditModal(s));
    card.querySelector(`[data-delete]`).addEventListener("click", () => deleteSubject(s.id, s.name));
    grid.appendChild(card);
  });
}

// ── Modal: Add / Edit Subject ─────────────────────────────────────────────────
function setupModal() {
  const overlay = $("#modal-overlay");
  const close = () => overlay.classList.remove("open");

  $("#open-add-subject").addEventListener("click", () => openAddModal());
  $("#modal-close").addEventListener("click", close);
  $("#modal-cancel").addEventListener("click", close);
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  $("#modal-save").addEventListener("click", saveSubject);
}

function openAddModal() {
  $("#modal-title").textContent = "Add Subject";
  $("#edit-subject-id").value = "";
  $("#f-name").value = "";
  $("#f-exam-date").value = "";
  $("#f-required-hours").value = "";
  setStars("difficulty-stars", 3); setStars("prep-stars", 3);
  setColor("#6366f1");
  $("#modal-overlay").classList.add("open");
  setTimeout(() => $("#f-name").focus(), 100);
}

function openEditModal(s) {
  $("#modal-title").textContent = "Edit Subject";
  $("#edit-subject-id").value = s.id;
  $("#f-name").value = s.name;
  $("#f-exam-date").value = s.exam_date;
  $("#f-required-hours").value = s.required_hours;
  setStars("difficulty-stars", s.difficulty);
  setStars("prep-stars", s.prep_level);
  setColor(s.color || "#6366f1");
  $("#modal-overlay").classList.add("open");
}

async function saveSubject() {
  const id = $("#edit-subject-id").value;
  const payload = {
    name: $("#f-name").value.trim(),
    exam_date: $("#f-exam-date").value,
    difficulty: parseInt($("#f-difficulty").value),
    prep_level: parseInt($("#f-prep-level").value),
    required_hours: parseFloat($("#f-required-hours").value),
    color: $("#f-color").value
  };

  if (!payload.name || !payload.exam_date || !payload.required_hours) {
    toast("Please fill in all required fields.", "error"); return;
  }

  try {
    if (id) {
      await api(`/api/subjects/${id}`, "PUT", payload);
      toast("Subject updated ✓", "success");
    } else {
      await api("/api/subjects", "POST", payload);
      toast("Subject added ✓", "success");
    }
    $("#modal-overlay").classList.remove("open");
    await loadSubjects();
    if (isViewActive("analytics")) renderAnalytics();
  } catch (e) {
    toast("Error saving subject.", "error");
  }
}

// Add a single sample subject (for demos / professor walkthrough)
async function addSampleSubject() {
  const d = new Date();
  const exam = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  const payload = {
    name: "Sample: Calculus",
    exam_date: exam.toISOString().slice(0, 10),
    difficulty: 4,
    prep_level: 3,
    required_hours: 40,
    color: "#6366f1"
  };
  try {
    await api("/api/subjects", "POST", payload);
    toast("Sample subject added ✓", "success");
    await loadSubjects();
    if (isViewActive("analytics")) renderAnalytics();
  } catch (e) {
    toast("Failed to add sample subject.", "error");
  }
}

async function deleteSubject(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  await api(`/api/subjects/${id}`, "DELETE");
  toast(`"${name}" removed.`);
  await loadSubjects();
  if (isViewActive("analytics")) renderAnalytics();
}

// ── Star Ratings ──────────────────────────────────────────────────────────────
function setupStars() {
  [["difficulty-stars", "f-difficulty"], ["prep-stars", "f-prep-level"]].forEach(([containerId, inputId]) => {
    const container = $(`#${containerId}`);
    $$(".star", container).forEach(star => {
      star.addEventListener("click", () => {
        const val = parseInt(star.dataset.val);
        $(`#${inputId}`).value = val;
        setStars(containerId, val);
      });
      star.addEventListener("mouseenter", () => highlightStars(containerId, parseInt(star.dataset.val)));
      star.addEventListener("mouseleave", () => setStars(containerId, parseInt($(`#${inputId}`).value)));
    });
  });
}

function setStars(containerId, val) {
  $$(`#${containerId} .star`).forEach(s => {
    s.classList.toggle("active", parseInt(s.dataset.val) <= val);
  });
}

function highlightStars(containerId, val) {
  $$(`#${containerId} .star`).forEach(s => {
    s.style.color = parseInt(s.dataset.val) <= val ? "var(--amber)" : "var(--bg-3)";
  });
}

// ── Color Picker ──────────────────────────────────────────────────────────────
function setupColorPicker() {
  $$(".color-swatch").forEach(sw => {
    sw.addEventListener("click", () => setColor(sw.dataset.color));
  });
}

function setColor(color) {
  $("#f-color").value = color;
  $$(".color-swatch").forEach(sw => sw.classList.toggle("selected", sw.dataset.color === color));
}

// ── Timetable ─────────────────────────────────────────────────────────────────
function setupTimetableButtons() {
  $("#generate-timetable").addEventListener("click", async () => {
    const maxH = parseFloat($("#max-daily-hours").value) || 6;
    const btn = $("#generate-timetable");
    btn.textContent = "Generating…";
    btn.disabled = true;
    try {
      const d = await api("/api/timetable/generate", "POST", { max_daily_hours: maxH });
      STATE.timetable = d.timetable;
      renderTimetable();
      toast("Timetable generated ✓", "success");
    } catch {
      toast("Error generating timetable.", "error");
    } finally {
      btn.textContent = "Generate";
      btn.disabled = false;
    }
  });

  $("#export-timetable").addEventListener("click", () => {
    window.location.href = "/api/timetable/export";
  });
}

async function loadTimetable() {
  const d = await api("/api/timetable");
  STATE.timetable = d.timetable || [];
  renderTimetable();
}

function renderTimetable() {
  const container = $("#timetable-container");
  const empty = $("#timetable-empty");
  $$(".timetable-day", container).forEach(c => c.remove());

  if (!STATE.timetable.length) {
    empty.style.display = "";
    return;
  }
  empty.style.display = "none";

  STATE.timetable.forEach(day => {
    const div = el("div", "timetable-day");
    div.innerHTML = `
      <div class="day-header">
        <div>
          <div class="day-date">${fmtLong(day.date)}</div>
          <div class="day-name">${day.day_name}</div>
        </div>
        <div class="day-hours-badge">${day.total_hours} hrs</div>
      </div>
      <div class="day-slots">
        ${day.slots.map(slot => `
          <div class="day-slot" style="--slot-color:${slot.color || "var(--accent)"}">
            <span class="slot-time">${slot.start_time} – ${slot.end_time}</span>
            <span class="slot-subject">${esc(slot.subject)}</span>
            <span class="slot-hours">${slot.hours}h</span>
          </div>
        `).join("")}
      </div>
    `;
    // Toggle collapse
    $(".day-header", div).addEventListener("click", () => {
      $(".day-slots", div).style.display =
        $(".day-slots", div).style.display === "none" ? "" : "none";
    });
    container.appendChild(div);
  });
}

// ── Progress ──────────────────────────────────────────────────────────────────
function setupProgressListener() {
  // Event delegation for progress updates
  document.addEventListener("change", async e => {
    const input = e.target;
    if (input.classList.contains("progress-hours-input")) {
      const subjectId = input.dataset.sid;
      const studiedHours = parseFloat(input.value) || 0;
      const subject = STATE.subjects.find(s => s.id === subjectId);
      if (!subject) return;
      const pct = Math.min(100, Math.round((studiedHours / subject.required_hours) * 100));
      await api(`/api/progress/${subjectId}`, "PUT", {
        subject_id: subjectId,
        subject_name: subject.name,
        studied_hours: studiedHours,
        required_hours: subject.required_hours,
        pct
      });
      STATE.progress[subjectId] = { studied_hours: studiedHours, required_hours: subject.required_hours, pct };
      // Update bar
      const bar = document.querySelector(`[data-bar="${subjectId}"]`);
      const pctEl = document.querySelector(`[data-pct="${subjectId}"]`);
      if (bar) bar.style.width = pct + "%";
      if (pctEl) pctEl.textContent = pct + "%";
    }
  });
}

async function loadProgress() {
  const d = await api("/api/progress");
  STATE.progress = {};
  (d.progress || []).forEach(p => { STATE.progress[p.id] = p; });
}

async function renderProgress() {
  await loadProgress();
  await loadSessions();
  const grid = $("#progress-grid");
  const empty = $("#progress-empty");
  $$(".progress-card", grid).forEach(c => c.remove());

  if (!STATE.subjects.length) { empty.style.display = ""; return; }
  empty.style.display = "none";

  for (const s of STATE.subjects) {
    const p = STATE.progress[s.id] || {};
    const studiedHours = p.studied_hours || 0;
    const pct = p.pct || Math.min(100, Math.round((studiedHours / s.required_hours) * 100));

    // Filter Pomodoro sessions for this subject
    const subSessions = STATE.sessions.filter(ss => ss.subject_id === s.id && ss.type === "work");
    const pomoDots = subSessions.slice(0, 12).map(ss => {
      const t = new Date(ss.timestamp);
      return `<span class="pomo-chip">🍅 ${ss.duration_minutes}m · ${t.toLocaleDateString()}</span>`;
    }).join("");

    const card = el("div", "progress-card");
    card.innerHTML = `
      <div class="progress-card-header">
        <div>
          <div class="progress-subject-name" style="color:${s.color}">${esc(s.name)}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${fmtLong(s.exam_date)} · ${getDaysLeft(s.exam_date)}d left</div>
        </div>
        <div class="progress-pct" data-pct="${s.id}" style="color:${s.color}">${pct}%</div>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" data-bar="${s.id}" style="--bar-color:${s.color};width:0%"></div>
      </div>
      <div class="progress-controls">
        <label>Hours studied:</label>
        <input type="number" class="progress-hours-input" data-sid="${s.id}"
               value="${studiedHours}" min="0" max="${s.required_hours * 2}" step="0.5" />
        <span style="font-size:13px;color:var(--text-muted)">/ ${s.required_hours}h total</span>
      </div>
      ${subSessions.length ? `
        <div class="pomodoro-history">
          <h4>Pomodoro Sessions (${subSessions.length})</h4>
          ${pomoDots}
        </div>` : ""}
    `;
    grid.appendChild(card);

    // Animate bar in after render
    requestAnimationFrame(() => {
      setTimeout(() => {
        const bar = card.querySelector(`[data-bar="${s.id}"]`);
        if (bar) bar.style.width = pct + "%";
      }, 100);
    });
  }
}

// ── Analytics ─────────────────────────────────────────────────────────────────
async function renderAnalytics() {
  await loadSubjects();
  await loadProgress();

  const subjects = STATE.subjects;
  if (!subjects.length) return;

  const labels = subjects.map(s => s.name);
  const scores = subjects.map(s => s.priority_score || 0);
  const hours = subjects.map(s => s.required_hours);
  const colors = subjects.map(s => s.color || "#6366f1");

  // Pie chart — priority-weighted allocation
  const pieCtx = $("#chart-pie").getContext("2d");
  if (STATE.charts.pie) STATE.charts.pie.destroy();
  STATE.charts.pie = new Chart(pieCtx, {
    type: "doughnut",
    data: { labels, datasets: [{ data: scores, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: { position: "right", labels: { color: "#7a8290", font: { family: "DM Sans", size: 13 }, padding: 16, boxWidth: 12 } }
      }
    }
  });

  // Bar chart — required hours
  const barCtx = $("#chart-bar").getContext("2d");
  if (STATE.charts.bar) STATE.charts.bar.destroy();
  STATE.charts.bar = new Chart(barCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: hours,
        backgroundColor: colors.map(c => c + "cc"),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#7a8290", font: { family: "DM Sans", size: 12 } }, grid: { color: "rgba(255,255,255,0.04)" } },
        y: { ticks: { color: "#7a8290", font: { family: "DM Sans", size: 12 } }, grid: { color: "rgba(255,255,255,0.04)" } }
      }
    }
  });

  // Progress rings
  const rings = $("#progress-rings");
  rings.innerHTML = "";
  subjects.forEach(s => {
    const p = STATE.progress[s.id] || {};
    const pct = p.pct || 0;
    const circumference = 2 * Math.PI * 36;
    const offset = circumference * (1 - pct / 100);

    const item = el("div", "ring-item");
    item.innerHTML = `
      <svg class="ring-svg" viewBox="0 0 80 80">
        <circle class="ring-track" cx="40" cy="40" r="36"/>
        <circle class="ring-fill" cx="40" cy="40" r="36"
          stroke="${s.color}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${circumference}"
          data-offset="${offset}"/>
      </svg>
      <div style="position:absolute;font-family:var(--font-serif);font-size:15px;color:var(--text)">${pct}%</div>
      <div class="ring-label">${esc(s.name)}</div>
    `;
    item.style.position = "relative";
    rings.appendChild(item);

    // Animate
    requestAnimationFrame(() => {
      setTimeout(() => {
        const circle = item.querySelector(".ring-fill");
        if (circle) circle.style.strokeDashoffset = offset;
      }, 200);
    });
  });
}

// ── Pomodoro Timer ────────────────────────────────────────────────────────────
function setupPomodoro() {
  const P = STATE.pomodoro;

  // Mode tabs
  $$(".mode-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      if (P.running) return;
      $$(".mode-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      P.mode = tab.dataset.mode;
      P.totalSeconds = P.DURATIONS[P.mode];
      P.remainingSeconds = P.totalSeconds;
      updateTimerDisplay();
    });
  });

  $("#pomo-toggle").addEventListener("click", togglePomodoro);
  $("#pomo-reset").addEventListener("click", resetPomodoro);
  $("#pomo-skip").addEventListener("click", skipPomodoro);

  $("#pomodoro-subject").addEventListener("change", () => {
    const sel = $("#pomodoro-subject");
    P.subjectId = sel.value;
    P.subjectName = sel.options[sel.selectedIndex].text;
  });

  updateTimerDisplay();
}

function togglePomodoro() {
  const P = STATE.pomodoro;
  if (P.running) {
    P.running = false;
    clearInterval(P.timer);
    $("#pomo-toggle").textContent = "Resume";
  } else {
    P.running = true;
    $("#pomo-toggle").textContent = "Pause";
    P.timer = setInterval(tickPomodoro, 1000);
  }
}

function tickPomodoro() {
  const P = STATE.pomodoro;
  P.remainingSeconds--;
  updateTimerDisplay();
  if (P.remainingSeconds <= 0) {
    completePomodoro();
  }
}

async function completePomodoro() {
  const P = STATE.pomodoro;
  P.running = false;
  clearInterval(P.timer);
  playBell();

  // Save session
  const session = {
    subject_id: P.subjectId,
    subject_name: P.subjectName || "General",
    duration_minutes: Math.round(P.DURATIONS[P.mode] / 60),
    type: P.mode
  };

  try {
    await api("/api/pomodoro/sessions", "POST", session);
    await loadSessions();
    loadStreak();
    renderSessionLog();
  } catch {}

  if (P.mode === "work") {
    P.cycleCount = (P.cycleCount + 1) % 4;
    P.totalCycles++;
    updateCycleDots();
    // Auto-switch to break
    const nextMode = P.cycleCount === 0 ? "long_break" : "short_break";
    switchMode(nextMode);
    toast(`Focus session complete! 🍅 Time for a ${nextMode === "long_break" ? "long" : "short"} break.`, "success");
  } else {
    switchMode("work");
    toast("Break over! Ready to focus? 💪", "success");
  }

  $("#pomo-toggle").textContent = "Start";
}

function skipPomodoro() {
  const P = STATE.pomodoro;
  P.running = false;
  clearInterval(P.timer);
  const nextMode = P.mode === "work" ? (P.cycleCount === 3 ? "long_break" : "short_break") : "work";
  switchMode(nextMode);
  $("#pomo-toggle").textContent = "Start";
}

function resetPomodoro() {
  const P = STATE.pomodoro;
  P.running = false;
  clearInterval(P.timer);
  P.remainingSeconds = P.totalSeconds;
  updateTimerDisplay();
  $("#pomo-toggle").textContent = "Start";
}

function switchMode(mode) {
  const P = STATE.pomodoro;
  P.mode = mode;
  P.totalSeconds = P.DURATIONS[mode];
  P.remainingSeconds = P.totalSeconds;
  $$(".mode-tab").forEach(t => t.classList.toggle("active", t.dataset.mode === mode));
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const P = STATE.pomodoro;
  const m = Math.floor(P.remainingSeconds / 60);
  const s = P.remainingSeconds % 60;
  $("#timer-display").textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  $("#timer-mode-label").textContent = P.MODE_LABELS[P.mode];
  $("#timer-cycle").textContent = `Cycle ${(P.cycleCount % 4) + 1} / 4`;

  // SVG ring
  const circumference = 603.2;
  const pct = P.remainingSeconds / P.totalSeconds;
  const offset = circumference * (1 - pct);
  const ring = $("#timer-ring");
  ring.style.strokeDashoffset = offset;
  ring.setAttribute("class", "timer-ring" + (P.mode === "short_break" ? " break" : P.mode === "long_break" ? " long-break" : ""));
}

function updateCycleDots() {
  $$(".cycle-dot").forEach((dot, i) => {
    dot.classList.toggle("done", i < STATE.pomodoro.cycleCount);
  });
}

function populatePomodoroSubjectSelect() {
  const sel = $("#pomodoro-subject");
  const curr = sel.value;
  sel.innerHTML = `<option value="">— General —</option>`;
  STATE.subjects.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    sel.appendChild(opt);
  });
  sel.value = curr;
}

// Bell sound via Web Audio API
function playBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
  } catch {}
}

// ── Session Log ───────────────────────────────────────────────────────────────
async function loadSessions() {
  try {
    const d = await api("/api/pomodoro/sessions");
    STATE.sessions = d.sessions || [];
    renderSessionLog();
  } catch {}
}

function renderSessionLog() {
  const list = $("#session-log-list");
  list.innerHTML = "";

  if (!STATE.sessions.length) {
    list.innerHTML = `<div class="empty-state-sm">No sessions yet today.</div>`;
    return;
  }

  const today = new Date().toDateString();
  const todaySessions = STATE.sessions.filter(s => {
    try { return new Date(s.timestamp).toDateString() === today; } catch { return false; }
  });

  const toShow = todaySessions.length ? todaySessions : STATE.sessions.slice(0, 10);

  toShow.forEach(s => {
    const t = new Date(s.timestamp);
    const timeStr = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const item = el("div", "session-item");
    const typeLabel = s.type === "work" ? "🍅 Focus" : s.type === "short_break" ? "☕ Break" : "🌙 Long Break";
    item.innerHTML = `
      <span class="session-dot ${s.type}"></span>
      <span class="session-subject">${esc(s.subject_name || "General")} <span style="font-weight:300;color:var(--text-dim)">${typeLabel}</span></span>
      <span class="session-time">${timeStr}</span>
      <span class="session-dur">${s.duration_minutes}m</span>
    `;
    list.appendChild(item);
  });
}

// ── Utilities ─────────────────────────────────────────────────────────────────
async function api(url, method = "GET", body = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function esc(str) {
  return String(str || "").replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])
  );
}

function getDaysLeft(dateStr) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date(); today.setHours(0,0,0,0);
    return Math.max(0, Math.round((d - today) / 86400000));
  } catch { return 0; }
}

function fmt(dateStr) {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return dateStr; }
}

function fmtLong(dateStr) {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

function isViewActive(name) {
  return $(`#view-${name}`)?.classList.contains("active");
}

function toast(msg, type = "") {
  const t = $("#toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

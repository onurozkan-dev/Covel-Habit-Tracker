// js/tracker.js

let currentStart = new Date();
currentStart.setDate(currentStart.getDate() - currentStart.getDay() + 1);

function formatRange(date) {
  const opt = { month: 'short', day: 'numeric' };
  const start = date.toLocaleDateString('en-US', opt);
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const endStr = end.toLocaleDateString('en-US', opt);
  return `${start} – ${endStr}`;
}

function renderHabits(filter = '') {
  let habits = JSON.parse(localStorage.getItem('covel_habits') || '[]');
  const tbody = document.getElementById('habits-body');
  tbody.innerHTML = '';

  // Support old string-only habits
  habits = habits.map(h =>
    typeof h === 'string' ? { name: h, category: 'Other', color: '#4caf50' } : h
  );

  // Filter habits by search input
  const filteredHabits = habits.filter(habit =>
    habit.name.toLowerCase().includes(filter.toLowerCase())
  );

  filteredHabits.forEach((habit, idx) => {
    const tr = document.createElement('tr');
    tr.draggable = true;
    tr.dataset.index = idx;
    tr.addEventListener('dragstart', (e) => {
      tr.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', idx);
    });
    tr.addEventListener('dragend', () => {
      tr.classList.remove('dragging');
    });
    tr.addEventListener('dragover', (e) => {
      e.preventDefault();
      tr.classList.add('drag-over');
    });
    tr.addEventListener('dragleave', () => {
      tr.classList.remove('drag-over');
    });
    tr.addEventListener('drop', (e) => {
      e.preventDefault();
      tr.classList.remove('drag-over');
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const toIdx = idx;
      if (fromIdx === toIdx) return;
      // Reorder habits array
      let habits = JSON.parse(localStorage.getItem('covel_habits') || '[]');
      habits = habits.map(h => typeof h === 'string' ? { name: h, category: 'Other', color: '#4caf50' } : h);
      const [moved] = habits.splice(fromIdx, 1);
      habits.splice(toIdx, 0, moved);
      localStorage.setItem('covel_habits', JSON.stringify(habits));
      updateWeek();
    });

    // Progress ring column
    const progressKey = `${habit.name}-${formatRange(currentStart)}`;
    const progressState = JSON.parse(localStorage.getItem(progressKey) || '{}');
    const checkedDays = Object.values(progressState).filter(Boolean).length;
    const percent = Math.round((checkedDays / 7) * 100);
    const ring = document.createElement('td');
    ring.style.width = '48px';
    ring.style.textAlign = 'center';
    ring.innerHTML = `
      <div class="progress-ring" style="--p:${percent};">
        <span class="progress-label">${percent}%</span>
      </div>
    `;
    tr.appendChild(ring);

    // --- Streaks & Achievements ---
    // Calculate streak (consecutive checked days, including previous weeks)
    let streak = 0;
    let today = new Date(currentStart);
    today.setDate(today.getDate() + (new Date().getDay() || 7) - 1); // today in current week
    let dayIdx = today.getDay();
    let weekStart = new Date(currentStart);
    let keepGoing = true;
    while (keepGoing) {
      const weekKey = `${habit.name}-${formatRange(weekStart)}`;
      const state = JSON.parse(localStorage.getItem(weekKey) || '{}');
      for (let d = dayIdx; d >= 0; d--) {
        if (state[d]) {
          streak++;
        } else {
          keepGoing = false;
          break;
        }
      }
      dayIdx = 6;
      weekStart.setDate(weekStart.getDate() - 7);
    }
    // Show streak icon and count
    const streakTd = document.createElement('td');
    streakTd.style.textAlign = 'center';
    if (streak > 0) {
      streakTd.innerHTML = `<span title="Current streak"><span style="font-size:1.2em;">🔥</span> ${streak}</span>`;
      // Achievements
      if (streak >= 30) {
        streakTd.innerHTML += ' <span title="30-day streak!" style="font-size:1.1em;">🏆</span>';
      } else if (streak >= 14) {
        streakTd.innerHTML += ' <span title="14-day streak!" style="font-size:1.1em;">🥇</span>';
      } else if (streak >= 7) {
        streakTd.innerHTML += ' <span title="7-day streak!" style="font-size:1.1em;">🥈</span>';
      }
    }
    tr.appendChild(streakTd);

    // 1) Habit name (with color indicator)
    const tdName = document.createElement('td');
    tdName.className = 'habit-name';
    tdName.textContent = habit.name;
    tdName.style.cursor = 'pointer';
    tdName.title = 'Click to edit';
    tdName.style.borderLeft = `8px solid ${habit.color}`;
    tdName.addEventListener('click', () => {
      // Replace with input for inline editing
      const input = document.createElement('input');
      input.type = 'text';
      input.value = habit.name;
      input.style.width = '90%';
      input.style.fontSize = '1em';
      tdName.textContent = '';
      tdName.appendChild(input);
      input.focus();
      input.select();

      function saveEdit() {
        const newName = input.value.trim();
        if (!newName || newName === habit.name) {
          tdName.textContent = habit.name;
          return;
        }
        // Prevent duplicate names
        const allHabits = JSON.parse(localStorage.getItem('covel_habits') || '[]').map(h => typeof h === 'string' ? { name: h, category: 'Other', color: '#4caf50' } : h);
        if (allHabits.some(h => h.name === newName)) {
          alert('Habit name already exists!');
          input.focus();
          return;
        }
        // Update habit name in localStorage
        const updatedHabits = allHabits.map(h => h.name === habit.name ? { ...h, name: newName } : h);
        localStorage.setItem('covel_habits', JSON.stringify(updatedHabits));
        // Rename all state keys for this habit
        Object.keys(localStorage)
          .filter(k => k.startsWith(`${habit.name}-`))
          .forEach(k => {
            const val = localStorage.getItem(k);
            const newKey = k.replace(`${habit.name}-`, `${newName}-`);
            localStorage.setItem(newKey, val);
            localStorage.removeItem(k);
          });
        updateWeek();
        showToast('Habit renamed!');
      }

      input.addEventListener('blur', saveEdit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          saveEdit();
        } else if (e.key === 'Escape') {
          tdName.textContent = habit.name;
        }
      });
    });
    tr.appendChild(tdName);

    // 1b) Category column
    const tdCategory = document.createElement('td');
    tdCategory.textContent = habit.category || 'Other';
    tr.appendChild(tdCategory);

    // 2) 7 days of checkboxes
    const key = `${habit.name}-${formatRange(currentStart)}`;
    const state = JSON.parse(localStorage.getItem(key) || '{}');

    for (let day = 0; day < 7; day++) {
      const td = document.createElement('td');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.habit = habit.name;
      cb.dataset.day = day;
      if (state[day]) cb.checked = true;

      cb.addEventListener('change', () => {
        const newState = JSON.parse(localStorage.getItem(key) || '{}');
        newState[day] = cb.checked;
        localStorage.setItem(key, JSON.stringify(newState));
      });

      td.appendChild(cb);
      tr.appendChild(td);
    }

    // 3) Delete button
    const tdAction = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.textContent = '\u{1F5D1}';
    delBtn.className = 'delete-btn';
    delBtn.title = 'Delete habit';
    delBtn.addEventListener('click', () => {
      // Remove habit from list
      let current = JSON.parse(localStorage.getItem('covel_habits') || '[]').map(h => typeof h === 'string' ? { name: h, category: 'Other', color: '#4caf50' } : h);
      current = current.filter(h => h.name !== habit.name);
      localStorage.setItem('covel_habits', JSON.stringify(current));

      // Clear all stored state for this habit
      Object.keys(localStorage)
        .filter(k => k.startsWith(`${habit.name}-`))
        .forEach(k => localStorage.removeItem(k));

      // Re-render table
      updateWeek();
      showToast('Habit deleted!');
    });
    tdAction.appendChild(delBtn);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

function updateWeek() {
  document.getElementById('week-range').textContent = formatRange(currentStart);
  renderHabits(document.getElementById('habit-search')?.value || '');
}

// Week nav buttons
document.getElementById('prev-week').addEventListener('click', () => {
  currentStart.setDate(currentStart.getDate() - 7);
  updateWeek();
});
document.getElementById('next-week').addEventListener('click', () => {
  currentStart.setDate(currentStart.getDate() + 7);
  updateWeek();
});

// Initial load
updateWeek();

// Search bar event listener
const searchInput = document.getElementById('habit-search');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    renderHabits(e.target.value);
  });
}

// Add CSS for .progress-ring and .progress-label via JS if not present
if (!document.getElementById('progress-ring-style')) {
  const style = document.createElement('style');
  style.id = 'progress-ring-style';
  style.textContent = `
    .progress-ring {
      --size: 36px;
      --thickness: 5px;
      width: var(--size);
      height: var(--size);
      border-radius: 50%;
      background: conic-gradient(#4caf50 calc(var(--p,0) * 1%), #eee 0);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .progress-label {
      position: absolute;
      font-size: 0.8em;
      color: #222;
      left: 0; right: 0; top: 0; bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

// Toast container setup
if (!document.getElementById('toast-container')) {
  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.style.position = 'fixed';
  toastContainer.style.bottom = '32px';
  toastContainer.style.left = '50%';
  toastContainer.style.transform = 'translateX(-50%)';
  toastContainer.style.zIndex = '9999';
  toastContainer.style.display = 'flex';
  toastContainer.style.flexDirection = 'column';
  toastContainer.style.alignItems = 'center';
  document.body.appendChild(toastContainer);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 500);
  }, 1800);
}

// Add CSS for toast
if (!document.getElementById('toast-style')) {
  const style = document.createElement('style');
  style.id = 'toast-style';
  style.textContent = `
    .toast {
      background: #222;
      color: #fff;
      padding: 0.75em 1.5em;
      border-radius: 24px;
      margin: 0.5em 0;
      font-size: 1em;
      opacity: 1;
      transition: opacity 0.5s;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
      pointer-events: none;
    }
    .toast.fade-out {
      opacity: 0;
    }
  `;
  document.head.appendChild(style);
}

// --- Custom Theme Loader ---
(function() {
  const root = document.documentElement;
  const theme = JSON.parse(localStorage.getItem('covel_theme') || '{}');
  if (theme.primary) root.style.setProperty('--primary-accent', theme.primary);
  if (theme.secondary) root.style.setProperty('--secondary-accent', theme.secondary);
})();

// --- Dashboard Overview Logic ---
function renderDashboardOverview() {
  // Habits data
  let habits = JSON.parse(localStorage.getItem('covel_habits') || '[]');
  habits = habits.map(h => typeof h === 'string' ? { name: h, category: 'Other', color: '#4caf50' } : h);
  const week = formatRange(currentStart);

  // Calculate overall progress
  let totalChecks = 0;
  let totalPossible = habits.length * 7;
  let habitProgress = [];
  let timeline = [];

  habits.forEach(habit => {
    const key = `${habit.name}-${week}`;
    const state = JSON.parse(localStorage.getItem(key) || '{}');
    const checked = Object.values(state).filter(Boolean).length;
    totalChecks += checked;
    habitProgress.push({
      name: habit.name,
      color: habit.color,
      checked,
      percent: Math.round((checked / 7) * 100)
    });
    // Timeline: add checked days
    Object.entries(state).forEach(([day, val]) => {
      if (val) {
        timeline.push({
          label: `${habit.name} completed`,
          date: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][day],
        });
      }
    });
  });

  // Update progress ring
  const percent = totalPossible ? Math.round((totalChecks / totalPossible) * 100) : 0;
  const ring = document.getElementById('dashboard-ring');
  const percentLabel = document.getElementById('dashboard-percent');
  if (ring) ring.style.background = `conic-gradient(var(--primary-accent, #4caf50) 0% ${percent}%, #eee ${percent}% 100%)`;
  if (percentLabel) percentLabel.textContent = percent + '%';

  // Update targets list
  const targetsList = document.getElementById('dashboard-targets-list');
  if (targetsList) {
    targetsList.innerHTML = '';
    habitProgress.forEach(h => {
      const li = document.createElement('li');
      li.className = 'dashboard-target-item';
      li.innerHTML = `
        <span class="dashboard-target-label">${h.name}</span>
        <span class="dashboard-target-bar">
          <span class="dashboard-target-bar-inner" style="width:${h.percent}%;background:linear-gradient(90deg, var(--primary-accent, #4caf50), var(--secondary-accent, #2196f3));"></span>
        </span>
        <span style="margin-left:0.7em;font-size:0.95em;">${h.checked}/7</span>
      `;
      targetsList.appendChild(li);
    });
  }

  // Update timeline (show most recent 7 completions)
  const timelineList = document.getElementById('dashboard-timeline-list');
  if (timelineList) {
    timelineList.innerHTML = '';
    timeline.slice(-7).reverse().forEach(item => {
      const li = document.createElement('li');
      li.className = 'dashboard-timeline-item';
      li.innerHTML = `<span class="dashboard-timeline-label">${item.label}</span><span class="dashboard-timeline-date">${item.date}</span>`;
      timelineList.appendChild(li);
    });
  }
}
// Call on load and after updates
renderDashboardOverview();
// Patch updateWeek to also update dashboard
const origUpdateWeek = updateWeek;
updateWeek = function() {
  origUpdateWeek();
  renderDashboardOverview();
};

// --- JSON Import/Export Logic ---
function exportData() {
  const habits = localStorage.getItem('covel_habits');
  const allKeys = Object.keys(localStorage);
  const progress = {};
  allKeys.forEach(k => {
    if (k !== 'covel_habits' && k !== 'covel_theme') {
      progress[k] = localStorage.getItem(k);
    }
  });
  const theme = localStorage.getItem('covel_theme');
  const data = { habits: JSON.parse(habits || '[]'), progress, theme: theme ? JSON.parse(theme) : undefined };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'covel_data.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.habits) localStorage.setItem('covel_habits', JSON.stringify(data.habits));
      if (data.theme) localStorage.setItem('covel_theme', JSON.stringify(data.theme));
      if (data.progress) {
        Object.entries(data.progress).forEach(([k, v]) => {
          localStorage.setItem(k, v);
        });
      }
      showToast('Data imported!');
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      showToast('Import failed: Invalid file');
    }
  };
  reader.readAsText(file);
}

document.getElementById('export-json')?.addEventListener('click', exportData);
document.getElementById('import-json')?.addEventListener('click', () => {
  document.getElementById('import-json-file').click();
});
document.getElementById('import-json-file')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) importData(file);
});

// --- Onboarding Tour Logic ---
function startOnboardingTour() {
  const steps = [
    {
      selector: '#dashboard-ring',
      text: 'This ring shows your overall weekly progress!'
    },
    {
      selector: '#habit-search',
      text: 'Use this search bar to quickly find your habits.'
    },
    {
      selector: '.btn-gradient[href="add.html"]',
      text: 'Click here to add a new habit.'
    },
    {
      selector: '#export-json',
      text: 'Export all your data as a backup.'
    },
    {
      selector: '#import-json',
      text: 'Import your data from a backup file.'
    }
  ];
  let step = 0;
  const overlay = document.getElementById('onboarding-tour');
  function showStep() {
    const s = steps[step];
    const el = document.querySelector(s.selector);
    if (!el) return finishTour();
    const rect = el.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.position = 'fixed';
    overlay.style.left = 0;
    overlay.style.top = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.35)';
    overlay.style.zIndex = 10000;
    overlay.innerHTML = '';
    // Tooltip positioning
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'rgba(255,255,255,0.98)';
    tooltip.style.padding = '1.2em 1.5em';
    tooltip.style.borderRadius = '14px';
    tooltip.style.boxShadow = '0 2px 16px rgba(0,0,0,0.13)';
    tooltip.style.maxWidth = '320px';
    tooltip.style.textAlign = 'center';
    tooltip.style.fontSize = '1.08em';
    tooltip.style.pointerEvents = 'auto';
    tooltip.innerHTML = `<div style="margin-bottom:0.7em;">${s.text}</div>`;
    const btn = document.createElement('button');
    btn.id = 'onboarding-next';
    btn.className = 'btn-gradient';
    btn.textContent = step < steps.length-1 ? 'Next' : 'Finish';
    btn.style.marginTop = '0.5em';
    tooltip.appendChild(btn);
    overlay.appendChild(tooltip);
    // Calculate position (prefer below, fallback above)
    let top = rect.bottom + 16;
    let left = rect.left + rect.width/2;
    tooltip.style.transform = 'translate(-50%,0)';
    // If not enough space below, show above
    if (top + tooltip.offsetHeight > window.innerHeight) {
      top = rect.top - tooltip.offsetHeight - 16;
      if (top < 0) top = 16;
    }
    // If not enough space left/right, clamp
    left = Math.max(tooltip.offsetWidth/2 + 8, Math.min(left, window.innerWidth - tooltip.offsetWidth/2 - 8));
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    // Highlight element
    el.style.boxShadow = '0 0 0 4px var(--secondary-accent, #2196f3)';
    el.style.position = 'relative';
    // Scroll into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    btn.onclick = () => {
      el.style.boxShadow = '';
      step++;
      if (step < steps.length) showStep();
      else finishTour();
    };
  }
  function finishTour() {
    overlay.style.display = 'none';
    steps.forEach(s => {
      const el = document.querySelector(s.selector);
      if (el) el.style.boxShadow = '';
    });
    localStorage.setItem('covel_onboarding', 'done');
  }
  showStep();
}
// Show onboarding only on first visit
if (!localStorage.getItem('covel_onboarding')) {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(startOnboardingTour, 600);
  });
}

// --- Reminders & Notifications Logic ---
function scheduleReminders() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  let habits = JSON.parse(localStorage.getItem('covel_habits') || '[]');
  habits = habits.map(h => typeof h === 'string' ? { name: h, category: 'Other', color: '#4caf50' } : h);
  const now = new Date();
  habits.forEach(habit => {
    if (!habit.reminder) return;
    const [h, m] = habit.reminder.split(':').map(Number);
    const next = new Date();
    next.setHours(h, m, 0, 0);
    if (next < now) next.setDate(next.getDate() + 1);
    const ms = next - now;
    setTimeout(() => {
      new Notification(`Habit Reminder: ${habit.name}`, {
        body: `It's time for your habit: ${habit.name}`,
        icon: 'images/covel_logo.png'
      });
      // Reschedule for next day
      setTimeout(arguments.callee, 24*60*60*1000);
    }, ms);
  });
}
// Request permission and schedule on load
if ('Notification' in window && !localStorage.getItem('covel_notif_permission')) {
  Notification.requestPermission().then(perm => {
    localStorage.setItem('covel_notif_permission', perm);
    if (perm === 'granted') scheduleReminders();
  });
} else if (Notification.permission === 'granted') {
  scheduleReminders();
}

// Add streaks column header
const trackerTable = document.querySelector('.tracker-table thead tr');
if (trackerTable && !document.getElementById('streaks-header')) {
  const th = document.createElement('th');
  th.id = 'streaks-header';
  th.textContent = 'Streaks';
  th.style.textAlign = 'center';
  trackerTable.insertBefore(th, trackerTable.children[1]);
}

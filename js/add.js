// js/add.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-habit-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('habit-name');
    const name = input.value.trim();
    const category = document.getElementById('habit-category').value;
    const color = document.getElementById('habit-color').value;
    const reminder = document.getElementById('habit-reminder').value;
    if (!name) return;

    // 1) Get existing habits array (as objects)
    const keyHabits = 'covel_habits';
    let habits = JSON.parse(localStorage.getItem(keyHabits) || '[]');

    // 2) Avoid duplicates (by name)
    if (!habits.some(h => (typeof h === 'string' ? h : h.name) === name)) {
      habits.push({ name, category, color, reminder });
      localStorage.setItem(keyHabits, JSON.stringify(habits));
      // Show toast if available
      try { window.opener?.showToast?.('Habit added!'); } catch(e) {}
    }

    // 3) Redirect back to tracker
    window.location.href = 'tracker.html';
  });

  // --- AI Habit Suggestion Logic ---
  const aiBtn = document.getElementById('ai-suggest');
  const aiDiv = document.getElementById('ai-suggestions');
  aiBtn?.addEventListener('click', () => {
    // Simple local AI: suggest habits not already present, based on categories
    const existing = (JSON.parse(localStorage.getItem('covel_habits') || '[]')).map(h => typeof h === 'string' ? h : h.name);
    const suggestions = [
      { name: 'Drink Water', category: 'Health', color: '#2196f3', reason: 'Stay hydrated for better health.' },
      { name: 'Read 20 min', category: 'Study', color: '#ff9800', reason: 'Boost your knowledge every day.' },
      { name: 'Walk 5,000 steps', category: 'Health', color: '#4caf50', reason: 'Keep active for fitness.' },
      { name: 'Save $5', category: 'Finance', color: '#009688', reason: 'Build a savings habit.' },
      { name: 'Meditate', category: 'Health', color: '#9c27b0', reason: 'Reduce stress and improve focus.' },
      { name: 'Write Journal', category: 'Other', color: '#607d8b', reason: 'Reflect on your day.' },
      { name: 'No Sugar', category: 'Health', color: '#e91e63', reason: 'Cut sugar for better health.' },
      { name: 'Review Notes', category: 'Study', color: '#3f51b5', reason: 'Reinforce learning.' },
      { name: 'Plan Tomorrow', category: 'Other', color: '#795548', reason: 'Stay organized.' }
    ];
    const filtered = suggestions.filter(s => !existing.includes(s.name));
    aiDiv.innerHTML = '<b>AI Suggestions:</b><ul style="margin-top:0.5em;">' +
      filtered.map(s => `<li style="margin-bottom:0.5em;cursor:pointer;" data-name="${s.name}" data-category="${s.category}" data-color="${s.color}"><b>${s.name}</b> <span style="color:#888;font-size:0.95em;">(${s.category})</span><br><span style="font-size:0.93em;">${s.reason}</span></li>`).join('') +
      '</ul>';
    // Click to fill form
    aiDiv.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => {
        document.getElementById('habit-name').value = li.dataset.name;
        document.getElementById('habit-category').value = li.dataset.category;
        document.getElementById('habit-color').value = li.dataset.color;
        aiDiv.innerHTML = '';
      });
    });
  });

  // --- Popular Templates Logic ---
  const templateList = document.getElementById('template-list');
  if (templateList) {
    const templates = [
      { name: 'Drink Water', category: 'Health', color: '#2196f3', desc: 'Stay hydrated for better health.' },
      { name: 'Read 20 min', category: 'Study', color: '#ff9800', desc: 'Boost your knowledge every day.' },
      { name: 'Walk 5,000 steps', category: 'Health', color: '#4caf50', desc: 'Keep active for fitness.' },
      { name: 'Save $5', category: 'Finance', color: '#009688', desc: 'Build a savings habit.' },
      { name: 'Meditate', category: 'Health', color: '#9c27b0', desc: 'Reduce stress and improve focus.' },
      { name: 'Write Journal', category: 'Other', color: '#607d8b', desc: 'Reflect on your day.' },
      { name: 'No Sugar', category: 'Health', color: '#e91e63', desc: 'Cut sugar for better health.' },
      { name: 'Review Notes', category: 'Study', color: '#3f51b5', desc: 'Reinforce learning.' },
      { name: 'Plan Tomorrow', category: 'Other', color: '#795548', desc: 'Stay organized.' }
    ];
    templateList.innerHTML = templates.map(t => `
      <div class="template-card" data-name="${t.name}" data-category="${t.category}" data-color="${t.color}">
        <span class="template-title">${t.name}</span>
        <span class="template-cat">${t.category}</span>
        <span class="template-desc">${t.desc}</span>
      </div>
    `).join('');
    templateList.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        document.getElementById('habit-name').value = card.dataset.name;
        document.getElementById('habit-category').value = card.dataset.category;
        document.getElementById('habit-color').value = card.dataset.color;
        window.scrollTo({ top: document.getElementById('add-habit-form').offsetTop - 40, behavior: 'smooth' });
      });
    });
  }
});

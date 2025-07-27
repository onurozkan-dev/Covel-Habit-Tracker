// js/calendar.js

document.addEventListener('DOMContentLoaded', () => {
  // Get habits
  let habits = JSON.parse(localStorage.getItem('covel_habits') || '[]');
  habits = habits.map(h => typeof h === 'string' ? { name: h, category: 'Other', color: '#4caf50' } : h);

  // Populate habit dropdown
  const habitSelect = document.getElementById('habit-select');
  habits.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h.name;
    opt.textContent = h.name;
    habitSelect.appendChild(opt);
  });

  function getCompletionsByDay(selectedHabit) {
    // Map: date string (YYYY-MM-DD) => count
    const completions = {};
    const now = new Date();
    for (let w = 0; w < 52; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(now);
        date.setDate(now.getDate() - (now.getDay() || 7) + d - w * 7);
        const key = date.toISOString().slice(0, 10);
        completions[key] = 0;
      }
    }
    habits.forEach(habit => {
      if (selectedHabit && selectedHabit !== '__all__' && habit.name !== selectedHabit) return;
      for (let w = 0; w < 52; w++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) - w * 7 + 1);
        const weekKey = `${habit.name}-${weekStart.toLocaleString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(weekStart.getTime() + 6*86400000).toLocaleString('en-US', { month: 'short', day: 'numeric' })}`;
        const state = JSON.parse(localStorage.getItem(weekKey) || '{}');
        for (let d = 0; d < 7; d++) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + d);
          const key = date.toISOString().slice(0, 10);
          if (state[d]) completions[key] = (completions[key] || 0) + 1;
        }
      }
    });
    return completions;
  }

  function renderHeatmap() {
    const selectedHabit = habitSelect.value;
    const completions = getCompletionsByDay(selectedHabit);
    const heatmap = document.getElementById('calendar-heatmap');
    heatmap.innerHTML = '';
    // Build columns (weeks)
    const now = new Date();
    for (let w = 51; w >= 0; w--) {
      const weekCol = document.createElement('div');
      weekCol.className = 'calendar-week';
      for (let d = 0; d < 7; d++) {
        const date = new Date(now);
        date.setDate(now.getDate() - (now.getDay() || 7) + d - w * 7);
        const key = date.toISOString().slice(0, 10);
        const count = completions[key] || 0;
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.dataset.count = Math.min(count, 5);
        cell.dataset.tooltip = `${date.toDateString()}: ${count} completed`;
        weekCol.appendChild(cell);
      }
      heatmap.appendChild(weekCol);
    }
  }

  habitSelect.addEventListener('change', renderHeatmap);
  renderHeatmap();
}); 
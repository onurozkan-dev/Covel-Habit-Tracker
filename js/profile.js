// js/profile.js
document.addEventListener('DOMContentLoaded', () => {
  // --- Custom Theme Logic ---
  const root = document.documentElement;
  const primaryInput = document.getElementById('primary-color');
  const secondaryInput = document.getElementById('secondary-color');
  const saveBtn = document.getElementById('save-theme');

  // Load theme from localStorage
  function loadTheme() {
    const theme = JSON.parse(localStorage.getItem('covel_theme') || '{}');
    if (theme.primary) {
      root.style.setProperty('--primary-accent', theme.primary);
      if (primaryInput) primaryInput.value = theme.primary;
    }
    if (theme.secondary) {
      root.style.setProperty('--secondary-accent', theme.secondary);
      if (secondaryInput) secondaryInput.value = theme.secondary;
    }
  }

  // Save theme to localStorage and apply
  function saveTheme() {
    const primary = primaryInput.value;
    const secondary = secondaryInput.value;
    localStorage.setItem('covel_theme', JSON.stringify({ primary, secondary }));
    root.style.setProperty('--primary-accent', primary);
    root.style.setProperty('--secondary-accent', secondary);
    // Optional: show a toast or message
    if (window.showToast) window.showToast('Theme saved!');
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', saveTheme);
  }
  loadTheme();

  // Haftanın başlangıcını al (Pazartesi)
  let currentStart = new Date();
  currentStart.setDate(currentStart.getDate() - currentStart.getDay() + 1);

  // Aynı formatRange fonksiyonu
  function formatRange(date) {
    const opt = { month: 'short', day: 'numeric' };
    const start = date.toLocaleDateString('en-US', opt);
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    const endStr = end.toLocaleDateString('en-US', opt);
    return `${start} – ${endStr}`;
  }

  // Stats hesapla ve DOM’a yerleştir
  function renderProfile() {
    const habits = JSON.parse(localStorage.getItem('covel_habits') || '[]');
    const totalHabits = habits.length;

    let totalDone = 0;
    const weekKey = formatRange(currentStart);

    // Tablo body
    const tbody = document.getElementById('profile-body');
    tbody.innerHTML = '';

    habits.forEach(habit => {
      const state = JSON.parse(localStorage.getItem(`${habit}-${weekKey}`) || '{}');
      const doneCount = Object.values(state).filter(v => v).length;
      totalDone += doneCount;

      // Tablo satırı
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${habit}</td>
        <td>${doneCount} / 7</td>
      `;
      tbody.appendChild(tr);
    });

    // Ortalama yüzde
    const maxPossible = totalHabits * 7;
    const avgRate = maxPossible ? Math.round((totalDone / maxPossible) * 100) : 0;

    // DOM’a yaz
    document.getElementById('total-habits').textContent = totalHabits;
    document.getElementById('completed-this-week').textContent = totalDone;
    document.getElementById('avg-rate').textContent = `${avgRate}%`;
  }

  // --- Achievements & Badges Logic ---
  function getBadges(habits) {
    // Calculate streaks for each habit
    function getStreak(habit) {
      let streak = 0;
      let today = new Date();
      today.setDate(today.getDate() - (today.getDay() || 7) + 6); // Sunday of this week
      let dayIdx = 6;
      let weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 6);
      let keepGoing = true;
      while (keepGoing) {
        const weekKey = `${habit.name}-${weekStart.toLocaleString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(weekStart.getTime() + 6*86400000).toLocaleString('en-US', { month: 'short', day: 'numeric' })}`;
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
      return streak;
    }
    // Calculate badges
    const badges = [
      {
        id: 'first-habit',
        icon: '🌱',
        name: 'First Habit',
        desc: 'Add your first habit.',
        earned: habits.length > 0
      },
      {
        id: 'ten-habits',
        icon: '🌳',
        name: 'Habit Collector',
        desc: 'Add 10 habits.',
        earned: habits.length >= 10
      },
      {
        id: 'first-week',
        icon: '📅',
        name: 'First Week',
        desc: 'Complete a full week for any habit.',
        earned: habits.some(h => {
          for (let w = 0; w < 52; w++) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) - w * 7 + 1);
            const weekKey = `${h.name}-${weekStart.toLocaleString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(weekStart.getTime() + 6*86400000).toLocaleString('en-US', { month: 'short', day: 'numeric' })}`;
            const state = JSON.parse(localStorage.getItem(weekKey) || '{}');
            if (Object.values(state).filter(Boolean).length === 7) return true;
          }
          return false;
        })
      },
      {
        id: 'streak-7',
        icon: '🥈',
        name: '7-Day Streak',
        desc: 'Reach a 7-day streak on any habit.',
        earned: habits.some(h => getStreak(h) >= 7)
      },
      {
        id: 'streak-14',
        icon: '🥇',
        name: '14-Day Streak',
        desc: 'Reach a 14-day streak on any habit.',
        earned: habits.some(h => getStreak(h) >= 14)
      },
      {
        id: 'streak-30',
        icon: '🏆',
        name: '30-Day Streak',
        desc: 'Reach a 30-day streak on any habit.',
        earned: habits.some(h => getStreak(h) >= 30)
      }
    ];
    return badges;
  }

  function renderBadges(habits) {
    const badges = getBadges(habits);
    const gallery = document.getElementById('badge-gallery');
    if (!gallery) return;
    gallery.innerHTML = badges.map(b => `
      <div class="badge${b.earned ? '' : ' locked'}">
        <span class="badge-icon">${b.icon}</span>
        <span class="badge-name">${b.name}</span>
        <span class="badge-desc">${b.desc}</span>
      </div>
    `).join('');
    // Show toast for new badges
    const earnedIds = JSON.parse(localStorage.getItem('covel_badges') || '[]');
    badges.forEach(b => {
      if (b.earned && !earnedIds.includes(b.id)) {
        if (window.showToast) window.showToast(`Badge earned: ${b.name}!`);
        earnedIds.push(b.id);
      }
    });
    localStorage.setItem('covel_badges', JSON.stringify(earnedIds));
  }

  // --- XP & Leveling Logic ---
  function getXPAndLevel() {
    // 10 XP per habit completion
    let xp = 0;
    let completions = 0;
    const habits = JSON.parse(localStorage.getItem('covel_habits') || '[]').map(h => typeof h === 'string' ? { name: h } : h);
    for (let w = 0; w < 52; w++) {
      habits.forEach(habit => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) - w * 7 + 1);
        const weekKey = `${habit.name}-${weekStart.toLocaleString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(weekStart.getTime() + 6*86400000).toLocaleString('en-US', { month: 'short', day: 'numeric' })}`;
        const state = JSON.parse(localStorage.getItem(weekKey) || '{}');
        completions += Object.values(state).filter(Boolean).length;
      });
    }
    xp = completions * 10;
    const level = Math.floor(xp / 100) + 1;
    const xpThisLevel = xp % 100;
    return { xp, level, xpThisLevel };
  }

  function renderXPLevel() {
    const { xp, level, xpThisLevel } = getXPAndLevel();
    let xpBar = document.getElementById('xp-bar');
    let xpLabel = document.getElementById('xp-label');
    let levelLabel = document.getElementById('level-label');
    if (!xpBar) {
      const container = document.createElement('div');
      container.className = 'xp-container';
      container.innerHTML = `
        <div class="xp-labels">
          <span id="level-label">Level ${level}</span>
          <span id="xp-label">${xpThisLevel}/100 XP</span>
        </div>
        <div class="xp-bar-bg"><div class="xp-bar" id="xp-bar"></div></div>
      `;
      const badgeGallery = document.getElementById('badge-gallery');
      badgeGallery.parentNode.insertBefore(container, badgeGallery);
      xpBar = document.getElementById('xp-bar');
      xpLabel = document.getElementById('xp-label');
      levelLabel = document.getElementById('level-label');
    }
    xpBar.style.width = `${xpThisLevel}%`;
    xpLabel.textContent = `${xpThisLevel}/100 XP`;
    levelLabel.textContent = `Level ${level}`;
    // Confetti animation on level up
    const lastLevel = parseInt(localStorage.getItem('covel_last_level') || '1', 10);
    if (level > lastLevel) {
      showConfetti();
      localStorage.setItem('covel_last_level', level);
      if (window.showToast) window.showToast(`Level up! You reached Level ${level}!`);
    }
  }
  // Simple confetti animation
  function showConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    for (let i = 0; i < 40; i++) {
      const dot = document.createElement('div');
      dot.className = 'confetti-dot';
      dot.style.left = Math.random() * 100 + '%';
      dot.style.background = `hsl(${Math.random()*360},80%,60%)`;
      dot.style.animationDelay = (Math.random()*0.7) + 's';
      confetti.appendChild(dot);
    }
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 1800);
  }

  // --- Challenges Logic ---
  function getChallenges(habits) {
    // Today
    const today = new Date();
    const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0=Mon
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - todayIdx);
    const weekKey = `${weekStart.toLocaleString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(weekStart.getTime() + 6*86400000).toLocaleString('en-US', { month: 'short', day: 'numeric' })}`;
    // Challenge 1: Complete all habits today
    const allToday = habits.length > 0 && habits.every(h => {
      const state = JSON.parse(localStorage.getItem(`${h.name}-${weekKey}`) || '{}');
      return state[todayIdx];
    });
    // Challenge 2: 3-day streak (any habit)
    function getStreak(habit) {
      let streak = 0;
      let d = todayIdx;
      let wStart = new Date(weekStart);
      let keepGoing = true;
      while (keepGoing) {
        const state = JSON.parse(localStorage.getItem(`${habit.name}-${wStart.toLocaleString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(wStart.getTime() + 6*86400000).toLocaleString('en-US', { month: 'short', day: 'numeric' })}`) || '{}');
        for (let i = d; i >= 0; i--) {
          if (state[i]) streak++;
          else { keepGoing = false; break; }
        }
        d = 6;
        wStart.setDate(wStart.getDate() - 7);
      }
      return streak;
    }
    const streak3 = habits.some(h => getStreak(h) >= 3);
    // Challenge 3: Complete all habits 5 days this week
    let all5 = false;
    if (habits.length > 0) {
      let days = 0;
      for (let d = 0; d < 7; d++) {
        if (habits.every(h => {
          const state = JSON.parse(localStorage.getItem(`${h.name}-${weekKey}`) || '{}');
          return state[d];
        })) days++;
      }
      all5 = days >= 5;
    }
    return [
      {
        id: 'all-today',
        name: 'Complete all habits today',
        desc: 'Check off every habit today.',
        progress: allToday ? 1 : 0,
        reward: '+20 XP',
        earned: !!allToday
      },
      {
        id: 'streak-3',
        name: '3-Day Streak',
        desc: 'Get a 3-day streak on any habit.',
        progress: streak3 ? 1 : 0,
        reward: '+10 XP',
        earned: !!streak3
      },
      {
        id: 'all-5',
        name: 'All Habits 5 Days',
        desc: 'Complete all habits on 5 days this week.',
        progress: all5 ? 1 : 0,
        reward: '+30 XP',
        earned: !!all5
      }
    ];
  }

  function renderChallenges(habits) {
    const challenges = getChallenges(habits);
    let section = document.getElementById('challenges-section');
    if (!section) {
      section = document.createElement('div');
      section.id = 'challenges-section';
      section.className = 'challenges-section';
      const badgeGallery = document.getElementById('badge-gallery');
      badgeGallery.parentNode.insertBefore(section, badgeGallery);
    }
    section.innerHTML = '<h2>Daily & Weekly Challenges</h2>' +
      '<div class="challenge-list">' +
      challenges.map(c => `
        <div class="challenge${c.earned ? ' earned' : ''}">
          <div class="challenge-name">${c.name}</div>
          <div class="challenge-desc">${c.desc}</div>
          <div class="challenge-reward">${c.reward}${c.earned ? ' <span class=\'challenge-earned\'>(Earned!)</span>' : ''}</div>
        </div>
      `).join('') +
      '</div>';
    // Award XP for new completions
    const done = JSON.parse(localStorage.getItem('covel_challenges') || '[]');
    challenges.forEach(c => {
      if (c.earned && !done.includes(c.id)) {
        // Add XP
        const { xp } = getXPAndLevel();
        let add = 0;
        if (c.id === 'all-today') add = 20;
        if (c.id === 'streak-3') add = 10;
        if (c.id === 'all-5') add = 30;
        localStorage.setItem('covel_xp_bonus', ((parseInt(localStorage.getItem('covel_xp_bonus')||'0',10))+add).toString());
        if (window.showToast) window.showToast(`Challenge complete: ${c.name}!`);
        done.push(c.id);
      }
    });
    localStorage.setItem('covel_challenges', JSON.stringify(done));
  }

  renderProfile();
  // Render XP/level
  renderXPLevel();
  // Render challenges
  const habits = JSON.parse(localStorage.getItem('covel_habits') || '[]').map(h => typeof h === 'string' ? { name: h } : h);
  renderChallenges(habits);
  // Render badges
  renderBadges(habits);
});

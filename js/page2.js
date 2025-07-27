// js/page2.js
document.addEventListener('DOMContentLoaded', () => {
  // Timer
  let totalSeconds = 0, interval = null;
  const timerEl = document.getElementById('timer');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');

  function pad(n){ return n < 10 ? '0' + n : n; }
  function updateDisplay(){
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    timerEl.textContent = `${pad(m)}:${pad(s)}`;
  }

  startBtn.addEventListener('click', () => {
    if (!interval) interval = setInterval(() => {
      totalSeconds++;
      updateDisplay();
    }, 1000);
  });
  pauseBtn.addEventListener('click', () => {
    clearInterval(interval);
    interval = null;
  });
  resetBtn.addEventListener('click', () => {
    clearInterval(interval);
    interval = null;
    totalSeconds = 0;
    updateDisplay();
  });

  // Motivational Quotes
  const quotes = [
    "Success is the sum of small efforts repeated daily.",
    "Discipline is choosing between what you want now and what you want most.",
    "Don't watch the clock; do what it does. Keep going.",
    "Strive for progress, not perfection.",
    "Your only limit is you."
  ];
  const quoteEl = document.getElementById('quote');
  const newQuoteBtn = document.getElementById('new-quote-btn');

  newQuoteBtn.addEventListener('click', () => {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    quoteEl.textContent = `"${q}"`;
  });
});

/* ========== GLOBAL STATE ========== */
const G = {
  score: 0,
  combo: 0,
  bestCombo: 0,
  currentGame: null,
  soundOn: true,
  totalXP: 0,
  badges: []
};

// Persist total XP across pages so the menu can show cumulative progress
try {
  G.totalXP = parseInt(sessionStorage.getItem('questXP') || '0', 10);
} catch (e) { G.totalXP = 0; }

function saveXP() {
  try { sessionStorage.setItem('questXP', String(G.totalXP)); } catch (e) {}
}

/* ========== PARTICLES ========== */
function createParticles() {
  const colors = ['#2ecc71','#f1c40f','#ff6b6b','#87ceeb','#ff8fb1'];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.width = p.style.height = (4 + Math.random() * 8) + 'px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (8 + Math.random() * 12) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    document.body.appendChild(p);
  }
}

/* ========== HUD ========== */
function updateScoreUI() {
  const scoreEl = document.getElementById('gameScore');
  if (scoreEl) scoreEl.textContent = G.score;
}
function updateHUD() {
  const poemScore = document.getElementById('poemScore');
  const crossScore = document.getElementById('crossScore');
  const oddScore = document.getElementById('oddScore');
  const poemCombo = document.getElementById('poemCombo');
  const oddCombo = document.getElementById('oddCombo');
  const crossCombo = document.getElementById('crossCombo');
  if (poemScore) poemScore.textContent = G.score;
  if (crossScore) crossScore.textContent = G.score;
  if (oddScore) oddScore.textContent = G.score;
  if (poemCombo) poemCombo.textContent = 'x' + G.combo;
  if (oddCombo) oddCombo.textContent = 'x' + G.combo;
  if (crossCombo) crossCombo.textContent = 'x' + G.combo;
}

/* ========== SOUND TOGGLE ========== */
var audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSound(type) {
  if (!G.soundOn) return;
  try {
    var ctx = getAudioCtx();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    var now = ctx.currentTime;

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.1);
      osc.frequency.setValueAtTime(784, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.setValueAtTime(150, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'launch') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'hit') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(200, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'shoot') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {}
}

document.querySelectorAll('[data-sound-toggle]').forEach(btn => {
  btn.addEventListener('click', () => {
    G.soundOn = !G.soundOn;
    btn.textContent = G.soundOn ? '🔊' : '🔇';
  });
});

/* ========== BACK BUTTON (goes to menu page) ========== */
document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', () => {
    window.location.href = '../sense-safari-game.html';
  });
});

/* ========== BANNER ========== */
function showBanner(text, type) {
  const b = document.getElementById('floatBanner');
  if (!b) return;
  b.textContent = text;
  b.className = 'float-banner ' + (type || '') + ' show';
  setTimeout(() => b.classList.remove('show'), 2000);
}

function addScore(pts) {
  G.combo++;
  if (G.combo > G.bestCombo) G.bestCombo = G.combo;
  const bonus = G.combo >= 3 ? Math.floor(pts * 0.5) : 0;
  G.score += pts + bonus;
  G.totalXP += pts + bonus;
  saveXP();
  updateHUD();
  if (G.combo === 3) showBanner('🔥 Combo x3!', 'combo');
  if (G.combo === 5) showBanner('🔥🔥 Combo x5!', 'combo');
}

function wrongAnswer() {
  G.combo = 0;
  updateHUD();
}

/* ========== GAME COMPLETE ========== */
function showResult(emoji, title, score, xp, combo, noConfetti) {
  if (!noConfetti) launchConfetti();
  var overlay = document.getElementById('gameResultOverlay');
  if (!overlay) return;
  overlay.querySelector('.game-result-emoji').textContent = emoji;
  overlay.querySelector('.game-result-title').textContent = title;
  overlay.querySelector('.game-result-score').textContent = '⭐ Score: ' + score + '  |  🔥 Best Combo: x' + combo;
  overlay.classList.add('show');
  overlay.querySelector('[data-play-again]').onclick = function() { window.location.reload(); };
  overlay.querySelector('[data-go-menu]').onclick = function() { window.location.href = '../sense-safari-game.html'; };
}

/* ========== CONFETTI ========== */
function launchConfetti() {
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:60;';
  document.body.appendChild(layer);
  const colors = ['#2ecc71','#f1c40f','#ff6b6b','#87ceeb','#ff8fb1','#8B7CF6'];
  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.style.cssText = `position:absolute;top:-20px;width:10px;height:14px;border-radius:2px;
      left:${Math.random()*100}vw;background:${colors[Math.floor(Math.random()*colors.length)]};
      animation:fall ${2+Math.random()*1.5}s linear ${Math.random()*0.4}s forwards;opacity:0.95;`;
    layer.appendChild(piece);
  }
  const style = document.createElement('style');
  style.textContent = '@keyframes fall{to{transform:translateY(110vh) rotate(540deg);opacity:1;}}';
  layer.appendChild(style);
  setTimeout(() => layer.remove(), 4000);
}

/* ========== UTILITIES ========== */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ========== VOICE (SPEECH) ANNOUNCEMENTS ========== */
function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.95;
    u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

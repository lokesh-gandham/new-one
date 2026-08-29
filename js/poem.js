/* ========== GAME 1: POEM BLASTER (SHOOTING STYLE) ========== */
const poemLevels = [
  { title: 'Mission 1: The Smelling Poem', icon: '👃', sense: 'nose',
    answers: ['nose','flowers','smell','fresh'],
    lines: [
      ['I have a ', '<BLANK>', ' to smell,'],
      ['The rain and ', '<BLANK>', ' as well.'],
      ['I ', '<BLANK>', ' the food so nice,'],
      ['And the air, ', '<BLANK>', ' and hasty.']
    ]},
  { title: 'Mission 2: The Seeing Poem', icon: '👁️', sense: 'eyes',
    answers: ['see','birds','Sun','night'],
    lines: [
      ['I have two eyes to ', '<BLANK>', ','],
      ['The ', '<BLANK>', ', the flowers, and the tree.'],
      ['I look at the ', '<BLANK>', ', so bright,'],
      ['And the stars that shine at ', '<BLANK>', '!']
    ]}
];

// Picture shown on each floating word option
const POEM_ICONS = {
  nose:'👃', flowers:'🌸', flower:'🌸', smell:'👃', fresh:'🌬️',
  see:'👁️', birds:'🐦', bird:'🐦', sun:'☀️', night:'🌙',
  tree:'🌳', wind:'🍃', rain:'🌧️', moon:'🌙', sky:'⛅',
  fish:'🐟', leaf:'🍃', rock:'🪨', wave:'🌊', cloud:'☁️'
};

const POEM_IMAGES = {
  sun: '../assets/sun-removebg-preview.png',
  tree: '../assets/tree-removebg-preview.png',
  cloud: '../assets/cloud-removebg-preview.png',
  smell: '../assets/smell-removebg-preview.png',
  bird: '../assets/bird-removebg-preview.png',
  birds: '../assets/bird-removebg-preview.png',
  rock: '../assets/rock-removebg-preview.png',
  fish: '../assets/fish-removebg-preview.png',
  rain: '../assets/rain-removebg-preview.png'
};

function poemIconHTML(word) {
  const w = String(word).toLowerCase();
  if (POEM_IMAGES[w]) {
    return `<img src="${POEM_IMAGES[w]}" alt="${w}" class="poem-ast-img">`;
  }
  return `<span class="poem-ast-icon">${POEM_ICONS[w] || '✨'}</span>`;
}
function poemIcon(word){ return POEM_ICONS[String(word).toLowerCase()] || '✨'; }

let poemState = { current: 0, filled: [], currentSlot: 0, isFiring: false, timeLeft: 120, timerId: null };
const POEM_TIMER = 120;

function initPoemGame() {
  poemState = { current: 0, filled: [], currentSlot: 0, isFiring: false, timeLeft: POEM_TIMER, timerId: null };
  renderPoemLevel(0);
  updatePoemProgress();
}

function startPoemTimer() {
  if (poemState.timerId) clearInterval(poemState.timerId);
  poemState.timeLeft = POEM_TIMER;
  updatePoemTimerUI();
  poemState.timerId = setInterval(() => {
    poemState.timeLeft--;
    updatePoemTimerUI();
    if (poemState.timeLeft <= 0) {
      clearInterval(poemState.timerId);
      poemState.timerId = null;
      poemTimeout();
    }
  }, 1000);
}

function updatePoemTimerUI() {
  const el = document.getElementById('poemTimer');
  if (!el) return;
  const m = Math.floor(Math.max(0, poemState.timeLeft) / 60);
  const s = Math.max(0, poemState.timeLeft) % 60;
  el.textContent = '⏰ ' + m + ':' + (s < 10 ? '0' + s : s);
  el.classList.toggle('low', poemState.timeLeft <= 30);
}

function poemTimeout() {
  poemState.isFiring = true;
  speak("Time's Up! Play Again?");
  showResult('⏰', 'Time\'s Up! Play Again?', G.score, G.totalXP, G.bestCombo, true);
}

function renderPoemLevel(li) {
  const lvl = poemLevels[li];
  const board = document.getElementById('poemBoard');
  const asteroids = document.getElementById('poemAsteroids');
  
  poemState.filled = Array(lvl.answers.length).fill(null);
  poemState.currentSlot = 0;
  poemState.isFiring = false;
  
  let boardHtml = `<div class="poem-board-title">${lvl.icon} ${lvl.title}</div>`;
  lvl.lines.forEach((line, i) => {
    boardHtml += `<div class="poem-line"><span>${line[0]}</span><span class="poem-blank-slot${i === 0 ? ' active' : ''}" id="poemSlot${i}">?</span><span>${line[2]}</span></div>`;
  });
  board.innerHTML = boardHtml;
  
  const allWords = shuffle([...lvl.answers, ...getDistractors(lvl.answers)]);
  asteroids.innerHTML = '';

  allWords.forEach((word) => {
    const ast = document.createElement('div');
    ast.className = 'poem-asteroid';
    ast.innerHTML = poemIconHTML(word) + '<span class="poem-ast-word">' + word + '</span>';
    ast.onclick = () => shootPoemAsteroid(ast, word);
    asteroids.appendChild(ast);
  });
  requestAnimationFrame(layoutPoemAsteroids);

  document.getElementById('poemInstruction').textContent = `🎯 Shoot word for slot #1`;
  document.getElementById('poemGameScore').textContent = G.score;
  
  setupPoemAimLine();
  startPoemTimer();
}

/* Place the floating word options on a tidy grid that always stays fully
   inside the play area — never overlapping the container border, and to the
   side of (or below, on narrow screens) the poem board. */
function layoutPoemAsteroids() {
  const area = getPoemPlayArea();
  if (!area) return;
  const chips = area.querySelectorAll('.poem-asteroid');
  if (!chips.length) return;
  const board = document.getElementById('poemBoard');
  const aw = area.clientWidth, ah = area.clientHeight;
  const pad = 12, bottomSafe = 70;
  const boardRight = board ? board.offsetLeft + board.offsetWidth : 0;
  const boardBottom = board ? board.offsetTop + board.offsetHeight : 0;

  let zoneLeft, zoneTop, zoneW, zoneH;
  if (boardRight > aw * 0.6) {
    // Narrow: board spans the top — options go underneath it.
    zoneLeft = pad;
    zoneTop = boardBottom + 14;
    zoneW = aw - pad * 2;
    zoneH = ah - zoneTop - bottomSafe;
  } else {
    // Wide: options fill the space to the right of the board (no big dead gap).
    zoneLeft = boardRight + Math.max(24, aw * 0.04);
    zoneTop = pad + 4;
    zoneW = aw - zoneLeft - pad;
    zoneH = ah - zoneTop - bottomSafe;
  }
  if (zoneH < 140) { zoneTop = pad; zoneH = ah - pad - bottomSafe; }

  let maxChipW = 96, maxChipH = 70;
  chips.forEach(c => {
    maxChipW = Math.max(maxChipW, c.offsetWidth || 96);
    maxChipH = Math.max(maxChipH, c.offsetHeight || 70);
  });

  // Always aim for 4 across (laptops and monitors alike); only drop below 4 if
  // the zone genuinely can't fit them.
  let cols = Math.min(4, chips.length);
  while (cols > 2 && zoneW / cols < maxChipW + 30) cols--;
  const rows = Math.ceil(chips.length / cols);
  const cellW = zoneW / cols;
  const tight = cols <= 2;
  const rowPitch = Math.min(maxChipH + (tight ? 30 : 48), Math.max(maxChipH + (tight ? 24 : 18), zoneH / Math.max(rows, 1)));
  const blockTop = zoneTop + Math.max(0, (zoneH - rowPitch * rows) / 2);

  // Deterministic per-chip pseudo-random so the scatter is stable across
  // resizes but still looks hand-placed rather than a rigid grid.
  const rand = (n) => { const x = Math.sin((n + 1) * 43758.5453) * 10000; return x - Math.floor(x); };
  const jx = Math.min(tight ? 12 : 20, (cellW - maxChipW) / 2 + 8);
  const jy = Math.min(tight ? 8 : 26, Math.max(0, (rowPitch - maxChipH) / 2));

  chips.forEach((c, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, chips.length - row * cols);
    const col = i % cols;
    const cw = c.offsetWidth || maxChipW, chh = c.offsetHeight || maxChipH;
    const rowLeft = zoneLeft + Math.max(0, (zoneW - inRow * cellW) / 2);
    let x = rowLeft + col * cellW + (cellW - cw) / 2 + (rand(i * 2) - 0.5) * 2 * jx;
    let y = blockTop + row * rowPitch + (rowPitch - chh) / 2 + (rand(i * 2 + 1) - 0.5) * 2 * jy;
    x = Math.max(pad, Math.min(x, aw - cw - pad));
    y = Math.max(pad, Math.min(y, ah - chh - bottomSafe));
    c.style.left = Math.round(x) + 'px';
    c.style.top = Math.round(y) + 'px';
  });
}

let _poemResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(_poemResizeTimer);
  _poemResizeTimer = setTimeout(layoutPoemAsteroids, 120);
});

function getDistractors(answers) {
  const extras = ['tree','wind','rain','sun','moon','sky','bird','fish','leaf','rock','wave','cloud'];
  return shuffle(extras).slice(0, 4);
}

function getPoemPlayArea() {
  return document.getElementById('poemPlay') || document.getElementById('poemGameArea');
}

function setupPoemAimLine() {
  const area = getPoemPlayArea();
  const aimLine = document.getElementById('poemAimLine');
  const slingshot = document.getElementById('poemSlingshot');

  area.onmousemove = (e) => {
    if (poemState.isFiring) return;
    const rect = area.getBoundingClientRect();
    const slingW = slingshot.offsetWidth || 40;
    let mouseX = e.clientX - rect.left;
    mouseX = Math.max(slingW / 2, Math.min(rect.width - slingW / 2, mouseX));

    const bottomY = rect.height - 55;
    let lineTop = 8;

    const hovered = document.elementFromPoint(e.clientX, e.clientY);
    if (hovered && hovered.classList && hovered.classList.contains('poem-asteroid')) {
      const ar = hovered.getBoundingClientRect();
      const centerY = (ar.top + ar.height / 2) - rect.top;
      if (centerY < bottomY - 30) lineTop = centerY;
    }

    aimLine.style.left = mouseX + 'px';
    aimLine.style.top = lineTop + 'px';
    aimLine.style.height = Math.max(60, bottomY - lineTop) + 'px';

    slingshot.style.left = mouseX + 'px';
    slingshot.style.transform = 'translateX(-50%)';
  };
}

function shootPoemAsteroid(asteroidEl, word) {
  if (poemState.isFiring || poemState.currentSlot >= poemLevels[poemState.current].answers.length) return;
  poemState.isFiring = true;
  playSound('shoot');
  
  const area = getPoemPlayArea();
  const areaRect = area.getBoundingClientRect();
  const astRect = asteroidEl.getBoundingClientRect();
  
  const targetX = (astRect.left + astRect.width / 2) - areaRect.left;
  const targetY = (astRect.top + astRect.height / 2) - areaRect.top;
  
  const laser = document.getElementById('poemLaser');
  const marker = document.getElementById('poemTargetMarker');
  const slingshot = document.getElementById('poemSlingshot');
  const aimLine = document.getElementById('poemAimLine');

  const slingHalf = (slingshot.offsetWidth || 40) / 2;
  const shotX = Math.max(slingHalf, Math.min(areaRect.width - slingHalf, targetX));
  const shipTopY = areaRect.height - 55;
  const laserHeight = shipTopY - targetY;

  aimLine.style.left = shotX + 'px';
  aimLine.style.top = targetY + 'px';
  aimLine.style.height = laserHeight + 'px';
  aimLine.style.display = 'none';

  slingshot.style.left = shotX + 'px';
  slingshot.style.transform = 'translateX(-50%)';
  
  marker.style.left = shotX + 'px';
  marker.style.top = targetY + 'px';
  marker.style.display = 'block';
  
  laser.style.left = (shotX - 3) + 'px';
  laser.style.top = targetY + 'px';
  laser.style.height = laserHeight + 'px';
  laser.style.display = 'block';
  laser.style.animation = 'none';
  laser.offsetHeight;
  laser.style.animation = 'laserShoot 0.25s ease-out';
  
  setTimeout(() => {
    laser.style.display = 'none';
    marker.style.display = 'none';
    aimLine.style.display = 'block';
    poemState.isFiring = false;
    
    const lvl = poemLevels[poemState.current];
    const correctWord = lvl.answers[poemState.currentSlot];
    
    if (word.toLowerCase() === correctWord.toLowerCase()) {
      const slot = document.getElementById('poemSlot' + poemState.currentSlot);
      slot.textContent = word;
      slot.classList.remove('active');
      slot.classList.add('correct');
      poemState.filled[poemState.currentSlot] = word;
      
      asteroidEl.style.border = '3px solid #2e7d32';
      asteroidEl.style.boxShadow = '0 0 12px #2e7d32';
      setTimeout(() => { asteroidEl.style.display = 'none'; }, 300);
      addScore(100);
      playSound('correct');
      speak('Correct!');
      document.getElementById('poemGameScore').textContent = G.score;
      showPoemMessage(`⚡ "${word}" slotted!`, 2000, 'correct');
      
      poemState.currentSlot++;
      
      if (poemState.currentSlot < lvl.answers.length) {
        document.getElementById('poemSlot' + poemState.currentSlot).classList.add('active');
        document.getElementById('poemInstruction').textContent = `🎯 Shoot word for slot #${poemState.currentSlot + 1}`;
      } else {
        document.getElementById('poemInstruction').textContent = '🏆 Mission complete!';
        setTimeout(() => checkPoemLevelComplete(poemState.current), 600);
      }
    } else {
      asteroidEl.style.border = '3px solid #c62828';
      asteroidEl.style.boxShadow = '0 0 12px #c62828';
      setTimeout(() => {
        asteroidEl.style.border = '';
        asteroidEl.style.boxShadow = '';
      }, 600);
      wrongAnswer();
      playSound('wrong');
      speak('Try again');
      showPoemMessage('❌ Wrong word for this slot!', 1200, 'wrong');
    }
  }, 120);
}

function showPoemMessage(text, duration, type) {
  const msg = document.getElementById('poemMessage');
  msg.textContent = text;
  msg.style.display = 'block';
  // Match the Jungle Launcher (odd-one-out) result popup look: soft light
  // background, coloured border, gentle glow.
  if (type === 'correct') {
    msg.style.background = 'linear-gradient(145deg,#d8f6e4,#f2fdf6)';
    msg.style.border = '2px solid #1f9d57';
    msg.style.color = '#0c3d22';
    msg.style.boxShadow = '0 0 34px rgba(31,157,87,0.42)';
  } else if (type === 'wrong') {
    msg.style.background = 'linear-gradient(145deg,#ffe2dc,#fff5f2)';
    msg.style.border = '2px solid #e0554b';
    msg.style.color = '#5c1712';
    msg.style.boxShadow = '0 0 34px rgba(224,85,75,0.42)';
  } else {
    msg.style.background = 'linear-gradient(145deg,#fff6e6,#fffdf8)';
    msg.style.border = '2px solid var(--edge)';
    msg.style.color = 'var(--ink)';
    msg.style.boxShadow = '0 8px 28px rgba(0,0,0,0.18)';
  }
  setTimeout(() => { msg.style.display = 'none'; }, duration || 2000);
}

function checkPoemLevelComplete(li) {
  if (poemState.currentSlot >= poemLevels[li].answers.length) {
    if (li === poemLevels.length - 1) {
      if (poemState.timerId) { clearInterval(poemState.timerId); poemState.timerId = null; }
      speak('Congratulations! Poem Blaster Complete!');
      showResult('🏆', 'Poem Blaster Complete!', G.score, G.totalXP, G.bestCombo);
    } else {
      speak('Mission Complete!');
      showPoemMessage('🎉 Mission complete!', 1600);
      setTimeout(() => {
        poemState.current = li + 1;
        renderPoemLevel(li + 1);
        updatePoemProgress();
        speak('Starting ' + poemLevels[li + 1].title);
      }, 1500);
    }
  }
}

function updatePoemProgress() {
  const row = document.getElementById('poemProgress');
  row.innerHTML = '';
  for (let i = 0; i < poemLevels.length; i++) {
    const dot = document.createElement('div');
    dot.className = 'poem-dot';
    if (i < poemState.current) dot.classList.add('done');
    else if (i === poemState.current) dot.classList.add('current');
    row.appendChild(dot);
  }
}

function resetPoemGame() {
  if (poemState.timerId) { clearInterval(poemState.timerId); poemState.timerId = null; }
  poemState = { current: 0, filled: [], currentSlot: 0, isFiring: false, timeLeft: POEM_TIMER, timerId: null };
}

initPoemGame();

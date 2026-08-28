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
  
  const positions = [
    { left: '56%', top: '12%' },
    { left: '74%', top: '12%' },
    { left: '90%', top: '12%' },
    { left: '60%', top: '35%' },
    { left: '80%', top: '35%' },
    { left: '56%', top: '58%' },
    { left: '74%', top: '58%' },
    { left: '90%', top: '58%' }
  ];
  
  allWords.forEach((word, i) => {
    const pos = positions[i % positions.length];
    const ast = document.createElement('div');
    ast.className = 'poem-asteroid';
    ast.style.left = pos.left;
    ast.style.top = pos.top;
    ast.textContent = word;
    ast.onclick = () => shootPoemAsteroid(ast, word);
    asteroids.appendChild(ast);
  });
  
  document.getElementById('poemInstruction').textContent = `🎯 SHOOT WORD FOR SLOT #1`;
  document.getElementById('poemGameScore').textContent = G.score;
  
  setupPoemAimLine();
  startPoemTimer();
}

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
      
      asteroidEl.style.display = 'none';
      addScore(100);
      playSound('correct');
      speak('Correct!');
      document.getElementById('poemGameScore').textContent = G.score;
      showPoemMessage(`⚡ "${word.toUpperCase()}" SLOTTED!`);
      
      poemState.currentSlot++;
      
      if (poemState.currentSlot < lvl.answers.length) {
        document.getElementById('poemSlot' + poemState.currentSlot).classList.add('active');
        document.getElementById('poemInstruction').textContent = `🎯 SHOOT WORD FOR SLOT #${poemState.currentSlot + 1}`;
      } else {
        document.getElementById('poemInstruction').textContent = '🏆 MISSION COMPLETE!';
        setTimeout(() => checkPoemLevelComplete(poemState.current), 1000);
      }
    } else {
      wrongAnswer();
      playSound('wrong');
      speak('Try again');
      showPoemMessage('❌ WRONG WORD FOR THIS SLOT!');
    }
  }, 250);
}

function showPoemMessage(text, duration) {
  const msg = document.getElementById('poemMessage');
  msg.textContent = text;
  msg.style.display = 'block';
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
      showPoemMessage('🎉 MISSION COMPLETE!', 4000);
      setTimeout(() => {
        poemState.current = li + 1;
        renderPoemLevel(li + 1);
        updatePoemProgress();
        speak('Starting ' + poemLevels[li + 1].title);
      }, 3800);
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

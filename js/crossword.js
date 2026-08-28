/* ========== GAME 2: CROSSWORD (PICTURE CLUE STYLE) ========== */

var crosswordWords = [
  { number: 1, word: 'NOSE', clue: 'Organ to smell', row: 0, col: 5, dir: 'down', emoji: '👃', image: '../assets/body-parts%20(2).png', label: 'Nose', cluePos: 'top' },
  { number: 2, word: 'TONGUE', clue: 'Organ to taste', row: 1, col: 7, dir: 'down', emoji: '👅', image: '../assets/tongue.png', label: 'Tongue', cluePos: 'top' },
  { number: 3, word: 'MOUTH', clue: 'Organ to taste & speak', row: 1, col: 4, dir: 'across', emoji: '👄', image: '../assets/mouth1-removebg-preview.png', label: 'Mouth', cluePos: 'right' },
  { number: 4, word: 'EYES', clue: 'Organs to see', row: 2, col: 2, dir: 'down', emoji: '👁️', image: '../assets/body-parts%20(3).png', label: 'Eyes', cluePos: 'top', clueOffsetY: 20 },
  { number: 5, word: 'EARS', clue: 'Organs to hear', row: 2, col: 2, dir: 'across', emoji: '👂', image: '../assets/ear.png', label: 'Ears', cluePos: 'left', clueOffsetY: 64 },
  { number: 6, word: 'TEETH', clue: 'Organs to chew', row: 4, col: 0, dir: 'across', emoji: '🦷', label: 'Teeth', cluePos: 'left', clueOffsetY: 58, clueOffsetX: -20 }
];

var CROSS_ROWS = 7;
var CROSS_COLS = 9;
var CROSS_SHAPE = [
  '.....#...',
  '....#####',
  '..####.#.',
  '..####.#.',
  '#####..#.',
  '..#....#.',
  '.......#.'
];

var crossState = { grid: [], filled: {}, solved: 0, total: crosswordWords.length, feedback: {}, finished: false };
var CROSS_TIMER = 300;
var crossTimerId = null;
var crossTimeLeft = CROSS_TIMER;

function initCrosswordGame() {
  crossState.filled = {
    '0,5': 'n',
    '2,4': 'r',
    '1,7': 't',
    '4,2': 'e'
  };
  crossState.solved = 0;
  crossState.feedback = {};
  crossState.finished = false;

  crossState.grid = [];
  for (var r = 0; r < CROSS_ROWS; r++) {
    crossState.grid[r] = [];
    for (var c = 0; c < CROSS_COLS; c++) {
      crossState.grid[r][c] = {
        letter: '',
        type: CROSS_SHAPE[r][c] === '#' ? 'letter' : 'empty',
        wordIdx: -1,
        isStart: false
      };
    }
  }

  crosswordWords.forEach(function(w, idx) {
    var chars = w.word.split('');
    chars.forEach(function(ch, i) {
      var r = w.dir === 'down' ? w.row + i : w.row;
      var c = w.dir === 'across' ? w.col + i : w.col;
      if (r < CROSS_ROWS && c < CROSS_COLS) {
        crossState.grid[r][c] = {
          letter: ch,
          type: 'letter',
          wordIdx: idx,
          isStart: i === 0
        };
      }
    });
  });

  renderCrossword();
  startCrossTimer();
}

function renderCrossword() {
  var stage = document.getElementById('crosswordStage');
  var html = '';
  html += '<div class="cross-header">';
  html += '<div class="cross-title">🧩 Use the pictures as clues and complete the crossword puzzle.</div>';
  html += '<div class="cross-progress" id="crossCount">' + crossState.solved + '/' + crossState.total + ' Words</div>';
  html += '</div>';

  html += '<div class="cross-layout">';

  // Grid area with emoji clues around it
  html += '<div class="cross-grid-area">';

  // Emoji clues positioned around the grid
  crosswordWords.forEach(function(w, idx) {
    var pos = getCluePosition(w);
    var filled = isWordComplete(w);
    html += '<div class="cross-clue-emoji' + (filled ? ' done' : '') + '" style="top:' + pos.top + ';left:' + pos.left + ';">';
    html += '<span class="cross-clue-icon">' + (w.image ? '<img src="' + w.image + '" alt="' + w.label + '">' : w.emoji) + '</span>';
    if (filled) html += '<span class="cross-clue-check">✓</span>';
    html += '</div>';
  });

  // The crossword grid
  html += '<div class="cross-grid">';
  for (var r = 0; r < CROSS_ROWS; r++) {
    for (var c = 0; c < CROSS_COLS; c++) {
      var cell = crossState.grid[r][c];
      if (cell.type === 'empty') {
        html += '<div class="cross-cell locked"></div>';
      } else {
        var key = r + ',' + c;
        var filled = crossState.filled[key] || '';
        var classes = 'cross-cell';
        if (cell.isStart) classes += ' start';
        if (filled) classes += ' filled';
        html += '<div class="' + classes + '" onclick="crossClick(' + r + ',' + c + ')">';
        var startNumbers = getCellStartNumbers(r, c);
        if (startNumbers) html += '<span class="cell-num">' + startNumbers + '</span>';
        html += '<span class="cell-letter">' + filled + '</span>';
        html += '</div>';
      }
    }
  }
  html += '</div>';
  html += '</div>';

  // Word bank sidebar
  html += '<div class="cross-wordbank">';
  html += '<div class="cross-wordbank-title">Words</div>';
  crosswordWords.forEach(function(w, idx) {
    var filled = isWordComplete(w);
    html += '<div class="cross-word-row' + (filled ? ' done' : '') + '">';
    html += '<span class="cross-word-emoji">' + (w.image ? '<img src="' + w.image + '" alt="' + w.label + '">' : w.emoji) + '</span>';
    html += '<span class="cross-word-label">' + w.label + '</span>';
    if (filled) html += '<span class="cross-word-check">✓</span>';
    html += '</div>';
  });
  html += '</div>';

  html += '</div>';

  stage.innerHTML = html;
}

function getCluePosition(w) {
  var cw = 45, gap = 2;
  var gridPadX = 86;
  var gridPadY = 72;
  var clueOffsetY = w.clueOffsetY || 0;
  var clueOffsetX = w.clueOffsetX || 0;
  var cellX = w.col * (cw + gap);
  var cellY = w.row * (cw + gap);
  
  if (w.cluePos === 'top') {
    return { top: (cellY + gridPadY - 62 + clueOffsetY) + 'px', left: (gridPadX + cellX + cw / 2 - 22) + 'px' };
  } else if (w.cluePos === 'right') {
    var endX = (w.col + w.word.length) * (cw + gap);
    return { top: (cellY + gridPadY + cw / 2 - 22 + clueOffsetY) + 'px', left: (gridPadX + endX + 10) + 'px' };
  } else if (w.cluePos === 'left') {
    return { top: (cellY + cw / 2 - 22 + clueOffsetY) + 'px', left: (gridPadX + cellX - 46 + clueOffsetX) + 'px' };
  } else {
    if (w.dir === 'down') {
      return { top: (cellY + gridPadY - 62 + clueOffsetY) + 'px', left: (gridPadX + cellX + cw / 2 - 22) + 'px' };
    } else {
      return { top: (cellY + cw / 2 - 22 + clueOffsetY) + 'px', left: (gridPadX + cellX - 46 + clueOffsetX) + 'px' };
    }
  }
}

function getCellStartNumbers(row, col) {
  var numbers = [];
  crosswordWords.forEach(function(w) {
    if (w.row === row && w.col === col) numbers.push(w.number);
  });
  return numbers.join('/');
}

function getRevealedWord(w) {
  var chars = w.word.split('');
  var revealed = '';
  chars.forEach(function(ch, i) {
    var r = w.dir === 'down' ? w.row + i : w.row;
    var c = w.dir === 'across' ? w.col + i : w.col;
    var key = r + ',' + c;
    if (crossState.filled[key]) {
      revealed += '<span class="revealed-letter">' + crossState.filled[key] + '</span>';
    } else {
      revealed += '<span class="hidden-letter">_</span>';
    }
  });
  return revealed;
}

function isWordComplete(w) {
  var chars = w.word.split('');
  for (var i = 0; i < chars.length; i++) {
    var r = w.dir === 'down' ? w.row + i : w.row;
    var c = w.dir === 'across' ? w.col + i : w.col;
    var key = r + ',' + c;
    if (!crossState.filled[key] || crossState.filled[key].toUpperCase() !== chars[i].toUpperCase()) return false;
  }
  return true;
}

function crossClick(r, c) {
  var cell = crossState.grid[r][c];
  if (cell.type === 'empty') return;
  if (isCellLocked(r, c)) return;
  var key = r + ',' + c;
  var correctLetter = getLetterForCell(r, c);
  var wrongLetter = getWrongLetter(correctLetter);
  var popup = document.createElement('div');
  popup.className = 'cross-letter-popout';
  popup.innerHTML = '<button type="button" onclick="chooseCrossLetter(event, \'' + correctLetter + '\', ' + r + ', ' + c + ')">' + correctLetter.toUpperCase() + '</button>' +
    '<button type="button" onclick="chooseCrossLetter(event, \'' + wrongLetter + '\', ' + r + ', ' + c + ')">' + wrongLetter.toUpperCase() + '</button>';
  var target = document.querySelector('.cross-cell[onclick="crossClick(' + r + ',' + c + ')"]');
  if (target) {
    document.querySelectorAll('.cross-letter-popout').forEach(function(oldPopup) { oldPopup.remove(); });
    var gridArea = document.querySelector('.cross-grid-area');
    var cellRect = target.getBoundingClientRect();
    var areaRect = gridArea.getBoundingClientRect();
    popup.style.left = (cellRect.left - areaRect.left + cellRect.width / 2) + 'px';
    popup.style.top = (cellRect.top - areaRect.top + cellRect.height / 2) + 'px';
    gridArea.appendChild(popup);
  }
}

function isCellLocked(r, c) {
  for (var i = 0; i < crosswordWords.length; i++) {
    var w = crosswordWords[i];
    for (var j = 0; j < w.word.length; j++) {
      var wordRow = w.dir === 'down' ? w.row + j : w.row;
      var wordCol = w.dir === 'across' ? w.col + j : w.col;
      if (wordRow === r && wordCol === c && isWordComplete(w)) return true;
    }
  }
  return false;
}

function getLetterForCell(r, c) {
  var cell = crossState.grid[r][c];
  if (cell.letter) return cell.letter.toLowerCase();
  for (var i = 0; i < crosswordWords.length; i++) {
    var w = crosswordWords[i];
    for (var j = 0; j < w.word.length; j++) {
      var wordRow = w.dir === 'down' ? w.row + j : w.row;
      var wordCol = w.dir === 'across' ? w.col + j : w.col;
      if (wordRow === r && wordCol === c) return w.word[j].toLowerCase();
    }
  }
  return 'e';
}

function getWrongLetter(correctLetter) {
  var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var wrongLetter = correctLetter.toUpperCase();
  while (wrongLetter === correctLetter.toUpperCase()) {
    wrongLetter = letters[Math.floor(Math.random() * letters.length)];
  }
  return wrongLetter.toLowerCase();
}

function chooseCrossLetter(event, letter, r, c) {
  event.stopPropagation();
  var key = r + ',' + c;
  crossState.filled[key] = letter;
  updateSolvedCount();
  renderCrossword();
}

function updateSolvedCount() {
  var solved = 0;
  crosswordWords.forEach(function(w) {
    if (isWordComplete(w)) {
      solved++;
      if (crossState.feedback[w.label] !== 'correct') {
        crossState.feedback[w.label] = 'correct';
        playSound('correct');
        speak('Correct ' + w.label);
        showBanner('Correct ' + w.label + '!', 'correct');
      }
    } else if (isWordFilled(w) && crossState.feedback[w.label] !== 'correct') {
      if (crossState.feedback[w.label] !== 'wrong') {
        crossState.feedback[w.label] = 'wrong';
        wrongAnswer();
        playSound('wrong');
        speak('Try again');
        showBanner('Wrong ' + w.label + ' - try again', 'wrong');
      }
    }
  });
  crossState.solved = solved;
  var el = document.getElementById('crossCount');
  if (el) el.textContent = solved + '/' + crossState.total + ' Words';
  if (solved === crossState.total && !crossState.finished) {
    crossState.finished = true;
    stopCrossTimer();
    setTimeout(function() {
      playSound('correct');
      speak('Crossword complete!');
      addScore(50);
      showResult('🧩', 'Crossword Complete!', G.score, G.totalXP, G.bestCombo);
    }, 2100);
  }
}

function isWordFilled(w) {
  for (var i = 0; i < w.word.length; i++) {
    var r = w.dir === 'down' ? w.row + i : w.row;
    var c = w.dir === 'across' ? w.col + i : w.col;
    if (!crossState.filled[r + ',' + c]) return false;
  }
  return true;
}

function checkCrossword() {
  var correct = 0;
  crosswordWords.forEach(function(w) { if (isWordComplete(w)) correct++; });
  crossState.solved = correct;
  var el = document.getElementById('crossCount');
  if (el) el.textContent = correct + '/' + crossState.total + ' Words';
  if (correct === crossState.total) {
    addScore(50);
    showResult('🧩', 'Crossword Complete!', G.score, G.totalXP, G.bestCombo);
  } else {
    showBanner(correct + '/' + crossState.total + ' correct — try again!', 'combo');
  }
}

function resetCrosswordGame() {
  crossState = { grid: [], filled: {
    '0,5': 'n',
    '2,4': 'r',
    '1,7': 't',
    '4,2': 'e'
  }, solved: 0, total: crosswordWords.length, feedback: {}, finished: false };
  stopCrossTimer();
}

function startCrossTimer() {
  stopCrossTimer();
  crossTimeLeft = CROSS_TIMER;
  updateCrossTimerUI();
  crossTimerId = setInterval(function() {
    crossTimeLeft--;
    updateCrossTimerUI();
    if (crossTimeLeft <= 0) {
      stopCrossTimer();
      crossTimeUp();
    }
  }, 1000);
}

function stopCrossTimer() {
  if (crossTimerId) { clearInterval(crossTimerId); crossTimerId = null; }
}

function updateCrossTimerUI() {
  var el = document.getElementById('crossTimer');
  if (!el) return;
  var m = Math.floor(Math.max(0, crossTimeLeft) / 60);
  var s = Math.max(0, crossTimeLeft) % 60;
  el.textContent = '⏰ ' + m + ':' + (s < 10 ? '0' + s : s);
  el.classList.toggle('low', crossTimeLeft <= 30);
}

function crossTimeUp() {
  if (crossState.finished) return;
  crossState.finished = true;
  speak("Time's Up! Crossword Over!");
  showResult('⏰', "Time's Up!", G.score, G.totalXP, G.bestCombo, true);
}

initCrosswordGame();

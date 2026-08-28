/* ========== GAME 2: CROSSWORD (PICTURE CLUE STYLE) ========== */

var crosswordWords = [
  { word: 'NOSE', clue: 'Organ to smell', row: 0, col: 5, dir: 'down', emoji: '👃', label: 'Nose', cluePos: 'top' },
  { word: 'TONGUE', clue: 'Organ to taste', row: 1, col: 7, dir: 'down', emoji: '👅', label: 'Tongue', cluePos: 'top' },
  { word: 'MOUTH', clue: 'Organ to taste & speak', row: 1, col: 4, dir: 'across', emoji: '👄', label: 'Mouth', cluePos: 'right' },
  { word: 'EYES', clue: 'Organs to see', row: 4, col: 0, dir: 'across', emoji: '👁️', label: 'Eyes', cluePos: 'left' },
  { word: 'EARS', clue: 'Organs to hear', row: 2, col: 2, dir: 'across', emoji: '👂', label: 'Ears', cluePos: 'left' }
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

var crossState = { grid: [], filled: {}, solved: 0, total: crosswordWords.length };

function initCrosswordGame() {
  crossState.filled = {
    '0,5': 'n',
    '2,4': 'r',
    '1,7': 't',
    '4,2': 'e'
  };
  crossState.solved = 0;

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
    html += '<span class="cross-clue-num">' + (idx + 1) + '</span>';
    html += '<span class="cross-clue-icon">' + w.emoji + '</span>';
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
        if (cell.isStart) {
          html += '<span class="cell-num">' + (cell.wordIdx + 1) + '</span>';
        }
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
    html += '<span class="cross-word-emoji">' + w.emoji + '</span>';
    html += '<span class="cross-word-label">' + w.label + ' — </span>';
    html += '<span class="cross-word-letters">' + getRevealedWord(w) + '</span>';
    html += '</div>';
  });
  html += '</div>';

  html += '</div>';

  html += '<div class="crossword-actions">';
  html += '<button class="btn btn-leaf" onclick="checkCrossword()">Check Crossword ✓</button>';
  html += '</div>';

  stage.innerHTML = html;
}

function getCluePosition(w) {
  var cw = 29, gap = 1;
  var cellX = w.col * (cw + gap);
  var cellY = w.row * (cw + gap);
  
  if (w.cluePos === 'top') {
    return { top: (cellY - 56) + 'px', left: (cellX + cw / 2 - 18) + 'px' };
  } else if (w.cluePos === 'right') {
    var endX = (w.col + w.word.length) * (cw + gap);
    return { top: (cellY + cw / 2 - 18) + 'px', left: (endX + 8) + 'px' };
  } else if (w.cluePos === 'left') {
    return { top: (cellY + cw / 2 - 18) + 'px', left: (cellX - 28) + 'px' };
  } else {
    if (w.dir === 'down') {
      return { top: (cellY - 56) + 'px', left: (cellX + cw / 2 - 18) + 'px' };
    } else {
      return { top: (cellY + cw / 2 - 18) + 'px', left: (cellX - 28) + 'px' };
    }
  }
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
  var key = r + ',' + c;
  if (crossState.filled[key]) {
    delete crossState.filled[key];
    renderCrossword();
    return;
  }
  var letter = prompt('Enter a letter:');
  if (letter && letter.trim().length === 1) {
    crossState.filled[key] = letter.trim().toLowerCase();
    renderCrossword();
    updateSolvedCount();
  }
}

function updateSolvedCount() {
  var solved = 0;
  crosswordWords.forEach(function(w) { if (isWordComplete(w)) solved++; });
  crossState.solved = solved;
  var el = document.getElementById('crossCount');
  if (el) el.textContent = solved + '/' + crossState.total + ' Words';
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
  }, solved: 0, total: crosswordWords.length };
}

initCrosswordGame();

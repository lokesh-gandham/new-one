/* ========== GAME 2: CROSSWORD (PICTURE CLUE STYLE) ========== */

var crosswordWords = [
  { number: 1, word: 'NOSE', clue: 'Organ to smell', row: 0, col: 5, dir: 'down', emoji: '👃', image: '../assets/cw-nose.png', label: 'Nose', cluePos: 'top', clueOffsetX: -6, clueOffsetY: -2 },
  { number: 2, word: 'TONGUE', clue: 'Organ to taste', row: 1, col: 7, dir: 'down', emoji: '👅', image: '../assets/cw-tongue.png', label: 'Tongue', cluePos: 'top', clueScale: 1.1, clueOffsetX: 12, clueOffsetY: -10 },
  { number: 3, word: 'MOUTH', clue: 'Organ to taste & speak', row: 1, col: 4, dir: 'across', emoji: '👄', image: '../assets/cw-mouth.png', label: 'Mouth', cluePos: 'right', clueOffsetX: 6, clueOffsetY: 0 },
  { number: 4, word: 'EYES', clue: 'Organs to see', row: 2, col: 2, dir: 'down', emoji: '👁️', image: '../assets/cw-eyes.png', label: 'Eyes', cluePos: 'top', clueOffsetX: -6, clueOffsetY: -4 },
  { number: 5, word: 'EARS', clue: 'Organs to hear', row: 2, col: 2, dir: 'across', emoji: '👂', image: '../assets/ears-new.png', label: 'Ears', cluePos: 'left', clueScale: 1.05, clueAspect: 1.7, clueOffsetX: -4, clueOffsetY: 8 },
  { number: 6, word: 'TEETH', clue: 'Organs to chew', row: 4, col: 0, dir: 'across', emoji: '🦷', image: '../assets/cw-teeth.png', label: 'Teeth', cluePos: 'left', clueOffsetX: -4 }
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

var crossState = { grid: [], filled: {}, hintKeys: [], solved: 0, total: crosswordWords.length, feedback: {}, finished: false };
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
  crossState.hintKeys = Object.keys(crossState.filled);
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
  html += '<div class="cross-grid-area" id="crossGridArea">';

  // Emoji clue placeholders — exact position/size is computed in JS after
  // the grid is in the DOM (see layoutCrossword), so they always line up
  // with the real, currently-rendered cells instead of guessed pixel maths.
  crosswordWords.forEach(function(w, idx) {
    var filled = isWordComplete(w);
    html += '<div class="cross-clue-emoji' + (filled ? ' done' : '') + '" data-clue-idx="' + idx + '">';
    html += '<span class="cross-clue-icon">' + (w.image ? '<img src="' + w.image + '" alt="' + w.label + '">' : w.emoji) + '</span>';
    if (filled) html += '<span class="cross-clue-check">✓</span>';
    html += '</div>';
  });

  // The crossword grid
  html += '<div class="cross-grid" id="crossGrid">';
  for (var r = 0; r < CROSS_ROWS; r++) {
    for (var c = 0; c < CROSS_COLS; c++) {
      var cell = crossState.grid[r][c];
      if (cell.type === 'empty') {
        html += '<div class="cross-cell locked"></div>';
      } else if (!isCellPartOfWord(r, c)) {
        html += '<div class="cross-cell locked"></div>';
      } else {
        var key = r + ',' + c;
        var filled2 = crossState.filled[key] || '';
        var classes = 'cross-cell';
        if (cell.isStart) classes += ' start';
        if (filled2) classes += ' filled';
        var startNumbers = getCellStartNumbers(r, c);
        if (startNumbers) {
          classes += ' has-num';
        }
        html += '<div class="' + classes + '" data-row="' + r + '" data-col="' + c + '" onclick="crossClick(' + r + ',' + c + ')">';
        if (startNumbers) html += '<span class="cell-num">' + startNumbers + '</span>';
        html += '<span class="cell-letter">' + filled2 + '</span>';
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
  layoutCrossword();
}

/* ========== LAYOUT (measurement-based, resize-safe) ==========
   Instead of guessing pixel positions per breakpoint (which drifted out of
   sync with the CSS and could clip clue icons off-screen), this measures
   the grid actually rendered by the browser and derives everything —
   letter size, number-badge size, clue-icon size and clue position — from
   it. That keeps every cell and every clue icon perfectly aligned and
   fully visible at any window size, and stays correct on resize. */
function layoutCrossword() {
  var area = document.getElementById('crossGridArea');
  var grid = document.getElementById('crossGrid');
  if (!area || !grid) return;

  var sampleCell = grid.querySelector('.cross-cell:not(.locked)');
  if (!sampleCell) return;
  var cellRect = sampleCell.getBoundingClientRect();
  var cellSize = cellRect.width;
  if (!cellSize) return;

  // Scale typography/icon sizes off the real cell size instead of a fixed
  // list of breakpoint values, so they shrink/grow smoothly.
  // Large external monitors get bigger caps so the grid letters and clue
  // pictures scale up with the enlarged grid; laptops (<=1600px) keep the
  // original tight caps untouched.
  var isMonitor = window.innerWidth >= 1601;
  var cellFont = clampNum(cellSize * 0.5, 13, isMonitor ? 56 : 34);
  var numFont = clampNum(cellSize * 0.17, 8, isMonitor ? 22 : 13);
  // Keep clue pictures close to the old fixed ~48px so they never dominate the
  // board or overlap each other on a laptop.
  var clueSize = clampNum(cellSize * 0.82, 32, isMonitor ? 88 : 50);
  var clueEmojiFont = clampNum(cellSize * 0.4, 16, isMonitor ? 48 : 28);
  area.style.setProperty('--cross-cell-font', cellFont + 'px');
  area.style.setProperty('--cross-num-font', numFont + 'px');
  area.style.setProperty('--cross-clue-size', clueSize + 'px');
  area.style.setProperty('--cross-clue-font', clueEmojiFont + 'px');

  var areaRect = area.getBoundingClientRect();
  // Distance between a clue picture and its cell. Tighter on laptops so the
  // side clues (ears / eyes / mouth / teeth) sit close to the grid; monitors
  // keep the roomier spacing.
  var gap = isMonitor ? Math.max(10, cellSize * 0.26) : Math.max(5, cellSize * 0.12);

  // Hand-tuned offsets in the word list were picked against a ~64px cell, so
  // scale them with the real cell size — otherwise they overshoot and land a
  // clue on top of the grid on smaller / display-scaled laptop screens.
  var offScale = cellSize / 64;

  crosswordWords.forEach(function(w, idx) {
    var clueEl = area.querySelector('.cross-clue-emoji[data-clue-idx="' + idx + '"]');
    if (!clueEl) return;
    // Per-clue size override, capped so no single picture blows out of
    // proportion. Ears art is wide, so it gets a slightly larger cap.
    var scale = Math.min(w.clueScale || 1, 1.12);
    var aspect = Math.min(w.clueAspect || 1, 1.72);
    var iconEl = clueEl.querySelector('.cross-clue-icon');
    if (iconEl) {
      iconEl.style.width = (clueSize * scale * aspect) + 'px';
      iconEl.style.height = (clueSize * scale) + 'px';
      iconEl.style.fontSize = (clueEmojiFont * scale) + 'px';
    }
    var startCell = grid.querySelector('.cross-cell[data-row="' + w.row + '"][data-col="' + w.col + '"]');
    if (!startCell) return;
    var startRect = startCell.getBoundingClientRect();
    var clueRect = clueEl.getBoundingClientRect();
    var offsetY = (w.clueOffsetY || 0) * offScale;
    var offsetX = (w.clueOffsetX || 0) * offScale;
    var top, left;

    // Anchor edges (relative to the area) for the "must not overlap the grid"
    // clamp applied after offsets.
    var anchorRect = startRect;
    var endRect = startRect;
    if (w.dir === 'across') {
      var endCell = grid.querySelector('.cross-cell[data-row="' + w.row + '"][data-col="' + (w.col + w.word.length - 1) + '"]');
      if (endCell) endRect = endCell.getBoundingClientRect();
      var midCol = w.col + Math.floor((w.word.length - 1) / 2);
      var midCell = grid.querySelector('.cross-cell[data-row="' + w.row + '"][data-col="' + midCol + '"]');
      if (midCell) anchorRect = midCell.getBoundingClientRect();
    } else {
      var endCellD = grid.querySelector('.cross-cell[data-row="' + (w.row + w.word.length - 1) + '"][data-col="' + w.col + '"]');
      if (endCellD) endRect = endCellD.getBoundingClientRect();
    }

    if (w.cluePos === 'right') {
      left = (endRect.right - areaRect.left) + gap + offsetX;
      top = (endRect.top - areaRect.top) + (endRect.height - clueRect.height) / 2 + offsetY;
    } else if (w.cluePos === 'left') {
      left = (startRect.left - areaRect.left) - clueRect.width - gap + offsetX;
      top = (startRect.top - areaRect.top) + (startRect.height - clueRect.height) / 2 + offsetY;
    } else {
      // 'top' (default): centred above the start cell, or above the middle of
      // the word for an across clue so it reads naturally.
      left = (anchorRect.left - areaRect.left) + (anchorRect.width - clueRect.width) / 2 + offsetX;
      top = (anchorRect.top - areaRect.top) - clueRect.height - gap + offsetY;
    }

    // Hard rule: a clue picture must never sit on top of the grid. Push it
    // back to the correct side of its own word with at least `gap` clearance,
    // whatever the offsets asked for. This is what keeps clues off the cells
    // on every laptop size.
    var edgeGap = Math.max(4, gap);
    if (w.cluePos === 'right') {
      left = Math.max(left, (endRect.right - areaRect.left) + edgeGap);
    } else if (w.cluePos === 'left') {
      left = Math.min(left, (startRect.left - areaRect.left) - clueRect.width - edgeGap);
    } else {
      top = Math.min(top, (anchorRect.top - areaRect.top) - clueRect.height - edgeGap);
    }

    // Keep the clue on screen: it may hang a little past the grid area (which
    // has overflow:visible) but not off the page.
    var pagePad = 6;
    var absLeft = areaRect.left + left;
    if (absLeft < pagePad) left += (pagePad - absLeft);
    var absRight = areaRect.left + left + clueRect.width;
    if (absRight > window.innerWidth - pagePad) left -= (absRight - (window.innerWidth - pagePad));
    var absTop = areaRect.top + top;
    if (absTop < pagePad) top += (pagePad - absTop);

    clueEl.style.left = left + 'px';
    clueEl.style.top = top + 'px';
  });
}

function clampNum(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Re-layout on resize/orientation change so clue icons and text always
// track the grid, even if the window is resized mid-game. Debounced so a
// drag-resize doesn't thrash layout on every pixel. Any open letter-choice
// popout is closed immediately since its position was computed for the
// old size and would otherwise drift or end up clipped.
var _crossResizeTimer = null;
window.addEventListener('resize', function() {
  document.querySelectorAll('.cross-letter-popout').forEach(function(p) { p.remove(); });
  clearTimeout(_crossResizeTimer);
  _crossResizeTimer = setTimeout(layoutCrossword, 120);
});

// Re-run the measurement-based layout once fonts/images settle and once more
// on full load — the first synchronous pass can measure a not-yet-final grid,
// which would leave clue pictures stacked in the corner.
window.addEventListener('load', function() { layoutCrossword(); setTimeout(layoutCrossword, 150); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function() { layoutCrossword(); });
document.addEventListener('load', function(e) {
  if (e.target && e.target.tagName === 'IMG' && e.target.closest('.cross-clue-icon')) layoutCrossword();
}, true);

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

function isCellPartOfWord(r, c) {
  for (var i = 0; i < crosswordWords.length; i++) {
    var w = crosswordWords[i];
    for (var j = 0; j < w.word.length; j++) {
      var wordRow = w.dir === 'down' ? w.row + j : w.row;
      var wordCol = w.dir === 'across' ? w.col + j : w.col;
      if (wordRow === r && wordCol === c) return true;
    }
  }
  return false;
}

function crossClick(r, c) {
  var cell = crossState.grid[r][c];
  if (cell.type === 'empty') return;
  if (!isCellPartOfWord(r, c)) return;
  if (isCellLocked(r, c)) return;
  var hintKeys = crossState.hintKeys || [];
  if (hintKeys.indexOf(r + ',' + c) !== -1) return;
  var key = r + ',' + c;
  var correctLetter = getLetterForCell(r, c);
  var wrongLetter = getWrongLetter(correctLetter);
  var popup = document.createElement('div');
  popup.className = 'cross-letter-popout';
  popup.innerHTML = '<button type="button" onclick="chooseCrossLetter(event, \'' + correctLetter + '\', ' + r + ', ' + c + ')">' + correctLetter.toUpperCase() + '</button>' +
    '<button type="button" onclick="chooseCrossLetter(event, \'' + wrongLetter + '\', ' + r + ', ' + c + ')">' + wrongLetter.toUpperCase() + '</button>';
  var target = document.querySelector('.cross-cell[data-row="' + r + '"][data-col="' + c + '"]');
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
  crossState.filled[key] = letter.toUpperCase();
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
        addScore(20);
        showBanner('Correct ' + w.label + '!', 'correct');
      }
    } else if (isWordFilled(w) && crossState.feedback[w.label] !== 'correct') {
      crossState.feedback[w.label] = 'wrong';
      wrongAnswer();
      playSound('wrong');
      speak('Try again');
      showBanner('Wrong ' + w.label + ' - try again', 'wrong');
      var hintKeys = crossState.hintKeys || [];
      var chars = w.word.split('');
      chars.forEach(function(ch, i) {
        var wr = w.dir === 'down' ? w.row + i : w.row;
        var wc = w.dir === 'across' ? w.col + i : w.col;
        var k = wr + ',' + wc;
        if (hintKeys.indexOf(k) === -1) {
          delete crossState.filled[k];
        }
      });
      crossState.feedback[w.label] = undefined;
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
  }, hintKeys: ['0,5', '2,4', '1,7', '4,2'], solved: 0, total: crosswordWords.length, feedback: {}, finished: false };
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
// Settle passes: the grid's flex/aspect-ratio size isn't final on the first
// synchronous layout, so re-measure on the next frames to avoid a brief
// corner pile-up of the clue pictures.
requestAnimationFrame(layoutCrossword);
setTimeout(layoutCrossword, 80);
setTimeout(layoutCrossword, 300);

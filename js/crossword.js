/* ========== GAME 2: CROSSWORD ========== */
const crosswordWords = [
  { word: 'NOSE', clue: 'Organ to smell', row: 0, col: 2, dir: 'down', emoji: '👃' },
  { word: 'EYES', clue: 'Organs to see', row: 1, col: 0, dir: 'across', emoji: '👁️' },
  { word: 'EARS', clue: 'Organs to hear', row: 1, col: 0, dir: 'down', emoji: '👂' },
  { word: 'TONGUE', clue: 'Organ to taste', row: 0, col: 4, dir: 'down', emoji: '👅' },
  { word: 'SKIN', clue: 'Organ to feel', row: 3, col: 1, dir: 'across', emoji: '✋' }
];

let crossState = { grid: [], filled: {}, activeClue: null, solved: 0 };

function initCrosswordGame() {
  crossState.grid = Array(6).fill(null).map(() => Array(6).fill({ letter: '', type: 'empty' }));
  crossState.filled = {};
  crossState.solved = 0;
  
  crosswordWords.forEach(w => {
    const chars = w.word.split('');
    chars.forEach((ch, i) => {
      const r = w.dir === 'down' ? w.row + i : w.row;
      const c = w.dir === 'across' ? w.col + i : w.col;
      if (r < 6 && c < 6) {
        crossState.grid[r][c] = { letter: ch, type: 'letter', wordIdx: crosswordWords.indexOf(w) };
      }
    });
  });
  
  renderCrossword();
}

function renderCrossword() {
  const stage = document.getElementById('crosswordStage');
  let html = '<div style="display:flex;justify-content:center;"><div class="crossword-grid" style="grid-template-columns:repeat(6,48px);">';
  
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const cell = crossState.grid[r][c];
      if (cell.type === 'empty') {
        html += `<div class="crossword-cell locked"></div>`;
      } else {
        const key = r + ',' + c;
        const filled = crossState.filled[key] || '';
        html += `<div class="crossword-cell" data-r="${r}" data-c="${c}" onclick="clickCrossCell(${r},${c})">${filled}</div>`;
      }
    }
  }
  
  html += '</div></div>';
  html += '<div class="clues-panel"><div class="clue-group"><h4>📖 Clues</h4>';
  
  crosswordWords.forEach((w, i) => {
    html += `<div class="clue-item" data-idx="${i}" onclick="selectCrossClue(${i})">${w.emoji} ${w.clue} (${w.word.length} letters)</div>`;
  });
  
  html += '</div></div>';
  html += '<div style="text-align:center;margin-top:16px;"><button class="btn btn-leaf" onclick="checkCrossword()">Check Crossword ✓</button></div>';
  stage.innerHTML = html;
  
  document.getElementById('crossCount').textContent = crossState.solved + '/' + crosswordWords.length + ' Words';
}

function selectCrossClue(idx) {
  crossState.activeClue = idx;
  document.querySelectorAll('.clue-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  showBanner('Type the word: ' + crosswordWords[idx].word.length + ' letters', 'combo');
}

function clickCrossCell(r, c) {
  const key = r + ',' + c;
  if (crossState.filled[key]) {
    delete crossState.filled[key];
  } else {
    const letter = prompt('Enter letter for this cell:');
    if (letter && letter.length === 1) {
      crossState.filled[key] = letter.toUpperCase();
    }
  }
  renderCrossword();
}

function checkCrossword() {
  let correct = 0;
  crosswordWords.forEach(w => {
    let wordCorrect = true;
    const chars = w.word.split('');
    chars.forEach((ch, i) => {
      const r = w.dir === 'down' ? w.row + i : w.row;
      const c = w.dir === 'across' ? w.col + i : w.col;
      const key = r + ',' + c;
      if (crossState.filled[key] !== ch) wordCorrect = false;
    });
    if (wordCorrect) correct++;
  });
  
  crossState.solved = correct;
  document.getElementById('crossCount').textContent = correct + '/' + crosswordWords.length + ' Words';
  
  if (correct === crosswordWords.length) {
    addScore(50);
    showBanner('🎉 Crossword Complete!', 'achieve');
    setTimeout(() => showResult('🧩', 'Crossword Complete!', G.score, G.totalXP, G.bestCombo), 1500);
  } else {
    showBanner(correct + '/' + crosswordWords.length + ' correct — try again!', 'combo');
  }
}

function resetCrosswordGame() {
  crossState = { grid: [], filled: {}, activeClue: null, solved: 0 };
}

initCrosswordGame();

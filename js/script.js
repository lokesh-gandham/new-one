let score = 0;
let draggedWord = null;

document.addEventListener('DOMContentLoaded', () => {
    const chips = document.querySelectorAll('.word-chip');
    const blanks = document.querySelectorAll('.blank-slot');

    chips.forEach(chip => {
        chip.addEventListener('dragstart', handleDragStart);
        chip.addEventListener('dragend', handleDragEnd);
        chip.addEventListener('click', handleChipClick);
    });

    blanks.forEach(blank => {
        blank.addEventListener('dragover', handleDragOver);
        blank.addEventListener('dragleave', handleDragLeave);
        blank.addEventListener('drop', handleDrop);
        blank.addEventListener('click', handleBlankClick);
    });
});

let selectedChip = null;

function handleChipClick(e) {
    const chip = e.target;
    if (chip.classList.contains('used')) return;

    document.querySelectorAll('.word-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    selectedChip = chip;
}

function handleBlankClick(e) {
    const blank = e.target.closest('.blank-slot');
    if (!blank || !selectedChip) return;

    const word = selectedChip.dataset.word;
    placeWord(blank, word, selectedChip);
    selectedChip = null;
    document.querySelectorAll('.word-chip').forEach(c => c.classList.remove('selected'));
}

function handleDragStart(e) {
    draggedWord = e.target;
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
}

function handleDragOver(e) {
    e.preventDefault();
    e.target.closest('.blank-slot')?.classList.add('dragover');
}

function handleDragLeave(e) {
    e.target.closest('.blank-slot')?.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    const blank = e.target.closest('.blank-slot');
    if (!blank || !draggedWord) return;

    blank.classList.remove('dragover');
    const word = draggedWord.dataset.word;
    placeWord(blank, word, draggedWord);
}

function placeWord(blank, word, chip) {
    blank.querySelector('.blank-text').textContent = word;
    blank.dataset.current = word;
    blank.classList.add('filled');
    chip.classList.add('used');
}

function checkAnswers() {
    const blanks = document.querySelectorAll('.blank-slot');
    score = 0;

    blanks.forEach(blank => {
        const current = blank.dataset.current?.toLowerCase();
        const answer = blank.dataset.answer.toLowerCase();

        blank.classList.remove('correct', 'incorrect');

        if (current === answer) {
            blank.classList.add('correct');
            score += 10;
        } else {
            blank.classList.add('incorrect');
        }
    });

    document.getElementById('score').textContent = score;

    const resultMessage = document.getElementById('resultMessage');
    if (score === 80) {
        resultMessage.textContent = 'Perfect! 🎉 You got all answers right!';
        resultMessage.classList.add('success');
    } else if (score >= 50) {
        resultMessage.textContent = `Good job! You scored ${score} points. Try again for a perfect score!`;
        resultMessage.classList.remove('success');
    } else {
        resultMessage.textContent = `You scored ${score} points. Keep trying!`;
        resultMessage.classList.remove('success');
    }
}

function resetGame() {
    const blanks = document.querySelectorAll('.blank-slot');
    const chips = document.querySelectorAll('.word-chip');

    blanks.forEach(blank => {
        blank.querySelector('.blank-text').textContent = '';
        blank.dataset.current = '';
        blank.classList.remove('filled', 'correct', 'incorrect');
    });

    chips.forEach(chip => {
        chip.classList.remove('used', 'selected');
    });

    score = 0;
    document.getElementById('score').textContent = '0';
    document.getElementById('resultMessage').textContent = '';
    document.getElementById('resultMessage').classList.remove('success');
    selectedChip = null;
}

const boardElement = document.querySelector('#sudoku-board');
const numberPad = document.querySelector('#number-pad');
const timerElement = document.querySelector('.timer');
const mistakesElement = document.querySelector('.mistakes');
const difficultySelect = document.querySelector('#difficulty-select');

const puzzles = {
    easy: [
        '530070000', '600195000', '098000060', '800060003', '400803001',
        '700020006', '060000280', '000419005', '000080079'
    ],
    medium: [
        '000260701', '680070090', '190004500', '820100040', '004602900',
        '050003028', '009300074', '040050036', '703018000'
    ],
    hard: [
        '000000907', '000420180', '000705026', '100904000', '050000040',
        '000507009', '920108000', '034059000', '507000000'
    ],
    expert: [
        '000000010', '400000000', '020000000', '000050407', '008000300',
        '001090000', '300400200', '050100000', '000806000'
    ]
};

let puzzle = [];
let solution = [];
let values = [];
let selectedCell = null;
let mistakes = 0;
let elapsedSeconds = 0;
let timerId = null;
let undoStack = [];
let settings = {
    highlight: localStorage.getItem('highlight') !== 'off',
    theme: localStorage.getItem('theme') || 'dark'
};

function parsePuzzle(rows) {
    return rows.join('').split('').map(Number);
}

function solve(grid) {
    let bestIndex = -1;
    let candidates = null;
    for (let index = 0; index < 81; index += 1) {
        if (grid[index]) continue;
        const row = Math.floor(index / 9);
        const col = index % 9;
        const available = [];
        for (let number = 1; number <= 9; number += 1) {
            if (isValid(grid, row, col, number)) available.push(number);
        }
        if (!available.length) return false;
        if (!candidates || available.length < candidates.length) {
            bestIndex = index;
            candidates = available;
        }
    }
    if (bestIndex === -1) return true;
    const row = Math.floor(bestIndex / 9);
    const col = bestIndex % 9;
    for (const number of candidates) {
        if (isValid(grid, row, col, number)) {
            grid[bestIndex] = number;
            if (solve(grid)) return true;
            grid[bestIndex] = 0;
        }
    }
    return false;
}

function isValid(grid, row, col, number) {
    for (let i = 0; i < 9; i += 1) {
        if (grid[row * 9 + i] === number || grid[i * 9 + col] === number) return false;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r += 1) {
        for (let c = boxCol; c < boxCol + 3; c += 1) {
            if (grid[r * 9 + c] === number) return false;
        }
    }
    return true;
}

function formatTime(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function renderBoard() {
    boardElement.replaceChildren();
    values.forEach((value, index) => {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cell';
        cell.dataset.index = index;
        cell.textContent = value || '';
        if (puzzle[index]) cell.classList.add('given');
        else if (value) cell.classList.add('player');
        cell.addEventListener('click', () => selectCell(index));
        boardElement.appendChild(cell);
    });
    updateHighlights();
}

function selectCell(index) {
    if (puzzle[index]) return;
    selectedCell = index;
    updateHighlights();
}

function updateHighlights() {
    [...boardElement.children].forEach((cell, index) => {
        cell.classList.toggle('selected', index === selectedCell);
        cell.classList.remove('related', 'same-number');
        if (selectedCell === null || !settings.highlight) return;
        const row = Math.floor(index / 9);
        const col = index % 9;
        const selectedRow = Math.floor(selectedCell / 9);
        const selectedCol = selectedCell % 9;
        if (row === selectedRow || col === selectedCol ||
            (Math.floor(row / 3) === Math.floor(selectedRow / 3) &&
             Math.floor(col / 3) === Math.floor(selectedCol / 3))) {
            cell.classList.add('related');
        }
        if (values[selectedCell] && values[index] === values[selectedCell]) {
            cell.classList.add('same-number');
        }
    });
}

function enterNumber(number) {
    if (selectedCell === null || puzzle[selectedCell]) return;
    const previous = values[selectedCell];
    if (previous === number) return;
    undoStack.push({ index: selectedCell, value: previous });
    values[selectedCell] = number;
    if (number && number !== solution[selectedCell]) {
        mistakes += 1;
        values[selectedCell] = 0;
        mistakesElement.textContent = `Mistakes: ${mistakes}/3`;
        renderBoard();
        if (mistakes >= 3) {
            window.setTimeout(() => alert('Three mistakes reached. Keep trying!'), 0);
        }
        return;
    }
    renderBoard();
    checkComplete();
}

function erase() {
    if (selectedCell === null || puzzle[selectedCell] || !values[selectedCell]) return;
    undoStack.push({ index: selectedCell, value: values[selectedCell] });
    values[selectedCell] = 0;
    renderBoard();
}

function undo() {
    const action = undoStack.pop();
    if (!action) return;
    values[action.index] = action.value;
    renderBoard();
}

function hint() {
    if (selectedCell === null || puzzle[selectedCell]) return;
    values[selectedCell] = solution[selectedCell];
    renderBoard();
    checkComplete();
}

function checkComplete() {
    if (values.every((value, index) => value === solution[index])) {
        window.clearInterval(timerId);
        document.querySelector('#win-time').textContent = formatTime(elapsedSeconds);
        document.querySelector('#win-mistakes').textContent = mistakes;
        document.querySelector('#win-difficulty').textContent =
            difficultySelect.options[difficultySelect.selectedIndex].text;
        document.querySelector('#win-modal').style.display = 'flex';
    }
}

function newGame() {
    puzzle = parsePuzzle(puzzles[difficultySelect.value]);
    solution = [...puzzle];
    solve(solution);
    values = [...puzzle];
    selectedCell = null;
    mistakes = 0;
    elapsedSeconds = 0;
    undoStack = [];
    mistakesElement.textContent = 'Mistakes: 0/3';
    timerElement.textContent = '00:00';
    window.clearInterval(timerId);
    timerId = window.setInterval(() => {
        elapsedSeconds += 1;
        timerElement.textContent = formatTime(elapsedSeconds);
    }, 1000);
    renderBoard();
}

function showModal(id) {
    document.querySelector(id).style.display = 'flex';
}

function hideModal(id) {
    document.querySelector(id).style.display = 'none';
}

document.querySelector('#number-pad').replaceChildren(...Array.from({ length: 9 }, (_, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = i + 1;
    button.addEventListener('click', () => enterNumber(i + 1));
    return button;
}));
document.querySelector('#undo-button').addEventListener('click', undo);
document.querySelector('#erase-button').addEventListener('click', erase);
document.querySelector('#hint-button').addEventListener('click', hint);
document.querySelector('#new-game-button').addEventListener('click', newGame);
document.querySelector('#play-again-button').addEventListener('click', () => {
    hideModal('#win-modal');
    newGame();
});
document.querySelector('#new-puzzle-button').addEventListener('click', () => {
    hideModal('#win-modal');
    newGame();
});
document.querySelector('#stats-button').addEventListener('click', () => showModal('#stats-modal'));
document.querySelector('#settings-button').addEventListener('click', () => showModal('#settings-modal'));
document.querySelector('#close-stats-button').addEventListener('click', () => hideModal('#stats-modal'));
document.querySelector('#close-settings-button').addEventListener('click', () => hideModal('#settings-modal'));
difficultySelect.addEventListener('change', newGame);
document.querySelector('#theme-select').addEventListener('change', (event) => {
    settings.theme = event.target.value;
    document.body.classList.toggle('light-theme', settings.theme === 'light');
    localStorage.setItem('theme', settings.theme);
});
document.querySelector('#highlight-toggle').addEventListener('change', (event) => {
    settings.highlight = event.target.value === 'on';
    localStorage.setItem('highlight', event.target.value);
    updateHighlights();
});
document.querySelector('#zoom-select').addEventListener('change', (event) => {
    document.documentElement.style.fontSize = `${event.target.value}%`;
});
document.addEventListener('keydown', (event) => {
    if (/^[1-9]$/.test(event.key)) enterNumber(Number(event.key));
    if (event.key === 'Backspace' || event.key === 'Delete') erase();
});
document.querySelector('#theme-select').value = settings.theme;
document.querySelector('#highlight-toggle').value = settings.highlight ? 'on' : 'off';
document.body.classList.toggle('light-theme', settings.theme === 'light');
newGame();

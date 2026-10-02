# SudokuX

A lightweight, browser-based Sudoku game built with plain HTML, CSS, and JavaScript.

## Features

- Easy, Medium, Hard, and Expert puzzles
- Timer and mistake counter
- Number pad and keyboard input
- Undo, erase, and hint controls
- Related-cell highlighting
- Light and dark themes
- Responsive layout for desktop and mobile

## Run locally

No build tools or dependencies are required.

1. Open `index.html` directly in a browser, or start a local server:

   ```bash
   python3 -m http.server 8000
   ```

2. Visit `http://localhost:8000`.

## Project structure

```text
.
├── index.html   # Page markup
├── style.css    # Layout and theme styles
└── script.js    # Sudoku game logic and interactions
```

## Controls

- Select a cell and choose a number from the number pad.
- Use number keys `1`–`9` to enter values.
- Use `Backspace` or `Delete` to erase a value.
- Use **Undo** to reverse the previous move.
- Use **Hint** to fill the selected cell.


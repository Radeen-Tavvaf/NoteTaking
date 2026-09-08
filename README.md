# NoteTaking

A private, browser-based note-taking app. Run it locally on your own computer, and note content stays only on your device.

pyrth## Setup and Usage

To use this app:

1. Clone or download this repository.
2. Open a terminal in the project folder.
3. Start a local server:

```bash
python3 -m http.server ####
```

4. Visit http://localhost:####/.

**Note:** Opening `index.html` directly may prevent some browser storage features from working correctly, so use the local server.

## Privacy

Your notes are completely private. They are saved only in your browser's IndexedDB and localStorage, and never sent to GitHub, a server, or anyone else.

- Notes remain available when you return on the same browser and device.
- Different browsers or devices have separate note collections.
- Clearing browser site data removes your notes, so use the built-in JSON export for backups.


## Features

### Writing and Editing

Rich text editor (bold, italic, headers, lists, checkboxes for to-dos)
Font picker — a handful of curated fonts (serif for long-form, sans for clean notes, monospace for code snippets, maybe a handwriting-style font for a personal touch)
Selection-based font size and line spacing controls with numeric values
Light/dark mode, maybe a few accent color themes

### Organization

-Folders or tags/labels. Notes can have multiple comma-separated tags.
Pinning important notes
Search across all note names, text, and tags
-Include or exclude notes by tag, then sort by date, title, tag name, tag count, or pin status

### Local Storage and Data

Auto-save as you type (no "save" button needed)
Export notes as .txt, .md, or .pdf for backup
Import/export a full backup file (JSON) so users can move devices manually
Clear indication in the UI that "your notes never leave your device"

### Quality of Life

Word/character count
Reading time estimate
Simple markdown shortcuts (typing # creates a heading, etc.)
Keyboard shortcuts for power users
A minimalist, distraction-free "focus mode"
## Tech Stack
Frontend: React (or vanilla JS if you want to show fundamentals)
Storage: IndexedDB for structured note data
Styling: Tailwind CSS for speed, or handcrafted CSS to show design chops

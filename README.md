# NoteTaking

A private, browser-based note-taking app. The app is served as a static site, and note content stays in the visitor's own browser.

## Open the Site

The live site is available at:

https://radeen-tavvaf.github.io/NoteTaking/

To open the project locally instead:

1. Clone or download this repository.
2. Open a terminal in the project folder.
3. Start a local server:

```bash
python3 -m http.server 4173
```

4. Visit http://localhost:4173/.

Opening `index.html` directly may prevent some browser storage features from working correctly, so use the local server when testing locally.

## Local Privacy

Every visitor gets an independent local workspace. Notes are saved in IndexedDB, and the saved display name is stored in localStorage. Neither is sent to GitHub, a server, or another visitor.

That means:

- Different people can use the same live URL without seeing each other's notes.
- Notes remain available when the same person returns on the same browser and device.
- Different browsers or devices have separate note collections.
- Clearing browser site data removes the local notes, so use the built-in JSON export for backups.

## GitHub Pages Setup

The repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`. It deploys automatically whenever changes are pushed to `main`.

If Pages has not been enabled for the repository yet:

1. Open the repository on GitHub.
2. Go to **Settings**, then **Pages**.
3. Set the source to **GitHub Actions**.
4. Push to `main` or run the `Deploy NoteTaking to GitHub Pages` workflow manually from the **Actions** tab.

After the workflow completes, visitors can use the live site link above.


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

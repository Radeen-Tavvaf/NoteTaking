# NoteTaking
Creating a note taking site for my portfolio. There will be easy notetaking feutures, and saved notes will be only saved on a person's device. there will be different fonts available and such. Basically google docs, but not a multi billion dollar company


Feature Ideas

Writing & editing

Rich text editor (bold, italic, headers, lists, checkboxes for to-dos)
Font picker — a handful of curated fonts (serif for long-form, sans for clean notes, monospace for code snippets, maybe a handwriting-style font for a personal touch)
Adjustable font size and line spacing
Light/dark mode, maybe a few accent color themes

Voice notes

Record audio directly in-browser (Web Audio API / MediaRecorder API)
Playback controls attached to each note
Optional: live transcription using the Web Speech API, so voice notes become searchable text too

Organization

-Folders or tags/labels. Notes can have multiple comma-separated tags.
Pinning important notes
Search across all notes (including transcribed voice content)
-Include or exclude notes by tag, then sort by date, title, tag name, tag count, or pin status

Local storage & data

Auto-save as you type (no "save" button needed)
Export notes as .txt, .md, or .pdf for backup
Import/export a full backup file (JSON) so users can move devices manually
Clear indication in the UI that "your notes never leave your device"

Extra Quality of Life

Word/character count
Reading time estimate
Simple markdown shortcuts (typing # creates a heading, etc.)
Keyboard shortcuts for power users
A minimalist, distraction-free "focus mode"
Tech Stack Suggestion
Frontend: React (or vanilla JS if you want to show fundamentals)
Storage: IndexedDB for structured data + audio blobs, since localStorage has size limits and can't hold binary audio well
Styling: Tailwind CSS for speed, or handcrafted CSS to show design chops
Voice: MediaRecorder API for capture, Web Speech API for optional transcription

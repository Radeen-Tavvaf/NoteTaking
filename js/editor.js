import {
  openDatabase,
  readAllNotes,
  saveNote,
  stripHtml,
  escapeHtml,
  createDefaultNote,
} from './storage.js';
import { getStoredFolders, addFolder } from './folders.js';
import { DEFAULT_TAGS, parseTagInput } from './tags.js';
import { getEditorElements } from './editor-elements.js';
import { createEditorView } from './editor-view.js';
import { createEditorFormatting } from './editor-formatting.js';

// Editor state stays local to this page; IndexedDB remains the source of persistence.
const state = {
  db: null,
  notes: [],
  selectedNoteId: null,
  saveTimer: null,
  searchTerm: '',
  folderFilter: 'all',
  includeTags: '',
  excludeTags: '',
  sortMode: 'updated-desc',
};

const els = getEditorElements();

// Folder input is hidden until the user chooses to create a custom folder.
function toggleFolderInput() {
  const isHidden = els.addFolderInput.classList.contains('hidden');
  els.addFolderInput.classList.toggle('hidden', !isHidden);
  if (!isHidden) {
    els.addFolderInput.value = '';
  } else {
    els.addFolderInput.focus();
  }
}

function syncTagSuggestions() {
  // Datalist suggestions come from the same canonical list used by the tag utilities.
  els.tagSuggestions.innerHTML = DEFAULT_TAGS
    .map((tag) => `<option value="${escapeHtml(tag)}"></option>`)
    .join('');
}

function setStatus(message) {
  els.saveStatus.textContent = message;
}

function getSelectedNote() {
  return state.notes.find((note) => note.id === state.selectedNoteId) || null;
}

const editorView = createEditorView({
  els,
  state,
  getSelectedNote,
  selectNote,
  setStatus,
});

const {
  renderTagList,
  renderNoteList,
  applyTheme,
  applyEditorStyles,
  updateReadingStats,
  fillEditorFromNote,
} = editorView;

// Formatting remembers the editor selection while the user interacts with numeric controls.
const editorFormatting = createEditorFormatting({
  editor: els.editor,
  setStatus,
  onChange: scheduleSave,
});

function syncFolderOptions() {
  // Folder names are shared through localStorage, while note assignments live in IndexedDB.
  const folders = getStoredFolders();
  const folderHtml = folders
    .map((folder) => `<option value="${escapeHtml(folder)}">${escapeHtml(folder)}</option>`)
    .join('');

  els.folderFilter.innerHTML = `<option value="all">All folders</option>${folderHtml}`;
  els.folderSelect.innerHTML = folders
    .map((folder) => `<option value="${escapeHtml(folder)}">${escapeHtml(folder)}</option>`)
    .join('');

  const selected = getSelectedNote();
  if (selected) {
    const folderValue = folders.includes(selected.folder) ? selected.folder : 'General';
    els.folderSelect.value = folderValue;
    els.folderFilter.value = 'all';
  }
}

function collectCurrentNote() {
  // Read the form once before saving so tags, styles, and content stay in sync.
  const note = getSelectedNote();
  if (!note) return null;

  note.title = els.noteTitle.value.trim() || 'Untitled note';
  note.content = els.editor.innerHTML;
  note.folder = els.folderSelect.value || 'General';
  note.tags = parseTagInput(els.tagInput.value);
  note.fontFamily = els.fontSelect.value;
  note.theme = els.themeSelect.value;
  note.updatedAt = new Date().toISOString();

  renderTagList(note.tags);
  applyEditorStyles(note);
  updateReadingStats();
  renderNoteList();
  return note;
}

function scheduleSave() {
  // Debouncing avoids an IndexedDB write for every keystroke.
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(async () => {
    const note = collectCurrentNote();
    if (!note) return;
    await saveNote(state.db, note);
    setStatus('Autosaved locally');
    state.notes = await readAllNotes(state.db);
    renderNoteList();
  }, 250);
}

async function createNewNote() {
  // New notes are persisted before navigation so the editor can open them by id.
  const note = createDefaultNote();
  await saveNote(state.db, note);
  state.notes = await readAllNotes(state.db);
  selectNote(note.id);
  setStatus('New note created.');
}

async function selectNote(id) {
  state.selectedNoteId = id;
  const note = getSelectedNote();
  if (!note) return;
  fillEditorFromNote(note);
  renderNoteList();
}

async function loadNotes() {
  // Load existing notes, create the first note when needed, then honor an id in the URL.
  state.db = await openDatabase();
  state.notes = await readAllNotes(state.db);
  if (!state.notes.length) {
    const note = createDefaultNote();
    await saveNote(state.db, note);
    state.notes = [note];
  }

  syncFolderOptions();

  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get('id');
  const target = state.notes.find((note) => note.id === requestedId) || state.notes[0];
  state.selectedNoteId = target.id;
  fillEditorFromNote(target);
  renderNoteList();
  setStatus('Autosaved locally');
}

function bindToolbarCommands() {
  // Native editing commands keep the toolbar small while preserving browser editing behavior.
  document.querySelectorAll('[data-command]').forEach((button) => {
    button.addEventListener('click', () => {
      const command = button.dataset.command;
      document.execCommand(command, false, button.dataset.value || null);
      els.editor.focus();
      scheduleSave();
    });
  });
}

function bindInputEvents() {
  // All controls update the view immediately and use the same autosave path where needed.
  els.searchInput.addEventListener('input', (event) => {
    state.searchTerm = event.target.value;
    renderNoteList();
  });

  els.folderFilter.addEventListener('change', (event) => {
    state.folderFilter = event.target.value;
    renderNoteList();
  });

  els.includeTags.addEventListener('input', (event) => {
    state.includeTags = event.target.value;
    renderNoteList();
  });

  els.excludeTags.addEventListener('input', (event) => {
    state.excludeTags = event.target.value;
    renderNoteList();
  });

  els.sortSelect.addEventListener('change', (event) => {
    state.sortMode = event.target.value;
    renderNoteList();
  });

  els.addFolderBtn.addEventListener('click', () => {
    if (els.addFolderInput.classList.contains('hidden')) {
      toggleFolderInput();
      return;
    }

    const created = addFolder(els.addFolderInput.value);
    if (created) {
      els.addFolderInput.value = '';
      els.addFolderInput.classList.add('hidden');
      syncFolderOptions();
      const note = getSelectedNote();
      if (note) {
        els.folderSelect.value = created;
        note.folder = created;
        scheduleSave();
      }
    }
  });

  els.noteTitle.addEventListener('input', scheduleSave);
  els.editor.addEventListener('input', scheduleSave);
  els.tagInput.addEventListener('input', scheduleSave);
  els.folderSelect.addEventListener('change', scheduleSave);
  els.fontSelect.addEventListener('change', scheduleSave);
  els.themeSelect.addEventListener('change', () => {
    const note = collectCurrentNote();
    if (note) {
      applyTheme(note.theme);
      scheduleSave();
    }
  });

  els.fontSize.addEventListener('change', () => editorFormatting.applyFontSize(els.fontSize.value));
  els.lineHeight.addEventListener('change', () => editorFormatting.applyLineHeight(els.lineHeight.value));

  els.pinNote.addEventListener('click', async () => {
    const note = getSelectedNote();
    if (!note) return;
    note.pinned = !note.pinned;
    note.updatedAt = new Date().toISOString();
    await saveNote(state.db, note);
    state.notes = await readAllNotes(state.db);
    els.pinNote.textContent = note.pinned ? 'Unpin' : 'Pin';
    renderNoteList();
    setStatus(note.pinned ? 'Pinned note.' : 'Pin removed.');
  });

  els.toggleFocus.addEventListener('click', () => {
    document.body.classList.toggle('focus-mode');
  });
}

function handleShortcuts(event) {
  // Keyboard shortcuts mirror the most common toolbar actions for faster writing.
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
    event.preventDefault();
    document.execCommand('bold');
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
    event.preventDefault();
    document.execCommand('italic');
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'u') {
    event.preventDefault();
    document.execCommand('underline');
  }
}

els.editor.addEventListener('keydown', handleShortcuts);

function exportNoteAsText(type) {
  // Text exports intentionally use the rendered note's plain-text content.
  const note = getSelectedNote();
  if (!note) return;
  const rawText = stripHtml(note.content || '').trim();
  const fileBase = `${(note.title || 'note').replace(/\s+/g, '-').toLowerCase()}`;

  let output = rawText;
  if (type === 'md') {
    output = `# ${note.title || 'Untitled note'}\n\n${rawText}`;
  }
  if (type === 'txt') {
    output = `${note.title || 'Untitled note'}\n\n${rawText}`;
  }

  const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileBase}.${type}`;
  link.click();
  URL.revokeObjectURL(url);
  setStatus(`Exported ${type.toUpperCase()}.`);
}

function exportBackup() {
  // A JSON backup preserves every note field for manual device-to-device transfer.
  const payload = JSON.stringify(state.notes, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'note-taking-backup.json';
  link.click();
  URL.revokeObjectURL(url);
  setStatus('Backup exported.');
}

function exportPdf() {
  // PDF export uses the browser print dialog so no server or PDF library is required.
  const note = getSelectedNote();
  if (!note) return;
  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <head>
        <title>${escapeHtml(note.title || 'Untitled note')}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; }
          h1 { margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(note.title || 'Untitled note')}</h1>
        ${note.content || '<p>No content</p>'}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
  setStatus('Print dialog ready.');
}

async function importBackup(event) {
  // Backups are merged by note id, matching IndexedDB's put semantics.
  const [file] = event.target.files;
  if (!file) return;

  const raw = await file.text();
  const imported = JSON.parse(raw);
  if (!Array.isArray(imported)) {
    setStatus('Imported file is not a valid backup.');
    return;
  }

  for (const note of imported) {
    if (note?.id) {
      await saveNote(state.db, note);
    }
  }

  state.notes = await readAllNotes(state.db);
  state.selectedNoteId = state.notes[0]?.id || null;
  if (state.selectedNoteId) selectNote(state.selectedNoteId);
  setStatus('Backup imported.');
  event.target.value = '';
}

async function init() {
  // Bind listeners before loading data so the first rendered note is fully interactive.
  bindToolbarCommands();
  bindInputEvents();
  syncTagSuggestions();

  els.newNoteBtn.addEventListener('click', createNewNote);
  els.exportJson.addEventListener('click', exportBackup);
  els.exportMd.addEventListener('click', () => exportNoteAsText('md'));
  els.exportTxt.addEventListener('click', () => exportNoteAsText('txt'));
  els.exportPdf.addEventListener('click', exportPdf);
  els.importBtn.addEventListener('click', () => els.importJson.click());
  els.importJson.addEventListener('change', importBackup);

  await loadNotes();
  setStatus('Autosaved locally');
}

init();

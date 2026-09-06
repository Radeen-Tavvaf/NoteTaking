import { openDatabase, readAllNotes, saveNote, deleteNote, formatDate, escapeHtml, stripHtml, createDefaultNote } from './storage.js';
import { getStoredFolders, addFolder } from './folders.js';
import { filterAndSortNotes } from './note-filters.js';
import { normalizeTags } from './tags.js';

// Home state controls only the current view; notes remain stored in IndexedDB.
const state = {
  db: null,
  notes: [],
  search: '',
  filter: 'all',
  includeTags: '',
  excludeTags: '',
  sort: 'updated-desc',
};

const USER_NAME_KEY = 'notetaking-user-name';

const els = {
  noteCount: document.getElementById('note-count'),
  userName: document.getElementById('user-name'),
  searchInput: document.getElementById('search-input'),
  folderFilter: document.getElementById('folder-filter'),
  sortSelect: document.getElementById('sort-select'),
  includeTags: document.getElementById('include-tags'),
  excludeTags: document.getElementById('exclude-tags'),
  newNoteBtn: document.getElementById('new-note-btn'),
  notesGrid: document.getElementById('notes-grid'),
  addFolderInput: document.getElementById('add-folder-input'),
  addFolderBtn: document.getElementById('add-folder-btn'),
};

// The name is a page preference, not note data, so localStorage is enough here.
function toggleFolderInput() {
  const isHidden = els.addFolderInput.classList.contains('hidden');
  els.addFolderInput.classList.toggle('hidden', !isHidden);
  if (!isHidden) {
    els.addFolderInput.value = '';
  } else {
    els.addFolderInput.focus();
  }
}

function renderSummary() {
  // The total note count describes the full collection, not only the filtered grid.
  els.noteCount.textContent = String(state.notes.length);
}

function loadUserName() {
  els.userName.value = localStorage.getItem(USER_NAME_KEY) || '';
}

function syncFolderOptions() {
  // Folder choices are shared with the editor through the folders module.
  const folders = getStoredFolders();
  const current = state.filter;
  const html = folders
    .map((folder) => `<option value="${escapeHtml(folder)}">${escapeHtml(folder)}</option>`)
    .join('');

  els.folderFilter.innerHTML = `<option value="all">All folders</option>${html}`;
  els.folderFilter.value = folders.includes(current) ? current : 'all';
  state.filter = els.folderFilter.value;
}

function getVisibleNotes() {
  // Home and editor use the same search, tag rules, folder filter, and sort order.
  return filterAndSortNotes(state.notes, {
    search: state.search,
    folder: state.filter,
    includeTags: state.includeTags,
    excludeTags: state.excludeTags,
    sort: state.sort,
  });
}

function renderNotes() {
  // Rebuild the grid from state so every filter change is reflected consistently.
  const notes = getVisibleNotes();
  renderSummary();
  els.notesGrid.innerHTML = '';

  if (!notes.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No notes match your filters yet. Create a new note to get started.';
    els.notesGrid.appendChild(empty);
    return;
  }

  notes.forEach((note) => {
    const card = document.createElement('article');
    card.className = 'note-grid-card';
    card.innerHTML = `
      <div class="note-card-header">
        <h3>${escapeHtml(note.title || 'Untitled note')}</h3>
        ${note.pinned ? '<span class="meta-tag">📌</span>' : ''}
      </div>
      <div class="tag-list">${normalizeTags(note.tags).slice(0, 5).map((tag) => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join('')}</div>
      <p>${escapeHtml(stripHtml(note.content || '').slice(0, 180) || 'No content yet')}</p>
      <div class="note-card-meta">
        <span>${formatDate(note.updatedAt)}</span>
        <span>${escapeHtml(note.folder || 'General')}</span>
      </div>
      <div class="note-card-actions">
        <a class="secondary-button" href="editor.html?id=${note.id}">Open</a>
        <button class="secondary-button" data-delete="${note.id}" type="button">Delete</button>
      </div>
    `;

    card.querySelector('[data-delete]').addEventListener('click', async () => {
      await deleteNote(state.db, note.id);
      state.notes = await readAllNotes(state.db);
      renderNotes();
    });

    els.notesGrid.appendChild(card);
  });
}

async function createNoteAndOpen() {
  const newNote = createDefaultNote();
  await saveNote(state.db, newNote);
  window.location.href = `editor.html?id=${newNote.id}`;
}

async function loadData() {
  // IndexedDB is opened before the first render so the empty state is meaningful.
  state.db = await openDatabase();
  state.notes = await readAllNotes(state.db);
  loadUserName();
  syncFolderOptions();
  renderNotes();
}

els.searchInput.addEventListener('input', (event) => {
  state.search = event.target.value;
  renderNotes();
});

els.folderFilter.addEventListener('change', (event) => {
  state.filter = event.target.value;
  renderNotes();
});

els.includeTags.addEventListener('input', (event) => {
  state.includeTags = event.target.value;
  renderNotes();
});

els.excludeTags.addEventListener('input', (event) => {
  state.excludeTags = event.target.value;
  renderNotes();
});

els.sortSelect.addEventListener('change', (event) => {
  state.sort = event.target.value;
  renderNotes();
});

els.addFolderBtn.addEventListener('click', () => {
  if (els.addFolderInput.classList.contains('hidden')) {
    toggleFolderInput();
    return;
  }

  const folderName = els.addFolderInput.value;
  const created = addFolder(folderName);
  if (created) {
    els.addFolderInput.value = '';
    els.addFolderInput.classList.add('hidden');
    syncFolderOptions();
    renderNotes();
  }
});

els.newNoteBtn.addEventListener('click', createNoteAndOpen);

els.userName.addEventListener('input', (event) => {
  localStorage.setItem(USER_NAME_KEY, event.target.value.trim());
});

loadData();

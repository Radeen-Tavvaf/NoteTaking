import { escapeHtml, formatDate, stripHtml } from './storage.js';
import { filterAndSortNotes } from './note-filters.js';
import { normalizeTags } from './tags.js';

// Rendering is isolated from persistence and event wiring to keep editor.js focused on coordination.
export function createEditorView({ els, state, getSelectedNote, selectNote }) {
  function getVisibleNotes() {
    return filterAndSortNotes(state.notes, {
      search: state.searchTerm,
      folder: state.folderFilter,
      includeTags: state.includeTags,
      excludeTags: state.excludeTags,
      sort: state.sortMode,
    });
  }

  function renderTagList(tags = []) {
    els.tagList.innerHTML = '';
    normalizeTags(tags).forEach((tag) => {
      const chip = document.createElement('span');
      chip.className = 'tag-pill';
      chip.textContent = tag;
      els.tagList.appendChild(chip);
    });
  }

  function renderNoteList() {
    const notes = getVisibleNotes();
    els.noteCount.textContent = `${notes.length}`;
    els.noteList.innerHTML = '';

    if (!notes.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No notes match your filters.';
      els.noteList.appendChild(empty);
      return;
    }

    notes.forEach((note) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `note-card ${note.id === state.selectedNoteId ? 'active' : ''}`;
      card.innerHTML = `
        <div class="note-card-header">
          <h3>${escapeHtml(note.title || 'Untitled note')}</h3>
          ${note.pinned ? '<span>📌</span>' : ''}
        </div>
        <p>${escapeHtml(stripHtml(note.content || '').slice(0, 120) || 'No content yet')}</p>
        <div class="tag-list">${normalizeTags(note.tags).map((tag) => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="note-card-meta">
          <span>${formatDate(note.updatedAt)}</span>
          <span>${escapeHtml(note.folder || 'General')}</span>
        </div>
      `;
      card.addEventListener('click', () => selectNote(note.id));
      els.noteList.appendChild(card);
    });
  }

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    els.themeSelect.value = theme;
  }

  function applyEditorStyles(note) {
    if (!note) return;
    els.editor.style.fontFamily = note.fontFamily || 'Inter, sans-serif';
    els.editor.style.fontSize = `${note.fontSize || 18}px`;
    els.editor.style.lineHeight = note.lineHeight || 1.6;
    applyTheme(note.theme || 'violet');
  }

  function updateReadingStats() {
    const note = getSelectedNote();
    if (!note) return;
    const text = stripHtml(note.content || '');
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    els.wordCount.textContent = `${words} words`;
    els.characterCount.textContent = `${text.length} characters`;
    els.readTime.textContent = `${Math.max(1, Math.ceil(words / 200))} min read`;
  }

  function fillEditorFromNote(note) {
    if (!note) return;
    els.noteTitle.value = note.title || '';
    els.editor.innerHTML = note.content || '<p>Start writing here...</p>';
    els.folderSelect.value = note.folder || 'General';
    els.tagInput.value = normalizeTags(note.tags).join(', ');
    els.fontSelect.value = note.fontFamily || 'Inter, sans-serif';
    els.fontSize.value = note.fontSize || 18;
    els.lineHeight.value = note.lineHeight || 1.6;
    els.themeSelect.value = note.theme || 'violet';
    els.pinNote.textContent = note.pinned ? 'Unpin' : 'Pin';
    renderTagList(note.tags);
    applyEditorStyles(note);

    if (note.audioData) {
      els.voicePlayer.src = note.audioData;
      els.voicePlayer.classList.remove('hidden');
    } else {
      els.voicePlayer.classList.add('hidden');
      els.voicePlayer.removeAttribute('src');
    }

    updateReadingStats();
  }

  return {
    renderTagList,
    renderNoteList,
    applyTheme,
    applyEditorStyles,
    updateReadingStats,
    fillEditorFromNote,
  };
}

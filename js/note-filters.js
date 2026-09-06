import { normalizeTags, tagsMatch } from './tags.js';

// Apply search, folder, and tag rules before sorting the visible notes.
export function filterAndSortNotes(notes, {
  search = '',
  folder = 'all',
  includeTags = [],
  excludeTags = [],
  sort = 'updated-desc',
} = {}) {
  const searchTerm = search.trim().toLowerCase();
  const visible = notes.filter((note) => {
    const haystack = [
      note.title,
      note.contentText,
      note.content,
      normalizeTags(note.tags).join(' '),
    ].join(' ').toLowerCase();

    return (!searchTerm || haystack.includes(searchTerm))
      && (folder === 'all' || note.folder === folder)
      && tagsMatch(note, includeTags, excludeTags);
  });

  return visible.sort((first, second) => {
    const firstTags = normalizeTags(first.tags).join(', ').toLowerCase();
    const secondTags = normalizeTags(second.tags).join(', ').toLowerCase();

    switch (sort) {
      case 'created':
      case 'created-desc':
        return new Date(second.createdAt) - new Date(first.createdAt);
      case 'alpha':
        return (first.title || '').localeCompare(second.title || '');
      case 'tags-alpha':
        return firstTags.localeCompare(secondTags) || (first.title || '').localeCompare(second.title || '');
      case 'tags-count':
        return normalizeTags(second.tags).length - normalizeTags(first.tags).length
          || new Date(second.updatedAt) - new Date(first.updatedAt);
      case 'pinned':
        return Number(second.pinned) - Number(first.pinned)
          || new Date(second.updatedAt) - new Date(first.updatedAt);
      case 'updated-desc':
      default:
        return new Date(second.updatedAt) - new Date(first.updatedAt);
    }
  });
}

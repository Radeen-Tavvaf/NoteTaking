// These suggestions keep the most common labels consistent and properly capitalized.
export const DEFAULT_TAGS = ['New', 'Voice Note', 'Favorite', 'Notes', 'Ideas', 'Draft', 'Archived'];

// Keep tag values predictable across editing, filtering, imports, and legacy notes.
export function normalizeTags(tags = []) {
  const values = Array.isArray(tags) ? tags : String(tags).split(',');
  const seen = new Set();

  return values
    .map((tag) => String(tag || '').trim().replace(/\s+/g, ' '))
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function parseTagInput(value) {
  return normalizeTags(String(value || '').split(','));
}

export function tagsMatch(note, includeTags = [], excludeTags = []) {
  const noteTags = new Set(normalizeTags(note.tags).map((tag) => tag.toLowerCase()));
  const includes = normalizeTags(includeTags).map((tag) => tag.toLowerCase());
  const excludes = normalizeTags(excludeTags).map((tag) => tag.toLowerCase());

  return includes.every((tag) => noteTags.has(tag))
    && excludes.every((tag) => !noteTags.has(tag));
}

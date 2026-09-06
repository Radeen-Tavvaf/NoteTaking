export const DEFAULT_FOLDERS = ['General', 'Work', 'Personal', 'Ideas', 'Voice Notes'];
export const FOLDER_STORAGE_KEY = 'notetaking-custom-folders';

export function getStoredFolders() {
  try {
    const raw = localStorage.getItem(FOLDER_STORAGE_KEY);
    const customFolders = raw ? JSON.parse(raw) : [];
    const merged = [...DEFAULT_FOLDERS, ...customFolders];
    return Array.from(new Set(merged.map((name) => String(name).trim()))).filter(Boolean);
  } catch {
    return [...DEFAULT_FOLDERS];
  }
}

export function saveFolders(folders) {
  const normalized = folders
    .map((folder) => String(folder || '').trim())
    .filter(Boolean);

  const customFolders = normalized.filter((folder) => !DEFAULT_FOLDERS.includes(folder));
  localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(customFolders));
  return [...DEFAULT_FOLDERS, ...customFolders];
}

export function addFolder(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;

  const current = getStoredFolders();
  const lowered = current.map((folder) => folder.toLowerCase());
  if (lowered.includes(trimmed.toLowerCase())) return trimmed;

  const updated = saveFolders([...current, trimmed]);
  return updated.includes(trimmed) ? trimmed : null;
}

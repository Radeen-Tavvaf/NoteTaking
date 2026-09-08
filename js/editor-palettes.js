// Keep palette menu behavior separate from the editor coordinator.
export function bindEditorPalettes({ formatting, editor }) {
  document.querySelectorAll('[data-palette-toggle]').forEach((trigger) => {
    trigger.addEventListener('mousedown', (event) => event.preventDefault());
    trigger.addEventListener('click', () => {
      const palette = document.getElementById(trigger.dataset.paletteToggle);
      const shouldOpen = palette.classList.contains('hidden');
      document.querySelectorAll('.color-palette').forEach((item) => item.classList.add('hidden'));
      document.querySelectorAll('[data-palette-toggle]').forEach((item) => item.setAttribute('aria-expanded', 'false'));
      palette.classList.toggle('hidden', !shouldOpen);
      trigger.setAttribute('aria-expanded', String(shouldOpen));
    });
  });

  document.querySelectorAll('[data-color-command]').forEach((button) => {
    button.addEventListener('mousedown', (event) => event.preventDefault());
    button.addEventListener('click', () => {
      formatting.applyColor(button.dataset.colorCommand, button.dataset.colorValue, button.dataset.colorLabel);
      button.closest('.color-palette').classList.add('hidden');
      button.closest('.palette-control').querySelector('[data-palette-toggle]').setAttribute('aria-expanded', 'false');
      editor.focus();
    });
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('.palette-control')) return;
    document.querySelectorAll('.color-palette').forEach((palette) => palette.classList.add('hidden'));
    document.querySelectorAll('[data-palette-toggle]').forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
  });
}

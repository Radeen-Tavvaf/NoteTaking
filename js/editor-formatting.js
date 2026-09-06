// Apply typography to the selected content instead of changing the whole editor surface.
export function createEditorFormatting({ editor, setStatus, onChange }) {
  let savedRange = null;

  function selectionIsInEditor(selection) {
    return selection?.rangeCount
      && editor.contains(selection.anchorNode)
      && editor.contains(selection.focusNode);
  }

  function rememberSelection() {
    const selection = window.getSelection();
    if (selectionIsInEditor(selection)) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    if (!savedRange) return null;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
    return savedRange;
  }

  function getSelectedBlocks(range) {
    const blockTags = new Set(['ADDRESS', 'BLOCKQUOTE', 'DIV', 'H1', 'H2', 'H3', 'LI', 'OL', 'P', 'PRE', 'UL']);
    const blocks = [];
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_ELEMENT);

    while (walker.nextNode()) {
      const element = walker.currentNode;
      if (blockTags.has(element.tagName) && range.intersectsNode(element)) {
        blocks.push(element);
      }
    }

    return blocks.length ? blocks : [range.startContainer.parentElement?.closest('p, div, li')].filter(Boolean);
  }

  function applyFontSize(rawValue) {
    const value = Number(rawValue);
    const range = restoreSelection();
    if (!Number.isFinite(value) || value < 8 || value > 96 || !range || range.collapsed) {
      setStatus('Select text before changing its size.');
      return;
    }

    const fragment = range.extractContents();
    const span = document.createElement('span');
    span.style.fontSize = `${value}px`;
    span.appendChild(fragment);
    range.insertNode(span);
    onChange();
    setStatus(`Selected text set to ${value}px.`);
  }

  function applyLineHeight(rawValue) {
    const value = Number(rawValue);
    const range = restoreSelection();
    if (!Number.isFinite(value) || value < 0.8 || value > 4 || !range) {
      setStatus('Enter a line height between 0.8 and 4.');
      return;
    }

    getSelectedBlocks(range).forEach((block) => {
      block.style.lineHeight = String(value);
    });
    onChange();
    setStatus(`Selected paragraph line height set to ${value}.`);
  }

  document.addEventListener('selectionchange', rememberSelection);

  return { applyFontSize, applyLineHeight };
}

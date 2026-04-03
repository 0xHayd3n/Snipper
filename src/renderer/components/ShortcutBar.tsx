import React from 'react';

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const mod = isMac ? '\u2318' : 'Ctrl+';

export default function ShortcutBar() {
  return (
    <div className="shortcut-bar">
      <span className="shortcut-hint">{mod}K Command Palette</span>
      <span className="shortcut-sep">&middot;</span>
      <span className="shortcut-hint">{mod}N New Snippet</span>
      <span className="shortcut-sep">&middot;</span>
      <span className="shortcut-hint">&uarr;&darr; Navigate</span>
    </div>
  );
}

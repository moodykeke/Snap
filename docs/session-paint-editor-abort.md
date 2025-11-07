Date: 2025-11-07
Topic: Embedded paint editor experiment (aborted) and restoration

Summary
- Switched SVG costume editing to prototype embedded editor and updated right-click menu.
- Verified postMessage protocol works and result payloads include SVG/PNG and rotation center.
- Decision: abandon this track; focus on enhancing legacy `src/paint.js` instead.

Restoration
- Reverted `src/objects.js` to use `VectorPaintEditorMorph` as the default for `SVG_Costume.prototype.edit`.
- Reverted `src/gui.js` right-click menu to default “edit” (classic), keep “edit (beta)” for embedded editor.

Next Considerations for paint.js
- Improve brush, shape tools, and selection UX.
- Add rotation center UI and metadata persistence.
- Export options: optimized PNG/SVG with Snap! metadata.
- Undo/redo robustness and keyboard shortcuts.

Notes
- The embedded prototype editor and bridge remain in the codebase for future reference but are not the default.
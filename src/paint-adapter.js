/*
  paint-adapter.js

  Paper.js 适配器骨架，用于与现有 Snap! 矢量/位图编辑器解耦，
  提供导入/导出与基本编辑操作的统一接口。
*/

/* global paper */

class PaperAdapter {
  constructor(canvas) {
    if (!canvas) throw new Error('PaperAdapter requires a canvas element');
    paper.setup(canvas);
    this.defaultStyle = {
      strokeColor: new paper.Color('#333333'),
      fillColor: new paper.Color('#00000000'),
      strokeWidth: 3
    };
    this.currentTool = null;
    this.selection = [];
  }

  setStrokeColor(color) { this.defaultStyle.strokeColor = new paper.Color(color); }
  setFillColor(color) { this.defaultStyle.fillColor = new paper.Color(color); }
  setStrokeWidth(width) { this.defaultStyle.strokeWidth = width; }

  clear() { paper.project.clear(); paper.view.update(); }
  addLayer() { const layer = new paper.Layer(); layer.activate(); return layer; }

  importSVG(svgText, options = {}) {
    return paper.project.importSVG(svgText, Object.assign({ insert: true }, options));
  }

  exportSVG(options = {}) {
    const opts = Object.assign({ asString: true, bounds: 'content', matchShapes: true, precision: 3 }, options);
    return paper.project.exportSVG(opts);
  }

  exportPNG() { return paper.view.element.toDataURL('image/png'); }

  selectAt(point, tolerance = 6) {
    const hit = paper.project.hitTest(point, { stroke: true, fill: true, segments: true, tolerance });
    this.selection = [];
    if (hit && hit.item) {
      hit.item.selected = true;
      this.selection = [hit.item];
      return hit.item;
    }
    return null;
  }

  setTool(name) {
    if (this.currentTool) this.currentTool.remove();
    const tool = new paper.Tool();
    this.currentTool = tool;

    if (name === 'brush') {
      let path;
      tool.onMouseDown = (e) => {
        path = new paper.Path({ strokeColor: this.defaultStyle.strokeColor, strokeWidth: this.defaultStyle.strokeWidth });
        path.add(e.point);
      };
      tool.onMouseDrag = (e) => { path && path.add(e.point); };
      tool.onMouseUp = () => { if (path) path.simplify(5); };
    }

    if (name === 'rectangle') {
      let rect; let start;
      tool.onMouseDown = (e) => { start = e.point; };
      tool.onMouseDrag = (e) => {
        const r = new paper.Rectangle(start, e.point);
        if (rect) rect.remove();
        rect = new paper.Shape.Rectangle({ rectangle: r, strokeColor: this.defaultStyle.strokeColor, fillColor: this.defaultStyle.fillColor, strokeWidth: this.defaultStyle.strokeWidth });
      };
    }

    if (name === 'ellipse') {
      let ell; let start;
      tool.onMouseDown = (e) => { start = e.point; };
      tool.onMouseDrag = (e) => {
        const r = new paper.Rectangle(start, e.point);
        if (ell) ell.remove();
        ell = new paper.Shape.Ellipse({ rectangle: r, strokeColor: this.defaultStyle.strokeColor, fillColor: this.defaultStyle.fillColor, strokeWidth: this.defaultStyle.strokeWidth });
      };
    }

    if (name === 'line') {
      let line; let start;
      tool.onMouseDown = (e) => { start = e.point; };
      tool.onMouseDrag = (e) => {
        if (line) line.remove();
        line = new paper.Path({ strokeColor: this.defaultStyle.strokeColor, strokeWidth: this.defaultStyle.strokeWidth });
        line.add(start);
        line.add(e.point);
      };
    }

    if (name === 'select') {
      let active = null;
      tool.onMouseDown = (e) => { active = this.selectAt(e.point); };
      tool.onMouseDrag = (e) => { if (active) active.position = active.position.add(e.delta); };
    }
  }
}

// --- Session store for snapshots, undo/redo, and local persistence ---
class PaintSessionStore {
  constructor() { this.history = []; this.index = -1; this.lastSavedKey = null; }
  snapshotFromCanvas(canvas) {
    try { return (canvas && canvas.toDataURL) ? canvas.toDataURL('image/png') : null; } catch (e) { return null; }
  }
  commit(canvas) {
    const snap = this.snapshotFromCanvas(canvas); if (!snap) return false;
    const curr = this.history[this.index]; if (curr && curr === snap) return false;
    if (this.index < this.history.length - 1) this.history = this.history.slice(0, this.index + 1);
    this.history.push(snap); this.index = this.history.length - 1; return true;
  }
  undo() { if (this.index > 0) { this.index -= 1; return this.history[this.index]; } return null; }
  redo() { if (this.index < this.history.length - 1) { this.index += 1; return this.history[this.index]; } return null; }
  current() { return this.history[this.index] || null; }
  applyToCanvas(canvas, dataURL) {
    if (!canvas || !dataURL) return false;
    try { const ctx = canvas.getContext && canvas.getContext('2d'); if (!ctx) return false;
      const img = new Image(); img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
      img.src = dataURL; return true; } catch (e) { return false; }
  }
  saveLocal(key) { try { const k = key || 'snap:paint:last'; const payload = JSON.stringify({ history: this.history, index: this.index }); localStorage.setItem(k, payload); this.lastSavedKey = k; return true; } catch (e) { return false; } }
  loadLocal(key) { try { const raw = localStorage.getItem(key || 'snap:paint:last'); if (!raw) return false; const obj = JSON.parse(raw); if (Array.isArray(obj.history)) { this.history = obj.history; this.index = typeof obj.index === 'number' ? obj.index : (obj.history.length - 1); return true; } return false; } catch (e) { return false; } }
}

// --- Lifecycle hooks consumed by paint.js ---
PaperAdapter._store = null; PaperAdapter._timer = null;
PaperAdapter.onEditorBuilt = function (editor) {
  try {
    const canvas = editor && editor.paper && editor.paper.paper;
    this._store = new PaintSessionStore();
    this._store.commit(canvas);
    const self = this;
    this._timer = setInterval(function(){ try { self._store.commit(canvas); } catch(_){} }, 5000);
    window.PaintAdapterAPI = {
      undo: function(){ const data = self._store.undo(); if (data) self._store.applyToCanvas(canvas, data); return !!data; },
      redo: function(){ const data = self._store.redo(); if (data) self._store.applyToCanvas(canvas, data); return !!data; },
      saveLocal: function(key){ return self._store.saveLocal(key); },
      loadLocal: function(key){ return self._store.loadLocal(key); },
      current: function(){ return self._store.current(); }
    };
  } catch (e) { /* keep UI intact */ }
};
PaperAdapter.onSubmit = function (canvas /*, rotationCenter */) {
  try { if (this._timer) { clearInterval(this._timer); this._timer = null; } if (this._store) { this._store.commit(canvas); this._store.saveLocal('snap:paint:last'); } } catch(e){}
};

// UMD 暴露
if (typeof window !== 'undefined') {
  window.PaperAdapter = PaperAdapter;
  window.PaintSessionStore = PaintSessionStore;
  // 已移除开发期的独立画板桥接与嵌入式原型入口
}
import mammoth from 'mammoth';

export function renderDoodling(container, user, onBack) {
  let currentPdfUrl = null;
  let isDrawing = false;
  let isEraser = false;
  let brushColor = '#2e4957';
  let brushSize = 3;

  container.innerHTML = `
    <div class="method-workspace" style="max-width: 1360px;">
      <div class="workspace-topbar">
        <div class="workspace-title-group">
          <button class="btn btn-secondary" id="doodle-back">← Volver</button>
          <h2>Doodling & Lectura Visual</h2>
        </div>
        <span class="save-indicator">Sube un PDF o DOCX a la izquierda y esquematiza a la derecha</span>
      </div>

      <div class="doodling-grid">
        <!-- Panel Izquierdo: Visor de Documentos -->
        <section class="doc-viewer-panel">
          <div class="panel-toolbar">
            <label class="file-upload-label" for="doodle-file-input">
              📂 Subir PDF o DOCX
            </label>
            <input type="file" id="doodle-file-input" accept=".pdf,.docx" hidden />
            <span class="file-name-badge" id="doodle-file-name">Ningún archivo cargado</span>
          </div>

          <div class="doc-viewer-body" id="doc-viewer-body">
            <div class="doc-placeholder">
              <span>📄</span>
              <p><strong>Carga tu guía de estudio</strong></p>
              <p style="font-size: 0.85rem; margin-top: 0.3rem;">
                Soporta archivos <code>.pdf</code> y <code>.docx</code> para leer mientras dibujas tus esquemas al lado.
              </p>
            </div>
          </div>
        </section>

        <!-- Panel Derecho: Lienzo Libre -->
        <section class="canvas-panel">
          <div class="panel-toolbar">
            <div class="doodle-tools-left">
              <button class="color-swatch active" data-color="#2e4957" style="background: #2e4957;" title="Azul Pizarra"></button>
              <button class="color-swatch" data-color="#1e272e" style="background: #1e272e;" title="Negro"></button>
              <button class="color-swatch" data-color="#c0392b" style="background: #c0392b;" title="Rojo"></button>
              <button class="color-swatch" data-color="#2980b9" style="background: #2980b9;" title="Azul"></button>
              <button class="color-swatch" data-color="#27ae60" style="background: #27ae60;" title="Verde"></button>
              <input type="color" class="color-picker-input" id="doodle-color-picker" value="#2e4957" title="Color personalizado" />

              <input type="range" class="brush-slider" id="doodle-size" min="1" max="18" value="3" title="Grosor del trazo" />
            </div>

            <div class="doodle-tools-right">
              <button class="tool-btn active" id="tool-pen">✏️ Pincel</button>
              <button class="tool-btn" id="tool-eraser">🧽 Borrador</button>
              <button class="tool-btn" id="tool-clear">🗑️ Limpiar</button>
              <button class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" id="tool-export">
                Exportar PNG
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="canvas-wrapper">
            <canvas id="doodle-canvas"></canvas>
          </div>
        </section>
      </div>
    </div>
  `;

  // ==========================================
  // 1. LÓGICA DEL VISOR DE DOCUMENTOS
  // ==========================================
  const fileInput = document.getElementById('doodle-file-input');
  const fileNameBadge = document.getElementById('doodle-file-name');
  const viewerBody = document.getElementById('doc-viewer-body');

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    fileNameBadge.textContent = file.name;

    // Liberar URL anterior si existía
    if (currentPdfUrl) {
      URL.revokeObjectURL(currentPdfUrl);
      currentPdfUrl = null;
    }

    const fileNameLower = file.name.toLowerCase();

    if (file.type === 'application/pdf' || fileNameLower.endsWith('.pdf')) {
      currentPdfUrl = URL.createObjectURL(file);
      viewerBody.innerHTML = `<iframe class="pdf-frame" src="${currentPdfUrl}" title="Visor PDF"></iframe>`;
      return;
    }

    if (fileNameLower.endsWith('.docx')) {
      viewerBody.innerHTML = `<div class="doc-placeholder"><p>Procesando documento Word...</p></div>`;
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        viewerBody.innerHTML = `<div class="docx-render-area">${result.value || '<p>El documento está vacío.</p>'}</div>`;
      } catch (err) {
        viewerBody.innerHTML = `
          <div class="doc-placeholder">
            <p style="color: #c0392b;"><strong>No se pudo leer el archivo .docx</strong></p>
            <p style="font-size: 0.85rem;">Asegúrate de que sea un archivo Word válido (.docx, no .doc antiguo).</p>
          </div>
        `;
      }
      return;
    }

    alert('Formato no soportado. Por favor sube un archivo .pdf o .docx');
  });

  // ==========================================
  // 2. LÓGICA DEL LIENZO DE DIBUJO (CANVAS)
  // ==========================================
  const wrapper = document.getElementById('canvas-wrapper');
  const canvas = document.getElementById('doodle-canvas');
  const ctx = canvas.getContext('2d');

  function fillWhiteBackground() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function resizeCanvas(preserveDrawing = true) {
    const rect = wrapper.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    let tempCanvas = null;
    if (preserveDrawing && canvas.width > 0 && canvas.height > 0) {
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCanvas.getContext('2d').drawImage(canvas, 0, 0);
    }

    canvas.width = rect.width;
    canvas.height = rect.height;
    fillWhiteBackground();

    if (tempCanvas) {
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }

  // Inicializar dimensiones del canvas
  requestAnimationFrame(() => resizeCanvas(false));

  const onWindowResize = () => resizeCanvas(true);
  window.addEventListener('resize', onWindowResize);

  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    isDrawing = true;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;
    const { x, y } = getPointerPos(e);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = isEraser ? brushSize * 4 : brushSize;
    ctx.strokeStyle = isEraser ? '#ffffff' : brushColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  });

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.closePath();
    if (e.pointerId && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointercancel', stopDrawing);

  // Controles de herramientas
  const swatches = container.querySelectorAll('.color-swatch');
  const colorPicker = document.getElementById('doodle-color-picker');
  const penBtn = document.getElementById('tool-pen');
  const eraserBtn = document.getElementById('tool-eraser');

  function activatePen() {
    isEraser = false;
    penBtn.classList.add('active');
    eraserBtn.classList.remove('active');
  }

  swatches.forEach(swatch => {
    swatch.onclick = () => {
      swatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      brushColor = swatch.dataset.color;
      colorPicker.value = brushColor;
      activatePen();
    };
  });

  colorPicker.oninput = (e) => {
    swatches.forEach(s => s.classList.remove('active'));
    brushColor = e.target.value;
    activatePen();
  };

  document.getElementById('doodle-size').oninput = (e) => {
    brushSize = Number(e.target.value);
  };

  penBtn.onclick = activatePen;

  eraserBtn.onclick = () => {
    isEraser = true;
    eraserBtn.classList.add('active');
    penBtn.classList.remove('active');
  };

  document.getElementById('tool-clear').onclick = () => {
    if (confirm('¿Limpiar todo el lienzo de dibujo?')) {
      fillWhiteBackground();
    }
  };

  document.getElementById('tool-export').onclick = () => {
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Esquema_Doodling_${Date.now()}.png`;
    a.click();
  };

  // Limpieza al salir de la pantalla
  const cleanup = () => {
    window.removeEventListener('resize', onWindowResize);
    if (currentPdfUrl) {
      URL.revokeObjectURL(currentPdfUrl);
    }
  };

  document.getElementById('doodle-back').onclick = () => {
    cleanup();
    onBack();
  };

  return cleanup;
}
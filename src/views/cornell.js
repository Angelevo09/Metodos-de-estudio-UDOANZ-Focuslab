import { getUserData, saveUserData } from '../services/storage.js';

/**
 * nombre de la funcion: escapeHtml
 * parametros: str (Tipo: string) - Cadena de texto a sanitizar.
 * retorno: string - Cadena de texto con entidades HTML escapadas (&, <, >, ").
 * funcionalidad: Previene errores de parseo o inyecciones de código HTML al insertar valores de texto dentro de atributos o plantillas del DOM.
 */
function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * nombre de la funcion: getTodayISO
 * parametros: Ninguno.
 * retorno: string - Fecha actual formateada en estándar internacional "YYYY-MM-DD".
 * funcionalidad: Obtiene la fecha del sistema en formato ISO para inicializar controles de entrada de tipo fecha (<input type="date">).
 */
function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * nombre de la funcion: renderCornell
 * parametros: container (Tipo: HTMLElement) - Nodo contenedor donde se renderizará la vista, user (Tipo: object|null) - Objeto de usuario autenticado o null si está en modo invitado, onBack (Tipo: function) - Callback invocado para regresar a la vista principal.
 * retorno: void (Sin retorno).
 * funcionalidad: Renderiza la interfaz interactiva del Método Cornell: estructura clásica dividida en palabras clave/preguntas (30%), notas de desarrollo (70%) y bloque inferior de síntesis/resumen; persistencia reactiva en localStorage, gestión de fichas guardadas y exportación a formatos PDF y .txt.
 */
export function renderCornell(container, user, onBack) {
  // Determinación de la clave de almacenamiento según la sesión
  const userId = user?.id || 'invitado';
  let userData = getUserData(userId);

  // Asegura la consistencia del listado de fichas
  if (!Array.isArray(userData.cornell)) {
    userData.cornell = [];
  }

  // Inicialización de la estructura del borrador activo en caso de no existir
  if (!userData.cornellDraft) {
    userData.cornellDraft = {
      id: null,
      topic: '',
      date: getTodayISO(),
      cues: '',
      notes: '',
      summary: ''
    };
  }

  const draft = userData.cornellDraft;

  // Inyección de la plantilla estructural de la ficha Cornell y barras de herramientas
  container.innerHTML = `
    <div class="method-workspace">
      <div class="workspace-topbar">
        <div class="workspace-title-group">
          <button class="btn btn-secondary" id="cornell-back">← Volver</button>
          <h2>Método Cornell</h2>
        </div>
        <span class="save-indicator" id="cornell-status">Listo · Guardado en localStorage</span>
      </div>

      <!-- Barra de gestión de fichas y exportación -->
      <div class="cornell-toolbar">
        <div class="cornell-selector-group">
          <select class="cornell-select" id="cornell-saved-select">
            <option value="">-- Borrador actual / Nueva ficha --</option>
          </select>
          <button class="btn btn-secondary" id="cornell-new">+ Nueva Ficha</button>
          <button class="btn btn-danger-outline hidden" id="cornell-delete">Eliminar</button>
        </div>

        <div class="cornell-actions-group">
          <button class="btn btn-primary" id="cornell-save">Guardar Ficha</button>
          <button class="btn btn-secondary" id="cornell-export-pdf">Exportar PDF</button>
          <button class="btn btn-secondary" id="cornell-export-txt">Exportar (.txt)</button>
        </div>
      </div>

      <!-- Plantilla Cornell -->
      <article class="cornell-sheet">
        <!-- Cabecera -->
        <div class="cornell-header">
          <div class="cornell-field-box">
            <label class="cornell-label" for="cornell-topic">Tema / Materia</label>
            <input
              type="text"
              id="cornell-topic"
              placeholder="Ej. Teoría de Autómatas - Gramáticas Libres de Contexto"
              value="${escapeHtml(draft.topic)}"
            />
          </div>
          <div class="cornell-field-box">
            <label class="cornell-label" for="cornell-date">Fecha</label>
            <input
              type="date"
              id="cornell-date"
              value="${draft.date || getTodayISO()}"
            />
          </div>
        </div>

        <!-- Cuerpo dividido 30% / 70% -->
        <div class="cornell-body">
          <div class="cornell-cues-col">
            <label class="cornell-label" for="cornell-cues">Palabras Clave / Preguntas</label>
            <textarea
              class="cornell-textarea"
              id="cornell-cues"
              placeholder="• Conceptos clave&#10;• Preguntas de repaso&#10;• Fórmulas o términos"
            >${escapeHtml(draft.cues)}</textarea>
          </div>

          <div class="cornell-notes-col">
            <label class="cornell-label" for="cornell-notes">Notas de Clase / Desarrollo</label>
            <textarea
              class="cornell-textarea"
              id="cornell-notes"
              placeholder="Desarrolla aquí las ideas principales, ejemplos, esquemas en texto y explicaciones detalladas..."
            >${escapeHtml(draft.notes)}</textarea>
          </div>
        </div>

        <!-- Resumen inferior -->
        <div class="cornell-summary">
          <label class="cornell-label" for="cornell-summary">Resumen (Síntesis en tus propias palabras)</label>
          <textarea
            class="cornell-textarea"
            id="cornell-summary"
            placeholder="Escribe en 3 o 4 líneas la conclusión esencial de este tema..."
          >${escapeHtml(draft.summary)}</textarea>
        </div>
      </article>
    </div>
  `;

  // Referencias a los elementos del DOM
  const statusEl = document.getElementById('cornell-status');
  const selectEl = document.getElementById('cornell-saved-select');
  const deleteBtn = document.getElementById('cornell-delete');

  const topicInput = document.getElementById('cornell-topic');
  const dateInput = document.getElementById('cornell-date');
  const cuesInput = document.getElementById('cornell-cues');
  const notesInput = document.getElementById('cornell-notes');
  const summaryInput = document.getElementById('cornell-summary');

  /**
   * nombre de la funcion: syncDraftToStorage
   * parametros: Ninguno.
   * retorno: void (Sin retorno).
   * funcionalidad: Sincroniza en tiempo real los valores de los campos de la ficha activa directamente en el almacenamiento local del navegador.
   */
  function syncDraftToStorage() {
    userData.cornellDraft = {
      id: userData.cornellDraft.id || null,
      topic: topicInput.value,
      date: dateInput.value,
      cues: cuesInput.value,
      notes: notesInput.value,
      summary: summaryInput.value
    };
    saveUserData(userId, userData);
    statusEl.textContent = 'Borrador guardado automáticamente ✓';
  }

  /**
   * nombre de la funcion: populateSavedSelect
   * parametros: Ninguno.
   * retorno: void (Sin retorno).
   * funcionalidad: Rellena el menú desplegable con el catálogo de fichas guardadas históricamente por el usuario y alterna la visibilidad del botón de eliminar según proceda.
   */
  function populateSavedSelect() {
    const sheets = userData.cornell;
    const currentId = userData.cornellDraft.id;

    selectEl.innerHTML = `<option value="">-- Borrador activo (${sheets.length} guardadas) --</option>` +
      sheets.map(s => `
        <option value="${s.id}" ${s.id === currentId ? 'selected' : ''}>
          ${escapeHtml(s.topic || 'Sin título')} (${s.date})
        </option>
      `).join('');

    deleteBtn.classList.toggle('hidden', !currentId);
  }

  /**
   * nombre de la funcion: loadSheetIntoForm
   * parametros: sheet (Tipo: object) - Objeto con los datos de una ficha de estudio Cornell.
   * retorno: void (Sin retorno).
   * funcionalidad: Carga en los campos de entrada de la interfaz los datos de una ficha seleccionada y actualiza el estado activo del borrador.
   */
  function loadSheetIntoForm(sheet) {
    topicInput.value = sheet.topic || '';
    dateInput.value = sheet.date || getTodayISO();
    cuesInput.value = sheet.cues || '';
    notesInput.value = sheet.notes || '';
    summaryInput.value = sheet.summary || '';
    userData.cornellDraft = { ...sheet };
    saveUserData(userId, userData);
    populateSavedSelect();
  }

  // Oyentes de eventos para autoguardado de borrador al escribir
  [topicInput, dateInput, cuesInput, notesInput, summaryInput].forEach(el => {
    el.addEventListener('input', syncDraftToStorage);
  });

  // Manejador de evento al cambiar de ficha en el selector desplegable
  selectEl.onchange = () => {
    const selectedId = selectEl.value;
    if (!selectedId) {
      userData.cornellDraft.id = null;
      saveUserData(userId, userData);
      deleteBtn.classList.add('hidden');
      return;
    }
    const found = userData.cornell.find(s => s.id === selectedId);
    if (found) {
      loadSheetIntoForm(found);
      statusEl.textContent = 'Ficha cargada ✓';
    }
  };

  // Manejador para reiniciar el formulario con una ficha en blanco
  document.getElementById('cornell-new').onclick = () => {
    loadSheetIntoForm({
      id: null,
      topic: '',
      date: getTodayISO(),
      cues: '',
      notes: '',
      summary: ''
    });
    statusEl.textContent = 'Nueva ficha lista';
  };

  // Manejador para persistir formalmente la ficha en el historial
  document.getElementById('cornell-save').onclick = () => {
    const topic = topicInput.value.trim();
    if (!topic && !notesInput.value.trim()) {
      alert('Escribe al menos un tema o una nota antes de guardar la ficha.');
      return;
    }

    const existingId = userData.cornellDraft.id;
    const sheetData = {
      id: existingId || String(Date.now()),
      topic: topic || 'Ficha Cornell sin título',
      date: dateInput.value || getTodayISO(),
      cues: cuesInput.value,
      notes: notesInput.value,
      summary: summaryInput.value
    };

    if (existingId) {
      const idx = userData.cornell.findIndex(s => s.id === existingId);
      if (idx !== -1) {
        userData.cornell[idx] = sheetData;
      } else {
        userData.cornell.unshift(sheetData);
      }
    } else {
      userData.cornell.unshift(sheetData);
    }

    userData.cornellDraft = { ...sheetData };
    saveUserData(userId, userData);
    populateSavedSelect();
    statusEl.textContent = 'Ficha guardada en historial ✓';
  };

  // Manejador para eliminar la ficha seleccionada actualmente
  deleteBtn.onclick = () => {
    const currentId = userData.cornellDraft.id;
    if (!currentId) return;
    if (!confirm('¿Seguro que deseas eliminar esta ficha guardada?')) return;

    userData.cornell = userData.cornell.filter(s => s.id !== currentId);
    loadSheetIntoForm({
      id: null,
      topic: '',
      date: getTodayISO(),
      cues: '',
      notes: '',
      summary: ''
    });
    statusEl.textContent = 'Ficha eliminada';
  };

  // Manejador para exportar a PDF utilizando el motor de impresión del navegador
  document.getElementById('cornell-export-pdf').onclick = () => {
    window.print();
  };

  // Manejador para exportar la ficha completa a formato de texto plano (.txt)
  document.getElementById('cornell-export-txt').onclick = () => {
    const topic = topicInput.value.trim() || 'Ficha_Cornell';
    const content = [
      `MÉTODO CORNELL - FOCUSLAB`,
      `Tema: ${topic}`,
      `Fecha: ${dateInput.value}`,
      `========================================`,
      ``,
      `[PALABRAS CLAVE / PREGUNTAS]`,
      cuesInput.value || '(Vacío)',
      ``,
      `----------------------------------------`,
      `[NOTAS DE CLASE]`,
      notesInput.value || '(Vacío)',
      ``,
      `----------------------------------------`,
      `[RESUMEN]`,
      summaryInput.value || '(Vacío)'
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cornell_${topic.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Inicialización de la lista de fichas y navegación
  populateSavedSelect();
  document.getElementById('cornell-back').onclick = onBack;
}

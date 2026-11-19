import { getUserData, saveUserData } from '../services/storage.js';

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

export function renderCornell(container, user, onBack) {
  const userId = user?.id || 'invitado';
  let userData = getUserData(userId);

  if (!Array.isArray(userData.cornell)) {
    userData.cornell = [];
  }

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

  // Referencias DOM
  const statusEl = document.getElementById('cornell-status');
  const selectEl = document.getElementById('cornell-saved-select');
  const deleteBtn = document.getElementById('cornell-delete');

  const topicInput = document.getElementById('cornell-topic');
  const dateInput = document.getElementById('cornell-date');
  const cuesInput = document.getElementById('cornell-cues');
  const notesInput = document.getElementById('cornell-notes');
  const summaryInput = document.getElementById('cornell-summary');

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

  // Autoguardado al escribir
  [topicInput, dateInput, cuesInput, notesInput, summaryInput].forEach(el => {
    el.addEventListener('input', syncDraftToStorage);
  });

  // Cambiar ficha desde el selector
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

  // Nueva ficha en blanco
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

  // Guardar ficha en el historial de localStorage
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

  // Eliminar ficha guardada seleccionada
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

  // Exportar a PDF (abre diálogo de impresión limpio con @media print)
  document.getElementById('cornell-export-pdf').onclick = () => {
    window.print();
  };

  // Exportar a texto plano (.txt)
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

  populateSavedSelect();
  document.getElementById('cornell-back').onclick = onBack;
}
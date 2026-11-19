import { getUserData, saveUserData } from '../services/storage.js';

// Duraciones de tiempo predeterminadas para los bloques en segundos
const STUDY_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

/**
 * nombre de la funcion: playBellSound
 * parametros: Ninguno.
 * retorno: void (Sin retorno).
 * funcionalidad: Genera una notificación sonora suave simulando una campana utilizando la Web Audio API nativa del navegador, sin dependencias ni archivos externos, para alertar el término de cada ciclo.
 */
function playBellSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Nota D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {
    // Manejo silencioso en caso de que las políticas de autoplay del navegador restrinjan el audio
  }
}

/**
 * nombre de la funcion: formatTime
 * parametros: totalSeconds (Tipo: number) - Cantidad total de segundos transcurridos o restantes.
 * retorno: string - Cadena formateada en minutos y segundos ("MM:SS").
 * funcionalidad: Transforma un valor numérico expresado en segundos en una representación cronométrica legible con relleno de dos dígitos por segmento.
 */
function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * nombre de la funcion: renderPomodoro
 * parametros: container (Tipo: HTMLElement) - Contenedor raíz donde se montará la vista, user (Tipo: object|null) - Objeto de usuario autenticado o null en modo invitado, onBack (Tipo: function) - Callback de navegación hacia atrás.
 * retorno: function - Función de limpieza (cleanup) que detiene temporizadores en curso y restablece el título de la página al salir de la pantalla.
 * funcionalidad: Renderiza y administra el espacio de trabajo del Método Pomodoro: reloj de estudio/descanso con Web Audio API, libreta lateral con autoguardado en localStorage particionado por usuario, gestión de bitácoras y exportación a archivo .txt.
 */
export function renderPomodoro(container, user, onBack) {
  // Identificador de usuario para particionar los registros en localStorage
  const userId = user?.id || 'invitado';
  let userData = getUserData(userId);

  // Verificación y preparación de la estructura del borrador activo
  if (!userData.pomodoro.activeDraft) {
    userData.pomodoro.activeDraft = { title: '', content: '' };
  }

  // Estados locales para el control del cronómetro y ciclos
  let mode = 'study'; // 'study' | 'break'
  let timeLeft = STUDY_SECONDS;
  let timerId = null;

  // Inyección de la plantilla estructural de Pomodoro (reloj + libreta lateral)
  container.innerHTML = `
    <div class="method-workspace">
      <div class="workspace-topbar">
        <div class="workspace-title-group">
          <button class="btn btn-secondary" id="pomo-back">← Volver</button>
          <h2>Método Pomodoro</h2>
        </div>
        <span class="badge-sessions" id="pomo-sessions-badge">
          Sesiones completadas: ${userData.pomodoro.completedSessions}
        </span>
      </div>

      <div class="pomodoro-grid">
        <!-- Columna Izquierda: Temporizador -->
        <section class="timer-card">
          <div class="mode-tabs">
            <button class="mode-tab active" data-mode="study">Enfoque (25 min)</button>
            <button class="mode-tab" data-mode="break">Descanso (5 min)</button>
          </div>

          <div class="timer-display" id="pomo-clock">25:00</div>
          <p class="timer-status-text" id="pomo-status">Listo para iniciar tu bloque de estudio</p>

          <div class="timer-controls">
            <button class="btn btn-primary btn-lg" id="pomo-start">Iniciar</button>
            <button class="btn btn-secondary btn-lg" id="pomo-pause" disabled>Pausar</button>
            <button class="btn btn-secondary btn-lg" id="pomo-reset">Reiniciar</button>
          </div>
        </section>

        <!-- Columna Derecha: Barra lateral de notas -->
        <aside class="notes-sidebar">
          <div class="notes-header">
            <h3>Notas de Sesión</h3>
            <span class="save-indicator" id="pomo-save-status">Guardado localmente</span>
          </div>

          <input
            type="text"
            class="note-title-input"
            id="pomo-note-title"
            placeholder="Título del tema (ej. Estructuras de Datos)"
            value="${userData.pomodoro.activeDraft.title.replace(/"/g, '&quot;')}"
          />

          <textarea
            class="note-textarea"
            id="pomo-note-content"
            placeholder="Escribe aquí tus apuntes, dudas o tareas durante el Pomodoro..."
          >${userData.pomodoro.activeDraft.content}</textarea>

          <div class="notes-actions">
            <button class="btn btn-primary" id="pomo-save-log">Guardar en Bitácora</button>
            <button class="btn btn-secondary" id="pomo-export">Exportar (.txt)</button>
          </div>

          <div class="saved-notes-box">
            <h4>Bitácora guardada (${userData.pomodoro.notes.length})</h4>
            <ul class="saved-notes-list" id="pomo-saved-list"></ul>
          </div>
        </aside>
      </div>
    </div>
  `;

  // Captura de elementos interactivos del DOM
  const clockEl = document.getElementById('pomo-clock');
  const statusEl = document.getElementById('pomo-status');
  const startBtn = document.getElementById('pomo-start');
  const pauseBtn = document.getElementById('pomo-pause');
  const resetBtn = document.getElementById('pomo-reset');
  const sessionsBadge = document.getElementById('pomo-sessions-badge');
  const modeTabs = container.querySelectorAll('.mode-tab');

  const titleInput = document.getElementById('pomo-note-title');
  const contentInput = document.getElementById('pomo-note-content');
  const saveStatusEl = document.getElementById('pomo-save-status');
  const savedListEl = document.getElementById('pomo-saved-list');

  /**
   * nombre de la funcion: updateClockUI
   * parametros: Ninguno.
   * retorno: void (Sin retorno).
   * funcionalidad: Refresca en la interfaz el cronómetro con el tiempo restante actual y sincroniza el título de la pestaña del navegador.
   */
  function updateClockUI() {
    clockEl.textContent = formatTime(timeLeft);
    document.title = `${formatTime(timeLeft)} - FocusLab`;
  }

  /**
   * nombre de la funcion: stopTimer
   * parametros: Ninguno.
   * retorno: void (Sin retorno).
   * funcionalidad: Detiene el intervalo de cuenta regresiva activo y actualiza el estado habilitado/deshabilitado de los botones de control.
   */
  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  /**
   * nombre de la funcion: switchMode
   * parametros: newMode (Tipo: string) - Modo de operación seleccionado ('study' o 'break').
   * retorno: void (Sin retorno).
   * funcionalidad: Cambia el temporizador entre el bloque de estudio (25 minutos) y el bloque de descanso (5 minutos), reiniciando el cronómetro y actualizando las etiquetas visuales.
   */
  function switchMode(newMode) {
    stopTimer();
    mode = newMode;
    timeLeft = mode === 'study' ? STUDY_SECONDS : BREAK_SECONDS;
    modeTabs.forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    statusEl.textContent = mode === 'study'
      ? 'Listo para iniciar tu bloque de estudio'
      : 'Tiempo de descanso activo';
    updateClockUI();
  }

  /**
   * nombre de la funcion: startTimer
   * parametros: Ninguno.
   * retorno: void (Sin retorno).
   * funcionalidad: Inicia el temporizador de cuenta regresiva por segundo, gestionando el paso de ciclos de estudio/descanso, la reproducción de alertas de sonido y el incremento del récord de sesiones en localStorage.
   */
  function startTimer() {
    if (timerId) return;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    statusEl.textContent = mode === 'study'
      ? 'Enfocado... evita distracciones'
      : 'Descansando... estira y hidrátate';

    timerId = setInterval(() => {
      timeLeft -= 1;
      updateClockUI();

      if (timeLeft <= 0) {
        stopTimer();
        playBellSound();

        // Incremento de sesiones completadas si se finalizó un bloque de concentración
        if (mode === 'study') {
          userData.pomodoro.completedSessions += 1;
          saveUserData(userId, userData);
          sessionsBadge.textContent = `Sesiones completadas: ${userData.pomodoro.completedSessions}`;
          alert('¡Bloque de 25 minutos completado! Pasando a 5 minutos de descanso.');
          switchMode('break');
        } else {
          alert('¡Descanso terminado! Listo para el siguiente Pomodoro.');
          switchMode('study');
        }
      }
    }, 1000);
  }

  // Asignación de manejadores de eventos a los controles del temporizador
  startBtn.onclick = startTimer;
  pauseBtn.onclick = () => {
    stopTimer();
    statusEl.textContent = 'Temporizador en pausa';
  };
  resetBtn.onclick = () => switchMode(mode);
  modeTabs.forEach(tab => {
    tab.onclick = () => switchMode(tab.dataset.mode);
  });

  /**
   * nombre de la funcion: persistDraft
   * parametros: Ninguno.
   * retorno: void (Sin retorno).
   * funcionalidad: Guarda de manera asíncrona en localStorage el borrador activo del título y contenido que el usuario está escribiendo.
   */
  function persistDraft() {
    userData.pomodoro.activeDraft = {
      title: titleInput.value,
      content: contentInput.value
    };
    saveUserData(userId, userData);
    saveStatusEl.textContent = 'Guardado ✓';
  }

  // Oyentes de entrada de texto para autoguardado en tiempo real
  titleInput.addEventListener('input', () => {
    saveStatusEl.textContent = 'Guardando...';
    persistDraft();
  });

  contentInput.addEventListener('input', () => {
    saveStatusEl.textContent = 'Guardando...';
    persistDraft();
  });

  /**
   * nombre de la funcion: renderSavedNotes
   * parametros: Ninguno.
   * retorno: void (Sin retorno).
   * funcionalidad: Construye y actualiza la lista visual de notas archivadas en la bitácora histórica, configurando las acciones de recarga en el editor y de eliminación.
   */
  function renderSavedNotes() {
    const notes = userData.pomodoro.notes;
    container.querySelector('.saved-notes-box h4').textContent = `Bitácora guardada (${notes.length})`;

    if (notes.length === 0) {
      savedListEl.innerHTML = `<li style="color: var(--text-muted); font-size: 0.82rem;">Aún no has guardado notas en la bitácora.</li>`;
      return;
    }

    // Mapeo dinámico de notas guardadas
    savedListEl.innerHTML = notes.map(note => `
      <li class="saved-note-item">
        <div class="saved-note-info" data-load-id="${note.id}" title="Clic para cargar en el editor">
          <strong>${note.title || 'Sin título'}</strong> · <span>${note.date}</span>
        </div>
        <button class="delete-note-btn" data-del-id="${note.id}" title="Eliminar">×</button>
      </li>
    `).join('');

    // Manejador para recargar una nota archivada en el editor
    savedListEl.querySelectorAll('[data-load-id]').forEach(el => {
      el.onclick = () => {
        const found = userData.pomodoro.notes.find(n => n.id === el.dataset.loadId);
        if (found) {
          titleInput.value = found.title;
          contentInput.value = found.content;
          persistDraft();
        }
      };
    });

    // Manejador para eliminar una nota archivada
    savedListEl.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.onclick = () => {
        userData.pomodoro.notes = userData.pomodoro.notes.filter(n => n.id !== btn.dataset.delId);
        saveUserData(userId, userData);
        renderSavedNotes();
      };
    });
  }

  // Manejador de evento para archivar una nueva entrada en la bitácora
  document.getElementById('pomo-save-log').onclick = () => {
    const content = contentInput.value.trim();
    if (!content) {
      alert('Escribe alguna nota antes de guardar en la bitácora.');
      return;
    }
    const newNote = {
      id: String(Date.now()),
      title: titleInput.value.trim() || 'Sesión Pomodoro',
      content,
      date: new Date().toLocaleDateString('es-VE')
    };
    userData.pomodoro.notes.unshift(newNote);
    saveUserData(userId, userData);
    renderSavedNotes();
    saveStatusEl.textContent = 'Archivada en bitácora ✓';
  };

  // Manejador de evento para exportar los apuntes a archivo descargable (.txt)
  document.getElementById('pomo-export').onclick = () => {
    const title = titleInput.value.trim() || 'Notas_Pomodoro';
    const content = contentInput.value;
    const fileBody = [
      `MÉTODO POMODORO - FOCUSLAB`,
      `Tema: ${title}`,
      `Fecha: ${new Date().toLocaleString('es-VE')}`,
      `Sesiones completadas: ${userData.pomodoro.completedSessions}`,
      `----------------------------------------`,
      ``,
      content
    ].join('\n');

    const blob = new Blob([fileBody], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render inicial de las notas guardadas
  renderSavedNotes();

  /**
   * nombre de la funcion: cleanup
   * parametros: Ninguno.
   * retorno: void (Sin retorno).
   * funcionalidad: Limpia los timers en ejecución y restaura el título original de la pestaña del navegador al desmontar la pantalla.
   */
  const cleanup = () => {
    stopTimer();
    document.title = 'FocusLab - Métodos de Estudio';
  };

  // Evento de regreso hacia la vista principal
  document.getElementById('pomo-back').onclick = () => {
    cleanup();
    onBack();
  };

  return cleanup;
}

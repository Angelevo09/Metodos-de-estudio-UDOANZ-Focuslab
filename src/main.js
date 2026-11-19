import './styles/variables.css';
import './styles/layout.css';
import './styles/methods.css';

import {
  signUpUser,
  signInUser,
  signOutUser,
  getCurrentUser,
  onAuthChange
} from './services/supabase.js';
import { renderLanding } from './views/landing.js';
import { renderPomodoro } from './views/pomodoro.js';
import { renderCornell } from './views/cornell.js';
import { renderDoodling } from './views/doodling.js';

// Estado global reactivo de la aplicación
const state = {
  user: null,
  currentView: 'landing',
  authMode: 'login' // 'login' | 'register'
};

// Referencia a la función de limpieza de la vista activa actual
let currentCleanup = null;

// Elementos estructurales base del DOM
const appContainer = document.getElementById('app');
const authControls = document.getElementById('auth-controls');
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const modalTitle = document.getElementById('modal-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');

/**
 * nombre de la funcion: renderNavbarAuth
 * parametros: Ninguno.
 * retorno: void (Sin retorno).
 * funcionalidad: Actualiza dinámicamente los controles de autenticación en la barra superior (Navbar). Si no hay un usuario autenticado, muestra los botones para Iniciar Sesión y Registrarse; si existe sesión activa, despliega el avatar del usuario con su menú desplegable de navegación y cierre de sesión.
 */
function renderNavbarAuth() {
  if (!state.user) {
    // Renderizado para usuarios no autenticados o invitados
    authControls.innerHTML = `
      <div style="display: flex; gap: 0.6rem;">
        <button class="btn btn-outline" id="btn-open-login">Iniciar Sesión</button>
        <button class="btn btn-primary" id="btn-open-register">Registrarse</button>
      </div>
    `;
    document.getElementById('btn-open-login').onclick = () => openModal('login');
    document.getElementById('btn-open-register').onclick = () => openModal('register');
  } else {
    // Renderizado para usuarios con sesión activa
    const initial = (state.user.email || 'U').charAt(0).toUpperCase();
    authControls.innerHTML = `
      <div class="user-menu-wrapper">
        <button class="avatar-btn" id="avatar-toggle" title="${state.user.email}">
          ${initial}
        </button>
        <div class="dropdown-menu hidden" id="user-dropdown">
          <div class="dropdown-header">${state.user.email}</div>
          <button class="dropdown-item" data-nav="pomodoro">Bitácora de Pomodoro</button>
          <button class="dropdown-item" data-nav="cornell">Método Cornell</button>
          <button class="dropdown-item" data-nav="doodling">Doodling (PDF/DOCX)</button>
          <button class="dropdown-item danger" id="btn-logout">Cerrar Sesión</button>
        </div>
      </div>
    `;

    const dropdown = document.getElementById('user-dropdown');
    document.getElementById('avatar-toggle').onclick = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    };

    // Navegación directa a los métodos desde el dropdown
    dropdown.querySelectorAll('[data-nav]').forEach(item => {
      item.onclick = () => {
        dropdown.classList.add('hidden');
        navigateTo(item.dataset.nav);
      };
    });

    // Acción de cierre de sesión
    document.getElementById('btn-logout').onclick = async () => {
      navigateTo('landing');
      await signOutUser();
    };
  }
}

/**
 * nombre de la funcion: openModal
 * parametros: mode (Tipo: string) - Modo del modal ('login' para iniciar sesión o 'register' para registro).
 * retorno: void (Sin retorno).
 * funcionalidad: Configura y hace visible el modal flotante de autenticación, restableciendo los campos del formulario y adaptando los textos según la acción solicitada.
 */
function openModal(mode) {
  state.authMode = mode;
  authError.textContent = '';
  authForm.reset();
  modalTitle.textContent = mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta';
  authSubmitBtn.textContent = mode === 'login' ? 'Entrar' : 'Registrarme';
  authModal.classList.remove('hidden');
}

// Cierre del modal y eventos de click fuera del menú de usuario
document.getElementById('close-modal').onclick = () => authModal.classList.add('hidden');
document.addEventListener('click', () => {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
});

// Procesamiento del envío del formulario de autenticación
authForm.onsubmit = async (e) => {
  e.preventDefault();
  authError.textContent = '';
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;

  try {
    authSubmitBtn.disabled = true;
    if (state.authMode === 'register') {
      await signUpUser(email, password);
    } else {
      await signInUser(email, password);
    }
    authModal.classList.add('hidden');
  } catch (err) {
    authError.textContent = err.message || 'Error de autenticación';
  } finally {
    authSubmitBtn.disabled = false;
  }
};

/**
 * nombre de la funcion: navigateTo
 * parametros: viewName (Tipo: string) - Nombre de la vista destino ('landing', 'pomodoro', 'cornell' o 'doodling').
 * retorno: void (Sin retorno).
 * funcionalidad: Enrutador SPA ligero que se encarga del ciclo de vida visual de la aplicación: invoca funciones de limpieza de la vista saliente y monta dinámicamente el componente de la nueva vista en el contenedor principal.
 */
export function navigateTo(viewName) {
  // Limpieza de suscripciones y recursos de la vista saliente
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  state.currentView = viewName;

  // Montaje de la vista seleccionada
  if (viewName === 'landing') {
    renderLanding(appContainer, (selectedMethod) => navigateTo(selectedMethod));
    return;
  }

  if (viewName === 'pomodoro') {
    currentCleanup = renderPomodoro(appContainer, state.user, () => navigateTo('landing'));
    return;
  }

  if (viewName === 'cornell') {
    renderCornell(appContainer, state.user, () => navigateTo('landing'));
    return;
  }

  if (viewName === 'doodling') {
    currentCleanup = renderDoodling(appContainer, state.user, () => navigateTo('landing'));
  }
}

// Enlaces de navegación rápida en la cabecera
document.getElementById('nav-home').onclick = () => navigateTo('landing');
document.getElementById('nav-methods').onclick = () => navigateTo('landing');

/**
 * nombre de la funcion: init
 * parametros: Ninguno.
 * retorno: Promise<void> (Sin retorno).
 * funcionalidad: Inicializa la aplicación obteniendo la sesión persistida en Supabase, renderizando el estado inicial del navbar, cargando la pantalla de inicio y suscribiendo el listener de eventos de autenticación.
 */
async function init() {
  state.user = await getCurrentUser();
  renderNavbarAuth();
  navigateTo('landing');

  // Suscripción reactiva a cambios de sesión (login, logout, token refresh)
  onAuthChange((user) => {
    state.user = user;
    renderNavbarAuth();
    if (state.currentView !== 'landing') {
      navigateTo(state.currentView);
    }
  });
}

// Arranque de la aplicación
init();

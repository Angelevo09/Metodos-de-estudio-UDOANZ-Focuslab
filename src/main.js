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

// Estado global de la aplicación
const state = {
  user: null,
  currentView: 'landing',
  authMode: 'login' // 'login' | 'register'
};

let currentCleanup = null;
const appContainer = document.getElementById('app');
const authControls = document.getElementById('auth-controls');
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const modalTitle = document.getElementById('modal-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');

// Renderiza la barra superior según si hay usuario o no
function renderNavbarAuth() {
  if (!state.user) {
    authControls.innerHTML = `
      <div style="display: flex; gap: 0.6rem;">
        <button class="btn btn-outline" id="btn-open-login">Iniciar Sesión</button>
        <button class="btn btn-primary" id="btn-open-register">Registrarse</button>
      </div>
    `;
    document.getElementById('btn-open-login').onclick = () => openModal('login');
    document.getElementById('btn-open-register').onclick = () => openModal('register');
  } else {
    const initial = state.user.email.charAt(0);
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

    dropdown.querySelectorAll('[data-nav]').forEach(item => {
      item.onclick = () => {
        dropdown.classList.add('hidden');
        navigateTo(item.dataset.nav);
      };
    });

    document.getElementById('btn-logout').onclick = async () => {
      await signOutUser();
      navigateTo('landing');
    };
  }
}

// Control del Modal de Autenticación
function openModal(mode) {
  state.authMode = mode;
  authError.textContent = '';
  authForm.reset();
  modalTitle.textContent = mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta';
  authSubmitBtn.textContent = mode === 'login' ? 'Entrar' : 'Registrarme';
  authModal.classList.remove('hidden');
}

document.getElementById('close-modal').onclick = () => authModal.classList.add('hidden');
document.addEventListener('click', () => {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
});

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

// Enrutador de Vistas
export function navigateTo(viewName) {
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  state.currentView = viewName;

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

// Navegación desde el Navbar
document.getElementById('nav-home').onclick = () => navigateTo('landing');
document.getElementById('nav-methods').onclick = () => navigateTo('landing');

// Inicialización
async function init() {
  state.user = await getCurrentUser();
  renderNavbarAuth();
  navigateTo('landing');

  onAuthChange((user) => {
    state.user = user;
    renderNavbarAuth();
    if (state.currentView !== 'landing') {
      navigateTo(state.currentView);
    }
  });
}

init();
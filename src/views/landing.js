// Importación de las imágenes representativas para cada método de estudio
import pomodoroImg from '../images/Pomodoro.jpg';
import cornellImg from '../images/Cornell.jpg';
import doodlingImg from '../images/Doodling.jpg';

// Definición estática del catálogo de métodos disponibles con sus recursos visuales y metadatos
const METHODS = [
  {
    id: 'pomodoro',
    image: pomodoroImg,
    tag: '25 / 5 min',
    title: 'Método Pomodoro',
    description: 'Alterna bloques de 25 minutos de concentración profunda con 5 minutos de descanso activo mientras tomas notas rápidas en tiempo real.',
    benefits: 'Combate la fatiga mental, evita la procrastinación y mantiene un registro exportable de tus avances por sesión.'
  },
  {
    id: 'cornell',
    image: cornellImg,
    tag: 'Plantilla',
    title: 'Método Cornell',
    description: 'Sistema estructurado de toma de apuntes dividido en columna de palabras clave/preguntas, área principal de notas y bloque de resumen final.',
    benefits: 'Facilita el repaso activo, sintetiza conceptos complejos y permite exportar tus fichas listas para estudiar.'
  },
  {
    id: 'doodling',
    image: doodlingImg,
    tag: 'PDF / DOCX',
    title: 'Doodling & Lectura Visual',
    description: 'Carga tus guías en PDF o Word (.docx) en pantalla dividida mientras dibujas esquemas, mapas mentales o trazos libres en un lienzo lateral.',
    benefits: 'Activa la memoria visual y espacial al conectar la lectura técnica con bocetos propios sin cambiar de ventana.'
  }
];

/**
 * nombre de la funcion: renderLanding
 * parametros: container (Tipo: HTMLElement) - Nodo contenedor del DOM donde se inyectará la vista, onSelectMethod (Tipo: function) - Función callback invocada al seleccionar un método.
 * retorno: void (Sin retorno).
 * funcionalidad: Renderiza la página de inicio (Landing) de FocusLab con una cabecera hero estilizada de alta estética y una cuadrícula de tarjetas de métodos centradas, enmarcadas y con sus imágenes completas sin recortes. Asigna los eventos de selección.
 */
export function renderLanding(container, onSelectMethod) {
  // Inyección de la estructura HTML con cabecera estética y tarjetas enmarcadas
  container.innerHTML = `
    <div class="container">
      <header class="hero">
        <h1 class="hero-title">
          Focus<span class="hero-gradient-text">Lab</span>
        </h1>

        <p class="hero-subtitle">
          Potencia tu retención, estructura tus apuntes y optimiza cada sesión de estudio.
          <span class="hero-subtitle-hint">Escoja el o los métodos de su preferencia</span>
        </p>

        <div class="hero-decoration">
          <span class="hero-line"></span>
          <span class="hero-star">★</span>
          <span class="hero-line"></span>
        </div>
      </header>

      <section class="methods-list">
        ${METHODS.map(m => `
          <article class="method-card">
            <div class="method-card-media">
              <img src="${m.image}" alt="${m.title}" class="method-card-img" />
            </div>
            <div class="method-info">
              <div class="method-meta">
                <span class="method-card-tag">${m.tag}</span>
              </div>
              <div class="method-header">
                <h2>${m.title}</h2>
              </div>
              <p class="method-desc">${m.description}</p>
              <div class="method-benefits">
                <span class="benefits-label">Beneficios:</span>
                <span>${m.benefits}</span>
              </div>
              <div class="method-actions">
                <button class="btn btn-primary select-method-btn" data-method="${m.id}">
                  Escoger este Método
                </button>
              </div>
            </div>
          </article>
        `).join('')}
      </section>
    </div>
  `;

  // Asignación de oyentes de eventos a cada botón de selección de método
  container.querySelectorAll('.select-method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      onSelectMethod(btn.dataset.method);
    });
  });
}

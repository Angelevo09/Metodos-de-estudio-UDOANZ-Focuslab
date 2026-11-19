const METHODS = [
  {
    id: 'pomodoro',
    icon: '⏱️',
    tag: '25 / 5 min',
    title: 'Método Pomodoro',
    description: 'Alterna bloques de 25 minutos de concentración profunda con 5 minutos de descanso activo mientras tomas notas rápidas en tiempo real.',
    benefits: 'Beneficios: Combate la fatiga mental, evita la procrastinación y mantiene un registro exportable de tus avances por sesión.'
  },
  {
    id: 'cornell',
    icon: '📝',
    tag: 'Plantilla',
    title: 'Método Cornell',
    description: 'Sistema estructurado de toma de apuntes dividido en columna de palabras clave/preguntas, área principal de notas y bloque de resumen final.',
    benefits: 'Beneficios: Facilita el repaso activo, sintetiza conceptos complejos y permite exportar tus fichas listas para estudiar.'
  },
  {
    id: 'doodling',
    icon: '🎨',
    tag: 'PDF / DOCX',
    title: 'Doodling & Lectura Visual',
    description: 'Carga tus guías en PDF o Word (.docx) en pantalla dividida mientras dibujas esquemas, mapas mentales o trazos libres en un lienzo lateral.',
    benefits: 'Beneficios: Activa la memoria visual y espacial al conectar la lectura técnica con bocetos propios sin cambiar de ventana.'
  }
];

export function renderLanding(container, onSelectMethod) {
  container.innerHTML = `
    <div class="container">
      <header class="hero">
        <h1>FocusLab</h1>
        <p>Escoja el o los métodos de su preferencia</p>
      </header>

      <section class="methods-list">
        ${METHODS.map(m => `
          <article class="method-card">
            <div class="method-logo">
              <div>${m.icon}</div>
              <span>${m.tag}</span>
            </div>
            <div class="method-info">
              <h2>${m.title}</h2>
              <p class="method-desc">${m.description}</p>
              <p class="method-benefits">${m.benefits}</p>
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

  container.querySelectorAll('.select-method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      onSelectMethod(btn.dataset.method);
    });
  });
}
# FocusLab - Plataforma de Métodos de Estudio

Aplicación web modular desarrollada en JavaScript (Vite) con autenticación mediante **Supabase Auth** y persistencia local por usuario en **localStorage**.

## Funcionalidades
- **Landing & Autenticación:** Inicio de sesión y registro con Supabase (más soporte de modo invitado).
- **Método Pomodoro:** Temporizador 25/5 min con alerta sonora, libreta lateral con autoguardado, bitácora y exportación `.txt`.
- **Método Cornell:** Plantilla interactiva de 3 secciones (Palabras clave, Notas y Resumen), historial de fichas y exportación a PDF / `.txt`.
- **Doodling & Lectura Visual:** Pantalla dividida con visor nativo de PDF y renderizado de Word (`.docx` con Mammoth.js) junto a un lienzo libre exportable en PNG.

## Instalación en Local
1. Clonar el repositorio e instalar dependencias: `npm install`
2. Configurar variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en un archivo `.env`
3. Ejecutar servidor local: `npm run dev`
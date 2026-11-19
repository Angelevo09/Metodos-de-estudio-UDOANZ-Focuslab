// Prefijo base para aislar las claves en el almacenamiento local del navegador
const PREFIX = 'cel2_studyapp_';

/**
 * nombre de la funcion: getStorageKey
 * parametros: userId (Tipo: string|null) - Identificador único de usuario o valor nulo si está en modo invitado.
 * retorno: string - Clave formateada para almacenamiento en localStorage.
 * funcionalidad: Genera una clave con prefijo para independizar los datos guardados de cada usuario o del usuario invitado.
 */
function getStorageKey(userId) {
  return `${PREFIX}${userId || 'invitado'}`;
}

/**
 * nombre de la funcion: getUserData
 * parametros: userId (Tipo: string|null) - Identificador único del usuario actual.
 * retorno: object - Objeto con el estado almacenado (sesiones de Pomodoro, notas y fichas Cornell).
 * funcionalidad: Recupera los datos del usuario desde localStorage o inicializa una estructura por defecto si no existen registros previos.
 */
export function getUserData(userId) {
  const raw = localStorage.getItem(getStorageKey(userId));
  if (!raw) {
    return {
      pomodoro: { completedSessions: 0, notes: [] },
      cornell: []
    };
  }
  return JSON.parse(raw);
}

/**
 * nombre de la funcion: saveUserData
 * parametros: userId (Tipo: string|null) - Identificador del usuario, data (Tipo: object) - Estructura de datos a guardar.
 * retorno: void (Sin retorno).
 * funcionalidad: Serializa y persiste en localStorage la información actualizada del usuario correspondiente.
 */
export function saveUserData(userId, data) {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
}

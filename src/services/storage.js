const PREFIX = 'cel2_studyapp_';

function getStorageKey(userId) {
  return `${PREFIX}${userId || 'invitado'}`;
}

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

export function saveUserData(userId, data) {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
}
import { useState } from 'react';

const SESSION_KEY = 'rtu_admin_session';

// ==================== ADMIN SESSION ====================
function useAdminSession() {
  const [isAuthed, setAuthed] = useState<boolean>(() => {
    return localStorage.getItem(SESSION_KEY) === 'true';
  });

  const login = (username: string, password: string) => {
    if (username === 'admin' && password === '55660') {
      setAuthed(true);
      localStorage.setItem(SESSION_KEY, 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthed(false);
    localStorage.removeItem(SESSION_KEY);
  };

  return { isAuthed, login, logout };
}

export default useAdminSession;


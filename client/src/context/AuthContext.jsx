import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    sessionStorage.getItem('stylesense_token')
  );

  const [loading, setLoading] = useState(true);

  const [loggingOut, setLoggingOut] = useState(false);

  // =========================================================
  // RESTORE USER AFTER PAGE REFRESH
  // =========================================================

  useEffect(() => {
    const restoreUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Session expired');
        }

        const data = await response.json();

        setUser(data.user);
      } catch (error) {
        console.error(
          'Failed to restore session:',
          error
        );

        sessionStorage.removeItem(
          'stylesense_token'
        );

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreUser();
  }, [token]);

  // =========================================================
  // REGISTER
  // =========================================================

  const register = async (
    name,
    email,
    password
  ) => {
    const response = await fetch(
      `${API_BASE_URL}/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || 'Registration failed'
      );
    }

    sessionStorage.setItem(
      'stylesense_token',
      data.token
    );

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const login = async (
    email,
    password
  ) => {
    const response = await fetch(
      `${API_BASE_URL}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || 'Login failed'
      );
    }

    sessionStorage.setItem(
      'stylesense_token',
      data.token
    );

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    sessionStorage.removeItem(
      'stylesense_token'
    );

    sessionStorage.removeItem(
      'stylesense_page'
    );

    sessionStorage.removeItem(
      'stylesense_selected_product'
    );

    setLoggingOut(true);

    setUser(null);
    setToken(null);

    setTimeout(() => {
      setLoggingOut(false);
    }, 800);
  };

  // =========================================================
  // PROVIDER
  // =========================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loggingOut,
        register,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =========================================================
// USE AUTH
// =========================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
};
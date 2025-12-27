import { useState } from 'react';
import { authService } from '../services/authService';
import './Login.css';

interface LoginProps {
  onLoginSuccess: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      
      if (isLogin) {
        result = await authService.login(email, password);
      } else {
        result = await authService.register(email, password, name);
        
        if (result.success) {
          // Auto-login después de registro
          result = await authService.login(email, password);
        }
      }

      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Error desconocido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🏭 Master Plan</h1>
          <p>Sistema de Gestión de Producción</p>
        </div>

        <div className="login-tabs">
          <button
            className={isLogin ? 'active' : ''}
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
          >
            Iniciar Sesión
          </button>
          <button
            className={!isLogin ? 'active' : ''}
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">👤 Nombre Completo</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">📧 Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">🔒 Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
            />
            {!isLogin && (
              <small className="form-hint">Mínimo 6 caracteres</small>
            )}
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? '⏳ Cargando...' : (isLogin ? '🚀 Iniciar Sesión' : '✨ Crear Cuenta')}
          </button>
        </form>

        <div className="login-footer">
          <p className="info-text">
            {isLogin ? (
              <>¿No tienes cuenta? <button onClick={() => setIsLogin(false)} className="link-button">Regístrate aquí</button></>
            ) : (
              <>¿Ya tienes cuenta? <button onClick={() => setIsLogin(true)} className="link-button">Inicia sesión</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from './api';
import { showSuccess, showError } from './utils/toast';
import { Eye, EyeOff, TrendingUp, Lock, Mail, Sparkles } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(email, password);
      localStorage.setItem('token', response.data.access_token);
      showSuccess('Login successful');
      window.location.href = '/dashboard';
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated Background */}
      <div className="auth-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Glass Card Container */}
      <div className="auth-container">
        <div className="auth-card">
          {/* Logo & Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">
                <TrendingUp size={28} strokeWidth={2.5} />
              </div>
              <h1 className="logo-text">Banking Dashboard</h1>
            </div>
            <div className="auth-title-group">
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-subtitle">Sign in to your account</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">
                <Mail size={14} />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">
                <Lock size={14} />
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="auth-submit"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p className="auth-footer-text">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="auth-link"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ═══════════════════════════════════════════════════════════════
           AUTH PAGE BASE
        ═══════════════════════════════════════════════════════════════ */
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          background: #0f0f1e;
        }

        /* ─── ANIMATED BACKGROUND ────────────────────────────────────────── */
        .auth-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.6;
          animation: float 20s ease-in-out infinite;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #6366f1 0%, transparent 70%);
          top: -10%;
          right: -10%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
          bottom: -5%;
          left: -5%;
          animation-delay: -7s;
        }

        .orb-3 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -14s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }

        /* ─── GLASS CARD ─────────────────────────────────────────────────── */
        .auth-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          padding: 3rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        /* ─── HEADER ─────────────────────────────────────────────────────── */
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
          animation: fadeIn 0.6s ease 0.2s backwards;
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .logo-text {
          font-family: 'Sora', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: white;
          letter-spacing: -0.02em;
        }

        .auth-title-group {
          animation: fadeIn 0.6s ease 0.3s backwards;
        }

        .auth-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.5rem;
        }

        .auth-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ─── FORM ───────────────────────────────────────────────────────── */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          animation: fadeIn 0.6s ease backwards;
        }

        .form-group:nth-child(1) { animation-delay: 0.4s; }
        .form-group:nth-child(2) { animation-delay: 0.5s; }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          outline: none;
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .form-input:focus {
          background: rgba(255, 255, 255, 0.12);
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0.25rem;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: rgba(255, 255, 255, 0.9);
        }

        /* ─── SUBMIT BUTTON ──────────────────────────────────────────────── */
        .auth-submit {
          margin-top: 0.5rem;
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          animation: fadeIn 0.6s ease 0.6s backwards;
        }

        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        .auth-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .auth-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ─── FOOTER ─────────────────────────────────────────────────────── */
        .auth-footer {
          margin-top: 2rem;
          text-align: center;
          animation: fadeIn 0.6s ease 0.7s backwards;
        }

        .auth-footer-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .auth-link {
          background: none;
          border: none;
          color: #6366f1;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
          text-decoration: underline;
        }

        .auth-link:hover {
          color: #8b5cf6;
        }

        /* ─── RESPONSIVE ─────────────────────────────────────────────────── */
        @media (max-width: 640px) {
          .auth-page {
            padding: 1rem;
          }
          .auth-card {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;

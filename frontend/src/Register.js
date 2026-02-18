import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from './api';
import { showSuccess, showError } from './utils/toast';
import {
  Eye,
  EyeOff,
  TrendingUp,
  Lock,
  Mail,
  User,
  Phone,
  Check,
  X,
  Sparkles,
  Shield,
} from 'lucide-react';

// ─── Password Strength Checker ────────────────────────────────────────────────
const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  score = Object.values(checks).filter(Boolean).length;

  const strengthMap = {
    0: { label: '', color: '' },
    1: { label: 'Very Weak', color: '#ef4444' },
    2: { label: 'Weak', color: '#f59e0b' },
    3: { label: 'Fair', color: '#eab308' },
    4: { label: 'Good', color: '#22c55e' },
    5: { label: 'Strong', color: '#10b981' },
  };

  return { score, ...strengthMap[score], checks };
};

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsDontMatch = confirmPassword && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Always check password match before submit
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (passwordStrength.score < 3) {
      showError('Please use a stronger password');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, phone);
      showSuccess('Account created successfully');
      navigate('/login');
    } catch (err) {
      showError(err.response?.data?.detail || 'Registration failed');
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
        <div className="auth-card register-card">
          {/* Logo & Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">
                <TrendingUp size={28} strokeWidth={2.5} />
              </div>
              <h1 className="logo-text">Banking Dashboard</h1>
            </div>
            <div className="auth-title-group">
              <h2 className="auth-title">Create Account</h2>
              <p className="auth-subtitle">Join us and take control of your finances</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name Field */}
            <div className="form-group">
              <label className="form-label">
                <User size={14} />
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="John Doe"
              />
            </div>

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

            {/* Phone Field */}
            <div className="form-group">
              <label className="form-label">
                <Phone size={14} />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                placeholder="9876543210"
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
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="password-toggle"
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className="strength-bar"
                        style={{
                          background: level <= passwordStrength.score
                            ? passwordStrength.color
                            : 'rgba(255,255,255,0.1)',
                        }}
                      />
                    ))}
                  </div>
                  {passwordStrength.label && (
                    <span className="strength-label" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
              )}

              {/* Password Requirements */}
              {password && (
                <div className="password-checks">
                  <CheckItem
                    met={passwordStrength.checks.length}
                    text="At least 8 characters"
                  />
                  <CheckItem
                    met={passwordStrength.checks.uppercase}
                    text="One uppercase letter"
                  />
                  <CheckItem
                    met={passwordStrength.checks.lowercase}
                    text="One lowercase letter"
                  />
                  <CheckItem
                    met={passwordStrength.checks.number}
                    text="One number"
                  />
                  <CheckItem
                    met={passwordStrength.checks.special}
                    text="One special character"
                  />
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label className="form-label">
                <Shield size={14} />
                Confirm Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`form-input ${passwordsMatch ? 'input-success' : passwordsDontMatch ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="password-toggle"
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    cursor: 'pointer'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {passwordsMatch && (
                  <div className="password-match-icon success">
                    <Check size={16} />
                  </div>
                )}
                {passwordsDontMatch && (
                  <div className="password-match-icon error">
                    <X size={16} />
                  </div>
                )}
              </div>
              {passwordsMatch && (
                <p className="password-match-text success">Passwords match!</p>
              )}
              {passwordsDontMatch && (
                <p className="password-match-text error">Passwords don't match</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !passwordsMatch || passwordStrength.score < 3}
              className="auth-submit"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p className="auth-footer-text">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="auth-link">
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ═══════════════════════════════════════════════════════════════
           AUTH PAGE BASE (Shared with Login)
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

        .auth-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 520px;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
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

        .register-card {
          max-height: 90vh;
          overflow-y: auto;
        }

        .register-card::-webkit-scrollbar {
          width: 6px;
        }

        .register-card::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .register-card::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
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
          gap: 1.25rem;
        }

        .form-group {
          animation: fadeIn 0.6s ease backwards;
        }

        .form-group:nth-child(1) { animation-delay: 0.4s; }
        .form-group:nth-child(2) { animation-delay: 0.45s; }
        .form-group:nth-child(3) { animation-delay: 0.5s; }
        .form-group:nth-child(4) { animation-delay: 0.55s; }
        .form-group:nth-child(5) { animation-delay: 0.6s; }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
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

        .input-success {
          border-color: #22c55e !important;
        }

        .input-error {
          border-color: #ef4444 !important;
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 3rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0.25rem;
          transition: color 0.2s;
          z-index: 2;
        }

        .password-toggle:hover {
          color: rgba(255, 255, 255, 0.9);
        }

        .password-match-icon {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .password-match-icon.success {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .password-match-icon.error {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        /* ─── PASSWORD STRENGTH METER ────────────────────────────────────── */
        .password-strength {
          margin-top: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .strength-bars {
          flex: 1;
          display: flex;
          gap: 0.25rem;
          height: 4px;
        }

        .strength-bar {
          flex: 1;
          border-radius: 2px;
          transition: background 0.3s ease;
        }

        .strength-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        /* ─── PASSWORD CHECKS ────────────────────────────────────────────── */
        .password-checks {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .password-match-text {
          margin-top: 0.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .password-match-text.success {
          color: #22c55e;
        }

        .password-match-text.error {
          color: #ef4444;
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
          animation: fadeIn 0.6s ease 0.65s backwards;
        }

        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        .auth-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .auth-submit:disabled {
          opacity: 0.5;
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
          margin-top: 1.5rem;
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

// ─── Password Check Item Component ────────────────────────────────────────────
function CheckItem({ met, text }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.8rem',
        fontFamily: "'DM Sans', sans-serif",
        color: met ? '#22c55e' : 'rgba(255,255,255,0.5)',
        transition: 'color 0.3s ease',
      }}
    >
      {met ? <Check size={14} /> : <X size={14} />}
      <span>{text}</span>
    </div>
  );
}

export default Register;

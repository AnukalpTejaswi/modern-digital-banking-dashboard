import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from './api';
import { showSuccess, showError } from './utils/toast';

// ==========================================
// LOGIN COMPONENT
// ==========================================
function Login() {

  // ==========================================
  // STATE VARIABLES
  // ==========================================
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ==========================================
  // EVENT HANDLER
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
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

  // ==========================================
  // JSX
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-2">
          Digital Banking Dashboard
        </h1>
        <h2 className="text-xl text-gray-700 text-center mb-8">
          Login to Your Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="*******"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-blue-600 hover:underline"
          >
            Register
          </button>
        </p>

      </div>
    </div>
  );
}

export default Login;

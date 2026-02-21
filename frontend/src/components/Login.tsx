import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle, resetPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      // Redirect to home route
      navigate('/');
    } else {
      setError(result.error || 'Failed to login');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);

    if (result.success) {
      // Redirect to home route
      navigate('/');
    } else {
      setError(result.error || 'Failed to login with Google');
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccess('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email first, then click "Forgot password".');
      return;
    }
    setLoading(true);
    const result = await resetPassword(trimmedEmail);
    setLoading(false);
    if (result.success) {
      setSuccess('Password reset email sent. Please check your inbox. If you do not see it, please also check your Spam or Promotions folder.');
    } else if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4 sm:mt-6 md:mt-8 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="text-center mb-6">
        <p
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm mb-4"
          style={{
            backgroundColor: 'var(--theme-primary-light)',
            color: 'var(--theme-primary)',
            border: '1px solid rgba(var(--theme-primary-rgb), 0.35)'
          }}
        >
          Welcome Back
        </p>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Login</h2>
        <p className="text-slate-600 text-sm">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            style={{ ['--tw-ring-color' as string]: 'var(--theme-primary)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Password
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            style={{ ['--tw-ring-color' as string]: 'var(--theme-primary)' }}
          />
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-xs font-semibold hover:opacity-80 transition-opacity"
              style={{ color: 'var(--theme-primary)' }}
            >
              Forgot password?
            </button>
          </div>
        </div>

        {(error || success) && (
          <div className="space-y-2">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm font-medium text-emerald-700">{success}</p>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style={{
            background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))',
            boxShadow: '0 10px 30px rgba(var(--theme-primary-rgb), 0.3)'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>Login with Google</span>
      </button>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--theme-primary)' }}>
          Sign Up
        </Link>
      </p>
    </div>
  );
}

export default Login;


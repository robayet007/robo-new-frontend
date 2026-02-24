import { useState } from 'react';
import type { FormEvent } from 'react';
import useAuth from '../hooks/useAuth';

function ChangePassword() {
  const { changePassword } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (result.success) {
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setError(result.error || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-md p-4 mx-auto mt-4 bg-white border shadow-xl sm:mt-6 md:mt-8 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border-slate-200">
      <div className="mb-6 text-center">
        <p className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-400/10 text-sky-700 border border-sky-400/35 font-semibold text-sm mb-4">
          Security
        </p>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Change Password</h2>
        <p className="text-sm text-slate-600">
          Update your account password. You&apos;ll need your current password.
        </p>
      </div>

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full px-4 py-3 font-semibold text-white transition-all duration-200 shadow-lg rounded-xl"
          style={{
            background: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`,
            boxShadow: `0 10px 30px rgba(var(--theme-primary-rgb), 0.3)`
          }}
        >
          Show Change Password Form
        </button>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-700">
            Current Password
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            className="w-full px-4 py-3 transition-all bg-white border rounded-xl border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{
              '--tw-ring-color': 'var(--theme-primary)'
            } as React.CSSProperties}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-700">
            New Password
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full px-4 py-3 transition-all bg-white border rounded-xl border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{
              '--tw-ring-color': 'var(--theme-primary)'
            } as React.CSSProperties}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-700">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className="w-full px-4 py-3 transition-all bg-white border rounded-xl border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{
              '--tw-ring-color': 'var(--theme-primary)'
            } as React.CSSProperties}
          />
        </div>

        {error && (
          <div className="p-3 border border-red-200 rounded-lg bg-red-50">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 border border-green-200 rounded-lg bg-green-50">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 font-semibold text-white transition-all duration-200 shadow-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`,
            boxShadow: `0 10px 30px rgba(var(--theme-primary-rgb), 0.3)`
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = `linear-gradient(to right, var(--theme-primary-hover), var(--theme-secondary-dark))`;
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`;
            }
          }}
        >
          {loading ? 'Updating password...' : 'Change Password'}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="w-full px-4 py-3 font-semibold transition-all border rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Hide Form
        </button>
      </form>
      )}
    </div>
  );
}

export default ChangePassword;



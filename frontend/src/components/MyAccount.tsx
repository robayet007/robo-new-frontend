import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaUser,
  FaBox,
  FaWallet,
  FaCog,
  FaPen,
  FaLock,
  FaFileInvoice,
} from 'react-icons/fa';
import useAuth from '../hooks/useAuth';
import useRoboBalance from '../hooks/useRoboBalance';
import ImageUpload from './ImageUpload';

type SectionKey = 'account' | 'wallet' | 'settings';

function MyAccount() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, changePassword, updateUserProfile } = useAuth();
  const { backendBalance, loading: balanceLoading } = useRoboBalance();

  const initialTab = (searchParams.get('tab') as SectionKey) || 'wallet';
  const [activeSection, setActiveSection] = useState<SectionKey>(
    initialTab === 'account' || initialTab === 'settings' ? initialTab : 'wallet',
  );

  const [profileName, setProfileName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const userInitials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  useEffect(() => {
    setProfileName(user?.displayName || '');
    setProfilePhoto(user?.photoURL || '');
  }, [user?.displayName, user?.photoURL]);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', activeSection);
      return next;
    });
  }, [activeSection, setSearchParams]);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileName.trim()) {
      setProfileError('Name is required');
      return;
    }

    setProfileLoading(true);
    const result = await updateUserProfile({
      displayName: profileName.trim(),
      photoURL: profilePhoto.trim(),
    });
    setProfileLoading(false);

    if (result.success) {
      setProfileSuccess('Profile updated successfully');
    } else {
      setProfileError(result.error || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (result.success) {
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(result.error || 'Failed to change password');
    }
  };

  const tabClass = (isActive: boolean) =>
    `inline-flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium border-b-2 ${
      isActive
        ? 'border-pink-500 text-pink-600'
        : 'border-transparent text-slate-600 hover:text-slate-800'
    }`;

  return (
    <div className="max-w-4xl p-4 mx-auto sm:p-6">
      <div className="flex items-center gap-4 overflow-x-auto border-b border-slate-200">
        <button className={tabClass(activeSection === 'account')} onClick={() => setActiveSection('account')}>
          <FaUser className="w-3.5 h-3.5" /> My Account
        </button>
        <button className={tabClass(false)} onClick={() => navigate('/orders')}>
          <FaBox className="w-3.5 h-3.5" /> My Orders
        </button>
        <button className={tabClass(activeSection === 'wallet')} onClick={() => setActiveSection('wallet')}>
          <FaWallet className="w-3.5 h-3.5" /> My Wallet
        </button>
        <button className={tabClass(activeSection === 'settings')} onClick={() => setActiveSection('settings')}>
          <FaCog className="w-3.5 h-3.5" /> Settings
        </button>
      </div>

      {activeSection === 'wallet' && (
        <div className="max-w-xs mt-4">
          <div className="p-3.5 bg-white border shadow-sm rounded-2xl border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl text-slate-600">Wallet Balance</p>
                <p className="text-4xl font-bold text-slate-900">
                  {balanceLoading ? '...' : `৳${(backendBalance ?? 0).toFixed(2)}`}
                </p>
              </div>
              <FaFileInvoice className="mt-1 text-base text-slate-400" />
            </div>
            <button
              type="button"
              onClick={() => navigate('/add-money')}
              className="w-full py-2 mt-3 text-xl font-semibold text-white rounded-xl"
              style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))' }}
            >
              + Add Balance
            </button>
          </div>
        </div>
      )}

      {activeSection === 'account' && (
        <div className="p-5 mt-4 bg-white border shadow-sm rounded-2xl border-slate-200">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="object-cover w-16 h-16 rounded-full border-2 border-slate-200"
              />
            ) : (
              <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold text-white bg-teal-700 rounded-full">
                {userInitials}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user?.displayName || 'User'}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'settings' && (
        <div className="max-w-2xl mt-4 space-y-4">
          <div className="p-5 bg-white border shadow-sm rounded-2xl border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <FaPen className="text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Edit Profile</h3>
            </div>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
              />
              <ImageUpload
                label="Profile Image"
                value={profilePhoto}
                onChange={setProfilePhoto}
                uploadEndpoint="/upload/profile-image"
              />
              {profileError && <p className="text-sm text-red-600">{profileError}</p>}
              {profileSuccess && <p className="text-sm text-emerald-700">{profileSuccess}</p>}
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
                style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))' }}
              >
                {profileLoading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          <div className="p-5 bg-white border shadow-sm rounded-2xl border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <FaLock className="text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Change Password</h3>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
                className="w-full px-4 py-3 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
              />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full px-4 py-3 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
              />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full px-4 py-3 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
              />
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-emerald-700">{passwordSuccess}</p>}
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
                style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))' }}
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAccount;

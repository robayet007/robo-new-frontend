import { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import { membershipApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import type { BackendMembershipPackage } from '../types';
import { Crown, Plus, Pencil, Trash2, Save, X } from 'lucide-react';

function AdminMembership() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<BackendMembershipPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: 'reseller' as 'reseller',
    durationDays: '',
    price: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    // Wait for user to be loaded before making API call
    if (user?.uid && user?.email) {
      loadPackages();
    }
  }, [user?.uid, user?.email]);

  const loadPackages = async () => {
    // Ensure user is available before making API call
    if (!user?.uid || !user?.email) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await membershipApi.getAllPackages(user.uid, user.email);
      if (response.success && Array.isArray(response.data)) {
        setPackages(response.data);
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to load packages' });
      }
    } catch (error: any) {
      console.error('Failed to load packages:', error);
      showToast({ type: 'error', text: error?.message || 'Failed to load packages' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'reseller',
      durationDays: '',
      price: '',
      description: '',
      isActive: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (pkg: BackendMembershipPackage) => {
    setFormData({
      name: pkg.name,
      role: pkg.role,
      durationDays: pkg.durationDays.toString(),
      price: pkg.price.toString(),
      description: pkg.description || '',
      isActive: pkg.isActive
    });
    setEditingId(pkg.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.durationDays || !formData.price) {
      showToast({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    const durationDays = parseInt(formData.durationDays);
    const price = parseFloat(formData.price);

    if (isNaN(durationDays) || durationDays < 1) {
      showToast({ type: 'error', text: 'Duration must be at least 1 day' });
      return;
    }

    if (isNaN(price) || price < 0) {
      showToast({ type: 'error', text: 'Price must be a valid number' });
      return;
    }

    try {
      setLoading(true);
      let response;
      
      if (editingId) {
        response = await membershipApi.updatePackage(
          editingId,
          {
            name: formData.name,
            role: formData.role,
            durationDays,
            price,
            description: formData.description || undefined,
            isActive: formData.isActive
          },
          user?.uid,
          user?.email || undefined
        );
      } else {
        response = await membershipApi.createPackage(
          {
            name: formData.name,
            role: formData.role,
            durationDays,
            price,
            description: formData.description || undefined,
            isActive: formData.isActive
          },
          user?.uid,
          user?.email || undefined
        );
      }

      if (response.success) {
        showToast({ 
          type: 'success', 
          text: editingId ? 'Package updated successfully' : 'Package created successfully' 
        });
        resetForm();
        await loadPackages();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to save package' });
      }
    } catch (error: any) {
      console.error('Failed to save package:', error);
      showToast({ type: 'error', text: error?.message || 'Failed to save package' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to disable this package?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await membershipApi.deletePackage(id, user?.uid, user?.email || undefined);
      if (response.success) {
        showToast({ type: 'success', text: 'Package disabled successfully' });
        await loadPackages();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to delete package' });
      }
    } catch (error: any) {
      console.error('Failed to delete package:', error);
      showToast({ type: 'error', text: error?.message || 'Failed to delete package' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-4 pb-4 pl-0 pr-4 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0" style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 md:p-6">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">Membership Packages</h3>
            <p className="text-sm text-slate-600">
              Manage membership packages that users can purchase to get Reseller role
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg flex items-center gap-2"
              style={{
                background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`
              }}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add Package
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {/* Create/Edit Form */}
      {showForm && (
        <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-slate-900">
              {editingId ? 'Edit Package' : 'Create New Package'}
            </h4>
            <button
              onClick={resetForm}
              className="p-2 text-slate-600 hover:text-slate-900"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Reseller 30 Days"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'reseller' })}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  required
                >
                  <option value="reseller">Reseller</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Duration (Days) *
                </label>
                <input
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                  placeholder="30"
                  min="1"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Price (৳) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="1000"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Package description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">Active (visible to users)</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`
                }}
              >
                <Save className="h-4 w-4" strokeWidth={2} />
                {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Packages Table */}
      <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
        {loading && !showForm ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="w-12 h-12 border-4 rounded-full border-t-transparent animate-spin"
              style={{ borderColor: 'var(--theme-primary)' }}
            ></div>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No membership packages found. Create your first package!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Duration</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-purple-600" strokeWidth={2} />
                        <span className="font-medium text-slate-900">{pkg.name}</span>
                      </div>
                      {pkg.description && (
                        <p className="text-xs text-slate-500 mt-1">{pkg.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                        {pkg.role.charAt(0).toUpperCase() + pkg.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {pkg.durationDays} days
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                      ৳{pkg.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        pkg.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(pkg)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Disable"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminMembership;

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Pencil, Trash2, Shield, Globe } from 'lucide-react';

type ShellAccount = {
    id: string;
    name: string;
    region: 'SG' | 'MY';
    username: string;
    password: string;
    autocode: string;
    isActive: boolean;
    createdAt: string;
};

const themeBtnStyle = {
    background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`,
};

export default function AdminShellAccounts() {
    const [accounts, setAccounts] = useState<ShellAccount[]>([]);
    const { showToast } = useToast();

    // Form state
    const [name, setName] = useState('');
    const [region, setRegion] = useState<'SG' | 'MY'>('SG');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [autocode, setAutocode] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shell-accounts`, {
                headers: {
                    'x-api-key': import.meta.env.VITE_API_KEY || '',
                },
            });
            const data = await res.json();
            if (data.success) {
                setAccounts(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch shell accounts:', err);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const payload = {
            name,
            region,
            username,
            password,
            autocode,
            isActive,
        };

        try {
            const url = editingId
                ? `${import.meta.env.VITE_API_BASE_URL}/api/shell-accounts/${editingId}`
                : `${import.meta.env.VITE_API_BASE_URL}/api/shell-accounts`;

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': import.meta.env.VITE_API_KEY || '',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                showToast({
                    type: 'success',
                    text: `Shell account ${editingId ? 'updated' : 'created'} successfully!`
                });
                resetForm();
                fetchAccounts();
            } else {
                showToast({ type: 'error', text: data.message || 'Operation failed' });
            }
        } catch (err) {
            showToast({ type: 'error', text: 'Something went wrong' });
        }
    };

    const handleEdit = (acc: ShellAccount) => {
        setEditingId(acc.id);
        setName(acc.name);
        setRegion(acc.region);
        setUsername(acc.username);
        setPassword(acc.password);
        setAutocode(acc.autocode);
        setIsActive(acc.isActive);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this account?')) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shell-accounts/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-api-key': import.meta.env.VITE_API_KEY || '',
                },
            });

            const data = await res.json();
            if (data.success) {
                showToast({ type: 'success', text: 'Shell account deleted!' });
                fetchAccounts();
            }
        } catch (err) {
            showToast({ type: 'error', text: 'Delete failed' });
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setRegion('SG');
        setUsername('');
        setPassword('');
        setAutocode('');
        setIsActive(true);
    };

    return (
        <div className="space-y-6 pt-4 pb-4 pl-0 pr-4 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Form Column */}
                <div className="lg:col-span-1">
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 md:p-6"
                    >
                        <h3 className="mb-4 text-lg font-bold tracking-tight text-slate-900">
                            {editingId ? 'Edit Account' : 'Add Shell Account'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block mb-1.5 text-sm font-semibold text-slate-700">Display Name</label>
                                <input
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. MY Primary Account"
                                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                                />
                            </div>

                            <div>
                                <label className="block mb-1.5 text-sm font-semibold text-slate-700">Region</label>
                                <select
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value as 'SG' | 'MY')}
                                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                                >
                                    <option value="SG">Singapore (SG)</option>
                                    <option value="MY">Malaysia (MY)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block mb-1.5 text-sm font-semibold text-slate-700">Username</label>
                                <input
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Garena Username"
                                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                                />
                            </div>

                            <div>
                                <label className="block mb-1.5 text-sm font-semibold text-slate-700">Password</label>
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Garena Password"
                                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                                />
                            </div>

                            <div>
                                <label className="block mb-1.5 text-sm font-semibold text-slate-700">Autocode (2FA) *</label>
                                <input
                                    required
                                    value={autocode}
                                    onChange={(e) => setAutocode(e.target.value)}
                                    placeholder="2FA Secret (Required)"
                                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                />
                                <label htmlFor="isActive" className="text-sm font-semibold text-slate-700">Active</label>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 font-semibold text-white rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02]"
                                    style={themeBtnStyle}
                                >
                                    {editingId ? 'Update Account' : 'Save Account'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2.5 font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 sm:px-6">
                            <h3 className="text-lg font-bold text-slate-900">Registered Accounts</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Name / Region</th>
                                        <th className="px-6 py-4">Username</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {accounts.length > 0 ? (
                                        accounts.map((acc) => (
                                            <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900">{acc.name}</div>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Shield className="w-3 h-3 text-slate-400" />
                                                        <span className="text-xs font-medium text-slate-500">{acc.region}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-sm text-slate-600">{acc.username}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${acc.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {acc.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(acc)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(acc.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Globe className="w-8 h-8 opacity-20" />
                                                    <p>No shell accounts found. Add one on the left.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '../contexts/ToastContext';
import { voucherApi, type VoucherBulkUploadSummary, type VoucherCodeRow } from '../services/api';

const UC_CATEGORIES = ['20', '36', '80', '160', '161', '162', '405', '800', '810', '1625', '2000'];

function AdminVoucher() {
  const { showToast } = useToast();
  const [bulkText, setBulkText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeVouchers, setActiveVouchers] = useState<VoucherCodeRow[]>([]);
  const [usedVouchers, setUsedVouchers] = useState<VoucherCodeRow[]>([]);
  const [stats, setStats] = useState<Record<string, { active: number; used: number; total: number }>>({});
  const [summary, setSummary] = useState<VoucherBulkUploadSummary | null>(null);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingSerial, setDeletingSerial] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const categoryFilterRef = useRef(categoryFilter);
  categoryFilterRef.current = categoryFilter;

  const applyStatsDelta = (rows: VoucherCodeRow[], direction: 'add' | 'sub') => {
    if (!rows.length) return;
    const factor = direction === 'add' ? 1 : -1;
    setStats((prev) => {
      const next = { ...prev };
      rows.forEach((row) => {
        const category = row.ucCategory;
        const current = next[category] || { active: 0, used: 0, total: 0 };
        next[category] = {
          active: Math.max(0, current.active + (row.status === 'active' ? factor : 0)),
          used: Math.max(0, current.used + (row.status === 'used' ? factor : 0)),
          total: Math.max(0, current.total + factor),
        };
      });
      return next;
    });
  };

  const loadStats = async () => {
    const response = await voucherApi.getStats();
    if (response.success && response.data) {
      setStats(response.data.byCategory || {});
    }
  };

  const loadVouchers = async () => {
    setLoadingVouchers(true);
    try {
      const baseParams = {
        ucCategory: categoryFilter === 'all' ? undefined : categoryFilter,
        limit: 300,
      };
      const [activeRes, usedRes] = await Promise.all([
        voucherApi.getAll({ ...baseParams, status: 'active' }),
        voucherApi.getAll({ ...baseParams, status: 'used' }),
      ]);
      if (activeRes.success && Array.isArray(activeRes.data)) {
        setActiveVouchers(activeRes.data);
      } else {
        setActiveVouchers([]);
      }
      if (usedRes.success && Array.isArray(usedRes.data)) {
        setUsedVouchers(usedRes.data);
      } else {
        setUsedVouchers([]);
      }
      if (!activeRes.success || !usedRes.success) {
        showToast({ type: 'error', text: activeRes.message || usedRes.message || 'Failed to load vouchers' });
      }
    } catch (error: any) {
      setActiveVouchers([]);
      setUsedVouchers([]);
      showToast({ type: 'error', text: error?.message || 'Failed to load vouchers' });
    } finally {
      setLoadingVouchers(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  // Real-time: join admin-room and listen for voucher-used
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
    if (!socketUrl) return;

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      auth: { apiKey: import.meta.env.VITE_API_KEY },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-admin-room');
    });

    socket.on('voucher-used', (payload: { vouchers: VoucherCodeRow[] }) => {
      const raw = payload?.vouchers || [];
      const filter = categoryFilterRef.current;
      const list = filter === 'all' ? raw : raw.filter((u) => u.ucCategory === filter);
      if (list.length === 0) return;
      setActiveVouchers((prev) => prev.filter((v) => !list.some((u) => u.serialNumber === v.serialNumber)));
      setUsedVouchers((prev) => {
        const existing = new Set(prev.map((v) => v.serialNumber));
        const newOnes = list.filter((u) => !existing.has(u.serialNumber)).map((u) => ({ ...u, status: 'used' as const }));
        return [...newOnes, ...prev];
      });
      setStats((s) => {
        const next = { ...s };
        raw.forEach((row) => {
          const cat = row.ucCategory;
          const cur = next[cat] || { active: 0, used: 0, total: 0 };
          next[cat] = {
            active: Math.max(0, cur.active - 1),
            used: cur.used + 1,
            total: cur.total,
          };
        });
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleBulkUpload = async () => {
    if (!bulkText.trim()) {
      showToast({ type: 'error', text: 'Bulk code text is required' });
      return;
    }
    setUploading(true);
    try {
      const response = await voucherApi.bulkUpload(bulkText);
      if (response.success && response.data) {
        setSummary(response.data);
        setBulkText('');
        const insertedRows = response.data.insertedRows || [];

        // Immediate UI update without waiting for network reload (bulk upload adds active only).
        if (insertedRows.length > 0) {
          const filteredRows = insertedRows.filter((row) => {
            if (row.status !== 'active') return false;
            if (categoryFilter !== 'all' && row.ucCategory !== categoryFilter) return false;
            return true;
          });
          if (filteredRows.length > 0) {
            setActiveVouchers((prev) => {
              const existing = new Set(prev.map((p) => p.serialNumber));
              const uniqueNew = filteredRows.filter((r) => !existing.has(r.serialNumber));
              return [...uniqueNew, ...prev];
            });
          }
          applyStatsDelta(insertedRows, 'add');
        } else if (response.data.byCategory) {
          // Fallback when backend does not return insertedRows.
          const syntheticRows: VoucherCodeRow[] = [];
          Object.entries(response.data.byCategory).forEach(([category, count]) => {
            const n = Number(count) || 0;
            for (let i = 0; i < n; i += 1) {
              syntheticRows.push({
                serialNumber: `TMP-${category}-${Date.now()}-${i}`,
                code: '',
                ucCategory: category,
                sourcePrefix: '',
                status: 'active',
              });
            }
          });
          applyStatsDelta(syntheticRows, 'add');
        }

        showToast({
          type: 'success',
          text: `Detected ${response.data.detected ?? 0} code(s). Inserted ${response.data.inserted}, skipped ${response.data.skipped}.`,
        });
      } else {
        setSummary((response.data as VoucherBulkUploadSummary) || null);
        showToast({ type: 'error', text: response.message || 'Failed to upload vouchers' });
      }
    } catch (error: any) {
      showToast({ type: 'error', text: error?.message || 'Failed to upload vouchers' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (serialNumber: string) => {
    const confirmed = window.confirm(`Delete voucher ${serialNumber}?`);
    if (!confirmed) return;

    const target = activeVouchers.find((v) => v.serialNumber === serialNumber) ?? usedVouchers.find((v) => v.serialNumber === serialNumber);
    setDeletingSerial(serialNumber);
    try {
      // Optimistic remove for instant UX.
      setActiveVouchers((prev) => prev.filter((v) => v.serialNumber !== serialNumber));
      setUsedVouchers((prev) => prev.filter((v) => v.serialNumber !== serialNumber));
      if (target) {
        applyStatsDelta([target], 'sub');
      }

      const response = await voucherApi.delete(serialNumber);
      if (response.success) {
        showToast({ type: 'success', text: 'Voucher deleted successfully' });
      } else {
        // Rollback on failure.
        if (target) {
          if (target.status === 'active') {
            setActiveVouchers((prev) => [target, ...prev]);
          } else {
            setUsedVouchers((prev) => [target, ...prev]);
          }
          applyStatsDelta([target], 'add');
        }
        showToast({ type: 'error', text: response.message || 'Failed to delete voucher' });
      }
    } catch (error: any) {
      // Rollback on failure.
      if (target) {
        if (target.status === 'active') {
          setActiveVouchers((prev) => [target, ...prev]);
        } else {
          setUsedVouchers((prev) => [target, ...prev]);
        }
        applyStatsDelta([target], 'add');
      }
      showToast({ type: 'error', text: error?.message || 'Failed to delete voucher' });
    } finally {
      setDeletingSerial(null);
    }
  };

  const totalActiveByFilter = useMemo(() => {
    if (categoryFilter === 'all') {
      return UC_CATEGORIES.reduce((acc, c) => acc + (stats[c]?.active || 0), 0);
    }
    return stats[categoryFilter]?.active || 0;
  }, [categoryFilter, stats]);

  const totalUsedByFilter = useMemo(() => {
    if (categoryFilter === 'all') {
      return UC_CATEGORIES.reduce((acc, c) => acc + (stats[c]?.used || 0), 0);
    }
    return stats[categoryFilter]?.used || 0;
  }, [categoryFilter, stats]);

  const getFormattedVoucherLine = (row: VoucherCodeRow) =>
    `${(row.sourcePrefix || '').trim()} ${(row.code || '').trim()}`.trim();

  return (
    <div className="space-y-6 pt-4 pb-4 pl-0 pr-4 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0" style={{ fontFamily: "var(--theme-font-family), 'Plus Jakarta Sans', sans-serif" }}>
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 md:p-6">
        <h3 className="mb-2 text-lg font-bold tracking-tight text-slate-900">Voucher UC Bulk Upload</h3>
        <p className="text-sm text-slate-600">
          Bulk code paste করুন। System auto-detect করে UC package অনুযায়ী active voucher add করবে।
        </p>

        <div className="mt-4">
          <label className="block mb-2 text-sm font-semibold text-slate-700">Bulk Voucher Input</label>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={10}
            placeholder="BDMB-T-S-12345678 1111-2222-3333-4444"
            className="w-full px-4 py-3 font-mono text-sm border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
          />
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={handleBulkUpload}
              disabled={uploading}
              className="px-5 py-2.5 font-semibold text-white rounded-xl disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }}
            >
              {uploading ? 'Uploading...' : 'Upload & Auto Detect'}
            </button>
            <button
              type="button"
              onClick={() => setBulkText('')}
              disabled={uploading}
              className="px-5 py-2.5 font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
        <h4 className="mb-3 text-base font-bold text-slate-900">UC Package Snapshot</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {UC_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`p-2 border rounded-lg text-left transition-all ${
                categoryFilter === cat ? 'border-transparent text-white' : 'border-slate-200 bg-slate-50'
              }`}
              style={
                categoryFilter === cat
                  ? { background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))' }
                  : undefined
              }
            >
              <p className="text-xs opacity-90">UC {cat}</p>
              <p className="text-sm font-bold">{stats[cat]?.active || 0} active</p>
            </button>
          ))}
        </div>
      </div>

      {summary && (
        <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
          <h4 className="mb-3 text-base font-bold text-slate-900">Last Upload Result</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-xs text-emerald-700">Inserted</p>
              <p className="text-xl font-bold text-emerald-700">{summary.inserted}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700">Skipped</p>
              <p className="text-xl font-bold text-amber-700">{summary.skipped}</p>
            </div>
            <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
              <p className="text-xs text-sky-700">Invalid / Duplicate</p>
              <p className="text-xl font-bold text-sky-700">
                {(summary.invalidLines?.length || 0) + (summary.duplicateLines?.length || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h4 className="text-base font-bold text-slate-900">Voucher Codes (Active | Used)</h4>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
          >
            <option value="all">All Packages</option>
            {UC_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                UC {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active codes column */}
          <div>
            <h5 className="mb-2 text-sm font-semibold text-emerald-700">Active ({totalActiveByFilter})</h5>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {loadingVouchers ? (
                <div className="p-4 text-center text-slate-500">Loading...</div>
              ) : activeVouchers.length === 0 ? (
                <div className="p-4 text-center text-slate-500">No active vouchers</div>
              ) : (
                activeVouchers
                  .filter((row) => row.serialNumber !== deletingSerial)
                  .map((row) => (
                    <div key={row.serialNumber} className="p-3 border rounded-lg border-emerald-200 bg-emerald-50/50">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 break-all">{getFormattedVoucherLine(row)}</p>
                          <p className="text-xs text-slate-500">{row.serialNumber} | UC {row.ucCategory}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.serialNumber)}
                          disabled={deletingSerial === row.serialNumber}
                          className="px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50 shrink-0"
                        >
                          {deletingSerial === row.serialNumber ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Used codes column */}
          <div>
            <h5 className="mb-2 text-sm font-semibold text-slate-600">Used ({totalUsedByFilter})</h5>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {loadingVouchers ? (
                <div className="p-4 text-center text-slate-500">Loading...</div>
              ) : usedVouchers.length === 0 ? (
                <div className="p-4 text-center text-slate-500">No used vouchers</div>
              ) : (
                usedVouchers
                  .filter((row) => row.serialNumber !== deletingSerial)
                  .map((row) => (
                    <div key={row.serialNumber} className="p-3 border rounded-lg border-slate-200 bg-slate-50">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-700 break-all">{getFormattedVoucherLine(row)}</p>
                          <p className="text-xs text-slate-500">
                            {row.serialNumber} | UC {row.ucCategory}
                            {row.usedBy?.userEmail && ` • ${row.usedBy.userEmail}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.serialNumber)}
                          disabled={deletingSerial === row.serialNumber}
                          className="px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50 shrink-0"
                        >
                          {deletingSerial === row.serialNumber ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminVoucher;

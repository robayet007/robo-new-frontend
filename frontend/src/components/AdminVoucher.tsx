import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { voucherApi, type VoucherBulkUploadSummary, type VoucherCodeRow } from '../services/api';

const UC_CATEGORIES = ['20', '36', '80', '160', '161', '162', '405', '800', '810', '1625', '2000'];

function AdminVoucher() {
  const { showToast } = useToast();
  const [bulkText, setBulkText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'used'>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [vouchers, setVouchers] = useState<VoucherCodeRow[]>([]);
  const [stats, setStats] = useState<Record<string, { active: number; used: number; total: number }>>({});
  const [summary, setSummary] = useState<VoucherBulkUploadSummary | null>(null);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingSerial, setDeletingSerial] = useState<string | null>(null);

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
      const response = await voucherApi.getAll({
        status: statusFilter,
        ucCategory: categoryFilter === 'all' ? undefined : categoryFilter,
        limit: 300,
      });
      if (response.success && Array.isArray(response.data)) {
        setVouchers(response.data);
      } else {
        setVouchers([]);
        showToast({ type: 'error', text: response.message || 'Failed to load vouchers' });
      }
    } catch (error: any) {
      setVouchers([]);
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
  }, [statusFilter, categoryFilter]);

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

        // Immediate UI update without waiting for network reload.
        if (insertedRows.length > 0) {
          const filteredRows = insertedRows.filter((row) => {
            if (statusFilter !== row.status) return false;
            if (categoryFilter !== 'all' && row.ucCategory !== categoryFilter) return false;
            return true;
          });
          if (filteredRows.length > 0) {
            setVouchers((prev) => {
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

    const target = vouchers.find((v) => v.serialNumber === serialNumber);
    setDeletingSerial(serialNumber);
    try {
      // Optimistic remove for instant UX.
      setVouchers((prev) => prev.filter((v) => v.serialNumber !== serialNumber));
      if (target) {
        applyStatsDelta([target], 'sub');
      }

      const response = await voucherApi.delete(serialNumber);
      if (response.success) {
        showToast({ type: 'success', text: 'Voucher deleted successfully' });
      } else {
        // Rollback on failure.
        if (target) {
          setVouchers((prev) => [target, ...prev]);
          applyStatsDelta([target], 'add');
        }
        showToast({ type: 'error', text: response.message || 'Failed to delete voucher' });
      }
    } catch (error: any) {
      // Rollback on failure.
      if (target) {
        setVouchers((prev) => [target, ...prev]);
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

  const getFormattedVoucherLine = (row: VoucherCodeRow) =>
    `${(row.sourcePrefix || '').trim()} ${(row.code || '').trim()}`.trim();

  return (
    <div className="pt-4 pb-4 pl-0 pr-4 space-y-6 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
      <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
        <h3 className="mb-2 text-lg font-bold text-slate-900">Voucher UC Bulk Upload</h3>
        <p className="text-sm text-slate-600">
          Bulk code paste করুন। System auto-detect করে UC category অনুযায়ী active voucher add করবে।
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
        <h4 className="mb-3 text-base font-bold text-slate-900">UC Category Snapshot</h4>
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
          <div>
            <h4 className="text-base font-bold text-slate-900">Active Voucher Codes</h4>
            <p className="text-xs text-slate-500">Filtered active count: {totalActiveByFilter}</p>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'active' | 'used')}
              className="px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
            >
              <option value="active">Active</option>
              <option value="used">Used</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
            >
              <option value="all">All Categories</option>
              {UC_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  UC {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {loadingVouchers ? (
            <div className="p-6 text-center text-slate-500">Loading vouchers...</div>
          ) : vouchers.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No vouchers found for selected filter.</div>
          ) : (
            vouchers
              .filter((row) => row.serialNumber !== deletingSerial)
              .map((row) => (
              <div key={row.serialNumber} className="p-3 border rounded-lg border-slate-200 bg-slate-50">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 break-all">{getFormattedVoucherLine(row)}</p>
                    <p className="text-xs text-slate-500">
                      {row.serialNumber} | UC {row.ucCategory}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(row.serialNumber)}
                    disabled={deletingSerial === row.serialNumber}
                    className="px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50"
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
  );
}

export default AdminVoucher;

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import useCatalog from '../hooks/useCatalog';
import { categoryApi, dealApi, voucherApi } from '../services/api';
import type { BackendDeal } from '../types';
import ImageUpload from './ImageUpload';
import { useToast } from '../contexts/ToastContext';
import { getImageUrl } from '../utils/imageUrl';

type SubTab = 'deals' | 'categories' | 'products';

const themeBtnStyle = {
  background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`,
};
const themeBtnHover = (e: React.MouseEvent<HTMLButtonElement>, enter: boolean) => {
  (e.currentTarget as HTMLButtonElement).style.background = enter
    ? `linear-gradient(135deg, var(--theme-primary-hover), var(--theme-secondary-dark))`
    : `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`;
};

export default function AdminProducts() {
  const {
    categories,
    products,
    addCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    refresh,
  } = useCatalog();
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<SubTab>('categories');

  // Category form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catBadge, setCatBadge] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catDealId, setCatDealId] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<any[]>([]);

  // Product form
  const [name, setName] = useState('');
  const [ucCategoryQuantities, setUcCategoryQuantities] = useState<Array<{ ucCategory: string; quantity: number }>>([{ ucCategory: '', quantity: 1 }]);
  const [price, setPrice] = useState('');
  const [resellerPrice, setResellerPrice] = useState('');
  const [bonus, setBonus] = useState('');
  const [tag, setTag] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  // UC categories from voucher stats
  const [ucCategories, setUcCategories] = useState<string[]>([]);

  // Deals
  const [deals, setDeals] = useState<BackendDeal[]>([]);
  const [dealName, setDealName] = useState('');
  const [dealDesc, setDealDesc] = useState('');
  const [dealOrder, setDealOrder] = useState('0');
  const [editingDeal, setEditingDeal] = useState<string | null>(null);

  const addUcCategoryRow = () => setUcCategoryQuantities((prev) => [...prev, { ucCategory: '', quantity: 1 }]);
  const removeUcCategoryRow = (idx: number) =>
    setUcCategoryQuantities((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  const updateUcCategoryRow = (idx: number, field: 'ucCategory' | 'quantity', value: string | number) =>
    setUcCategoryQuantities((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: field === 'quantity' ? Math.max(1, Number(value) || 1) : value } : r))
    );

  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        const aVal = (a.ucCategoryQuantities?.length ? a.ucCategoryQuantities.map((x) => x.ucCategory).join(',') : null) ?? a.ucCategory ?? a.diamonds ?? '';
        const bVal = (b.ucCategoryQuantities?.length ? b.ucCategoryQuantities.map((x) => x.ucCategory).join(',') : null) ?? b.ucCategory ?? b.diamonds ?? '';
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return aVal.localeCompare(bVal) || (a.name || '').localeCompare(b.name || '');
      }),
    [products]
  );

  const loadAllCategories = async () => {
    try {
      const res = await categoryApi.getAllForAdmin();
      if (res.success && Array.isArray(res.data)) setAllCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadDeals = async () => {
    try {
      const res = await dealApi.getAll();
      if (res.success && Array.isArray(res.data)) setDeals(res.data);
    } catch (err) {
      console.error('Failed to load deals:', err);
    }
  };

  const loadUcCategories = async () => {
    try {
      const res = await voucherApi.getStats();
      if (res.success && res.data?.categories) setUcCategories(res.data.categories);
    } catch (err) {
      console.error('Failed to load UC categories:', err);
    }
  };

  useEffect(() => {
    loadAllCategories();
    loadDeals();
    loadUcCategories();
  }, []);

  useEffect(() => {
    if (!categoryId && categories[0]?.id) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  // Deal handlers
  const handleAddDeal = async (e: FormEvent) => {
    e.preventDefault();
    if (!dealName.trim()) {
      showToast({ type: 'error', text: 'Deal name is required' });
      return;
    }
    try {
      const res = await dealApi.create({
        id: crypto.randomUUID(),
        name: dealName.trim(),
        description: dealDesc.trim() || undefined,
        displayOrder: Number(dealOrder) || 0,
        isActive: true,
      });
      if (res.success) {
        showToast({ type: 'success', text: 'Deal created!' });
        setDealName('');
        setDealDesc('');
        setDealOrder('0');
        await loadDeals();
      } else showToast({ type: 'error', text: res.message || 'Failed' });
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed' });
    }
  };

  const handleUpdateDeal = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDeal || !dealName.trim()) return;
    try {
      const res = await dealApi.update(editingDeal, {
        name: dealName.trim(),
        description: dealDesc.trim() || undefined,
        displayOrder: Number(dealOrder) || 0,
      });
      if (res.success) {
        showToast({ type: 'success', text: 'Deal updated!' });
        setEditingDeal(null);
        setDealName('');
        setDealDesc('');
        setDealOrder('0');
        await loadDeals();
      } else showToast({ type: 'error', text: res.message || 'Failed' });
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed' });
    }
  };

  const handleRemoveDeal = async (id: string) => {
    if (!window.confirm('Delete this deal? Categories will be unassigned.')) return;
    try {
      const res = await dealApi.delete(id);
      if (res.success) {
        showToast({ type: 'success', text: 'Deal deleted!' });
        await loadDeals();
        await loadAllCategories();
      } else showToast({ type: 'error', text: res.message || 'Failed' });
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed' });
    }
  };

  // Category handlers
  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast({ type: 'error', text: 'Category name is required' });
      return;
    }
    const result = await addCategory({
      name: catName.trim(),
      description: catDesc.trim() || undefined,
      badge: catBadge.trim() || undefined,
      image: catImage.trim() || undefined,
      dealId: catDealId || undefined,
    });
    if (result.success) {
      showToast({ type: 'success', text: 'Category added!' });
      setCatName('');
      setCatDesc('');
      setCatBadge('');
      setCatImage('');
      setCatDealId('');
      await loadAllCategories();
    } else showToast({ type: 'error', text: result.error || 'Failed' });
  };

  const handleUpdateCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !catName.trim()) return;
    try {
      const res = await categoryApi.update(editingCategory, {
        name: catName.trim(),
        description: catDesc.trim() || undefined,
        badge: catBadge.trim() || undefined,
        image: catImage.trim() || undefined,
        dealId: catDealId || undefined,
      });
      if (res.success) {
        showToast({ type: 'success', text: 'Category updated!' });
        setEditingCategory(null);
        setCatName('');
        setCatDesc('');
        setCatBadge('');
        setCatImage('');
        setCatDealId('');
        await loadAllCategories();
        refresh();
      } else showToast({ type: 'error', text: res.message || 'Failed' });
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed' });
    }
  };

  const handleRemoveCategory = async (id: string) => {
    if (!window.confirm('Permanently delete this category and all its products?')) return;
    const result = await deleteCategory(id);
    if (result.success) {
      showToast({ type: 'success', text: 'Category deleted!' });
      await loadAllCategories();
    } else showToast({ type: 'error', text: result.error || 'Failed' });
  };

  const handleToggleCategoryActive = async (id: string, current: boolean) => {
    try {
      const res = await categoryApi.update(id, { isActive: !current });
      if (res.success) {
        showToast({ type: 'success', text: `Category ${!current ? 'activated' : 'deactivated'}!` });
        await loadAllCategories();
        refresh();
      } else showToast({ type: 'error', text: res.message || 'Failed' });
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed' });
    }
  };

  const handleAssignCategoryToDeal = async (catId: string, dealId: string | null) => {
    try {
      const res = await categoryApi.update(catId, { dealId });
      if (res.success) {
        showToast({ type: 'success', text: 'Deal assigned!' });
        await loadAllCategories();
        refresh();
      } else showToast({ type: 'error', text: res.message || 'Failed' });
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed' });
    }
  };

  // Product handlers
  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId) {
      showToast({ type: 'error', text: 'Name, price and category required' });
      return;
    }
    const validRows = ucCategoryQuantities.filter((r) => r.ucCategory && r.quantity >= 1);
    const result = await addProduct({
      name: name.trim(),
      categoryId,
      diamonds: validRows.length ? validRows.map((r) => `${r.ucCategory}x${r.quantity}`).join(', ') : '',
      ucCategoryQuantities: validRows.length ? validRows : [],
      price: Number(price),
      resellerPrice: resellerPrice ? Number(resellerPrice) : undefined,
      bonus: bonus.trim() || undefined,
      tag: tag.trim() || undefined,
    });
    if (result.success) {
      showToast({ type: 'success', text: 'Product added!' });
      setName('');
      setUcCategoryQuantities([{ ucCategory: '', quantity: 1 }]);
      setPrice('');
      setResellerPrice('');
      setBonus('');
      setTag('');
    } else showToast({ type: 'error', text: result.error || 'Failed' });
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !name || !price || !categoryId) return;
    const validRows = ucCategoryQuantities.filter((r) => r.ucCategory && r.quantity >= 1);
    const result = await updateProduct(editingProduct, {
      name: name.trim(),
      categoryId,
      diamonds: validRows.length ? validRows.map((r) => `${r.ucCategory}x${r.quantity}`).join(', ') : '',
      ucCategoryQuantities: validRows.length ? validRows : [],
      price: Number(price),
      resellerPrice: resellerPrice ? Number(resellerPrice) : undefined,
      bonus: bonus.trim() || undefined,
      tag: tag.trim() || undefined,
    });
    if (result.success) {
      showToast({ type: 'success', text: 'Product updated!' });
      setEditingProduct(null);
      setName('');
      setUcCategoryQuantities([{ ucCategory: '', quantity: 1 }]);
      setPrice('');
      setResellerPrice('');
      setBonus('');
      setTag('');
      setCategoryId(categories[0]?.id ?? '');
    } else showToast({ type: 'error', text: result.error || 'Failed' });
  };

  const handleRemoveProduct = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    const result = await deleteProduct(id);
    if (result.success) {
      showToast({ type: 'success', text: 'Product deleted!' });
      if (editingProduct === id) setEditingProduct(null);
    } else showToast({ type: 'error', text: result.error || 'Failed' });
  };

  const subTabs: { id: SubTab; label: string }[] = [
    { id: 'deals', label: 'Deals' },
    { id: 'categories', label: 'Categories' },
    { id: 'products', label: 'Products' },
  ];

  return (
    <div className="pt-4 pb-4 pl-0 pr-4 sm:pt-5 sm:pr-5 sm:pb-5 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500">Categories</p>
            <p className="text-xl font-bold text-slate-900">{categories.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Products</p>
            <p className="text-xl font-bold text-slate-900">{products.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Deals</p>
            <p className="text-xl font-bold text-slate-900">{deals.length}</p>
          </div>
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {subTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                subTab === t.id
                  ? 'text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
              style={subTab === t.id ? themeBtnStyle : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deals tab */}
      {subTab === 'deals' && (
        <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Deal Management</h3>
          <form
            className="p-4 mb-6 rounded-lg border border-slate-200 bg-slate-50"
            onSubmit={editingDeal ? handleUpdateDeal : handleAddDeal}
          >
            <h4 className="mb-3 text-base font-semibold text-slate-700">
              {editingDeal ? 'Edit Deal' : 'Add New Deal'}
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Deal Name *</span>
                <input
                  required
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  placeholder="Regular Offers"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Description</span>
                <input
                  value={dealDesc}
                  onChange={(e) => setDealDesc(e.target.value)}
                  placeholder="Regular top-up offers"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Display Order</span>
                <input
                  type="number"
                  value={dealOrder}
                  onChange={(e) => setDealOrder(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                />
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 font-semibold text-white rounded-xl transition-all"
                style={themeBtnStyle}
                onMouseEnter={(e) => themeBtnHover(e, true)}
                onMouseLeave={(e) => themeBtnHover(e, false)}
              >
                {editingDeal ? 'Update Deal' : 'Add Deal'}
              </button>
              {editingDeal && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDeal(null);
                    setDealName('');
                    setDealDesc('');
                    setDealOrder('0');
                  }}
                  className="px-4 py-2 font-semibold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          <div>
            <h4 className="mb-3 text-base font-semibold text-slate-700">Existing Deals ({deals.length})</h4>
            <div className="space-y-2">
              {deals.length > 0 ? (
                deals.map((deal) => (
                  <div key={deal.id} className="flex items-start justify-between gap-4 p-4 border rounded-lg border-slate-200 hover:bg-slate-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-slate-900">{deal.name}</strong>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          Order: {deal.displayOrder}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{deal.description || 'No description'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDeal(deal.id);
                          setDealName(deal.name);
                          setDealDesc(deal.description || '');
                          setDealOrder(String(deal.displayOrder ?? 0));
                        }}
                        className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeal(deal.id)}
                        className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">No deals yet. Create your first deal.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Categories tab */}
      {subTab === 'categories' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <form
            className="p-4 border rounded-xl border-slate-200 bg-slate-50 sm:p-5 md:p-6"
            onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}
          >
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h3>
            <div className="space-y-4">
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Name *</span>
                <input
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Diamond TopUp"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Badge</span>
                <input
                  value={catBadge}
                  onChange={(e) => setCatBadge(e.target.value)}
                  placeholder="Hot"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Description</span>
                <input
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Fast delivery packs"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                />
              </label>
              <ImageUpload
                label="Category Image"
                value={catImage}
                onChange={setCatImage}
                uploadEndpoint="/upload/category-image"
              />
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Deal</span>
                <select
                  value={catDealId}
                  onChange={(e) => setCatDealId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                >
                  <option value="">Select a Deal</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-3 font-semibold text-white rounded-xl transition-all"
                style={themeBtnStyle}
                onMouseEnter={(e) => themeBtnHover(e, true)}
                onMouseLeave={(e) => themeBtnHover(e, false)}
              >
                {editingCategory ? 'Update' : 'Add Category'}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setCatName('');
                    setCatDesc('');
                    setCatBadge('');
                    setCatImage('');
                    setCatDealId('');
                  }}
                  className="px-4 py-3 font-semibold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          <div className="p-4 bg-white border rounded-xl border-slate-200 sm:p-5 md:p-6">
            <h3 className="mb-4 text-base font-bold text-slate-900">Categories ({allCategories.length})</h3>
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {allCategories.length > 0 ? (
                allCategories.map((cat) => {
                  const isActive = cat.isActive !== false;
                  return (
                    <div
                      key={cat.id}
                      className={`p-4 border rounded-lg ${isActive ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50'} hover:bg-slate-50`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <strong className={isActive ? 'text-slate-900' : 'text-slate-700'}>{cat.name}</strong>
                            {cat.badge && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                                {cat.badge}
                              </span>
                            )}
                            {!isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-semibold">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 truncate">{cat.description || 'No description'}</p>
                          {cat.image && (
                            <img
                              src={getImageUrl(cat.image)}
                              alt={cat.name}
                              className="mt-2 object-cover w-12 h-12 rounded-lg border border-slate-200"
                              onError={(e) => {(e.target as HTMLImageElement).style.display = 'none';}}
                            />
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <select
                            value={cat.dealId || ''}
                            onChange={(e) => handleAssignCategoryToDeal(cat.id, e.target.value || null)}
                            className="px-2 py-1 text-xs border rounded-lg border-slate-300"
                          >
                            <option value="">Deal</option>
                            {deals.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={() => handleToggleCategoryActive(cat.id, isActive)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(cat.id);
                                setCatName(cat.name);
                                setCatDesc(cat.description || '');
                                setCatBadge(cat.badge || '');
                                setCatImage(cat.image || '');
                                setCatDealId(cat.dealId || '');
                              }}
                              className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cat.id)}
                              className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500">No categories yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products tab */}
      {subTab === 'products' && (
        <div className="space-y-6">
          <form
            className="product-form p-4 border rounded-xl border-slate-200 bg-slate-50 sm:p-5 md:p-6"
            onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              {editingProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setName('');
                    setUcCategoryQuantities([{ ucCategory: '', quantity: 1 }]);
                    setPrice('');
                    setResellerPrice('');
                    setBonus('');
                    setTag('');
                    setCategoryId(categories[0]?.id ?? '');
                  }}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Category *</span>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Product Name *</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="50 Diamonds"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                />
              </label>
              <div className="block sm:col-span-2 lg:col-span-3">
                <span className="block mb-2 text-sm font-semibold text-slate-700">UC Categories & Quantities</span>
                <p className="mb-2 text-xs text-slate-500">Add rows for each UC category and quantity. Product will use codes from these categories for auto top-up.</p>
                <div className="space-y-2">
                  {ucCategoryQuantities.map((row, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2">
                      <select
                        value={row.ucCategory}
                        onChange={(e) => updateUcCategoryRow(idx, 'ucCategory', e.target.value)}
                        className="flex-1 min-w-[120px] px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                      >
                        <option value="">Select UC category</option>
                        {ucCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat} UC</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) => updateUcCategoryRow(idx, 'quantity', e.target.value)}
                        className="w-20 px-3 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                        placeholder="Qty"
                      />
                      <button
                        type="button"
                        onClick={() => removeUcCategoryRow(idx)}
                        className="px-3 py-2 text-sm font-semibold rounded-xl bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addUcCategoryRow}
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300"
                  >
                    + Add row
                  </button>
                </div>
              </div>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Price (৳) *</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="45"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Reseller Price (৳)</span>
                <input
                  type="number"
                  min="0"
                  value={resellerPrice}
                  onChange={(e) => setResellerPrice(e.target.value)}
                  placeholder="40"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Bonus</span>
                <input
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="+10 bonus"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Tag</span>
                <input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Hot"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2"
                />
              </label>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 mt-4 font-semibold text-white rounded-xl transition-all"
              style={themeBtnStyle}
              onMouseEnter={(e) => themeBtnHover(e, true)}
              onMouseLeave={(e) => themeBtnHover(e, false)}
            >
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </form>

          <div className="p-4 bg-white border rounded-xl border-slate-200 sm:p-5 md:p-6">
            <h3 className="mb-4 text-base font-bold text-slate-900">Products ({sortedProducts.length})</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {sortedProducts.length > 0 ? (
                sortedProducts.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 p-4 border rounded-lg border-slate-200 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <strong className="text-slate-900">{item.name}</strong>
                        {item.tag && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold">
                            {item.tag}
                          </span>
                        )}
                        {item.bonus && (
                          <span className="text-xs font-semibold text-violet-600">({item.bonus})</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                        <span>{categories.find((c) => c.id === item.categoryId)?.name || '-'}</span>
                        <span>
                          {item.ucCategoryQuantities?.length
                            ? `UC: ${item.ucCategoryQuantities.map((x) => `${x.ucCategory}x${x.quantity}`).join(', ')}`
                            : item.ucCategory
                              ? `UC: ${item.ucCategory}`
                              : `Diamonds: ${item.diamonds || 'Special'}`}
                        </span>
                        <span className="font-bold text-slate-900">৳{item.price}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(item.id);
                          setName(item.name);
                          setUcCategoryQuantities(
                            item.ucCategoryQuantities?.length
                              ? item.ucCategoryQuantities.map((x) => ({ ucCategory: x.ucCategory, quantity: x.quantity >= 1 ? x.quantity : 1 }))
                              : item.ucCategory
                                ? [{ ucCategory: item.ucCategory, quantity: 1 }]
                                : [{ ucCategory: '', quantity: 1 }]
                          );
                          setPrice(String(item.price));
                          setResellerPrice(item.resellerPrice?.toString() || '');
                          setBonus(item.bonus || '');
                          setTag(item.tag || '');
                          setCategoryId(item.categoryId);
                          document.querySelector('.product-form')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-4 py-2 text-sm font-semibold text-white rounded-lg"
                        style={themeBtnStyle}
                        onMouseEnter={(e) => themeBtnHover(e, true)}
                        onMouseLeave={(e) => themeBtnHover(e, false)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(item.id)}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">No products yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

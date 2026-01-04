import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import useCatalog from '../hooks/useCatalog';
import { categoryApi, dealApi } from '../services/api';
import type { BackendDeal } from '../types';
import UserManagement from './UserManagement';
import AdminOrders from './AdminOrders';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';

type TabType = 'dashboard' | 'products' | 'users' | 'orders';

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const { 
    categories, 
    products, 
    loading,
    error,
    addCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    refresh,
    retry 
  } = useCatalog();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catBadge, setCatBadge] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catDealId, setCatDealId] = useState<string>('');
  const [name, setName] = useState('');
  const [diamonds, setDiamonds] = useState('');
  const [price, setPrice] = useState('');
  const [bonus, setBonus] = useState('');
  const [tag, setTag] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [deals, setDeals] = useState<BackendDeal[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [dealName, setDealName] = useState('');
  const [dealDesc, setDealDesc] = useState('');
  const [dealOrder, setDealOrder] = useState('0');
  const [editingDeal, setEditingDeal] = useState<string | null>(null);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => {
      // Try numeric comparison first, fallback to string comparison
      const aDiamonds = a.diamonds || '';
      const bDiamonds = b.diamonds || '';
      const aName = a.name || '';
      const bName = b.name || '';
      
      const aNum = Number(aDiamonds);
      const bNum = Number(bDiamonds);
      if (!isNaN(aNum) && !isNaN(bNum) && aDiamonds !== '' && bDiamonds !== '') {
        return aNum - bNum || aName.localeCompare(bName);
      }
      return aDiamonds.localeCompare(bDiamonds) || aName.localeCompare(bName);
    }),
    [products],
  );

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Load all categories (including inactive) for admin
  const loadAllCategories = async () => {
    try {
      const response = await categoryApi.getAllForAdmin();
      if (response.success && Array.isArray(response.data)) {
        setAllCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to load all categories:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      loadAllCategories();
      loadDeals();
    }
  }, [activeTab]);

  // Also load when component mounts
  useEffect(() => {
    loadAllCategories();
    loadDeals();
  }, []);

  // Load deals
  const loadDeals = async () => {
    try {
      console.log('Loading deals...');
      const response = await dealApi.getAll();
      console.log('Deals API response:', response);
      if (response.success && Array.isArray(response.data)) {
        console.log('Deals loaded:', response.data);
        setDeals(response.data);
      } else {
        console.error('Failed to load deals - API response:', response);
      }
    } catch (err) {
      console.error('Failed to load deals:', err);
    }
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setMessage({ type: 'error', text: 'Category name is required' });
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
      setMessage({ type: 'success', text: 'Category added to database!' });
      setCatName('');
      setCatDesc('');
      setCatBadge('');
      setCatImage('');
      setCatDealId('');
      if (!categoryId) setCategoryId(result.data!.id);
      // Reload all categories to show the new one
      await loadAllCategories();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to add category' });
    }
  };

  const handleRemoveCategory = async (id: string) => {
    if (!window.confirm('Are you sure? This will permanently delete the category and all its products from the database.')) {
      return;
    }

    const result = await deleteCategory(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Category permanently deleted from database!' });
      // Reload all categories
      await loadAllCategories();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete category' });
    }
  };

  const handleToggleCategoryActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await categoryApi.update(id, { isActive: !currentStatus });
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: `Category ${!currentStatus ? 'activated' : 'deactivated'} successfully!` 
        });
        // Reload all categories to show updated status
        await loadAllCategories();
        refresh(); // Refresh to update frontend display for regular users
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update category status' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update category status' });
    }
  };

  const handleAddDeal = async (e: FormEvent) => {
    e.preventDefault();
    if (!dealName.trim()) {
      setMessage({ type: 'error', text: 'Deal name is required' });
      return;
    }

    try {
      const dealId = crypto.randomUUID();
      const response = await dealApi.create({
        id: dealId,
        name: dealName.trim(),
        description: dealDesc.trim() || undefined,
        displayOrder: Number(dealOrder) || 0,
        isActive: true,
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Deal created successfully!' });
        setDealName('');
        setDealDesc('');
        setDealOrder('0');
        // Reload deals after creating
        await loadDeals();
        console.log('Deal created, reloading deals...');
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to create deal' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to create deal' });
    }
  };

  const handleEditDeal = (deal: BackendDeal) => {
    setEditingDeal(deal.id);
    setDealName(deal.name);
    setDealDesc(deal.description || '');
    setDealOrder(deal.displayOrder.toString());
  };

  const handleCancelDealEdit = () => {
    setEditingDeal(null);
    setDealName('');
    setDealDesc('');
    setDealOrder('0');
  };

  const handleUpdateDeal = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDeal || !dealName.trim()) {
      setMessage({ type: 'error', text: 'Deal name is required' });
      return;
    }

    try {
      const response = await dealApi.update(editingDeal, {
        name: dealName.trim(),
        description: dealDesc.trim() || undefined,
        displayOrder: Number(dealOrder) || 0,
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Deal updated successfully!' });
        handleCancelDealEdit();
        await loadDeals();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update deal' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update deal' });
    }
  };

  const handleRemoveDeal = async (id: string) => {
    if (!window.confirm('Are you sure? Categories in this deal will be unassigned.')) {
      return;
    }

    try {
      const response = await dealApi.delete(id);
      if (response.success) {
        setMessage({ type: 'success', text: 'Deal deleted successfully!' });
        await loadDeals();
        await loadAllCategories();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to delete deal' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to delete deal' });
    }
  };

  const handleAssignCategoryToDeal = async (categoryId: string, dealId: string | null) => {
    try {
      const response = await categoryApi.update(categoryId, { dealId });
      if (response.success) {
        setMessage({ type: 'success', text: 'Category assigned to deal successfully!' });
        await loadAllCategories();
        refresh();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to assign category' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to assign category' });
    }
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat.id);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCatBadge(cat.badge || '');
    setCatImage(cat.image || '');
    setCatDealId(cat.dealId || '');
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setCatBadge('');
    setCatImage('');
    setCatDealId('');
  };

  const handleUpdateCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !catName.trim()) {
      setMessage({ type: 'error', text: 'Category name is required' });
      return;
    }

    try {
      const response = await categoryApi.update(editingCategory, {
        name: catName.trim(),
        description: catDesc.trim() || undefined,
        badge: catBadge.trim() || undefined,
        image: catImage.trim() || undefined,
        dealId: catDealId || undefined,
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Category updated successfully!' });
        handleCancelCategoryEdit();
        await loadAllCategories();
        refresh();
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update category' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update category' });
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId) {
      setMessage({ type: 'error', text: 'Product name, price and category are required' });
      return;
    }

    const result = await addProduct({
      name: name.trim(),
      categoryId,
      diamonds: diamonds.trim() || '',
      price: Number(price),
      bonus: bonus.trim() || undefined,
      tag: tag.trim() || undefined,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Product added to database!' });
      setName('');
      setDiamonds('');
      setPrice('');
      setBonus('');
      setTag('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to add product' });
    }
  };

  const handleEditProduct = (product: typeof products[0]) => {
    setEditingProduct(product.id);
    setName(product.name);
    setDiamonds(product.diamonds);
    setPrice(product.price.toString());
    setBonus(product.bonus || '');
    setTag(product.tag || '');
    setCategoryId(product.categoryId);
    // Scroll to form
    setTimeout(() => {
      document.querySelector('.product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setName('');
    setDiamonds('');
    setPrice('');
    setBonus('');
    setTag('');
    setCategoryId(categories[0]?.id ?? '');
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !name || !price || !categoryId) {
      setMessage({ type: 'error', text: 'Product name, price and category are required' });
      return;
    }

    const result = await updateProduct(editingProduct, {
      name: name.trim(),
      categoryId,
      diamonds: diamonds.trim() || '',
      price: Number(price),
      bonus: bonus.trim() || undefined,
      tag: tag.trim() || undefined,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Product updated in database!' });
      handleCancelEdit();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update product' });
    }
  };

  const handleRemoveProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    const result = await deleteProduct(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Product deleted from database!' });
      if (editingProduct === id) {
        handleCancelEdit();
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete product' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-400 rounded-full border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <div className="p-0">
          {/* Header */}
          <div className="mb-4 pt-4 pr-4 pb-4 pl-0 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'products' && 'Products & Categories'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'orders' && 'Order History'}
            </h1>
            <p className="text-sm text-slate-600">
              {activeTab === 'dashboard' && 'Overview of your business metrics and analytics'}
              {activeTab === 'products' && 'Manage products and categories'}
              {activeTab === 'users' && 'Manage users and their balances'}
              {activeTab === 'orders' && 'View and manage all orders'}
            </p>
            {error && (
              <div className="p-3 mt-3 border border-red-200 rounded-lg bg-red-50">
                <p className="text-sm text-red-600">{error}</p>
                <button 
                  className="px-3 py-1 mt-2 text-sm font-semibold text-red-700 transition-all bg-red-100 rounded-lg hover:bg-red-200" 
                  onClick={retry}
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-xl mb-4 mr-4 sm:mr-5 md:mr-6 ml-0 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <p className="font-semibold">{message.text}</p>
            </div>
          )}

          {/* Tab Content */}
          <div className="px-0">
            {activeTab === 'dashboard' ? (
              <AdminDashboard />
            ) : activeTab === 'users' ? (
              <UserManagement />
            ) : activeTab === 'orders' ? (
              <AdminOrders />
            ) : (
        <div className="space-y-6 pt-4 pr-4 pb-4 pl-0 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">

          {/* Deal Management Section */}
          <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Deal Management</h3>
            
            {/* Add/Edit Deal Form */}
            <form 
              className="mb-6 p-4 border rounded-lg bg-slate-50 border-slate-200" 
              onSubmit={editingDeal ? handleUpdateDeal : handleAddDeal}
            >
              <h4 className="mb-3 text-base font-semibold text-slate-700">
                {editingDeal ? 'Edit Deal' : 'Add New Deal'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Deal Name *</span>
                  <input
                    required
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    placeholder="Regular Offers"
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </label>
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Description (optional)</span>
                  <input
                    value={dealDesc}
                    onChange={(e) => setDealDesc(e.target.value)}
                    placeholder="Regular top-up offers"
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </label>
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Display Order</span>
                  <input
                    type="number"
                    value={dealOrder}
                    onChange={(e) => setDealOrder(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </label>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  className="px-4 py-2 font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700" 
                  type="submit"
                >
                  {editingDeal ? 'Update Deal' : 'Add Deal'}
                </button>
                {editingDeal && (
                  <button 
                    type="button"
                    onClick={handleCancelDealEdit}
                    className="px-4 py-2 font-semibold transition-all bg-slate-200 rounded-xl text-slate-700 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Deals List */}
            <div>
              <h4 className="mb-3 text-base font-semibold text-slate-700">
                Existing Deals ({deals.length})
              </h4>
              <div className="space-y-2">
                {deals.length > 0 ? (
                  deals.map((deal) => (
                    <div key={deal.id} className="p-4 transition-colors border rounded-lg border-slate-200 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <strong className="text-slate-900">{deal.name}</strong>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                              Order: {deal.displayOrder}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{deal.description || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-200 transition-all" 
                            onClick={() => handleEditDeal(deal)}
                          >
                            Edit
                          </button>
                          <button 
                            className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-all" 
                            onClick={() => handleRemoveDeal(deal.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    No deals yet. Create your first deal.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products & Categories Content */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-6">
            <form className="p-4 border sm:p-5 md:p-6 rounded-xl border-slate-200 bg-slate-50" onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}>
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
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </label>
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Badge (optional)</span>
                  <input
                    value={catBadge}
                    onChange={(e) => setCatBadge(e.target.value)}
                    placeholder="Hot"
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </label>
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Description (optional)</span>
                  <input
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Fast delivery packs"
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </label>
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Image URL (optional)</span>
                  <input
                    type="url"
                    value={catImage}
                    onChange={(e) => setCatImage(e.target.value)}
                    placeholder="https://example.com/image.jpg or /image.jpg"
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  {catImage && (
                    <div className="mt-2">
                      <img 
                        src={catImage} 
                        alt="Preview" 
                        className="w-20 h-20 object-cover rounded-lg border border-slate-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </label>
                <label className="block">
                  <span className="block mb-2 text-sm font-semibold text-slate-700">Deal (optional)</span>
                  <select
                    value={catDealId}
                    onChange={(e) => setCatDealId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="">Select a Deal</option>
                    {deals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  className="flex-1 px-4 py-3 font-semibold text-white transition-all shadow-lg rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-purple-500/30" 
                  type="submit"
                >
                  {editingCategory ? 'Update Category' : 'Add Category to Database'}
                </button>
                {editingCategory && (
                  <button 
                    type="button"
                    onClick={handleCancelCategoryEdit}
                    className="px-4 py-3 font-semibold transition-all bg-slate-200 rounded-xl text-slate-700 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
              <h3 className="mb-3 text-base font-bold sm:text-lg text-slate-900 sm:mb-4">Categories List</h3>
              <div className="space-y-2">
                {allCategories.length > 0 ? (
                  allCategories.map((cat) => {
                    const isActive = cat.isActive !== false; // Default to true if not set
                    return (
                      <div key={cat.id} className={`p-4 transition-colors border rounded-lg ${
                        isActive ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50'
                      } hover:bg-slate-50`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <strong className={isActive ? 'text-slate-900' : 'text-slate-700'}>
                                {cat.name}
                              </strong>
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
                            <p className={`text-sm ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                              {cat.description || 'No description'}
                            </p>
                            {cat.image && (
                              <div className="mt-2">
                                <img 
                                  src={cat.image} 
                                  alt={cat.name}
                                  className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {/* Deal Assignment */}
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-semibold text-slate-600">Deal:</label>
                              <select
                                value={cat.dealId || ''}
                                onChange={(e) => handleAssignCategoryToDeal(cat.id, e.target.value || null)}
                                className="px-2 py-1 text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                              >
                                <option value="">Select a Deal</option>
                                {deals.map((deal) => (
                                  <option key={deal.id} value={deal.id}>
                                    {deal.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Toggle Switch and Delete */}
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col items-center gap-1">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={() => handleToggleCategoryActive(cat.id, isActive)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                                <span className="text-[10px] text-slate-500">
                                  {isActive ? 'ON' : 'OFF'}
                                </span>
                              </div>
                              <button 
                                className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-200 transition-all" 
                                onClick={() => handleEditCategory(cat)}
                              >
                                Edit
                              </button>
                              <button 
                                className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-all" 
                                onClick={() => handleRemoveCategory(cat.id)}
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
                  <div className="p-8 text-center text-slate-500">
                    No categories yet. Add your first category.
                  </div>
                )}
              </div>
            </div>
          </div>

          <form className="p-4 border product-form sm:p-5 md:p-6 rounded-xl border-slate-200 bg-slate-50" onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base font-bold sm:text-lg text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              {editingProduct && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Category *</span>
                <select 
                  required 
                  value={categoryId} 
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
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
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Diamonds</span>
                <input
                  type="text"
                  min="0"
                  value={diamonds}
                  onChange={(e) => setDiamonds(e.target.value)}
                  placeholder="80"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Price (৳) *</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="45"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Bonus (optional)</span>
                <input
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="+10 bonus"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
              <label className="block">
                <span className="block mb-2 text-sm font-semibold text-slate-700">Tag (optional)</span>
                <input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Hot"
                  className="w-full px-4 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
            </div>
            <button 
              className="w-full px-4 py-3 mt-4 font-semibold text-white transition-all shadow-lg rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 shadow-sky-500/30" 
              type="submit"
            >
              {editingProduct ? 'Update Product in Database' : 'Add Product to Database'}
            </button>
          </form>

          <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
            <h3 className="mb-3 text-base font-bold sm:text-lg text-slate-900 sm:mb-4">Products List</h3>
            <div className="space-y-2">
              {sortedProducts.length > 0 ? (
                sortedProducts.map((item) => (
                  <div key={item.id} className="p-4 transition-colors border rounded-lg border-slate-200 hover:bg-slate-50">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex-1 min-w-0 overflow-hidden">
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
                        <div className="flex flex-wrap items-center gap-2 text-sm sm:gap-4 text-slate-600">
                          <span>Category: {categories.find(c => c.id === item.categoryId)?.name || '-'}</span>
                          <span>Diamonds: {item.diamonds || 'Special'}</span>
                          <span className="font-bold text-slate-900">Price: ৳{item.price}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end flex-shrink-0 w-full gap-2 sm:w-auto sm:justify-start">
                        <button 
                          className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white transition-all rounded-lg shadow-md bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 hover:shadow-lg whitespace-nowrap" 
                          onClick={() => handleEditProduct(item)}
                          type="button"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white transition-all bg-red-500 rounded-lg shadow-md hover:bg-red-600 hover:shadow-lg whitespace-nowrap" 
                          onClick={() => handleRemoveProduct(item.id)}
                          type="button"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No products yet. Add your first product.
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border sm:p-5 md:p-6 rounded-xl border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50">
            <h4 className="mb-3 text-base font-bold sm:text-lg text-slate-900 sm:mb-4">Database Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-sm text-slate-600">Categories</p>
                <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-slate-600">Products</p>
                <p className="text-2xl font-bold text-slate-900">{products.length}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              All data is stored in MongoDB. Changes are automatically saved.
            </p>
          </div>
        </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;


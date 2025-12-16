import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import useCatalog from '../hooks/useCatalog';
import UserManagement from './UserManagement';
import AdminOrders from './AdminOrders';

type TabType = 'products' | 'users' | 'orders';

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

  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catBadge, setCatBadge] = useState('');
  const [name, setName] = useState('');
  const [diamonds, setDiamonds] = useState('');
  const [price, setPrice] = useState('');
  const [bonus, setBonus] = useState('');
  const [tag, setTag] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.diamonds - b.diamonds || a.name.localeCompare(b.name)),
    [products],
  );

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Category added to database!' });
      setCatName('');
      setCatDesc('');
      setCatBadge('');
      if (!categoryId) setCategoryId(result.data!.id);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to add category' });
    }
  };

  const handleRemoveCategory = async (id: string) => {
    if (!window.confirm('Are you sure? Products in this category will also be removed.')) {
      return;
    }

    const result = await deleteCategory(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Category deleted from database!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete category' });
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
      diamonds: Number(diamonds) || 0,
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
    setDiamonds(product.diamonds.toString());
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
      diamonds: Number(diamonds) || 0,
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
      <div className="admin-layout">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-3 sm:mt-4 md:mt-6 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-400/14 text-purple-700 border border-purple-400/35 font-semibold text-sm mb-2">
            Admin Dashboard
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Admin Panel</h2>
          <p className="text-slate-600 text-sm">
            Manage products, categories, users, and full order history
          </p>
          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
              <button 
                className="mt-2 px-3 py-1 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-all" 
                onClick={retry}
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'products' && (
            <button 
              onClick={refresh}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all"
            >
              Refresh Data
            </button>
          )}
          <button 
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Products & Categories
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Order History
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <p className="font-semibold">{message.text}</p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'users' ? (
        <UserManagement />
      ) : activeTab === 'orders' ? (
        <AdminOrders />
      ) : (
        <div className="space-y-6">

          {/* Products & Categories Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <form className="p-4 sm:p-5 md:p-6 rounded-xl border border-slate-200 bg-slate-50" onSubmit={handleAddCategory}>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Add Category</h3>
              <div className="space-y-4">
                <label className="block">
                  <span className="block text-sm font-semibold text-slate-700 mb-2">Name *</span>
                  <input
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Diamond TopUp"
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold text-slate-700 mb-2">Badge (optional)</span>
                  <input
                    value={catBadge}
                    onChange={(e) => setCatBadge(e.target.value)}
                    placeholder="Hot"
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold text-slate-700 mb-2">Description (optional)</span>
                  <input
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Fast delivery packs"
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </label>
              </div>
              <button 
                className="w-full mt-4 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold hover:from-purple-600 hover:to-violet-700 transition-all shadow-lg shadow-purple-500/30" 
                type="submit"
              >
                Add Category to Database
              </button>
            </form>

            <div className="p-4 sm:p-5 md:p-6 rounded-xl border border-slate-200 bg-white">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Categories List</h3>
              <div className="space-y-2">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <div key={cat.id} className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <strong className="text-slate-900">{cat.name}</strong>
                            {cat.badge && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                                {cat.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{cat.description || 'No description'}</p>
                        </div>
                        <button 
                          className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition-all" 
                          onClick={() => handleRemoveCategory(cat.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    No categories yet. Add your first category.
                  </div>
                )}
              </div>
            </div>
          </div>

          <form className="product-form p-4 sm:p-5 md:p-6 rounded-xl border border-slate-200 bg-slate-50" onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <label className="block">
                <span className="block text-sm font-semibold text-slate-700 mb-2">Category *</span>
                <select 
                  required 
                  value={categoryId} 
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
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
                <span className="block text-sm font-semibold text-slate-700 mb-2">Product Name *</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="50 Diamonds"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-slate-700 mb-2">Diamonds</span>
                <input
                  type="number"
                  min="0"
                  value={diamonds}
                  onChange={(e) => setDiamonds(e.target.value)}
                  placeholder="50"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-slate-700 mb-2">Price (৳) *</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="45"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-slate-700 mb-2">Bonus (optional)</span>
                <input
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="+10 bonus"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-slate-700 mb-2">Tag (optional)</span>
                <input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Hot"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
            </div>
            <button 
              className="w-full mt-4 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-semibold hover:from-sky-500 hover:to-blue-600 transition-all shadow-lg shadow-sky-500/30" 
              type="submit"
            >
              {editingProduct ? 'Update Product in Database' : 'Add Product to Database'}
            </button>
          </form>

          <div className="p-4 sm:p-5 md:p-6 rounded-xl border border-slate-200 bg-white">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Products List</h3>
            <div className="space-y-2">
              {sortedProducts.length > 0 ? (
                sortedProducts.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <strong className="text-slate-900">{item.name}</strong>
                          {item.tag && (
                            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold">
                              {item.tag}
                            </span>
                          )}
                          {item.bonus && (
                            <span className="text-xs text-violet-600 font-semibold">({item.bonus})</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-slate-600">
                          <span>Category: {categories.find(c => c.id === item.categoryId)?.name || '-'}</span>
                          <span>Diamonds: {item.diamonds || 'Special'}</span>
                          <span className="font-bold text-slate-900">Price: ৳{item.price}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                        <button 
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-semibold hover:from-purple-600 hover:to-violet-700 transition-all shadow-md hover:shadow-lg whitespace-nowrap flex-shrink-0" 
                          onClick={() => handleEditProduct(item)}
                          type="button"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all shadow-md hover:shadow-lg whitespace-nowrap flex-shrink-0" 
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

          <div className="p-4 sm:p-5 md:p-6 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Database Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Categories</p>
                <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Products</p>
                <p className="text-2xl font-bold text-slate-900">{products.length}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-4">
              All data is stored in MongoDB. Changes are automatically saved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;


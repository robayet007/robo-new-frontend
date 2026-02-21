import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { subscriptionApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import type { BackendSubscriptionProduct } from '../types';
import { FaEdit, FaTrash } from 'react-icons/fa';
import ImageUpload from './ImageUpload';

function AdminSubscriptions() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<BackendSubscriptionProduct[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Product form state
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productResellerPrice, setProductResellerPrice] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productTag, setProductTag] = useState('');
  const [productBonus, setProductBonus] = useState('');
  const [inputFields, setInputFields] = useState<Array<{ name: string; placeholder: string; type: string; required: boolean }>>([]);
  const [newInputFieldName, setNewInputFieldName] = useState('');
  const [newInputFieldPlaceholder, setNewInputFieldPlaceholder] = useState('');
  const [newInputFieldType, setNewInputFieldType] = useState('text');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await subscriptionApi.getProducts(true);
      if (response.success && Array.isArray(response.data)) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setProductId('');
    setProductName('');
    setProductDesc('');
    setProductPrice('');
    setProductResellerPrice('');
    setProductImage('');
    setProductTag('');
    setProductBonus('');
    setInputFields([]);
    setNewInputFieldName('');
    setNewInputFieldPlaceholder('');
    setNewInputFieldType('text');
  };

  // Product handlers
  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productPrice.trim()) {
      showToast({ type: 'error', text: 'Name and Price are required' });
      return;
    }

    try {
      const response = await subscriptionApi.createProduct({
        id: productId.trim() || crypto.randomUUID(),
        name: productName.trim(),
        description: productDesc.trim() || undefined,
        price: Number(productPrice),
        resellerPrice: productResellerPrice ? Number(productResellerPrice) : undefined,
        image: productImage.trim() || undefined,
        tag: productTag.trim() || undefined,
        bonus: productBonus.trim() || undefined,
        inputFields: inputFields.length > 0 ? inputFields : undefined,
        isActive: true
      });

      if (response.success) {
        showToast({ type: 'success', text: 'Product created successfully!' });
        handleCancelEdit();
        await loadProducts();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to create product' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to create product' });
    }
  };

  const handleEditProduct = (product: BackendSubscriptionProduct) => {
    setEditingProduct(product.id);
    setProductId(product.id);
    setProductName(product.name);
    setProductDesc(product.description || '');
    setProductPrice(product.price.toString());
    setProductResellerPrice(product.resellerPrice?.toString() || '');
    setProductImage(product.image || '');
    setProductTag(product.tag || '');
    setProductBonus(product.bonus || '');
    setInputFields((product.inputFields || []).map(field => ({
      name: field.name,
      placeholder: field.placeholder || '',
      type: field.type || 'text',
      required: field.required ?? false
    })));
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !productName.trim() || !productPrice.trim()) {
      showToast({ type: 'error', text: 'Product name and price are required' });
      return;
    }

    try {
      const response = await subscriptionApi.updateProduct(editingProduct, {
        name: productName.trim(),
        description: productDesc.trim() || undefined,
        price: Number(productPrice),
        resellerPrice: productResellerPrice ? Number(productResellerPrice) : undefined,
        image: productImage.trim() || undefined,
        tag: productTag.trim() || undefined,
        bonus: productBonus.trim() || undefined,
        inputFields: inputFields.length > 0 ? inputFields : undefined
      });

      if (response.success) {
        showToast({ type: 'success', text: 'Product updated successfully!' });
        handleCancelEdit();
        await loadProducts();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to update product' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to update product' });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure? This will permanently delete the product.')) {
      return;
    }

    try {
      const response = await subscriptionApi.deleteProduct(id);
      if (response.success) {
        showToast({ type: 'success', text: 'Product deleted successfully!' });
        await loadProducts();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to delete product' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to delete product' });
    }
  };

  const handleToggleProductActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await subscriptionApi.updateProduct(id, { isActive: !currentStatus });
      if (response.success) {
        showToast({ type: 'success', text: `Product ${!currentStatus ? 'activated' : 'deactivated'} successfully!` });
        await loadProducts();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to update product status' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to update product status' });
    }
  };

  const handleAddInputField = () => {
    if (!newInputFieldName.trim()) {
      showToast({ type: 'error', text: 'Input field name is required' });
      return;
    }
    setInputFields([...inputFields, {
      name: newInputFieldName.trim(),
      placeholder: newInputFieldPlaceholder.trim() || '',
      type: newInputFieldType,
      required: false
    }]);
    setNewInputFieldName('');
    setNewInputFieldPlaceholder('');
    setNewInputFieldType('text');
  };

  const handleRemoveInputField = (index: number) => {
    setInputFields(inputFields.filter((_, i) => i !== index));
  };

  const handleUpdateInputField = (index: number, updates: Partial<{ name: string; placeholder: string; type: string; required: boolean }>) => {
    const updated = [...inputFields];
    updated[index] = { ...updated[index], ...updates };
    setInputFields(updated);
  };

  return (
    <div className="pt-4 pb-4 pl-0 pr-4 space-y-6 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
      <div className="p-4 bg-white border sm:p-5 md:p-6 rounded-xl border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">Subscriptions Management</h2>
        <p className="text-sm text-slate-600">Manage subscription products directly</p>
      </div>

      {/* Products Section */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product ID (Optional - Auto-generated if not provided)</label>
                <input
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  disabled={!!editingProduct}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Leave empty for auto-generation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price *</label>
                <input
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reseller Price (optional)</label>
                <input
                  type="number"
                  value={productResellerPrice}
                  onChange={(e) => setProductResellerPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                />
              </div>
              <div>
                <ImageUpload
                  label="Image"
                  value={productImage}
                  onChange={setProductImage}
                  uploadEndpoint="/upload/product-image"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tag</label>
                <input
                  type="text"
                  value={productTag}
                  onChange={(e) => setProductTag(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bonus</label>
                <input
                  type="text"
                  value={productBonus}
                  onChange={(e) => setProductBonus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Input Fields Configuration */}
            <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold mb-2">Optional Input Fields (for users to fill when purchasing)</h4>
                <div className="space-y-2 mb-4">
                  {inputFields.map((field, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                      <span className="flex-1 font-medium">{field.name}</span>
                      <span className="text-xs text-slate-500">({field.type})</span>
                      {field.placeholder && <span className="text-sm text-slate-600">- {field.placeholder}</span>}
                      {field.required && <span className="text-xs text-red-600 font-semibold">Required</span>}
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => handleUpdateInputField(index, { required: e.target.checked })}
                          className="rounded"
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveInputField(index)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInputFieldName}
                    onChange={(e) => setNewInputFieldName(e.target.value)}
                    placeholder="Field name (e.g., Email, Phone)"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={newInputFieldPlaceholder}
                    onChange={(e) => setNewInputFieldPlaceholder(e.target.value)}
                    placeholder="Placeholder text"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <select
                    value={newInputFieldType}
                    onChange={(e) => setNewInputFieldType(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="number">Number</option>
                    <option value="phone">Phone</option>
                    <option value="textarea">Textarea</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddInputField}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add Field
                  </button>
                </div>
              </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              {editingProduct && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold">Products</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading products...</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {products.map(product => (
                <div key={product.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1 flex items-center gap-4">
                    {product.image && (
                      <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{product.name}</span>
                        {product.tag && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">{product.tag}</span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded ${
                          product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        ৳{product.price}
                        {product.bonus && ` • ${product.bonus}`}
                      </p>
                      {product.description && (
                        <p className="text-xs text-slate-500 mt-1">{product.description}</p>
                      )}
                      {product.inputFields && product.inputFields.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-500">Input Fields:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.inputFields.map((field, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded">
                                {field.name} ({field.type || 'text'}){field.required && ' *'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleProductActive(product.id, product.isActive)}
                      className={`px-3 py-1 text-sm rounded ${
                        product.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {product.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="p-8 text-center text-slate-500">No products found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSubscriptions;

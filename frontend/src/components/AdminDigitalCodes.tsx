import { useEffect, useState, useMemo, useRef } from 'react';
import type { FormEvent } from 'react';
import { io, Socket } from 'socket.io-client';
import { digitalCodeApi, dealApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import type { BackendDigitalCodeCategory, BackendDigitalCodeProduct, BackendDigitalCode, BackendDeal } from '../types';
import { FaChartBar, FaEdit, FaTrash, FaCopy, FaCheck } from 'react-icons/fa';
import ImageUpload from './ImageUpload';

type DigitalCodeTab = 'categories' | 'products' | 'codes' | 'deals' | 'status';

function AdminDigitalCodes() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<DigitalCodeTab>('categories');
  const [categories, setCategories] = useState<BackendDigitalCodeCategory[]>([]);
  const [products, setProducts] = useState<BackendDigitalCodeProduct[]>([]);
  const [codes, setCodes] = useState<BackendDigitalCode[]>([]);
  const [deals, setDeals] = useState<BackendDeal[]>([]);
  const [stats, setStats] = useState<{ active: number; used: number; total: number }>({ active: 0, used: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  
  // Category form state
  const [catId, setCatId] = useState('');
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catBadge, setCatBadge] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catDealId, setCatDealId] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  
  // Product form state
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productResellerPrice, setProductResellerPrice] = useState('');
  const [productCategoryId, setProductCategoryId] = useState('');
  const [productTag, setProductTag] = useState('');
  const [inputFields, setInputFields] = useState<Array<{ name: string; placeholder: string; required: boolean }>>([]);
  const [newInputFieldName, setNewInputFieldName] = useState('');
  const [newInputFieldPlaceholder, setNewInputFieldPlaceholder] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  
  // Code form state
  const [bulkCodeText, setBulkCodeText] = useState('');
  const [codeCategoryId, setCodeCategoryId] = useState('');
  const [codeProductId, setCodeProductId] = useState('');
  const [singleCode, setSingleCode] = useState('');
  const [singleCodePrefix, setSingleCodePrefix] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Deal form state
  const [dealName, setDealName] = useState('');
  const [dealDesc, setDealDesc] = useState('');
  const [dealOrder, setDealOrder] = useState('0');
  const [editingDeal, setEditingDeal] = useState<string | null>(null);
  
  // Status tab state
  const [selectedProductForStatus, setSelectedProductForStatus] = useState<string>('');

  useEffect(() => {
    loadCategories();
    loadDeals();
    loadProducts(); // Load products once on mount - needed for codes tab dropdowns
    if (activeTab === 'products') {
      // Products already loaded
    }
    if (activeTab === 'codes') {
      // Don't load codes list in codes tab anymore
    }
    if (activeTab === 'status') {
      loadStats();
      loadCodes(); // Load all codes for status tab
    }
  }, [activeTab]);

  const loadCategories = async () => {
    try {
      const response = await digitalCodeApi.getCategories(true);
      if (response.success && Array.isArray(response.data)) {
        setCategories(response.data);
        if (response.data.length > 0 && !productCategoryId) {
          setProductCategoryId(response.data[0].id);
          setCodeCategoryId(response.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadProducts = async (forceReload = false) => {
    try {
      // Only load if products array is empty to avoid unnecessary reloads
      if (!forceReload && products.length > 0) return;
      setProductsLoading(true);
      const response = await digitalCodeApi.getAllProductsForAdmin();
      if (response.success && Array.isArray(response.data)) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadCodes = async (status?: 'active' | 'used', categoryId?: string, productId?: string) => {
    try {
      setLoading(true);
      const response = await digitalCodeApi.getCodes(status, categoryId, productId, 1000);
      if (response.success && Array.isArray(response.data)) {
        setCodes(response.data);
      }
    } catch (err) {
      console.error('Failed to load codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await digitalCodeApi.getCodeStats(codeCategoryId || undefined);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadDeals = async () => {
    try {
      const response = await dealApi.getAll();
      if (response.success && Array.isArray(response.data)) {
        setDeals(response.data);
      }
    } catch (err) {
      console.error('Failed to load deals:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'status') {
      loadCodes();
      loadStats();
    }
  }, [activeTab]);

  // Socket.IO real-time updates for admin panel
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
    
    if (!socketUrl) {
      console.warn('⚠️ VITE_SOCKET_URL and VITE_API_URL environment variables are not set. Socket.IO connection disabled.');
      return;
    }
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });
    
    // Add error handling for connection failures
    socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket.IO connection error:', error.message);
    });
    
    socket.on('reconnect_attempt', () => {
      console.log('🔄 Attempting to reconnect Socket.IO...');
    });
    
    socket.on('reconnect_failed', () => {
      console.warn('⚠️ Socket.IO reconnection failed.');
    });

    socket.on('connect', () => {
      socket.emit('join-admin-room');
    });

    socket.on('digital-code-assigned', (data: { code: BackendDigitalCode, purchase: any }) => {
      // Reload stats to ensure accuracy
      loadStats();
      
      // Always reload codes when status tab is active to ensure accurate display
      if (activeTab === 'status') {
        // Reload codes to get latest status from database
        loadCodes();
      } else if (selectedProductForStatus === data.code.productId) {
        // If product is selected but not on status tab, update in place
        setCodes(prev => {
          // Check if code already exists
          const existingIndex = prev.findIndex(c => c.serialNumber === data.code.serialNumber);
          
          if (existingIndex >= 0) {
            // Update existing code status from active to used
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              status: 'used' as const,
              purchasedAt: new Date().toISOString(),
              purchasedBy: {
                userId: data.purchase.userId,
                userEmail: data.purchase.userEmail,
                userName: data.purchase.userName || ''
              },
              purchaseId: data.purchase._id
            };
            return updated;
          } else {
            // Code not in current list, reload codes to get latest data
            loadCodes();
            return prev;
          }
        });
      }
    });

    socket.on('digital-code-added', (data: { code: BackendDigitalCode }) => {
      // Reload stats to update counts
      loadStats();
      
      // Reload codes if status tab is active or if code belongs to selected product
      if (activeTab === 'status') {
        if (!selectedProductForStatus || data.code.productId === selectedProductForStatus) {
          loadCodes();
        }
      }
    });

    socket.on('digital-codes-added', (data: { productId: string, categoryId: string | null, count: number }) => {
      // Reload stats to update counts
      loadStats();
      
      // Reload codes if status tab is active and product matches
      if (activeTab === 'status') {
        if (!selectedProductForStatus || data.productId === selectedProductForStatus) {
          loadCodes();
        }
      }
    });

    socket.on('disconnect', () => {
      // console.log('Admin socket disconnected');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedProductForStatus, activeTab]);

  // Category handlers
  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catId.trim() || !catName.trim()) {
      showToast({ type: 'error', text: 'Category ID and Name are required' });
      return;
    }

    try {
      const response = await digitalCodeApi.createCategory({
        id: catId.trim(),
        name: catName.trim(),
        description: catDesc.trim() || undefined,
        badge: catBadge.trim() || undefined,
        image: catImage.trim() || undefined,
        dealId: catDealId || undefined,
        isActive: true
      });

      if (response.success) {
        showToast({ type: 'success', text: 'Category created successfully!' });
        setCatId('');
        setCatName('');
        setCatDesc('');
        setCatBadge('');
        setCatImage('');
        setCatDealId('');
        await loadCategories();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to create category' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to create category' });
    }
  };

  const handleEditCategory = (category: BackendDigitalCodeCategory) => {
    setEditingCategory(category.id);
    setCatId(category.id);
    setCatName(category.name);
    setCatDesc(category.description || '');
    setCatBadge(category.badge || '');
    setCatImage(category.image || '');
    setCatDealId(category.dealId || '');
  };

  const handleUpdateCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !catName.trim()) {
      showToast({ type: 'error', text: 'Category name is required' });
      return;
    }

    try {
      const response = await digitalCodeApi.updateCategory(editingCategory, {
        name: catName.trim(),
        description: catDesc.trim() || undefined,
        badge: catBadge.trim() || undefined,
        image: catImage.trim() || undefined,
        dealId: catDealId || undefined
      });

      if (response.success) {
        showToast({ type: 'success', text: 'Category updated successfully!' });
        setEditingCategory(null);
        setCatId('');
        setCatName('');
        setCatDesc('');
        setCatBadge('');
        setCatImage('');
        setCatDealId('');
        await loadCategories();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to update category' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to update category' });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure? This will permanently delete the category.')) {
      return;
    }

    try {
      const response = await digitalCodeApi.deleteCategory(id);
      if (response.success) {
        showToast({ type: 'success', text: 'Category deleted successfully!' });
        await loadCategories();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to delete category' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to delete category' });
    }
  };

  const handleToggleCategoryActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await digitalCodeApi.updateCategory(id, { isActive: !currentStatus });
      if (response.success) {
        showToast({ type: 'success', text: `Category ${!currentStatus ? 'activated' : 'deactivated'} successfully!` });
        await loadCategories();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to update category status' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to update category status' });
    }
  };

  // Product handlers
  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productPrice.trim()) {
      showToast({ type: 'error', text: 'Name and Price are required' });
      return;
    }

    const category = productCategoryId ? categories.find(c => c.id === productCategoryId) : null;

    try {
      const response = await digitalCodeApi.createProduct({
        id: productId.trim() || '',
        categoryId: productCategoryId || '',
        categoryName: category?.name || '',
        name: productName.trim(),
        description: productDesc.trim() || undefined,
        price: Number(productPrice),
        resellerPrice: productResellerPrice ? Number(productResellerPrice) : undefined,
        inputFields: inputFields.length > 0 ? inputFields : undefined,
        tag: productTag.trim() || undefined,
        isActive: true
      });

      if (response.success) {
        showToast({ type: 'success', text: 'Product created successfully!' });
        setProductId('');
        setProductName('');
        setProductDesc('');
        setProductPrice('');
        setProductResellerPrice('');
        setProductTag('');
        setInputFields([]);
        await loadProducts(true); // Force reload to get new product
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to create product' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to create product' });
    }
  };

  const handleEditProduct = (product: BackendDigitalCodeProduct) => {
    setEditingProduct(product.id);
    setProductId(product.id);
    setProductName(product.name);
    setProductDesc(product.description || '');
    setProductPrice(product.price.toString());
    setProductResellerPrice(product.resellerPrice?.toString() || '');
    setProductCategoryId(product.categoryId);
    setProductTag(product.tag || '');
    setInputFields((product.inputFields || []).map(field => ({
      name: field.name,
      placeholder: field.placeholder || '',
      required: field.required ?? false
    })));
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !productName.trim() || !productPrice.trim()) {
      showToast({ type: 'error', text: 'Product name and price are required' });
      return;
    }

    const category = productCategoryId ? categories.find(c => c.id === productCategoryId) : null;

    try {
      const response = await digitalCodeApi.updateProduct(editingProduct, {
        name: productName.trim(),
        description: productDesc.trim() || undefined,
        price: Number(productPrice),
        resellerPrice: productResellerPrice ? Number(productResellerPrice) : undefined,
        categoryId: productCategoryId || undefined,
        categoryName: category?.name || undefined,
        inputFields: inputFields.length > 0 ? inputFields : undefined,
        tag: productTag.trim() || undefined
      });

      if (response.success) {
        showToast({ type: 'success', text: 'Product updated successfully!' });
        setEditingProduct(null);
        setProductId('');
        setProductName('');
        setProductDesc('');
        setProductPrice('');
        setProductResellerPrice('');
        setProductTag('');
        setInputFields([]);
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
      const response = await digitalCodeApi.deleteProduct(id);
      if (response.success) {
        showToast({ type: 'success', text: 'Product deleted successfully!' });
        await loadProducts(true); // Force reload to remove deleted product
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to delete product' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to delete product' });
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
      required: false
    }]);
    setNewInputFieldName('');
    setNewInputFieldPlaceholder('');
  };

  const handleRemoveInputField = (index: number) => {
    setInputFields(inputFields.filter((_, i) => i !== index));
  };

  // Code handlers
  const handleBulkUploadCodes = async (e: FormEvent) => {
    e.preventDefault();
    if (!bulkCodeText.trim()) {
      showToast({ type: 'error', text: 'Code text is required' });
      return;
    }
    if (!codeProductId) {
      showToast({ type: 'error', text: 'Product selection is required' });
      return;
    }

    try {
      setLoading(true);
      if (!codeCategoryId) {
        showToast({ type: 'error', text: 'Please select a category' });
        return;
      }
      
      const response = await digitalCodeApi.bulkUploadCodes(
        bulkCodeText.trim(),
        codeCategoryId,
        codeProductId || undefined
      );

      if (response.success) {
        showToast({ type: 'success', text: `Successfully uploaded ${response.data?.inserted || 0} code(s)!` });
        setBulkCodeText('');
        if (activeTab === 'status') {
          await loadCodes();
        }
        await loadStats();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to upload codes' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to upload codes' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSingleCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!singleCode.trim()) {
      showToast({ type: 'error', text: 'Code is required' });
      return;
    }
    if (!codeProductId) {
      showToast({ type: 'error', text: 'Product selection is required' });
      return;
    }

    if (!codeCategoryId) {
      showToast({ type: 'error', text: 'Please select a category' });
      return;
    }

    try {
      const response = await digitalCodeApi.addCode({
        categoryId: codeCategoryId,
        productId: codeProductId || undefined,
        code: singleCode.trim(),
        prefix: singleCodePrefix.trim() || undefined
      });

      if (response.success) {
        showToast({ type: 'success', text: 'Code added successfully!' });
        setSingleCode('');
        setSingleCodePrefix('');
        if (activeTab === 'status') {
          await loadCodes();
        }
        await loadStats();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to add code' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to add code' });
    }
  };


  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      showToast({ type: 'error', text: 'Failed to copy code' });
    }
  };

  // Deal handlers
  const handleAddDeal = async (e: FormEvent) => {
    e.preventDefault();
    if (!dealName.trim()) {
      showToast({ type: 'error', text: 'Deal name is required' });
      return;
    }

    try {
      const dealId = crypto.randomUUID();
      const response = await dealApi.create({
        id: dealId,
        name: dealName.trim(),
        description: dealDesc.trim() || undefined,
        displayOrder: Number(dealOrder) || 0,
        isActive: true
      });

      if (response.success) {
        showToast({ type: 'success', text: 'Deal created successfully!' });
        setDealName('');
        setDealDesc('');
        setDealOrder('0');
        await loadDeals();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to create deal' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to create deal' });
    }
  };

  const handleEditDeal = (deal: BackendDeal) => {
    setEditingDeal(deal.id);
    setDealName(deal.name);
    setDealDesc(deal.description || '');
    setDealOrder(deal.displayOrder.toString());
  };

  const handleUpdateDeal = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDeal || !dealName.trim()) {
      showToast({ type: 'error', text: 'Deal name is required' });
      return;
    }

    try {
      const response = await dealApi.update(editingDeal, {
        name: dealName.trim(),
        description: dealDesc.trim() || undefined,
        displayOrder: Number(dealOrder) || 0
      });

      if (response.success) {
        showToast({ type: 'success', text: 'Deal updated successfully!' });
        setEditingDeal(null);
        setDealName('');
        setDealDesc('');
        setDealOrder('0');
        await loadDeals();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to update deal' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to update deal' });
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!window.confirm('Are you sure? Categories in this deal will be unassigned.')) {
      return;
    }

    try {
      const response = await dealApi.delete(id);
      if (response.success) {
        showToast({ type: 'success', text: 'Deal deleted successfully!' });
        await loadDeals();
        await loadCategories();
      } else {
        showToast({ type: 'error', text: response.message || 'Failed to delete deal' });
      }
    } catch (err: any) {
      showToast({ type: 'error', text: err?.message || 'Failed to delete deal' });
    }
  };

  // Memoize filtered products for dropdowns
  const filteredProductsForCodes = useMemo(() => {
    if (!codeCategoryId) return products;
    return products.filter(p => p.categoryId === codeCategoryId);
  }, [products, codeCategoryId]);

  // Get selected product's codes for status tab
  const selectedProductCodes = useMemo(() => {
    if (!selectedProductForStatus) return { active: [], used: [] };
    
    const productCodes = codes.filter(c => c.productId === selectedProductForStatus);
    return {
      active: productCodes.filter(c => c.status === 'active'),
      used: productCodes.filter(c => c.status === 'used')
    };
  }, [codes, selectedProductForStatus]);

  // Get selected product details
  const selectedProduct = useMemo(() => {
    if (!selectedProductForStatus) return null;
    return products.find(p => p.id === selectedProductForStatus);
  }, [products, selectedProductForStatus]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Digital Codes Management</h2>
        <p className="text-sm text-slate-600">Manage categories, products, codes, and deals for digital codes</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-4">
          {(['categories', 'products', 'codes', 'deals', 'status'] as DigitalCodeTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'status' ? 'Status' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
            <h3 className="mb-4 text-lg font-semibold">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium">Category ID *</label>
                  <input
                    type="text"
                    value={catId}
                    onChange={(e) => setCatId(e.target.value)}
                    disabled={!!editingCategory}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Category Name *</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Description</label>
                  <input
                    type="text"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Badge</label>
                  <input
                    type="text"
                    value={catBadge}
                    onChange={(e) => setCatBadge(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <ImageUpload
                    label="Image"
                    value={catImage}
                    onChange={setCatImage}
                    uploadEndpoint="/upload/category-image"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Deal</label>
                  <select
                    value={catDealId}
                    onChange={(e) => setCatDealId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {deals.map(deal => (
                      <option key={deal.id} value={deal.id}>{deal.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCatId('');
                      setCatName('');
                      setCatDesc('');
                      setCatBadge('');
                      setCatImage('');
                      setCatDealId('');
                    }}
                    className="px-4 py-2 transition-colors rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="overflow-hidden bg-white border rounded-lg shadow-sm border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold">Categories</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {categories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{category.name}</span>
                      {category.badge && (
                        <span className="px-2 py-1 text-xs text-purple-700 bg-purple-100 rounded">{category.badge}</span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded ${
                        category.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {category.description && (
                      <p className="mt-1 text-sm text-slate-600">{category.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleCategoryActive(category.id, category.isActive)}
                      className={`px-3 py-1 text-sm rounded ${
                        category.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {category.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded hover:bg-red-200"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
            <h3 className="mb-4 text-lg font-semibold">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium">Product ID (Optional - Auto-generated if not provided)</label>
                  <input
                    type="text"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    disabled={!!editingProduct}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Leave empty for auto-generation"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Product Name *</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Category (Optional)</label>
                  <select
                    value={productCategoryId}
                    onChange={(e) => setProductCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {categories.filter(c => c.isActive).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Price *</label>
                  <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Reseller Price (optional)</label>
                  <input
                    type="number"
                    value={productResellerPrice}
                    onChange={(e) => setProductResellerPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium">Description</label>
                  <textarea
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Tag</label>
                  <input
                    type="text"
                    value={productTag}
                    onChange={(e) => setProductTag(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Input Fields Configuration */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="mb-2 text-sm font-semibold">Optional Input Fields (for users to fill when purchasing)</h4>
                <div className="mb-4 space-y-2">
                  {inputFields.map((field, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded bg-slate-50">
                      <span className="flex-1 font-medium">{field.name}</span>
                      {field.placeholder && <span className="text-sm text-slate-600">({field.placeholder})</span>}
                      <button
                        type="button"
                        onClick={() => handleRemoveInputField(index)}
                        className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded hover:bg-red-200"
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
                    placeholder="Field name (e.g., Player ID)"
                    className="flex-1 px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={newInputFieldPlaceholder}
                    onChange={(e) => setNewInputFieldPlaceholder(e.target.value)}
                    placeholder="Placeholder text"
                    className="flex-1 px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddInputField}
                    className="px-4 py-2 text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
                  >
                    Add Field
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setProductId('');
                      setProductName('');
                      setProductDesc('');
                      setProductPrice('');
                      setProductTag('');
                      setInputFields([]);
                    }}
                    className="px-4 py-2 transition-colors rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="overflow-hidden bg-white border rounded-lg shadow-sm border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold">Products</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {products.map(product => (
                <div key={product.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{product.name}</span>
                        {product.tag && (
                          <span className="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded">{product.tag}</span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded ${
                          product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">Category: {product.categoryName}</p>
                      <p className="mt-1 text-sm font-medium text-purple-600">Price: ৳{product.price}</p>
                      {product.inputFields && product.inputFields.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-500">Input Fields:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.inputFields.map((field, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">
                                {field.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded hover:bg-red-200"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Codes Tab */}
      {activeTab === 'codes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Bulk Upload */}
            <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
              <h3 className="mb-4 text-lg font-semibold">Bulk Upload Codes</h3>
              <form onSubmit={handleBulkUploadCodes} className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Category (Optional)</label>
                  <select
                    value={codeCategoryId}
                    onChange={(e) => setCodeCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Product *</label>
                  {productsLoading ? (
                    <div className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 bg-slate-50 text-slate-500">
                      Loading products...
                    </div>
                  ) : (
                    <select
                      value={codeProductId}
                      onChange={(e) => setCodeProductId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Product</option>
                      {filteredProductsForCodes.map(prod => (
                        <option key={prod.id} value={prod.id}>{prod.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Paste Codes *</label>
                  <textarea
                    value={bulkCodeText}
                    onChange={(e) => setBulkCodeText(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-sm border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={10}
                    placeholder="UPBD-N-S-10954119 6919-7623-5673-3296&#10;UPBD-N-S-10954119 7935-8068-7589-6390&#10;&#10;BDMB-T-S-01458610&#10;1146-2271-5996-512&#10;5678-9012-3456-7890"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">Codes will be automatically parsed. Each line can be a full code or just the code part if prefix is on previous line.</p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Upload Codes'}
                </button>
              </form>
            </div>

            {/* Single Code Add */}
            <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
              <h3 className="mb-4 text-lg font-semibold">Add Single Code</h3>
              <form onSubmit={handleAddSingleCode} className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Category (Optional)</label>
                  <select
                    value={codeCategoryId}
                    onChange={(e) => setCodeCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Product *</label>
                  {productsLoading ? (
                    <div className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 bg-slate-50 text-slate-500">
                      Loading products...
                    </div>
                  ) : (
                    <select
                      value={codeProductId}
                      onChange={(e) => setCodeProductId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Product</option>
                      {filteredProductsForCodes.map(prod => (
                        <option key={prod.id} value={prod.id}>{prod.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Prefix (Optional)</label>
                  <input
                    type="text"
                    value={singleCodePrefix}
                    onChange={(e) => setSingleCodePrefix(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., UPBD-N-S-10954119"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Code *</label>
                  <input
                    type="text"
                    value={singleCode}
                    onChange={(e) => setSingleCode(e.target.value)}
                    className="w-full px-3 py-2 font-mono border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 6919-7623-5673-3296"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  Add Code
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* Deals Tab */}
      {activeTab === 'deals' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
            <h3 className="mb-4 text-lg font-semibold">
              {editingDeal ? 'Edit Deal' : 'Add New Deal'}
            </h3>
            <form onSubmit={editingDeal ? handleUpdateDeal : handleAddDeal} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium">Deal Name *</label>
                  <input
                    type="text"
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Display Order</label>
                  <input
                    type="number"
                    value={dealOrder}
                    onChange={(e) => setDealOrder(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium">Description</label>
                  <textarea
                    value={dealDesc}
                    onChange={(e) => setDealDesc(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
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
                    className="px-4 py-2 transition-colors rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="overflow-hidden bg-white border rounded-lg shadow-sm border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold">Deals</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {deals.map(deal => (
                <div key={deal.id} className="flex items-center justify-between p-4">
                  <div>
                    <span className="font-semibold">{deal.name}</span>
                    {deal.description && (
                      <p className="mt-1 text-sm text-slate-600">{deal.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditDeal(deal)}
                      className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteDeal(deal.id)}
                      className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded hover:bg-red-200"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Codes</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <FaChartBar className="text-3xl text-purple-500" />
              </div>
            </div>
            <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active Codes</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">{stats.active}</p>
                  <p className="mt-1 text-xs text-slate-500">Currently available codes</p>
                </div>
                <FaChartBar className="text-3xl text-green-500" />
              </div>
            </div>
            <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Used Codes</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">{stats.used}</p>
                </div>
                <FaChartBar className="text-3xl text-red-500" />
              </div>
            </div>
          </div>

          {/* Product Selection */}
          <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
            <label className="block mb-2 text-sm font-medium">Select Product</label>
            {productsLoading ? (
              <div className="px-3 py-2 text-sm border rounded-lg border-slate-300 bg-slate-50 text-slate-500">
                Loading products...
              </div>
            ) : (
              <select
                value={selectedProductForStatus}
                onChange={(e) => setSelectedProductForStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a product</option>
                {products.map(prod => (
                  <option key={prod.id} value={prod.id}>{prod.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Codes Display in 2 Columns */}
          {selectedProductForStatus && (
            <div className="overflow-hidden bg-white border rounded-lg shadow-sm border-slate-200">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{selectedProduct?.name || 'Unknown Product'}</h3>
                    {selectedProduct?.categoryName && (
                      <p className="text-sm text-slate-600">Category: {selectedProduct.categoryName}</p>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-600">Active</p>
                      <p className="text-xl font-bold text-green-600">{selectedProductCodes.active.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-600">Used</p>
                      <p className="text-xl font-bold text-red-600">{selectedProductCodes.used.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-600">Total</p>
                      <p className="text-xl font-bold text-slate-900">{selectedProductCodes.active.length + selectedProductCodes.used.length}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
                {/* Active Codes Column */}
                <div className="border-r border-slate-200">
                  <div className="p-4 border-b bg-green-50 border-slate-200">
                    <h4 className="font-semibold text-green-700">Active Codes ({selectedProductCodes.active.length})</h4>
                  </div>
                  <div className="overflow-y-auto max-h-96">
                    {selectedProductCodes.active.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">No active codes</div>
                    ) : (
                      <div className="divide-y divide-slate-200">
                        {selectedProductCodes.active.map(code => (
                          <div key={code.serialNumber} className="p-4 hover:bg-slate-50">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-xs text-slate-500">{code.serialNumber}</span>
                              <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded">Active</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {code.prefix && (
                                <span className="font-mono text-sm text-slate-600">{code.prefix}</span>
                              )}
                              <span className="font-mono text-sm font-semibold">{code.code}</span>
                              <button
                                onClick={() => handleCopyCode(code.code)}
                                className="px-2 py-1 ml-auto text-xs text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                                title="Copy code"
                              >
                                {copiedCode === code.code ? <FaCheck /> : <FaCopy />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Used Codes Column */}
                <div>
                  <div className="p-4 border-b bg-red-50 border-slate-200">
                    <h4 className="font-semibold text-red-700">Used Codes ({selectedProductCodes.used.length})</h4>
                  </div>
                  <div className="overflow-y-auto max-h-96">
                    {selectedProductCodes.used.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">No used code here</div>
                    ) : (
                      <div className="divide-y divide-slate-200">
                        {selectedProductCodes.used.map(code => (
                          <div key={code.serialNumber} className="p-4 hover:bg-slate-50">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-xs text-slate-500">{code.serialNumber}</span>
                              <span className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded">Used</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {code.prefix && (
                                <span className="font-mono text-sm text-slate-600">{code.prefix}</span>
                              )}
                              <span className="font-mono text-sm font-semibold">{code.code}</span>
                              <button
                                onClick={() => handleCopyCode(code.code)}
                                className="px-2 py-1 ml-auto text-xs text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                                title="Copy code"
                              >
                                {copiedCode === code.code ? <FaCheck /> : <FaCopy />}
                              </button>
                            </div>
                            {code.purchasedBy && (
                              <p className="mt-1 text-xs text-slate-500">Purchased by: {code.purchasedBy.userEmail}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selectedProductForStatus && (
            <div className="p-8 text-center bg-white border rounded-lg shadow-sm border-slate-200">
              <p className="text-slate-500">Please select a product to view codes</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDigitalCodes;

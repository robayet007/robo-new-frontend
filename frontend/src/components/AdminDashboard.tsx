import { useMemo } from 'react';
import useCatalog from '../hooks/useCatalog';
import { useOrdersQuery, type AdminOrder } from '../hooks/useOrdersQuery';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FaDollarSign, FaShoppingCart, FaCheckCircle, FaClock, FaTimesCircle, FaBox } from 'react-icons/fa';

function AdminDashboard() {
  const { categories, products } = useCatalog();
  // Use cached orders hook - data is cached and shared with AdminOrders component
  const { data: orders = [], isLoading: loading } = useOrdersQuery(1000);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyOrders = orders.filter((o) => {
      const orderDate = new Date(o.verifiedAt || o.createdAt || 0);
      return orderDate >= weekAgo;
    });

    const totalRevenue = orders.reduce((sum, o) => sum + (o.price ?? o.amount ?? 0), 0);
    const weeklyRevenue = weeklyOrders.reduce((sum, o) => sum + (o.price ?? o.amount ?? 0), 0);

    const completed = orders.filter((o) => o.status === 'completed' || o.status === 'verified' || o.verifiedAt).length;
    const pending = orders.filter((o) => o.status === 'pending' || (!o.verifiedAt && !o.status)).length;
    const cancelled = orders.filter((o) => o.status === 'cancelled' || o.status === 'failed').length;

    return {
      totalOrders: orders.length,
      weeklyOrders: weeklyOrders.length,
      totalRevenue,
      weeklyRevenue,
      completed,
      pending,
      cancelled,
    };
  }, [orders]);

  // Prepare data for charts
  const weeklyData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.verifiedAt || o.createdAt || 0);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + (o.price ?? o.amount ?? 0), 0),
      });
    }
    return days;
  }, [orders]);

  // Category statistics
  const categoryStats = useMemo(() => {
    const categoryMap = new Map<string, { name: string; orders: number; revenue: number }>();
    
    orders.forEach((o) => {
      if (o.categoryId || o.productId) {
        const category = categories.find((c) => 
          c.id === o.categoryId || 
          products.find((p) => p.id === o.productId)?.categoryId === c.id
        );
        const categoryName = category?.name || 'Unknown';
        
        const existing = categoryMap.get(categoryName) || { name: categoryName, orders: 0, revenue: 0 };
        existing.orders += 1;
        existing.revenue += o.price ?? o.amount ?? 0;
        categoryMap.set(categoryName, existing);
      }
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [orders, categories, products]);

  // Order status pie chart data
  const statusData = useMemo(() => {
    return [
      { name: 'Completed', value: stats.completed, color: '#10b981' },
      { name: 'Pending', value: stats.pending, color: '#f59e0b' },
      { name: 'Cancelled', value: stats.cancelled, color: '#ef4444' },
    ].filter((item) => item.value > 0);
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-400 rounded-full border-t-transparent animate-spin"></div>
        <p className="ml-3 text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 pr-4 pb-4 pl-0 sm:pt-5 sm:pr-5 sm:pb-5 sm:pl-0 md:pt-6 md:pr-6 md:pb-6 md:pl-0">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FaDollarSign className="text-2xl opacity-80" />
            <span className="text-sm opacity-80">Total Revenue</span>
          </div>
          <p className="text-3xl font-bold">৳{stats.totalRevenue.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">Weekly: ৳{stats.weeklyRevenue.toFixed(2)}</p>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FaShoppingCart className="text-2xl opacity-80" />
            <span className="text-sm opacity-80">Total Orders</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
          <p className="text-sm opacity-80 mt-1">This week: {stats.weeklyOrders}</p>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FaCheckCircle className="text-2xl opacity-80" />
            <span className="text-sm opacity-80">Completed</span>
          </div>
          <p className="text-3xl font-bold">{stats.completed}</p>
          <p className="text-sm opacity-80 mt-1">
            {stats.totalOrders > 0 ? ((stats.completed / stats.totalOrders) * 100).toFixed(1) : 0}% success rate
          </p>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FaClock className="text-2xl opacity-80" />
            <span className="text-sm opacity-80">Pending</span>
          </div>
          <p className="text-3xl font-bold">{stats.pending}</p>
          <p className="text-sm opacity-80 mt-1">
            {stats.cancelled > 0 && `${stats.cancelled} cancelled`}
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Orders & Revenue Line Chart */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Weekly Orders & Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis yAxisId="left" stroke="#64748b" />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="orders"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Orders"
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Revenue (৳)"
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie Chart */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Order Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
              No order data available
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Revenue Bar Chart */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Top Categories by Revenue</h3>
          {categoryStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value: number | undefined) => `৳${(value ?? 0).toFixed(2)}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue (৳)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
              No category data available
            </div>
          )}
        </div>

        {/* Category Orders Bar Chart */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Top Categories by Orders</h3>
          {categoryStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="orders" fill="#06b6d4" name="Orders" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
              No category data available
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-100">
              <FaBox className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Categories</p>
              <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100">
              <FaBox className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Products</p>
              <p className="text-2xl font-bold text-slate-900">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-100">
              <FaTimesCircle className="text-red-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Cancelled Orders</p>
              <p className="text-2xl font-bold text-slate-900">{stats.cancelled}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;


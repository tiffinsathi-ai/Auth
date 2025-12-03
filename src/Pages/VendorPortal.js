// pages/VendorPortal.js
import React, { useState, useEffect } from "react";
import {
  Package,
  Users,
  LogOut,
  User,
  ChefHat,
  Calendar,
  Truck,
  RefreshCw,
  AlertCircle,
  Clock,
  Filter,
  CheckCircle,
  Mail,
  Phone,
  DollarSign,
  Package as PackageIcon,
  Search,
  Eye,
  TrendingUp,
  UserCheck,
  Shield,
  Home,
  X,
  ShoppingBag,
  BarChart,
  MessageSquare,
  Bell
} from "lucide-react";

const API_BASE = "http://localhost:8080/api";

const VendorPortal = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [upcomingOrders, setUpcomingOrders] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [subscriptionFilter, setSubscriptionFilter] = useState("ALL");
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [selectedDeliveryPartner, setSelectedDeliveryPartner] = useState({});
  
  // Customer Management State
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  
  // Stats State
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalCustomers: 0,
    todayOrders: 0,
    pendingOrders: 0
  });

  // Notifications State
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New order received from John Doe", time: "10 min ago", read: false, type: "order" },
    { id: 2, message: "Subscription #SUB123 is about to expire", time: "1 hour ago", read: false, type: "subscription" },
    { id: 3, message: "Delivery partner assigned to order #456", time: "2 hours ago", read: true, type: "delivery" }
  ]);

  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders();
      loadUpcomingOrders();
      loadDeliveryPartners();
      loadTodayStats();
    } else if (activeTab === "subscriptions") {
      loadAllSubscriptions();
    } else if (activeTab === "customers") {
      loadCustomers();
    } else if (activeTab === "dashboard") {
      loadDashboardStats();
    }
  }, [activeTab, selectedDate]);

  const getToken = () => localStorage.getItem("token");

  // Dashboard Functions
  const loadDashboardStats = async () => {
    try {
      // Load today's orders for stats
      const ordersRes = await fetch(`${API_BASE}/orders/vendor?date=${selectedDate}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const todayOrders = Array.isArray(ordersData) ? ordersData : [];
        
        // Load customers count
        const customersRes = await fetch(`${API_BASE}/vendors/customers`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        });
        
        let customersData = [];
        if (customersRes.ok) {
          customersData = await customersRes.json();
        }
        
        // Load subscriptions
        const subsRes = await fetch(`${API_BASE}/subscriptions/vendor/active`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        });
        
        let activeSubs = [];
        if (subsRes.ok) {
          activeSubs = await subsRes.json();
        }
        
        setStats({
          totalOrders: todayOrders.length,
          totalRevenue: todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
          activeSubscriptions: Array.isArray(activeSubs) ? activeSubs.length : 0,
          totalCustomers: Array.isArray(customersData) ? customersData.length : 0,
          todayOrders: todayOrders.length,
          pendingOrders: todayOrders.filter(o => o.status === "PENDING").length
        });
      }
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    }
  };

  const loadTodayStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/today`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        const todayOrders = Array.isArray(data) ? data : [];
        
        setStats(prev => ({
          ...prev,
          todayOrders: todayOrders.length,
          pendingOrders: todayOrders.filter(o => o.status === "PENDING" || o.status === "CONFIRMED").length
        }));
      }
    } catch (err) {
      console.error("Error loading today stats:", err);
    }
  };

  // Orders Functions
  const loadOrders = async () => {
    setLoading(true);
    setError("");
    setDebugInfo("");
    try {
      const url = `${API_BASE}/orders/vendor?date=${selectedDate}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      setDebugInfo(`Loaded ${Array.isArray(data) ? data.length : 0} orders for ${selectedDate}`);
      setOrders(Array.isArray(data) ? data : []);
      
    } catch (err) {
      setError(`Failed to load orders: ${err.message}`);
      setDebugInfo(`Error: ${err.message}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingOrders = async () => {
    setLoadingUpcoming(true);
    try {
      const res = await fetch(`${API_BASE}/orders/vendor/upcoming`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      setUpcomingOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setUpcomingOrders([]);
    } finally {
      setLoadingUpcoming(false);
    }
  };

  const loadDeliveryPartners = async () => {
    try {
      const res = await fetch(`${API_BASE}/delivery-partners/vendor/my-partners`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setDeliveryPartners(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading delivery partners:", err);
    }
  };

  const updateOrderStatus = async (orderId, status, deliveryPersonId = null) => {
    try {
      let url = `${API_BASE}/orders/${orderId}/status?status=${status}`;
      if (deliveryPersonId) {
        url += `&deliveryPersonId=${deliveryPersonId}`;
      }

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        loadOrders();
        // Add notification
        setNotifications(prev => [{
          id: Date.now(),
          message: `Order #${orderId} status updated to ${status}`,
          time: "Just now",
          read: false,
          type: "order"
        }, ...prev]);
      } else {
        throw new Error("Failed to update order status");
      }
    } catch (err) {
      setError("Failed to update order status");
    }
  };

  const assignDeliveryPartner = async (orderId, partnerId) => {
    try {
      if (!partnerId) {
        setError("Please select a delivery partner");
        return;
      }

      const partner = deliveryPartners.find(p => p.partnerId === partnerId);
      setSelectedDeliveryPartner({...selectedDeliveryPartner, [orderId]: partner});

      await updateOrderStatus(orderId, "ASSIGNED", partnerId);
    } catch (err) {
      setError("Failed to assign delivery partner");
    }
  };

  // Subscriptions Functions
  const loadAllSubscriptions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/subscriptions/vendor/all`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllSubscriptions(data);
      } else {
        setAllSubscriptions([]);
      }
    } catch (err) {
      setError(`Failed to load subscriptions: ${err.message}`);
      setAllSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Customer Functions
  const loadCustomers = async (searchName = "", searchPhone = "") => {
    setLoadingCustomers(true);
    setError("");
    try {
      let url = `${API_BASE}/vendors/customers`;
      
      const params = new URLSearchParams();
      if (searchName) params.append('name', searchName);
      if (searchPhone) params.append('phone', searchPhone);
      
      const queryString = params.toString();
      if (queryString) {
        url = `${API_BASE}/vendors/customers/search?${queryString}`;
      }
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      setError(`Failed to load customers: ${err.message}`);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadCustomers(searchQuery, searchPhone);
  };

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const handleSendMessage = (customer) => {
    alert(`Message feature would open for ${customer.userName}`);
  };

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Helper Functions
  const statusColor = (status) => {
    const map = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
      PREPARING: "bg-orange-100 text-orange-800 border-orange-200",
      READY_FOR_DELIVERY: "bg-purple-100 text-purple-800 border-purple-200",
      OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-800 border-indigo-200",
      PICKED_UP: "bg-blue-100 text-blue-800 border-blue-200",
      ON_THE_WAY: "bg-purple-100 text-purple-800 border-purple-200",
      ARRIVED: "bg-teal-100 text-teal-800 border-teal-200",
      DELIVERED: "bg-green-100 text-green-800 border-green-200",
      CANCELLED: "bg-red-100 text-red-800 border-red-200",
      FAILED: "bg-gray-100 text-gray-800 border-gray-200",
      COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
      PAUSED: "bg-amber-100 text-amber-800 border-amber-200",
      ASSIGNED: "bg-indigo-100 text-indigo-800 border-indigo-200"
    };
    return map[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const subscriptionStatusColor = (status) => {
    const map = {
      ACTIVE: "bg-green-100 text-green-800 border-green-200",
      PAUSED: "bg-amber-100 text-amber-800 border-amber-200",
      CANCELLED: "bg-red-100 text-red-800 border-red-200",
      COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200"
    };
    return map[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const orderCountByStatus = (status) =>
    orders.filter((o) => o.status === status).length;

  const filteredSubscriptions = subscriptionFilter === "ALL" 
    ? allSubscriptions 
    : allSubscriptions.filter(sub => sub.status === subscriptionFilter);

  const allStatuses = [...new Set(orders.map(order => order.status))];

  // Render Functions
  const renderDashboard = () => {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.businessName || "Vendor"}!</h1>
              <p className="opacity-90">Here's what's happening with your business today</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <p className="opacity-90 mt-1">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Orders"
            value={stats.todayOrders}
            icon={ShoppingBag}
            color="blue"
            change="+12% from yesterday"
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.activeSubscriptions}
            icon={Users}
            color="green"
            change="+5 this week"
          />
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={UserCheck}
            color="purple"
            change="+3 new this month"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={Clock}
            color="orange"
            change="Requires attention"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ActionButton
              icon={Package}
              label="View Orders"
              onClick={() => setActiveTab("orders")}
              color="blue"
            />
            <ActionButton
              icon={Users}
              label="Manage Customers"
              onClick={() => setActiveTab("customers")}
              color="green"
            />
            <ActionButton
              icon={Truck}
              label="Delivery Partners"
              onClick={() => loadDeliveryPartners()}
              color="purple"
            />
            <ActionButton
              icon={BarChart}
              label="View Reports"
              onClick={() => alert("Reports feature coming soon!")}
              color="orange"
            />
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <button 
              onClick={() => setActiveTab("orders")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-4">
            {orders.slice(0, 5).map(order => (
              <div key={order.orderId} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${statusColor(order.status)}`}>
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Order #{order.orderId}</p>
                    <p className="text-sm text-gray-500">{order.customer?.userName || "Customer"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">{order.preferredDeliveryTime || "No time specified"}</p>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Customers */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Customers</h2>
            <button 
              onClick={() => setActiveTab("customers")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-4">
            {customers.slice(0, 5).map(customer => (
              <div key={customer.userId} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-4">
                  {customer.profilePicture ? (
                    <img src={customer.profilePicture} alt={customer.userName} className="h-10 w-10 rounded-full" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{customer.userName}</p>
                    <p className="text-sm text-gray-500">{customer.phoneNumber || "No phone"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Rs. {customer.totalSpent?.toLocaleString() || "0"}</p>
                  <p className="text-xs text-gray-500">{customer.totalSubscriptions || 0} subscriptions</p>
                </div>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No customers yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadOrders();
                loadUpcomingOrders();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Order Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          {allStatuses.map((status) => (
            <div key={status} className="bg-white p-4 rounded-lg border text-center shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{orderCountByStatus(status)}</div>
              <div className={`text-xs uppercase mt-1 px-2 py-1 rounded-full ${statusColor(status)}`}>
                {status.replace(/_/g, ' ')}
              </div>
            </div>
          ))}
          {allStatuses.length === 0 && (
            <div className="col-span-8 text-center py-4 text-gray-500">
              No orders found for selected date
            </div>
          )}
        </div>

        {/* Today's Orders */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Today's Orders ({selectedDate})
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border rounded-lg p-12 text-center shadow-sm">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500 mb-4">No orders for {selectedDate}</p>
              <button
                onClick={loadOrders}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Check Again
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <OrderCard 
                  key={order.orderId} 
                  order={order} 
                  deliveryPartners={deliveryPartners}
                  onUpdateStatus={updateOrderStatus}
                  onAssignDelivery={assignDeliveryPartner}
                  selectedDeliveryPartner={selectedDeliveryPartner[order.orderId]}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Orders */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Upcoming Orders (Next 7 Days)
            </h3>
          </div>

          {loadingUpcoming ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading upcoming orders...</p>
            </div>
          ) : upcomingOrders.length === 0 ? (
            <div className="bg-white border rounded-lg p-8 text-center shadow-sm">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming orders for the next 7 days.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {upcomingOrders.map((order) => (
                <OrderCard 
                  key={order.orderId} 
                  order={order} 
                  deliveryPartners={deliveryPartners}
                  onUpdateStatus={updateOrderStatus}
                  onAssignDelivery={assignDeliveryPartner}
                  selectedDeliveryPartner={selectedDeliveryPartner[order.orderId]}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSubscriptions = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Subscriptions</h2>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={subscriptionFilter}
                onChange={(e) => setSubscriptionFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Subscriptions</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Showing {filteredSubscriptions.length} of {allSubscriptions.length} subscriptions
            </span>
            <button
              onClick={loadAllSubscriptions}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subscriptions...</p>
          </div>
        ) : !Array.isArray(filteredSubscriptions) || filteredSubscriptions.length === 0 ? (
          <EmptyState 
            text={`No ${subscriptionFilter === 'ALL' ? '' : subscriptionFilter.toLowerCase() + ' '}subscriptions found`} 
          />
        ) : (
          <div className="grid gap-6">
            {filteredSubscriptions.map((subscription) => (
              <div
                key={subscription.subscriptionId}
                className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      Subscription #{subscription.subscriptionId}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Customer: {subscription.customer?.userName || subscription.customer?.fullName || 'N/A'} • 
                      Phone: {subscription.customer?.phoneNumber || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Period: {new Date(subscription.startDate).toLocaleDateString()} -{" "}
                      {new Date(subscription.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total Amount: Rs. {subscription.totalAmount || 'N/A'}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${subscriptionStatusColor(
                      subscription.status
                    )}`}
                  >
                    {subscription.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="text-gray-700">Delivery Time:</strong>{" "}
                    {subscription.preferredDeliveryTime || "N/A"}
                  </div>
                  <div>
                    <strong className="text-gray-700">Address:</strong>{" "}
                    {subscription.deliveryAddress}
                  </div>
                  {subscription.landmark && (
                    <div>
                      <strong className="text-gray-700">Landmark:</strong>{" "}
                      {subscription.landmark}
                    </div>
                  )}
                  {subscription.dietaryNotes && (
                    <div className="md:col-span-2">
                      <strong className="text-gray-700">Dietary Notes:</strong>{" "}
                      {subscription.dietaryNotes}
                    </div>
                  )}
                  {subscription.specialInstructions && (
                    <div className="md:col-span-2">
                      <strong className="text-gray-700">Special Instructions:</strong>{" "}
                      {subscription.specialInstructions}
                    </div>
                  )}
                </div>

                {subscription.payment && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <strong className="text-gray-700">Payment: </strong>
                    {subscription.payment.paymentStatus} • 
                    {subscription.payment.paymentMethod && ` ${subscription.payment.paymentMethod}`}
                    {subscription.payment.transactionId && ` • Transaction: ${subscription.payment.transactionId}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCustomers = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
            <p className="text-gray-600 mt-1">Manage all customers who have subscribed to your services</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Total Customers: {customers.length}
            </span>
            <button
              onClick={() => loadCustomers()}
              disabled={loadingCustomers}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingCustomers ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search by Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter customer name..."
                  className="pl-10 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search by Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Enter phone number..."
                  className="pl-10 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
              {(searchQuery || searchPhone) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchPhone("");
                    loadCustomers();
                  }}
                  className="ml-2 text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Customers"
            value={customers.length}
            icon={UserCheck}
            color="blue"
          />
          <StatCard
            title="Active Subscriptions"
            value={customers.reduce((sum, customer) => sum + (customer.activeSubscriptions || 0), 0)}
            icon={PackageIcon}
            color="green"
          />
          <StatCard
            title="Total Revenue"
            value={`Rs. ${customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0).toLocaleString()}`}
            icon={DollarSign}
            color="emerald"
          />
          <StatCard
            title="Avg. Subscriptions"
            value={customers.length > 0 
              ? (customers.reduce((sum, customer) => sum + (customer.totalSubscriptions || 0), 0) / customers.length).toFixed(1)
              : 0}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* Customer List */}
        {loadingCustomers ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customers...</p>
          </div>
        ) : !Array.isArray(customers) || customers.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center shadow-sm">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || searchPhone 
                ? "No customers match your search criteria" 
                : "No customers have subscribed to your services yet"}
            </p>
            <button
              onClick={() => loadCustomers()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Refresh List
            </button>
          </div>
        ) : (
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscriptions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {customer.profilePicture ? (
                            <img
                              src={customer.profilePicture}
                              alt={customer.userName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.userName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {customer.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phoneNumber || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {customer.totalSubscriptions || 0}
                            </div>
                            <div className="text-xs text-gray-500">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {customer.activeSubscriptions || 0}
                            </div>
                            <div className="text-xs text-gray-500">Active</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          Rs. {(customer.totalSpent || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.totalOrders || 0} orders
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.userStatus === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.userStatus || 'N/A'}
                        </span>
                        {customer.currentSubscriptionStatus && (
                          <div className="mt-1 text-xs text-gray-500">
                            {customer.currentSubscriptionStatus}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewCustomerDetails(customer)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            onClick={() => handleSendMessage(customer)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1 ml-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customer Details Modal */}
        {showCustomerDetails && selectedCustomer && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <h3 className="text-xl font-bold text-gray-900">Customer Details</h3>
                <button
                  onClick={() => setShowCustomerDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer Profile */}
                <div className="md:col-span-1">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex flex-col items-center">
                      {selectedCustomer.profilePicture ? (
                        <img
                          src={selectedCustomer.profilePicture}
                          alt={selectedCustomer.userName}
                          className="h-24 w-24 rounded-full object-cover mb-4"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                          <User className="h-12 w-12 text-gray-500" />
                        </div>
                      )}
                      <h4 className="text-lg font-bold text-gray-900">{selectedCustomer.userName}</h4>
                      <p className="text-gray-600">Customer ID: {selectedCustomer.userId}</p>
                    </div>
                    
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedCustomer.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedCustomer.phoneNumber || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className={`text-sm px-2 py-1 rounded ${
                          selectedCustomer.userStatus === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedCustomer.userStatus || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Customer Stats */}
                <div className="md:col-span-2">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedCustomer.totalSubscriptions || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Subscriptions</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedCustomer.activeSubscriptions || 0}
                      </div>
                      <div className="text-sm text-gray-600">Active Subscriptions</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedCustomer.totalOrders || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Orders</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">
                        Rs. {(selectedCustomer.totalSpent || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Spent</div>
                    </div>
                  </div>
                  
                  {/* Current Subscription */}
                  {selectedCustomer.currentSubscriptionId && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h5 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <PackageIcon className="h-4 w-4" />
                        Current Subscription
                      </h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            selectedCustomer.currentSubscriptionStatus === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedCustomer.currentSubscriptionStatus}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Package:</span>
                          <span className="ml-2 font-medium">{selectedCustomer.currentPackageName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Start Date:</span>
                          <span className="ml-2">
                            {selectedCustomer.currentSubscriptionStart 
                              ? new Date(selectedCustomer.currentSubscriptionStart).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">End Date:</span>
                          <span className="ml-2">
                            {selectedCustomer.currentSubscriptionEnd
                              ? new Date(selectedCustomer.currentSubscriptionEnd).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Dietary Notes */}
                  {selectedCustomer.dietaryNotes && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h5 className="font-bold text-gray-900 mb-2">Dietary Notes</h5>
                      <p className="text-sm text-gray-700">{selectedCustomer.dietaryNotes}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                <button
                  onClick={() => handleSendMessage(selectedCustomer)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </button>
                <button
                  onClick={() => setShowCustomerDetails(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-green-600" />
            <h1 className="text-xl font-bold">Vendor Portal</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border hidden">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold">Notifications</h3>
                    <button onClick={clearAllNotifications} className="text-sm text-blue-600 hover:text-blue-800">
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map(notification => (
                    <div key={notification.id} className={`p-4 border-b hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <button onClick={() => markNotificationAsRead(notification.id)} className="text-xs text-blue-600 hover:text-blue-800">
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.businessName || user?.vendorName || "Vendor"}</p>
                <p className="text-xs text-gray-500">Vendor Account</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-black"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Debug Info */}
      {debugInfo && (
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded text-sm">
            {debugInfo}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 flex gap-8 overflow-x-auto">
          <TabButton
            label="Dashboard"
            icon={Home}
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <TabButton
            label="Order Management"
            icon={Package}
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
          />
          <TabButton
            label="Subscriptions"
            icon={Users}
            active={activeTab === "subscriptions"}
            onClick={() => setActiveTab("subscriptions")}
          />
          <TabButton
            label="Customers"
            icon={UserCheck}
            active={activeTab === "customers"}
            onClick={() => setActiveTab("customers")}
          />
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}
        
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "orders" && renderOrders()}
        {activeTab === "subscriptions" && renderSubscriptions()}
        {activeTab === "customers" && renderCustomers()}
      </main>
    </div>
  );
};

// Helper Components
const OrderCard = ({ order, deliveryPartners, onUpdateStatus, onAssignDelivery, selectedDeliveryPartner, showActions }) => {
  const statusColor = (status) => {
    const map = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
      PREPARING: "bg-orange-100 text-orange-800 border-orange-200",
      READY_FOR_DELIVERY: "bg-purple-100 text-purple-800 border-purple-200",
      ASSIGNED: "bg-indigo-100 text-indigo-800 border-indigo-200",
      OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800 border-purple-200",
      PICKED_UP: "bg-blue-100 text-blue-800 border-blue-200",
      ARRIVED: "bg-teal-100 text-teal-800 border-teal-200",
      DELIVERED: "bg-green-100 text-green-800 border-green-200",
      CANCELLED: "bg-red-100 text-red-800 border-red-200",
      FAILED: "bg-gray-100 text-gray-800 border-gray-200",
      COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
      PAUSED: "bg-amber-100 text-amber-800 border-amber-200"
    };
    return map[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            Order #{order.orderId}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Customer: {order.customer?.userName || "N/A"} • 
            Phone: {order.customer?.phoneNumber || "N/A"}
          </p>
          <p className="text-sm text-gray-500">
            Delivery: {order.deliveryDate} at {order.preferredDeliveryTime || "N/A"}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColor(
            order.status
          )}`}
        >
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Meals</h4>
        <div className="space-y-2">
          {order.orderMeals?.map((meal, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>
                {meal.mealSetName} ({meal.mealSetType})
              </span>
              <span className="font-medium">Qty: {meal.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          <strong>Address:</strong> {order.deliveryAddress}
        </p>
      </div>

      {order.specialInstructions && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Instructions:</strong> {order.specialInstructions}
          </p>
        </div>
      )}

      {showActions && (
        <div className="flex gap-2 flex-wrap">
          {order.status === "PENDING" && (
            <ActionButton
              label="Start Preparing"
              color="orange"
              onClick={() => onUpdateStatus(order.orderId, "PREPARING")}
            />
          )}

          {order.status === "PREPARING" && (
            <ActionButton
              label="Mark Ready"
              color="purple"
              onClick={() => onUpdateStatus(order.orderId, "READY_FOR_DELIVERY")}
            />
          )}

          {order.status === "READY_FOR_DELIVERY" && (
            <div className="flex gap-2 items-center w-full">
              <select
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
                onChange={(e) => {
                  onAssignDelivery(order.orderId, e.target.value);
                }}
                defaultValue=""
              >
                <option value="" disabled>Select Delivery Partner</option>
                {deliveryPartners
                  .filter(partner => partner.isActive)
                  .map(partner => (
                    <option key={partner.partnerId} value={partner.partnerId}>
                      {partner.name} {partner.phoneNumber ? `(${partner.phoneNumber})` : ''}
                    </option>
                  ))
                }
              </select>
            </div>
          )}

          {(order.status === "ASSIGNED" || 
            order.status === "PICKED_UP" || 
            order.status === "OUT_FOR_DELIVERY" || 
            order.status === "ARRIVED") && (
            <div className="flex items-center gap-2 text-sm text-gray-600 w-full">
              <Truck className="h-4 w-4" />
              <span>
                Assigned to: {
                  selectedDeliveryPartner?.name || 
                  deliveryPartners.find(p => p.partnerId === order.deliveryPersonId)?.name || 
                  `Delivery Partner ${order.deliveryPersonId}`
                }
              </span>
              {order.deliveryPersonId && (
                <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
              )}
            </div>
          )}

          {(order.status === "DELIVERED" || order.status === "COMPLETED") && (
            <div className="flex items-center gap-2 text-sm text-gray-600 w-full">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">Order Delivered Successfully</span>
            </div>
          )}

          {(order.status === "PENDING" || order.status === "CONFIRMED") && (
            <button
              onClick={() => onUpdateStatus(order.orderId, "CANCELLED")}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Cancel Order
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const TabButton = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium whitespace-nowrap ${
      active
        ? "border-green-500 text-green-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

const ActionButton = ({ label, color, onClick }) => {
  const colors = {
    orange: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
    purple: "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500",
    green: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    emerald: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
    blue: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
  };

  return (
    <button
      onClick={onClick}
      className={`text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors[color]}`}
    >
      {label}
    </button>
  );
};

const StatCard = ({ title, value, icon: Icon, color, change }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    purple: "text-purple-600 bg-purple-50",
    orange: "text-orange-600 bg-orange-50",
    emerald: "text-emerald-600 bg-emerald-50"
  };

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {change && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {change}
          </span>
        )}
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
};

const EmptyState = ({ text }) => (
  <div className="bg-white border rounded-lg p-12 text-center shadow-sm">
    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-500">{text}</p>
  </div>
);

export default VendorPortal;  
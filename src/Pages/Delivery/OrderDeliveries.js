// pages/DeliveryDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Truck,
  User,
  Navigation,
  Calendar,
  TrendingUp,
    BarChart3,
  RefreshCw
} from 'lucide-react';
import { deliveryApi } from '../../services/deliveryApi';
import MapModal from '../../components/Delivery/MapModal';

const OrderDeliveries = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    todayOrders: 0
  });
  const [todayOrders, setTodayOrders] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUserProfile(),
        fetchTodayOrders(),
        fetchRecentOrders()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const userData = await deliveryApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchTodayOrders = async () => {
    try {
      const response = await deliveryApi.getTodaysMyOrders();
      const orders = response.data || [];
      
      setTodayOrders(orders);
      
      // Calculate stats
      const completed = orders.filter(order => 
        order.status === 'DELIVERED' || order.status === 'COMPLETED'
      ).length;
      
      const pending = orders.filter(order => 
        order.status === 'PENDING' || order.status === 'CONFIRMED'
      ).length;
      
      const inProgress = orders.filter(order => 
        order.status === 'PREPARING' || order.status === 'READY_FOR_DELIVERY' || 
        order.status === 'PICKED_UP' || order.status === 'OUT_FOR_DELIVERY'
      ).length;

      setStats({
        totalOrders: orders.length,
        completed,
        pending,
        inProgress,
        todayOrders: orders.length
      });
    } catch (error) {
      console.error('Error fetching today orders:', error);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await deliveryApi.getMyOrders();
      const orders = response.data || [];
      // Get last 5 orders for recent activity
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleViewLocation = (order) => {
    setSelectedOrder(order);
    setIsMapModalOpen(true);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await deliveryApi.updateOrderStatus(orderId, newStatus);
      // Refresh data to reflect changes
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'OUT_FOR_DELIVERY':
      case 'PICKED_UP':
        return 'bg-blue-100 text-blue-800';
      case 'PREPARING':
      case 'READY_FOR_DELIVERY':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
      case 'CONFIRMED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'OUT_FOR_DELIVERY':
      case 'PICKED_UP':
        return <Truck className="h-4 w-4" />;
      case 'PREPARING':
      case 'READY_FOR_DELIVERY':
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not specified';
    return timeString;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Loading Skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-200 h-96 rounded-lg"></div>
              <div className="bg-gray-200 h-96 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.userName || 'Delivery Partner'}!
            </h1>
            <p className="text-gray-600 mt-2">
              Here's your delivery overview for today
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mt-4 sm:mt-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">
                {stats.todayOrders} today
              </span>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalOrders ? (stats.completed / stats.totalOrders) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inProgress}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-yellow-600 font-medium mt-3">
              Active deliveries
            </p>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pending}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-gray-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Ready for pickup
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Orders */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  Today's Orders
                </h2>
                <span className="bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full">
                  {todayOrders.length} orders
                </span>
              </div>
            </div>
            
            <div className="p-6">
              {todayOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No orders for today</p>
                  <p className="text-gray-400 text-sm mt-1">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayOrders.map((order) => (
                    <div key={order.orderId} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              Order #{order.orderId}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order.customer?.userName || 'Customer'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Time:</span>
                          <p className="font-medium">{formatTime(order.preferredDeliveryTime)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Meals:</span>
                          <p className="font-medium">
                            {order.orderMeals?.reduce((total, meal) => total + (meal.quantity || 0), 0) || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewLocation(order)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <MapPin className="h-4 w-4" />
                          View Map
                        </button>
                        
                        {order.status === 'READY_FOR_DELIVERY' && (
                          <button
                            onClick={() => handleStatusUpdate(order.orderId, 'PICKED_UP')}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                          >
                            <Truck className="h-4 w-4" />
                            Pick Up
                          </button>
                        )}
                        
                        {order.status === 'PICKED_UP' && (
                          <button
                            onClick={() => handleStatusUpdate(order.orderId, 'OUT_FOR_DELIVERY')}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Navigation className="h-4 w-4" />
                            Start Delivery
                          </button>
                        )}
                        
                        {order.status === 'OUT_FOR_DELIVERY' && (
                          <button
                            onClick={() => handleStatusUpdate(order.orderId, 'DELIVERED')}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-orange-600" />
                  Quick Actions
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-colors group">
                    <Truck className="h-8 w-8 text-gray-400 group-hover:text-orange-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">
                      Start Route
                    </span>
                  </button>
                  
                  <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors group">
                    <MapPin className="h-8 w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                      View All Routes
                    </span>
                  </button>
                  
                  <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors group">
                    <User className="h-8 w-8 text-gray-400 group-hover:text-green-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                      Update Profile
                    </span>
                  </button>
                  
                  <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-colors group">
                    <BarChart3 className="h-8 w-8 text-gray-400 group-hover:text-purple-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                      Performance
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Recent Activity
                </h2>
              </div>
              <div className="p-6">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.orderId} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`p-2 rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            Order #{order.orderId}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {order.customer?.userName || 'Customer'} • {order.status?.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewLocation(order)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <MapPin className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Modal */}
      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </div>
  );
};

export default OrderDeliveries;
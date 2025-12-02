// pages/DeliveryDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Filter,
  Search,
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  User,
  ChevronDown,
  ChevronUp,
  Map,
  Home,
  Flag,
  PlayCircle,
  ShieldCheck,
  Award,
  Calendar,
  Mail
} from 'lucide-react';
import { deliveryApi } from '../../services/deliveryApi';

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryProfile, setDeliveryProfile] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedOrderForMap, setSelectedOrderForMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchDeliveryProfile();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (deliveryProfile) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [deliveryProfile]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchDeliveryProfile = async () => {
    try {
      const response = await deliveryApi.getProfile();
      setDeliveryProfile(response.data);
    } catch (error) {
      console.error('Error fetching delivery profile:', error);
      setError('Failed to load delivery profile');
    }
  };

  const fetchOrders = async () => {
    if (!deliveryProfile) return;

    setLoading(true);
    setError('');
    try {
      const [todayResponse, completedResponse] = await Promise.all([
        deliveryApi.getTodaysMyOrders(),
        deliveryApi.getCompletedOrders()
      ]);

      const todayOrders = Array.isArray(todayResponse.data) ? todayResponse.data : [];
      const completed = Array.isArray(completedResponse.data) ? completedResponse.data : [];

      setOrders(todayOrders);

      // Filter active orders
      const active = todayOrders.filter(order =>
        order.status === 'ASSIGNED' ||
        order.status === 'PICKED_UP' ||
        order.status === 'OUT_FOR_DELIVERY' ||
        order.status === 'ARRIVED'
      );

      // Filter completed orders for today
      const completedToday = todayOrders.filter(order =>
        order.status === 'DELIVERED' || order.status === 'COMPLETED'
      );

      const allCompleted = [...completedToday, ...completed];

      // Sort completed orders
      const sortedCompleted = allCompleted.sort((a, b) => {
        const dateA = new Date(a.deliveryDate || a.updatedAt || a.createdAt);
        const dateB = new Date(b.deliveryDate || b.updatedAt || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setActiveOrders(active);
      setCompletedOrders(sortedCompleted);

    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Failed to load orders. Please try again.');
      setOrders([]);
      setActiveOrders([]);
      setCompletedOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const deliveryPersonId = deliveryProfile?.partnerId;
      await deliveryApi.updateOrderStatus(orderId, status, deliveryPersonId);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const pickUpOrder = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'PICKED_UP');
    } catch (error) {
      console.error('Error picking up order:', error);
    }
  };

  const startDelivery = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'OUT_FOR_DELIVERY');
    } catch (error) {
      console.error('Error starting delivery:', error);
    }
  };

  const markArrived = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'ARRIVED');
    } catch (error) {
      console.error('Error marking order as arrived:', error);
    }
  };

  const markDelivered = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'DELIVERED');
    } catch (error) {
      console.error('Error marking order as delivered:', error);
    }
  };

  const openMapModal = (order) => {
    setSelectedOrderForMap(order);
    setShowMapModal(true);
  };

  const callCustomer = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getFilteredOrders = () => {
    let filtered = [];
    switch (activeTab) {
      case 'active':
        filtered = activeOrders;
        break;
      case 'completed':
        filtered = completedOrders;
        break;
      default:
        filtered = [];
    }

    // Apply status filter for active tab
    if (activeTab === 'active' && statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply date filter for completed tab
    if (activeTab === 'completed' && dateFilter !== 'all') {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.deliveryDate || order.updatedAt || order.createdAt);

        switch (dateFilter) {
          case 'today':
            return orderDate.toDateString() === today.toDateString();
          case 'week':
            return orderDate >= startOfWeek;
          case 'month':
            return orderDate >= startOfMonth;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer?.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderId?.toString().includes(searchTerm) ||
        order.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'ASSIGNED': { label: 'Assigned', color: 'blue', step: 1, action: 'Pick Up' },
      'PICKED_UP': { label: 'Picked Up', color: 'orange', step: 2, action: 'Start Delivery' },
      'OUT_FOR_DELIVERY': { label: 'Out for Delivery', color: 'purple', step: 3, action: 'Mark Arrived' },
      'ARRIVED': { label: 'Arrived', color: 'yellow', step: 4, action: 'Mark Delivered' },
      'DELIVERED': { label: 'Delivered', color: 'green', step: 5, action: 'Completed' },
      'COMPLETED': { label: 'Completed', color: 'emerald', step: 6, action: 'Completed' }
    };
    return statusMap[status] || { label: status, color: 'gray', step: 0, action: '' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const DeliveryProgress = ({ order }) => {
    const steps = [
      { number: 1, label: 'Assigned', status: 'ASSIGNED', icon: ShieldCheck },
      { number: 2, label: 'Picked Up', status: 'PICKED_UP', icon: Package },
      { number: 3, label: 'Out for Delivery', status: 'OUT_FOR_DELIVERY', icon: Truck },
      { number: 4, label: 'Arrived', status: 'ARRIVED', icon: Flag },
      { number: 5, label: 'Delivered', status: 'DELIVERED', icon: CheckCircle },
      { number: 6, label: 'Completed', status: 'COMPLETED', icon: Award }
    ];

    const currentStep = getStatusInfo(order.status).step;

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const isUpcoming = currentStep < step.number;

            return (
              <div key={step.number} className="flex items-center">
                <div className={`flex flex-col items-center ${isUpcoming ? 'opacity-50' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isCompleted
                      ? 'bg-green-100 border-green-500 text-green-600'
                      : isCurrent
                        ? 'bg-orange-100 border-orange-500 text-orange-600'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}>
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="text-xs mt-1 text-center hidden sm:block">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-1 mx-1 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
              <p className="text-gray-600">Manage your deliveries efficiently</p>
              {deliveryProfile && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <span>{deliveryProfile.name} • {deliveryProfile.vehicleInfo || 'Delivery Partner'}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-64"
                />
              </div>
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-blue-100 text-blue-600 mr-3">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-xl font-bold text-gray-900">{activeOrders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-green-100 text-green-600 mr-3">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-xl font-bold text-gray-900">{completedOrders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-purple-100 text-purple-600 mr-3">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Today</p>
                <p className="text-xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'active', label: 'Active Orders', count: activeOrders.length },
                  { id: 'completed', label: 'Completed', count: completedOrders.length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setDateFilter('all');
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {activeTab === 'active' && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Status</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="PICKED_UP">Picked Up</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="ARRIVED">Arrived</option>
                  </select>
                </div>
              )}

              {activeTab === 'completed' && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No {activeTab} orders found</p>
                {searchTerm && (
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your search terms</p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* For completed orders, group by date */}
                {activeTab === 'completed' && (
                  (() => {
                    const groupedOrders = {};
                    filteredOrders.forEach(order => {
                      const dateKey = formatDate(order.deliveryDate);
                      if (!groupedOrders[dateKey]) {
                        groupedOrders[dateKey] = [];
                      }
                      groupedOrders[dateKey].push(order);
                    });

                    return Object.entries(groupedOrders).map(([date, dateOrders]) => (
                      <div key={date} className="mb-8">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                          <Calendar className="h-5 w-5 text-orange-600" />
                          <h3 className="text-lg font-semibold text-gray-900">{date}</h3>
                          <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                            {dateOrders.length} {dateOrders.length === 1 ? 'order' : 'orders'}
                          </span>
                        </div>
                        <div className="space-y-4">
                          {dateOrders.map((order) => (
                            <CompletedOrderCard
                              key={order.orderId}
                              order={order}
                              expandedOrder={expandedOrder}
                              toggleOrderExpand={toggleOrderExpand}
                              openMapModal={openMapModal}
                              getStatusInfo={getStatusInfo}
                              formatTime={formatTime}
                            />
                          ))}
                        </div>
                      </div>
                    ));
                  })()
                )}

                {/* For active tab */}
                {activeTab === 'active' && (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <div key={order.orderId} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">Order #{order.orderId}</h3>
                              <p className="text-sm text-gray-600">
                                {order.deliveryDate} • {order.preferredDeliveryTime || 'Anytime'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(order.status).color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                getStatusInfo(order.status).color === 'orange' ? 'bg-orange-100 text-orange-800' :
                                  getStatusInfo(order.status).color === 'purple' ? 'bg-purple-100 text-purple-800' :
                                    getStatusInfo(order.status).color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                              }`}>
                              {getStatusInfo(order.status).label}
                            </span>
                            <button
                              onClick={() => toggleOrderExpand(order.orderId)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {expandedOrder === order.orderId ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {activeTab === 'active' && <DeliveryProgress order={order} />}

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{order.customer?.userName || order.customer?.name || 'Customer'}</p>
                              {order.customer?.phoneNumber && (
                                <p className="text-sm text-gray-600">{order.customer.phoneNumber}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {order.customer?.phoneNumber && (
                              <>
                                <button
                                  onClick={() => callCustomer(order.customer.phoneNumber)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Call Customer"
                                >
                                  <Phone className="h-4 w-4" />
                                </button>
                                <a
                                  href={`https://wa.me/${order.customer.phoneNumber.replace('+', '').replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {order.status === 'ASSIGNED' && (
                            <button
                              onClick={() => pickUpOrder(order.orderId)}
                              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Package className="h-4 w-4" />
                              Pick Up Order
                            </button>
                          )}

                          {order.status === 'PICKED_UP' && (
                            <button
                              onClick={() => startDelivery(order.orderId)}
                              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <PlayCircle className="h-4 w-4" />
                              Start Delivery
                            </button>
                          )}

                          {order.status === 'OUT_FOR_DELIVERY' && (
                            <button
                              onClick={() => markArrived(order.orderId)}
                              className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                            >
                              <Flag className="h-4 w-4" />
                              Mark Arrived
                            </button>
                          )}

                          {order.status === 'ARRIVED' && (
                            <button
                              onClick={() => markDelivered(order.orderId)}
                              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Mark Delivered
                            </button>
                          )}

                          <button
                            onClick={() => openMapModal(order)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            <Map className="h-4 w-4" />
                            View Map
                          </button>
                        </div>

                        {expandedOrder === order.orderId && (
                          <div className="mt-4 space-y-4 border-t pt-4">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Delivery Address</p>
                                <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                              </div>
                            </div>

                            {order.orderMeals?.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-900 mb-2">Order Items</p>
                                <div className="space-y-2">
                                  {order.orderMeals.map((meal, index) => (
                                    <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                                      <div>
                                        <p className="font-medium text-gray-900">{meal.mealSetName}</p>
                                        <p className="text-sm text-gray-600 capitalize">{meal.mealSetType?.toLowerCase()}</p>
                                      </div>
                                      <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-sm font-medium">
                                        Qty: {meal.quantity}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {order.specialInstructions && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-yellow-800 mb-1">Special Instructions</p>
                                <p className="text-sm text-yellow-700">{order.specialInstructions}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <MapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        order={selectedOrderForMap}
        formatDate={formatDate}
      />
    </div>
  );
};

// Separate component for completed order card
const CompletedOrderCard = ({ order, expandedOrder, toggleOrderExpand, openMapModal, getStatusInfo, formatTime }) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Order #{order.orderId}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{order.preferredDeliveryTime || 'Anytime'}</span>
              {order.actualDeliveryTime && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>Delivered at {formatTime(order.actualDeliveryTime)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(order.status).color === 'green' ? 'bg-green-100 text-green-800' :
              'bg-emerald-100 text-emerald-800'
            }`}>
            {getStatusInfo(order.status).label}
          </span>
          <button
            onClick={() => toggleOrderExpand(order.orderId)}
            className="text-gray-400 hover:text-gray-600"
          >
            {expandedOrder === order.orderId ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{order.customer?.userName || order.customer?.name || 'Customer'}</p>
            {order.customer?.phoneNumber && (
              <p className="text-sm text-gray-600">{order.customer.phoneNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openMapModal(order)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            <Map className="h-3 w-3" />
            View Map
          </button>
        </div>
      </div>

      {expandedOrder === order.orderId && (
        <div className="mt-4 space-y-4 border-t pt-4">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Delivery Address</p>
              <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
            </div>
          </div>

          {order.orderMeals?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Order Items</p>
              <div className="space-y-2">
                {order.orderMeals.map((meal, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-gray-900">{meal.mealSetName}</p>
                      <p className="text-sm text-gray-600 capitalize">{meal.mealSetType?.toLowerCase()}</p>
                    </div>
                    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-sm font-medium">
                      Qty: {meal.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.specialInstructions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800 mb-1">Special Instructions</p>
              <p className="text-sm text-yellow-700">{order.specialInstructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MapModal = ({ isOpen, onClose, order, formatDate }) => {
  if (!isOpen) return null;

  const getMapUrl = (address) => {
    if (!address) return null;
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;
  };

  // Extract customer info safely
  const customerName = order?.customer?.userName ||
    order?.customer?.name ||
    order?.customerName ||
    'Customer';

  const customerPhone = order?.customer?.phoneNumber ||
    order?.customerPhone ||
    order?.phoneNumber;

  const customerEmail = order?.customer?.email;

  const deliveryAddress = order?.deliveryAddress ||
    order?.address ||
    'No address provided';

  // Get customer profile picture with fallbacks
  const getCustomerProfilePicture = () => {
    // Check multiple possible locations for profile picture
    const profilePic = order?.customer?.profilePicture ||
      order?.customer?.avatar ||
      order?.customer?.image ||
      order?.profilePicture;

    if (!profilePic) return null;

    // Handle different formats
    if (profilePic.startsWith("data:image/")) {
      return profilePic;
    } else if (profilePic.startsWith("http")) {
      return profilePic;
    } else if (profilePic.startsWith("/9j/") || profilePic.startsWith("iVBORw")) {
      return `data:image/jpeg;base64,${profilePic}`;
    } else {
      // Assume it's a base64 string
      return `data:image/jpeg;base64,${profilePic}`;
    }
  };

  const customerProfilePicture = getCustomerProfilePicture();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Delivery Location - Order #{order?.orderId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Info Section with Profile Picture */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {/* Profile Picture */}
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-md flex-shrink-0">
                {customerProfilePicture ? (
                  <img
                    src={customerProfilePicture}
                    alt={customerName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="w-full h-full bg-blue-100 flex items-center justify-center">
                          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                )}
              </div>

              {/* Customer Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{customerName}</p>

                    {/* Customer Status Badge */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">Customer</span>
                    </div>
                  </div>

                  {/* Order Status */}
                  {order?.status && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'DELIVERED' || order.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'OUT_FOR_DELIVERY'
                          ? 'bg-purple-100 text-purple-800'
                          : order.status === 'ARRIVED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'PICKED_UP'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                      }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Contact Information */}
                <div className="mt-3 space-y-2">
                  {customerPhone && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="h-3 w-3 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <a
                          href={`tel:${customerPhone}`}
                          className="text-gray-700 hover:text-green-600 transition-colors"
                        >
                          {customerPhone}
                        </a>
                      </div>
                    </div>
                  )}

                  {customerEmail && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="h-3 w-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <a
                          href={`mailto:${customerEmail}`}
                          className="text-gray-700 hover:text-blue-600 transition-colors text-sm"
                        >
                          {customerEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Home className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">Delivery Address</p>
                  {order?.deliveryDate && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(order.deliveryDate)}</span>
                    </div>
                  )}
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{deliveryAddress}</p>
                  </div>

                  {/* Special Instructions */}
                  {order?.specialInstructions && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                          <svg className="h-3 w-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-yellow-800">Special Instructions:</p>
                      </div>
                      <p className="text-sm text-yellow-700 ml-7">{order.specialInstructions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            {deliveryAddress && deliveryAddress !== 'No address provided' ? (
              <div className="h-80 w-full">
                <iframe
                  src={getMapUrl(deliveryAddress)}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Delivery Location Map"
                />
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                <Map className="h-12 w-12 mb-3 text-gray-400" />
                <p className="text-gray-600">No address available for mapping</p>
                <p className="text-sm text-gray-500 mt-1">Please check the delivery address</p>
              </div>
            )}
          </div>

          {/* Order Details Summary */}
          {order?.orderMeals?.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-gray-600" />
                <p className="font-semibold text-gray-900">Order Summary</p>
                <span className="ml-auto text-sm text-gray-600">
                  {order.orderMeals.reduce((total, meal) => total + (meal.quantity || 1), 0)} items
                </span>
              </div>
              <div className="space-y-2">
                {order.orderMeals.map((meal, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div>
                      <p className="font-medium text-gray-900">{meal.mealSetName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="capitalize">{meal.mealSetType?.toLowerCase()}</span>
                        {meal.mealSetCategory && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="capitalize">{meal.mealSetCategory}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-900 font-medium">
                        Qty: {meal.quantity || 1}
                      </span>
                      {meal.price && (
                        <span className="text-green-600 font-medium">
                          ₹{(meal.price * (meal.quantity || 1)).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Order Total */}
                {order.totalAmount && (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded border border-green-100">
                    <span className="font-semibold text-gray-900">Order Total</span>
                    <span className="text-lg font-bold text-green-600">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {deliveryAddress && deliveryAddress !== 'No address provided' && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(deliveryAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Navigation className="h-5 w-5" />
                Get Directions
              </a>
            )}

            {customerPhone && (
              <>
                <a
                  href={`tel:${customerPhone}`}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  Call Customer
                </a>

                <a
                  href={`https://wa.me/${customerPhone.replace('+', '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
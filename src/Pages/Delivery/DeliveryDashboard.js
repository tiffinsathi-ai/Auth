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
  CheckSquare
} from 'lucide-react';
import { deliveryApi } from '../../services/deliveryApi';

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [upcomingOrders, setUpcomingOrders] = useState([]);
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
      const [todayResponse, myOrdersResponse, completedResponse] = await Promise.all([
        deliveryApi.getTodaysOrders(),
        deliveryApi.getMyOrders(),
        deliveryApi.getCompletedOrders()
      ]);

      const todayOrders = Array.isArray(todayResponse.data) ? todayResponse.data : [];
      const myOrders = Array.isArray(myOrdersResponse.data) ? myOrdersResponse.data : [];
      const completed = Array.isArray(completedResponse.data) ? completedResponse.data : [];

      const myTodayOrders = todayOrders.filter(order => 
        order.deliveryPersonId && 
        (order.deliveryPersonId == deliveryProfile.partnerId || 
         order.deliveryPersonId === deliveryProfile.partnerId.toString())
      );

      setOrders(myTodayOrders);
      
      const active = myTodayOrders.filter(order => 
        order.status === 'OUT_FOR_DELIVERY' || 
        order.status === 'READY_FOR_DELIVERY' ||
        order.status === 'PICKED_UP'
      );
      
      const completedToday = myTodayOrders.filter(order => 
        order.status === 'DELIVERED' || order.status === 'COMPLETED'
      );
      
      setActiveOrders(active);
      setCompletedOrders([...completedToday, ...completed]);
      
      const upcoming = myOrders.filter(order => 
        order.status !== 'DELIVERED' && 
        order.status !== 'COMPLETED' &&
        !myTodayOrders.some(todayOrder => todayOrder.orderId === order.orderId)
      );
      setUpcomingOrders(upcoming);

    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Failed to load orders. Please try again.');
      setOrders([]);
      setActiveOrders([]);
      setCompletedOrders([]);
      setUpcomingOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await deliveryApi.updateOrderStatus(orderId, status, deliveryProfile.partnerId);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const pickUpOrder = async (orderId) => {
    await updateOrderStatus(orderId, 'PICKED_UP');
  };

  const markOnTheWay = async (orderId) => {
    await updateOrderStatus(orderId, 'OUT_FOR_DELIVERY');
  };

  const markArrived = async (orderId) => {
    await updateOrderStatus(orderId, 'ARRIVED');
  };

  const markDelivered = async (orderId) => {
    await updateOrderStatus(orderId, 'DELIVERED');
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
      case 'upcoming':
        filtered = upcomingOrders;
        break;
      case 'completed':
        filtered = completedOrders;
        break;
      default:
        filtered = [];
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

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
      'READY_FOR_DELIVERY': { label: 'Ready for Pickup', color: 'blue', step: 1 },
      'PICKED_UP': { label: 'Picked Up', color: 'orange', step: 2 },
      'OUT_FOR_DELIVERY': { label: 'On the Way', color: 'purple', step: 3 },
      'ARRIVED': { label: 'Arrived', color: 'yellow', step: 4 },
      'DELIVERED': { label: 'Delivered', color: 'green', step: 5 }
    };
    return statusMap[status] || { label: status, color: 'gray', step: 0 };
  };

  const DeliveryProgress = ({ order }) => {
    const steps = [
      { number: 1, label: 'Ready for Pickup', status: 'READY_FOR_DELIVERY', icon: Package },
      { number: 2, label: 'Picked Up', status: 'PICKED_UP', icon: CheckSquare },
      { number: 3, label: 'On the Way', status: 'OUT_FOR_DELIVERY', icon: Truck },
      { number: 4, label: 'Arrived', status: 'ARRIVED', icon: Flag },
      { number: 5, label: 'Delivered', status: 'DELIVERED', icon: CheckCircle }
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isCompleted 
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
                  <div className={`w-8 sm:w-12 h-1 mx-1 ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
              <p className="text-gray-600">Manage your deliveries efficiently</p>
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

      {/* Main Content */}
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-blue-100 text-blue-600 mr-3">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-xl font-bold text-gray-900">{activeOrders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <div className="rounded-full p-2 bg-orange-100 text-orange-600 mr-3">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-xl font-bold text-gray-900">{upcomingOrders.length}</p>
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
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Today</p>
                <p className="text-xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'active', label: 'Active Orders', count: activeOrders.length },
                  { id: 'upcoming', label: 'Upcoming', count: upcomingOrders.length },
                  { id: 'completed', label: 'Completed', count: completedOrders.length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab.id
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
                    <option value="READY_FOR_DELIVERY">Ready for Pickup</option>
                    <option value="PICKED_UP">Picked Up</option>
                    <option value="OUT_FOR_DELIVERY">On the Way</option>
                    <option value="ARRIVED">Arrived</option>
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
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.orderId} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow">
                    {/* Order Header */}
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusInfo(order.status).color === 'blue' ? 'bg-blue-100 text-blue-800' :
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

                    {/* Progress Bar */}
                    {activeTab === 'active' && <DeliveryProgress order={order} />}

                    {/* Customer Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.customer?.userName || 'Customer'}</p>
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
                              href={`https://wa.me/${order.customer.phoneNumber.replace('+', '')}`}
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

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {order.status === 'READY_FOR_DELIVERY' && (
                        <button
                          onClick={() => pickUpOrder(order.orderId)}
                          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <CheckSquare className="h-4 w-4" />
                          Pick Up Order
                        </button>
                      )}
                      
                      {order.status === 'PICKED_UP' && (
                        <button
                          onClick={() => markOnTheWay(order.orderId)}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Truck className="h-4 w-4" />
                          Start Delivery
                        </button>
                      )}
                      
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => markArrived(order.orderId)}
                          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Flag className="h-4 w-4" />
                          Mark Arrived
                        </button>
                      )}
                      
                      {(order.status === 'ARRIVED' || order.status === 'OUT_FOR_DELIVERY') && (
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

                    {/* Expanded Details */}
                    {expandedOrder === order.orderId && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        {/* Delivery Address */}
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Delivery Address</p>
                            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                          </div>
                        </div>

                        {/* Order Items */}
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

                        {/* Special Instructions */}
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
        </div>
      </main>

      {/* Improved Map Modal */}
      <MapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        order={selectedOrderForMap}
        userLocation={userLocation}
      />
    </div>
  );
};

// Improved MapModal Component
const MapModal = ({ isOpen, onClose, order, userLocation }) => {
  if (!isOpen) return null;

  const getMapUrl = (address) => {
    if (!address) return null;
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Delivery Location - Order #{order?.orderId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{order?.customer?.userName || 'Customer'}</p>
                {order?.customer?.phoneNumber && (
                  <p className="text-sm text-gray-600">{order.customer.phoneNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            {order?.deliveryAddress ? (
              <div className="h-96 w-full">
                <iframe
                  src={getMapUrl(order.deliveryAddress)}
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
              <div className="h-64 flex items-center justify-center text-gray-500">
                <Map className="h-12 w-12 mb-2" />
                <p>No address available</p>
              </div>
            )}
          </div>

          {/* Address Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Home className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">Delivery Address</p>
                <p className="text-gray-700">{order?.deliveryAddress || 'No address provided'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {order?.deliveryAddress && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.deliveryAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Navigation className="h-5 w-5" />
                Get Directions
              </a>
            )}
            
            {order?.customer?.phoneNumber && (
              <a
                href={`tel:${order.customer.phoneNumber}`}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="h-5 w-5" />
                Call Customer
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;





// pages/DeliveryPortal.js
import React, { useState, useEffect } from 'react';
import { 
  Package, MapPin, User, Phone, LogOut, Truck, CheckCircle, Clock,
  Navigation, AlertCircle, RefreshCw, Map, Settings, Star, Wifi, WifiOff,
  Mail, MessageCircle
} from 'lucide-react';

const API_BASE = "http://localhost:8080";

const DeliveryPortal = ({ user, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [upcomingOrders, setUpcomingOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryProfile, setDeliveryProfile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedOrderForMap, setSelectedOrderForMap] = useState(null);
  const [availabilityStatus, setAvailabilityStatus] = useState('AVAILABLE');
  const [userLocation, setUserLocation] = useState(null);

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
          setError('Unable to get your current location');
        }
      );
    }
  };

  const fetchDeliveryProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/delivery/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const profileData = await response.json();
        setDeliveryProfile(profileData);
        setAvailabilityStatus(profileData.availabilityStatus || 'AVAILABLE');
      } else {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching delivery profile:', error);
      setError('Failed to load delivery profile');
    }
  };

  const toggleAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/delivery/availability`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const message = await response.text();
        setAvailabilityStatus(prev => prev === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE');
        fetchDeliveryProfile();
        console.log(message);
      } else {
        throw new Error('Failed to toggle availability');
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      setError('Failed to update availability status');
    }
  };

  const fetchOrders = async () => {
    if (!deliveryProfile) return;
    
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      
      // Fetch today's orders
      const today = new Date().toISOString().split('T')[0];
      const ordersResponse = await fetch(`${API_BASE}/api/orders/today`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!ordersResponse.ok) {
        throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
      }

      const ordersData = await ordersResponse.json();
      
      // Filter orders assigned to this delivery partner
      const myOrders = Array.isArray(ordersData) 
        ? ordersData.filter(order => 
            order.deliveryPersonId && 
            (order.deliveryPersonId == deliveryProfile.partnerId || 
             order.deliveryPersonId === deliveryProfile.partnerId.toString())
          )
        : [];
      
      setOrders(myOrders);
      
      // Separate active and completed orders
      const active = myOrders.filter(order => 
        order.status === 'OUT_FOR_DELIVERY' || 
        order.status === 'READY_FOR_DELIVERY'
      );
      
      const completed = myOrders.filter(order => 
        order.status === 'DELIVERED'
      );
      
      setActiveOrders(active);
      setCompletedOrders(completed);

      // Fetch upcoming orders
      const upcomingResponse = await fetch(`${API_BASE}/api/orders/delivery/${deliveryProfile.partnerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (upcomingResponse.ok) {
        const upcomingData = await upcomingResponse.json();
        setUpcomingOrders(Array.isArray(upcomingData) ? upcomingData : []);
      }

    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to load orders. Please try again.');
      setOrders([]);
      setActiveOrders([]);
      setCompletedOrders([]);
      setUpcomingOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status, deliveryPersonId = null) => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE}/api/orders/${orderId}/status?status=${status}`;
      if (deliveryPersonId) {
        url += `&deliveryPersonId=${deliveryPersonId}`;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchOrders();
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to update order status: ${errorText}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.message || 'Failed to update order status');
    }
  };

  const pickUpOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/status?status=OUT_FOR_DELIVERY`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchOrders();
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to pick up order: ${errorText}`);
      }
    } catch (error) {
      console.error('Error picking up order:', error);
      setError(error.message || 'Failed to pick up order');
    }
  };

  const markDelivered = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/status?status=DELIVERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchOrders();
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to mark order delivered: ${errorText}`);
      }
    } catch (error) {
      console.error('Error marking order delivered:', error);
      setError(error.message || 'Failed to mark order delivered');
    }
  };

  const openMapModal = (order) => {
    setSelectedOrderForMap(order);
    setShowMapModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'READY_FOR_DELIVERY': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'OUT_FOR_DELIVERY': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'PREPARING': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getAvailabilityColor = () => {
    switch (availabilityStatus) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-200';
      case 'BUSY': return 'bg-red-100 text-red-800 border-red-200';
      case 'OFFLINE': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const timeMap = {
      'MORNING': 'Morning (8:00 AM - 10:00 AM)',
      'LUNCH': 'Lunch (12:00 PM - 2:00 PM)',
      'EVENING': 'Evening (6:00 PM - 8:00 PM)',
      'BREAKFAST': 'Breakfast (7:00 AM - 9:00 AM)',
      'DINNER': 'Dinner (7:00 PM - 9:00 PM)'
    };
    return timeMap[timeString] || timeString;
  };

  const getStatusDisplayText = (status) => {
    const statusMap = {
      'READY_FOR_DELIVERY': 'Ready for Pickup',
      'OUT_FOR_DELIVERY': 'Out for Delivery',
      'DELIVERED': 'Delivered',
      'PENDING': 'Pending',
      'PREPARING': 'Preparing',
      'CONFIRMED': 'Confirmed'
    };
    return statusMap[status] || status?.replace(/_/g, ' ') || 'Unknown';
  };

  // Enhanced map component with user location
  const EnhancedMap = ({ address, userLocation, customer }) => {
    if (!address) return <div className="text-gray-500">No address provided</div>;
    
    const encodedAddress = encodeURIComponent(address);
    
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center p-4">
          <div className="text-center mb-4">
            <Map className="h-16 w-16 text-gray-400 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-800">Delivery Location</h4>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Customer:</strong> {customer?.userName || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Address:</strong> {address}
            </p>
          </div>
          
          {userLocation && (
            <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
              <p className="text-sm text-gray-700">
                <strong>Your Location:</strong> 
                Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
              </p>
            </div>
          )}
          
          <div className="flex space-x-3">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Open in Google Maps
            </a>
            
            {customer?.phoneNumber && (
              <a 
                href={`tel:${customer.phoneNumber}`}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Customer
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Customer Contact Component
  const CustomerContact = ({ customer }) => {
    if (!customer) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
          <User className="h-4 w-4 mr-2" />
          Customer Contact
        </h4>
        <div className="flex items-center space-x-4">
          {/* Customer Profile Picture */}
          {customer.profilePicture ? (
            <img
              src={customer.profilePicture}
              alt={customer.userName}
              className="h-12 w-12 rounded-full object-cover border-2 border-blue-300"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-300">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          )}
          
          <div className="flex-1">
            <p className="font-medium text-gray-900">{customer.userName}</p>
            <div className="flex items-center space-x-4 mt-1">
              {customer.phoneNumber && (
                <a 
                  href={`tel:${customer.phoneNumber}`}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  {customer.phoneNumber}
                </a>
              )}
              {customer.email && (
                <a 
                  href={`mailto:${customer.email}`}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-orange-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Delivery Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Availability Toggle */}
              <button
                onClick={toggleAvailability}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 font-medium transition-colors ${getAvailabilityColor()}`}
              >
                {availabilityStatus === 'AVAILABLE' ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                <span>
                  {availabilityStatus === 'AVAILABLE' ? 'Available' : 
                   availabilityStatus === 'BUSY' ? 'Busy' : 'Offline'}
                </span>
              </button>

              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center justify-between">
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

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-orange-100 p-3 mr-4">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedOrders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-purple-100 p-3 mr-4">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingOrders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Active Deliveries</h2>
            <p className="text-sm text-gray-600">Orders that need to be delivered today</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading orders...</p>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active deliveries for today</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeOrders.map((order) => (
                  <div key={order.orderId} className="border rounded-lg p-4 bg-white shadow-sm">
                    {/* Customer Contact Section */}
                    <CustomerContact customer={order.customer} />

                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Order #{order.orderId}</h3>
                        <p className="text-sm text-gray-600">
                          Delivery: {order.deliveryDate} • {formatTime(order.preferredDeliveryTime)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusDisplayText(order.status)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {order.deliveryAddress}
                      </p>
                    </div>

                    {/* Meal Package Details */}
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Order Details:</h4>
                      <div className="bg-gray-50 rounded p-3">
                        {order.orderMeals?.map((meal, index) => (
                          <div key={index} className="flex justify-between text-sm mb-1 last:mb-0">
                            <div>
                              <span className="font-medium">{meal.mealSetName}</span>
                              <span className="text-gray-500 ml-2">({meal.mealSetType})</span>
                            </div>
                            <span className="font-medium">Qty: {meal.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.specialInstructions && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-3">
                        <p className="text-sm text-yellow-800">
                          <strong>Special Instructions:</strong> {order.specialInstructions}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {order.status === 'READY_FOR_DELIVERY' && (
                        <button
                          onClick={() => pickUpOrder(order.orderId)}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center"
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          Pick Up Order
                        </button>
                      )}
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <>
                          <button
                            onClick={() => markDelivered(order.orderId)}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Delivered
                          </button>
                          <button
                            onClick={() => openMapModal(order)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 flex items-center"
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            View Map
                          </button>
                          {order.customer?.phoneNumber && (
                            <a
                              href={`tel:${order.customer.phoneNumber}`}
                              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center"
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Call
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Orders */}
        {upcomingOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Deliveries</h2>
              <p className="text-sm text-gray-600">Future orders assigned to you</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {upcomingOrders.map((order) => (
                  <div key={order.orderId} className="border rounded-lg p-4 bg-blue-50">
                    <CustomerContact customer={order.customer} />

                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Order #{order.orderId}</h3>
                        <p className="text-sm text-gray-600">
                          Delivery: {order.deliveryDate} • {formatTime(order.preferredDeliveryTime)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusDisplayText(order.status)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {order.deliveryAddress}
                      </p>
                    </div>

                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Meals:</h4>
                      <div className="space-y-1">
                        {order.orderMeals?.map((meal, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{meal.mealSetName} ({meal.mealSetType})</span>
                            <span className="font-medium">Qty: {meal.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Completed Orders */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Completed Deliveries</h2>
            <p className="text-sm text-gray-600">Orders that have been delivered</p>
          </div>
          <div className="p-6">
            {completedOrders.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No completed deliveries yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <div key={order.orderId} className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {order.customer?.profilePicture ? (
                          <img
                            src={order.customer.profilePicture}
                            alt={order.customer.userName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">Order #{order.orderId}</h3>
                          <p className="text-sm text-gray-600">
                            {order.customer?.userName || 'Customer'} • {order.deliveryDate}
                          </p>
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        Delivered
                      </span>
                    </div>
                    {order.actualDeliveryTime && (
                      <p className="text-xs text-gray-500">
                        Delivered at: {new Date(order.actualDeliveryTime).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Delivery Partner Profile</h3>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            {deliveryProfile ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {deliveryProfile.profilePicture ? (
                    <img
                      src={deliveryProfile.profilePicture}
                      alt="Profile"
                      className="h-16 w-16 rounded-full object-cover border-2 border-orange-300"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-300">
                      <User className="h-8 w-8 text-orange-600" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{deliveryProfile.name}</h4>
                    <p className="text-gray-600">{deliveryProfile.email}</p>
                    <p className="text-sm text-gray-500">Delivery Partner</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="text-gray-700">Phone:</strong>
                    <p className="text-gray-900">{deliveryProfile.phoneNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <strong className="text-gray-700">Vehicle:</strong>
                    <p className="text-gray-900">{deliveryProfile.vehicleInfo || 'N/A'}</p>
                  </div>
                  <div>
                    <strong className="text-gray-700">License:</strong>
                    <p className="text-gray-900">{deliveryProfile.licenseNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <strong className="text-gray-700">Status:</strong>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      deliveryProfile.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {deliveryProfile.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {deliveryProfile.address && (
                  <div>
                    <strong className="text-gray-700">Address:</strong>
                    <p className="text-gray-900 text-sm mt-1">{deliveryProfile.address}</p>
                  </div>
                )}

                <div className="flex space-x-2 pt-4 border-t">
                  <button
                    onClick={() => setShowProfile(false)}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading profile...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Map Modal */}
      {showMapModal && selectedOrderForMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Delivery Location - Order #{selectedOrderForMap.orderId}
              </h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <EnhancedMap 
              address={selectedOrderForMap.deliveryAddress} 
              userLocation={userLocation}
              customer={selectedOrderForMap.customer}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowMapModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
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

export default DeliveryPortal;
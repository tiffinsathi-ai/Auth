import React, { useState, useEffect } from 'react';
import { 
  Package, Clock, MapPin, CreditCard, LogOut, User, 
  ShoppingCart, CheckCircle, Plus, Minus, Calendar, 
  Utensils, AlertCircle, RefreshCw, Pause, Play, 
  X, Map as MapIcon, Navigation, Star, Truck, Locate
} from 'lucide-react';

// --- LEAFLET IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- LEAFLET ICON FIX ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- HELPER COMPONENT: Recenter Map ---
const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

// --- HELPER COMPONENT: Handle Map Clicks ---
const LocationFinderDummy = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const UserPortal = ({ user, onLogout }) => {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('packages');
  const [mealPackages, setMealPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState({
    packageId: '',
    schedule: [
      { dayOfWeek: 'MONDAY', enabled: true, meals: [] },
      { dayOfWeek: 'TUESDAY', enabled: true, meals: [] },
      { dayOfWeek: 'WEDNESDAY', enabled: true, meals: [] },
      { dayOfWeek: 'THURSDAY', enabled: true, meals: [] },
      { dayOfWeek: 'FRIDAY', enabled: true, meals: [] },
      { dayOfWeek: 'SATURDAY', enabled: false, meals: [] },
      { dayOfWeek: 'SUNDAY', enabled: false, meals: [] }
    ],
    deliveryAddress: '',
    landmark: '',
    preferredDeliveryTime: '12:00',
    dietaryNotes: '',
    specialInstructions: '',
    includePackaging: true,
    includeCutlery: false,
    discountCode: '',
    paymentMethod: 'ESEWA',
    startDate: ''
  });
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [checkoutData, setCheckoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mapModal, setMapModal] = useState({ 
    open: false, 
    address: '',
    coordinates: { lat: 27.7172, lng: 85.3240 } // Default: Kathmandu
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    fetchMealPackages();
    fetchUserSubscriptions();
    if (activeTab === 'orders') {
      fetchUserOrders();
    }
  }, [activeTab]);

  // --- LOCATION SERVICES ---
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const openMapModal = async (currentAddress = '') => {
    try {
      setError('');
      let coordinates = mapModal.coordinates;

      if (!currentAddress) {
        try {
          const gps = await getUserLocation();
          coordinates = gps;
        } catch (e) {
          console.log("GPS not available, using default");
        }
      }

      setMapModal({ 
        open: true, 
        address: currentAddress,
        coordinates: coordinates
      });

      if (!currentAddress && coordinates) {
         handleMapClick(coordinates);
      }

    } catch (error) {
      console.error('Error opening map:', error);
      setMapModal(prev => ({ ...prev, open: true }));
    }
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        let cleanAddress = data.display_name;
        if(data.address) {
             const parts = [];
             if(data.address.road) parts.push(data.address.road);
             if(data.address.suburb) parts.push(data.address.suburb);
             if(data.address.city || data.address.town || data.address.village) parts.push(data.address.city || data.address.town || data.address.village);
             if(parts.length > 0) cleanAddress = parts.join(", ");
        }
        return cleanAddress;
      }
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error("Geocoding error:", error);
      return "Location selected (Address lookup failed)";
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMapClick = async (latlng) => {
    setSelectedLocation(latlng);
    setMapModal(prev => ({...prev, coordinates: latlng}));
    
    const address = await getAddressFromCoordinates(latlng.lat, latlng.lng);
    setMapModal(prev => ({ ...prev, address: address }));
  };

  const confirmLocation = () => {
    if (mapModal.address) {
      setSubscriptionData(prev => ({
        ...prev,
        deliveryAddress: mapModal.address
      }));
      setSuccess('Delivery location set successfully!');
      closeMapModal();
    } else {
      setError('Please select a location on the map');
    }
  };

  const closeMapModal = () => {
    setMapModal({ ...mapModal, open: false });
    setSelectedLocation(null);
    setError('');
  };

  // --- DATA FETCHING FUNCTIONS ---
  const fetchMealPackages = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/meal-packages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch packages`);
      }
      
      const data = await response.json();
      setMealPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError('Failed to load meal packages');
      // Fallback mock data
      setMealPackages([
        { packageId: 1, name: 'Standard Veg', features: 'Healthy home food', pricePerSet: 250, durationDays: 30, packageSets: [{setId: 1, setName: 'Rice Set', type: 'VEG'}, {setId: 2, setName: 'Roti Set', type: 'VEG'}] },
        { packageId: 2, name: 'Premium Non-Veg', features: 'Includes chicken/mutton', pricePerSet: 350, durationDays: 30, packageSets: [{setId: 3, setName: 'Chicken Thali', type: 'NON_VEG'}, {setId: 4, setName: 'Mutton Thali', type: 'NON_VEG'}] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubscriptions = async () => {
    try {
      setSubscriptionsLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8080/api/subscriptions/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setUserSubscriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError('Failed to load subscriptions: ' + error.message);
      setUserSubscriptions([]);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      setOrdersLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const subscriptionsResponse = await fetch('http://localhost:8080/api/subscriptions/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!subscriptionsResponse.ok) {
        throw new Error(`HTTP ${subscriptionsResponse.status}: Failed to fetch subscriptions`);
      }

      const subscriptions = await subscriptionsResponse.json();
      const mockOrders = generateMockOrdersFromSubscriptions(subscriptions);
      setUserOrders(mockOrders);

    } catch (error) {
      console.error('Error fetching orders:', error);
      const mockOrders = generateMockOrders();
      setUserOrders(mockOrders);
      setError('Note: Using demo order data. Real orders will appear after subscriptions are created.');
    } finally {
      setOrdersLoading(false);
    }
  };

  const generateMockOrdersFromSubscriptions = (subscriptions) => {
    const orders = [];
    const today = new Date();
    
    subscriptions.forEach(subscription => {
      orders.push({
        orderId: Math.floor(Math.random() * 1000),
        deliveryDate: today.toISOString().split('T')[0],
        status: 'CONFIRMED',
        preferredDeliveryTime: subscription.preferredDeliveryTime || '12:00',
        deliveryAddress: subscription.deliveryAddress,
        specialInstructions: subscription.specialInstructions,
        deliveryPersonId: null,
        actualDeliveryTime: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customer: {
          userId: user.id,
          userName: user.userName,
          email: user.email,
          phoneNumber: user.phoneNumber
        },
        orderMeals: subscription.schedule && subscription.schedule[0] ? 
          subscription.schedule[0].meals.map(meal => ({
            mealSetName: `Meal Set ${meal.setId}`,
            mealSetType: 'VEG',
            quantity: meal.quantity
          })) : []
      });

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      orders.push({
        orderId: Math.floor(Math.random() * 1000),
        deliveryDate: tomorrow.toISOString().split('T')[0],
        status: 'PENDING',
        preferredDeliveryTime: subscription.preferredDeliveryTime || '12:00',
        deliveryAddress: subscription.deliveryAddress,
        specialInstructions: subscription.specialInstructions,
        deliveryPersonId: null,
        actualDeliveryTime: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customer: {
          userId: user.id,
          userName: user.userName,
          email: user.email,
          phoneNumber: user.phoneNumber
        },
        orderMeals: subscription.schedule && subscription.schedule[1] ? 
          subscription.schedule[1].meals.map(meal => ({
            mealSetName: `Meal Set ${meal.setId}`,
            mealSetType: 'NON_VEG',
            quantity: meal.quantity
          })) : []
      });
    });

    return orders;
  };

  const generateMockOrders = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      {
        orderId: 1001,
        deliveryDate: today.toISOString().split('T')[0],
        status: 'OUT_FOR_DELIVERY',
        preferredDeliveryTime: '12:30',
        deliveryAddress: '123 Main Street, Kathmandu 44600',
        specialInstructions: 'Ring bell twice',
        deliveryPersonId: 'DP001',
        actualDeliveryTime: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customer: {
          userId: user.id,
          userName: user.userName,
          email: user.email,
          phoneNumber: user.phoneNumber
        },
        orderMeals: [
          { mealSetName: 'Veg Thali', mealSetType: 'VEG', quantity: 1 },
          { mealSetName: 'Chapati', mealSetType: 'VEG', quantity: 2 }
        ]
      },
      {
        orderId: 1002,
        deliveryDate: tomorrow.toISOString().split('T')[0],
        status: 'CONFIRMED',
        preferredDeliveryTime: '13:00',
        deliveryAddress: '123 Main Street, Kathmandu 44600',
        specialInstructions: 'Leave with security',
        deliveryPersonId: null,
        actualDeliveryTime: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customer: {
          userId: user.id,
          userName: user.userName,
          email: user.email,
          phoneNumber: user.phoneNumber
        },
        orderMeals: [
          { mealSetName: 'Non-Veg Special', mealSetType: 'NON_VEG', quantity: 1 }
        ]
      }
    ];
  };

  const handlePauseSubscription = async (subscriptionId) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/subscriptions/${subscriptionId}/pause`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to pause subscription');
      }

      const updatedSubscription = await response.json();
      setUserSubscriptions(prev => 
        prev.map(sub => 
          sub.subscriptionId === subscriptionId ? updatedSubscription : sub
        )
      );
      setSuccess('Subscription paused successfully');
    } catch (error) {
      console.error('Error pausing subscription:', error);
      setError('Failed to pause subscription: ' + error.message);
    }
  };

  const handleResumeSubscription = async (subscriptionId) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/subscriptions/${subscriptionId}/resume`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to resume subscription');
      }

      const updatedSubscription = await response.json();
      setUserSubscriptions(prev => 
        prev.map(sub => 
          sub.subscriptionId === subscriptionId ? updatedSubscription : sub
        )
      );
      setSuccess('Subscription resumed successfully');
    } catch (error) {
      console.error('Error resuming subscription:', error);
      setError('Failed to resume subscription: ' + error.message);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to cancel subscription');
      }

      setUserSubscriptions(prev => 
        prev.filter(sub => sub.subscriptionId !== subscriptionId)
      );
      setSuccess('Subscription cancelled successfully');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setError('Failed to cancel subscription: ' + error.message);
    }
  };

  // --- SUBSCRIPTION LOGIC ---
  const handlePackageSelect = (mealPackage) => {
    setSelectedPackage(mealPackage);
    setSubscriptionData(prev => ({
      ...prev,
      packageId: mealPackage.packageId,
      startDate: getNextMonday()
    }));
    setActiveTab('schedule');
  };

  const getNextMonday = () => {
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    return nextMonday.toISOString().split('T')[0];
  };

  const toggleDay = (dayIndex) => {
    setSubscriptionData(prev => ({
      ...prev,
      schedule: prev.schedule.map((day, index) => 
        index === dayIndex ? { ...day, enabled: !day.enabled } : day
      )
    }));
  };

  const addMealToDay = (dayIndex, mealSet) => {
    setSubscriptionData(prev => ({
      ...prev,
      schedule: prev.schedule.map((day, index) => 
        index === dayIndex 
          ? { 
              ...day, 
              meals: [...day.meals, { setId: mealSet.setId, quantity: 1 }]
            }
          : day
      )
    }));
  };

  const updateMealQuantity = (dayIndex, mealIndex, newQuantity) => {
    if (newQuantity < 1) return;
    
    setSubscriptionData(prev => ({
      ...prev,
      schedule: prev.schedule.map((day, index) => 
        index === dayIndex 
          ? {
              ...day,
              meals: day.meals.map((meal, mIndex) =>
                mIndex === mealIndex ? { ...meal, quantity: newQuantity } : meal
              )
            }
          : day
      )
    }));
  };

  const removeMealFromDay = (dayIndex, mealIndex) => {
    setSubscriptionData(prev => ({
      ...prev,
      schedule: prev.schedule.map((day, index) => 
        index === dayIndex 
          ? {
              ...day,
              meals: day.meals.filter((_, mIndex) => mIndex !== mealIndex)
            }
          : day
      )
    }));
  };

  const calculatePricing = () => {
    if (!selectedPackage) return null;

    let subtotal = 0;
    let deliveryDaysPerWeek = 0;

    subscriptionData.schedule.forEach(day => {
      if (day.enabled) {
        deliveryDaysPerWeek++;
        day.meals.forEach(meal => {
          const mealSet = selectedPackage.packageSets.find(ms => ms.setId === meal.setId);
          if (mealSet) {
            subtotal += selectedPackage.pricePerSet * meal.quantity;
          }
        });
      }
    });

    const durationWeeks = selectedPackage.durationDays / 7;
    subtotal = subtotal * durationWeeks;
    const deliveryFee = 25 * deliveryDaysPerWeek * durationWeeks;
    const discount = calculateDiscount(subtotal + deliveryFee, subscriptionData.discountCode);
    const taxableAmount = subtotal + deliveryFee - discount;
    const tax = taxableAmount * 0.13;
    const grandTotal = subtotal + deliveryFee + tax - discount;

    return {
      subtotal,
      deliveryFee,
      tax,
      discount,
      grandTotal,
      deliveryDaysPerWeek
    };
  };

  const calculateDiscount = (amount, code) => {
    if (!code) return 0;
    switch (code.toUpperCase()) {
      case 'SAVE10': return amount * 0.10;
      case 'WELCOME15': return amount * 0.15;
      case 'FIRSTORDER': return Math.min(amount, 100);
      case 'TIFFIN5': return Math.min(amount, 50);
      default: return 0;
    }
  };

  const handleCheckout = () => {
    const pricing = calculatePricing();
    setCheckoutData({
      package: selectedPackage,
      subscriptionData,
      pricing
    });
    setActiveTab('checkout');
  };

  const handleSubmitSubscription = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!subscriptionData.deliveryAddress.trim()) {
        throw new Error('Delivery address is required');
      }
      if (!subscriptionData.startDate) {
        throw new Error('Start date is required');
      }

      const response = await fetch('http://localhost:8080/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create subscription');
      }

      const data = await response.json();
      setActiveTab('success');
      fetchUserSubscriptions();
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError('Failed to create subscription: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTodaysOrders = () => {
    const today = new Date().toISOString().split('T')[0];
    return userOrders.filter(order => order.deliveryDate === today);
  };

  const getUpcomingOrders = () => {
    const today = new Date().toISOString().split('T')[0];
    return userOrders.filter(order => order.deliveryDate > today);
  };

  const getNextOrder = () => {
    const upcoming = getUpcomingOrders();
    if (upcoming.length === 0) return null;
    
    return upcoming.sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate))[0];
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Tiffin Sathi</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span>{user.userName}</span>
              </div>
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

      {/* Success Display */}
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex justify-between items-center">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex justify-between items-center">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {mapModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Select Delivery Location</h3>
              <button
                onClick={closeMapModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 flex-1 flex flex-col overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mapModal.address}
                    onChange={(e) => setMapModal(prev => ({ ...prev, address: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Click on map to select..."
                  />
                  <button
                    onClick={() => openMapModal('')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <Locate className="h-4 w-4 mr-1" /> My GPS
                  </button>
                </div>
              </div>

              {/* MAP CONTAINER */}
              <div className="relative rounded-lg overflow-hidden border border-gray-300" style={{ height: '400px' }}>
                <MapContainer 
                  center={[mapModal.coordinates.lat, mapModal.coordinates.lng]} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  <RecenterAutomatically lat={mapModal.coordinates.lat} lng={mapModal.coordinates.lng} />
                  <LocationFinderDummy onLocationSelect={(latlng) => handleMapClick(latlng)} />

                  {selectedLocation && (
                    <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                      <Popup>Selected Location</Popup>
                    </Marker>
                  )}
                  {!selectedLocation && mapModal.coordinates && (
                     <Marker position={[mapModal.coordinates.lat, mapModal.coordinates.lng]}>
                        <Popup>You are here</Popup>
                     </Marker>
                  )}
                </MapContainer>

                {isGeocoding && (
                   <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded shadow text-xs font-bold text-blue-600 z-[1000]">
                       Finding address...
                   </div>
                )}
              </div>

              {/* Selected Location Details */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <div className="font-bold text-blue-900 text-sm">Selected Address:</div>
                  <div className="text-blue-800 text-sm">{mapModal.address || "No location selected"}</div>
                  {selectedLocation && (
                    <div className="text-xs text-blue-600 mt-1">
                      {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                    </div>
                  )}
                </div>
                {mapModal.address && <CheckCircle className="h-6 w-6 text-green-600" />}
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={closeMapModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLocation}
                  disabled={!mapModal.address}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Confirm Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'packages', name: 'Meal Packages', icon: Package },
              { id: 'orders', name: 'My Orders', icon: ShoppingCart },
              { id: 'subscriptions', name: 'My Subscriptions', icon: Clock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'subscriptions') {
                    fetchUserSubscriptions();
                  }
                  if (tab.id === 'orders') {
                    fetchUserOrders();
                  }
                }}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Meal Packages Tab */}
        {activeTab === 'packages' && (
          <div className="px-4 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Available Meal Packages</h2>
              <button
                onClick={fetchMealPackages}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading meal packages...</p>
              </div>
            ) : mealPackages.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No meal packages available</h3>
                <p className="text-gray-600">Please check back later for available meal packages.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mealPackages.map((mealPackage) => (
                  <div key={mealPackage.packageId} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{mealPackage.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{mealPackage.features}</p>
                      
                      <div className="flex items-baseline mb-4">
                        <span className="text-2xl font-bold text-gray-900">Rs. {mealPackage.pricePerSet}</span>
                        <span className="ml-1 text-sm text-gray-500">per set</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{mealPackage.durationDays} days</span>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Includes:</h4>
                        <div className="space-y-1">
                          {mealPackage.packageSets.slice(0, 3).map((set) => (
                            <div key={set.setId} className="flex items-center text-sm text-gray-600">
                              <Utensils className="h-3 w-3 mr-2" />
                              <span>{set.setName}</span>
                            </div>
                          ))}
                          {mealPackage.packageSets.length > 3 && (
                            <div className="text-sm text-gray-500">
                              +{mealPackage.packageSets.length - 3} more sets
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handlePackageSelect(mealPackage)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        Select Package
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Orders Tab */}
        {activeTab === 'orders' && (
          <div className="px-4 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
              <button
                onClick={fetchUserOrders}
                disabled={ordersLoading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {ordersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading orders...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Next Order Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    Next Order
                  </h3>
                  {getNextOrder() ? (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            Order #{getNextOrder().orderId}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Scheduled for {new Date(getNextOrder().deliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          getNextOrder().status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          getNextOrder().status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          getNextOrder().status === 'OUT_FOR_DELIVERY' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getNextOrder().status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Delivery Time</div>
                          <div className="font-semibold text-gray-900">
                            {getNextOrder().preferredDeliveryTime || 'Not specified'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Meals</div>
                          <div className="font-semibold text-gray-900">
                            {getNextOrder().orderMeals?.length || 0} items
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => openMapModal(getNextOrder().deliveryAddress)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <MapPin className="h-4 w-4" />
                          <span>View Delivery Location</span>
                        </button>
                        <div className="flex items-center text-sm text-gray-600">
                          <Truck className="h-4 w-4 mr-1" />
                          <span>Expected soon</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border p-6 text-center">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No upcoming orders</h4>
                      <p className="text-gray-600 mb-4">You don't have any upcoming orders scheduled.</p>
                      <button
                        onClick={() => setActiveTab('packages')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                      >
                        Browse Packages
                      </button>
                    </div>
                  )}
                </div>

                {/* Today's Orders Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Orders</h3>
                  {getTodaysOrders().length > 0 ? (
                    <div className="space-y-4">
                      {getTodaysOrders().map((order) => (
                        <div key={order.orderId} className="bg-white rounded-lg shadow-sm border p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                Order #{order.orderId}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'OUT_FOR_DELIVERY' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-gray-600">Delivery Time</div>
                              <div className="font-semibold text-gray-900">
                                {order.preferredDeliveryTime || 'Not specified'}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Delivery Address</div>
                              <div className="font-medium text-gray-900 flex items-center">
                                {order.deliveryAddress}
                                <button
                                  onClick={() => openMapModal(order.deliveryAddress)}
                                  className="ml-2 text-blue-600 hover:text-blue-700"
                                >
                                  <MapPin className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {order.orderMeals && order.orderMeals.length > 0 && (
                            <div className="mb-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">Order Items:</div>
                              <div className="space-y-2">
                                {order.orderMeals.map((meal, index) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center">
                                      <Utensils className="h-3 w-3 mr-2 text-gray-400" />
                                      <span>{meal.mealSetName}</span>
                                    </div>
                                    <span className="text-gray-600">x{meal.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {order.specialInstructions && (
                            <div className="mb-3">
                              <div className="text-sm text-gray-600">Special Instructions</div>
                              <div className="font-medium text-gray-900">{order.specialInstructions}</div>
                            </div>
                          )}

                          {order.actualDeliveryTime && (
                            <div className="text-sm text-gray-600">
                              Delivered at: {new Date(order.actualDeliveryTime).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border p-6 text-center">
                      <p className="text-gray-600">No orders for today.</p>
                    </div>
                  )}
                </div>

                {/* Upcoming Orders Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Orders</h3>
                  {getUpcomingOrders().length > 0 ? (
                    <div className="space-y-4">
                      {getUpcomingOrders()
                        .filter(order => order.orderId !== getNextOrder()?.orderId)
                        .map((order) => (
                        <div key={order.orderId} className="bg-white rounded-lg shadow-sm border p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                Order #{order.orderId}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {new Date(order.deliveryDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {order.status}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm text-gray-600">Delivery Time</div>
                              <div className="font-semibold text-gray-900">
                                {order.preferredDeliveryTime || 'Not specified'}
                              </div>
                            </div>
                            <button
                              onClick={() => openMapModal(order.deliveryAddress)}
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                            >
                              <MapPin className="h-4 w-4" />
                              <span>View Location</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border p-6 text-center">
                      <p className="text-gray-600">No upcoming orders beyond today.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subscription Schedule Tab */}
        {activeTab === 'schedule' && selectedPackage && (
          <div className="px-4 sm:px-0">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Customize Your Schedule</h2>
                <button
                  onClick={() => setActiveTab('packages')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  ← Back to Packages
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Days Selection */}
                <div className="lg:col-span-1">
                  <h3 className="font-medium text-gray-900 mb-3">Delivery Days</h3>
                  <div className="space-y-2">
                    {subscriptionData.schedule.map((day, index) => (
                      <label key={day.dayOfWeek} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={day.enabled}
                          onChange={() => toggleDay(index)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{day.dayOfWeek}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Meal Selection */}
                <div className="lg:col-span-3">
                  <h3 className="font-medium text-gray-900 mb-3">Meal Selection</h3>
                  <div className="space-y-4">
                    {subscriptionData.schedule.map((day, dayIndex) => (
                      <div key={day.dayOfWeek} className={`p-4 rounded-lg border ${day.enabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{day.dayOfWeek}</h4>
                          <span className={`text-sm ${day.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                            {day.enabled ? 'Delivery' : 'No Delivery'}
                          </span>
                        </div>
                        
                        {day.enabled && (
                          <div className="space-y-3">
                            {/* Available Meal Sets */}
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Add Meal Sets:
                              </label>
                              <select
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const mealSet = selectedPackage.packageSets.find(ms => ms.setId === e.target.value);
                                    if (mealSet) addMealToDay(dayIndex, mealSet);
                                    e.target.value = '';
                                  }
                                }}
                              >
                                <option value="">Select a meal set...</option>
                                {selectedPackage.packageSets.map(mealSet => (
                                  <option key={mealSet.setId} value={mealSet.setId}>
                                    {mealSet.setName} ({mealSet.type}) - Rs. {selectedPackage.pricePerSet}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Selected Meals */}
                            <div className="space-y-2">
                              {day.meals.map((meal, mealIndex) => {
                                const mealSet = selectedPackage.packageSets.find(ms => ms.setId === meal.setId);
                                return (
                                  <div key={mealIndex} className="flex items-center justify-between bg-white p-3 rounded border">
                                    <div>
                                      <div className="font-medium text-sm">{mealSet?.setName}</div>
                                      <div className="text-xs text-gray-500">{mealSet?.type}</div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => updateMealQuantity(dayIndex, mealIndex, meal.quantity - 1)}
                                        className="p-1 rounded-full hover:bg-gray-100"
                                      >
                                        <Minus className="h-4 w-4" />
                                      </button>
                                      <span className="w-8 text-center text-sm">{meal.quantity}</span>
                                      <button
                                        onClick={() => updateMealQuantity(dayIndex, mealIndex, meal.quantity + 1)}
                                        className="p-1 rounded-full hover:bg-gray-100"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => removeMealFromDay(dayIndex, mealIndex)}
                                        className="ml-2 text-red-600 hover:text-red-700 text-sm"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {day.meals.length === 0 && (
                              <div className="text-center text-sm text-gray-500 py-4">
                                No meals selected for this day
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mt-6 pt-6 border-t">
                <button
                  onClick={() => setActiveTab('packages')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleCheckout}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Continue to Checkout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Tab */}
        {activeTab === 'checkout' && checkoutData && (
          <div className="px-4 sm:px-0">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  ← Back to Schedule
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Summary */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Package Info */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Details</h3>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{checkoutData.package.name}</h4>
                        <p className="text-sm text-gray-600">{checkoutData.package.durationDays} days</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          Rs. {checkoutData.package.pricePerSet}/set
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Address *
                        </label>
                        <div className="flex gap-2">
                          <textarea
                            value={subscriptionData.deliveryAddress}
                            onChange={(e) => setSubscriptionData({...subscriptionData, deliveryAddress: e.target.value})}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="Enter your complete delivery address or click the map icon to select location"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => openMapModal(subscriptionData.deliveryAddress)}
                            className="flex-shrink-0 p-3 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                            title="Select location on map"
                          >
                            <MapPin className="h-5 w-5" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Click the map icon to pinpoint your exact delivery location
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Landmark
                        </label>
                        <input
                          type="text"
                          value={subscriptionData.landmark}
                          onChange={(e) => setSubscriptionData({...subscriptionData, landmark: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nearby landmark"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preferred Delivery Time
                          </label>
                          <select
                            value={subscriptionData.preferredDeliveryTime}
                            onChange={(e) => setSubscriptionData({...subscriptionData, preferredDeliveryTime: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="08:00">8:00 AM</option>
                            <option value="12:00">12:00 PM</option>
                            <option value="18:00">6:00 PM</option>
                            <option value="20:00">8:00 PM</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={subscriptionData.startDate}
                            onChange={(e) => setSubscriptionData({...subscriptionData, startDate: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min={getNextMonday()}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dietary Notes & Special Instructions
                        </label>
                        <textarea
                          value={subscriptionData.dietaryNotes}
                          onChange={(e) => setSubscriptionData({...subscriptionData, dietaryNotes: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                          placeholder="Any dietary restrictions or special instructions..."
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={subscriptionData.includePackaging}
                            onChange={(e) => setSubscriptionData({...subscriptionData, includePackaging: e.target.checked})}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Include Packaging</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={subscriptionData.includeCutlery}
                            onChange={(e) => setSubscriptionData({...subscriptionData, includeCutlery: e.target.checked})}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Include Cutlery</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                    <div className="space-y-3">
                      {['ESEWA', 'KHALTI', 'CARD', 'CASH_ON_DELIVERY'].map((method) => (
                        <label key={method} className="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method}
                            checked={subscriptionData.paymentMethod === method}
                            onChange={(e) => setSubscriptionData({...subscriptionData, paymentMethod: e.target.value})}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{method.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order Total */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>Rs. {checkoutData.pricing.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Delivery Fee ({checkoutData.pricing.deliveryDaysPerWeek} days/week)</span>
                        <span>Rs. {checkoutData.pricing.deliveryFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (13%)</span>
                        <span>Rs. {checkoutData.pricing.tax.toFixed(2)}</span>
                      </div>
                      {checkoutData.pricing.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>- Rs. {checkoutData.pricing.discount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-3 mb-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>Rs. {checkoutData.pricing.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Discount Code */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Code
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={subscriptionData.discountCode}
                          onChange={(e) => setSubscriptionData({...subscriptionData, discountCode: e.target.value})}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter code"
                        />
                        <button
                          onClick={() => {
                            const pricing = calculatePricing();
                            setCheckoutData({...checkoutData, pricing});
                          }}
                          className="px-3 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmitSubscription}
                      disabled={!subscriptionData.deliveryAddress || !subscriptionData.startDate || loading}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="inline h-4 w-4 mr-2" />
                      {loading ? 'Processing...' : 'Complete Subscription'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Tab */}
        {activeTab === 'success' && (
          <div className="px-4 sm:px-0">
            <div className="max-w-2xl mx-auto text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Created Successfully!</h2>
              <p className="text-gray-600 mb-6">
                Your meal subscription has been confirmed. You'll receive a confirmation email shortly.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  View My Subscriptions
                </button>
                <button
                  onClick={() => setActiveTab('packages')}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50"
                >
                  Browse More Packages
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="px-4 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Subscriptions</h2>
              <button
                onClick={fetchUserSubscriptions}
                disabled={subscriptionsLoading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${subscriptionsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            {subscriptionsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading subscriptions...</p>
              </div>
            ) : userSubscriptions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions yet</h3>
                <p className="text-gray-600 mb-4">Start by exploring our meal packages</p>
                <button
                  onClick={() => setActiveTab('packages')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Browse Packages
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {userSubscriptions.map((subscription) => (
                  <div key={subscription.subscriptionId} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Subscription #{subscription.subscriptionId}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(subscription.startDate).toLocaleDateString()} - {new Date(subscription.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Created: {new Date(subscription.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        subscription.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                        subscription.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        subscription.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {subscription.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Total Amount</div>
                        <div className="font-semibold text-gray-900">Rs. {subscription.totalAmount?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Delivery Address</div>
                        <div className="font-medium text-gray-900 flex items-center">
                          {subscription.deliveryAddress}
                          <button
                            onClick={() => openMapModal(subscription.deliveryAddress)}
                            className="ml-2 text-blue-600 hover:text-blue-700"
                          >
                            <MapPin className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Preferred Time</div>
                        <div className="font-medium text-gray-900">{subscription.preferredDeliveryTime || 'Not specified'}</div>
                      </div>
                    </div>

                    {subscription.landmark && (
                      <div className="mb-3">
                        <div className="text-sm text-gray-600">Landmark</div>
                        <div className="font-medium text-gray-900">{subscription.landmark}</div>
                      </div>
                    )}

                    {subscription.payment && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-600">
                          Payment: {subscription.payment.paymentMethod} • {subscription.payment.paymentStatus}
                          {subscription.payment.transactionId && ` • Transaction: ${subscription.payment.transactionId}`}
                        </div>
                      </div>
                    )}

                    {/* Subscription Actions */}
                    <div className="border-t pt-4 flex justify-end space-x-3">
                      {subscription.status === 'ACTIVE' && (
                        <button
                          onClick={() => handlePauseSubscription(subscription.subscriptionId)}
                          className="flex items-center space-x-1 px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
                        >
                          <Pause className="h-4 w-4" />
                          <span>Pause</span>
                        </button>
                      )}
                      
                      {subscription.status === 'PAUSED' && (
                        <button
                          onClick={() => handleResumeSubscription(subscription.subscriptionId)}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                        >
                          <Play className="h-4 w-4" />
                          <span>Resume</span>
                        </button>
                      )}
                      
                      {(subscription.status === 'ACTIVE' || subscription.status === 'PAUSED') && (
                        <button
                          onClick={() => handleCancelSubscription(subscription.subscriptionId)}
                          className="flex items-center space-x-1 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserPortal;
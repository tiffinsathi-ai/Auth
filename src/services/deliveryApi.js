// services/deliveryApi.js
import axios from 'axios';

const API_BASE = "http://localhost:8080";

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const deliveryApi = {
  // Profile Management
  getProfile: () => apiClient.get('/api/delivery/profile'),
  
  updateProfile: (profileData) => 
    apiClient.put('/api/delivery/profile', profileData),
  
  changePassword: (passwordData) => 
    apiClient.post('/api/delivery/change-password', passwordData),
  
  toggleAvailability: () => 
    apiClient.put('/api/delivery/availability'),

  // Orders Management
  getTodaysOrders: () => apiClient.get('/api/orders/today'),
  
  getMyOrders: () => 
    apiClient.get('/api/orders/delivery/my-orders'),
  
  getCompletedOrders: () => 
    apiClient.get('/api/orders/delivery/completed'),
  
  getTodaysMyOrders: () => 
    apiClient.get('/api/orders/delivery/today'),
  
  getAllOrders: () => 
    apiClient.get('/api/orders/delivery/all'),
  
  updateOrderStatus: (orderId, status, deliveryPersonId = null) => {
    let url = `/api/orders/${orderId}/status?status=${status}`;
    if (deliveryPersonId) {
      url += `&deliveryPersonId=${deliveryPersonId}`;
    }
    return apiClient.put(url);
  },

  assignDeliveryPerson: (orderId, deliveryPersonId) =>
    apiClient.put(`/api/orders/${orderId}/assign-delivery?deliveryPersonId=${deliveryPersonId}`),

  // Get current user data
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/api/delivery/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      
      // If profile endpoint fails, try to get basic info from token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return {
            email: payload.email,
            name: payload.name || 'Delivery Partner',
            userName: payload.userName || payload.name || 'Delivery Partner',
            role: payload.role || 'DELIVERY',
            vehicleInfo: payload.vehicleInfo || 'Delivery Vehicle'
          };
        } catch (e) {
          console.error('Error parsing token:', e);
        }
      }
      
      // Return fallback user data
      return {
        userName: "Delivery Partner",
        email: "delivery@tiffinsathi.com",
        vehicleInfo: "Delivery Vehicle"
      };
    }
  },

  // Get order details with enhanced customer info
  getOrderDetails: async (orderId) => {
    try {
      const response = await apiClient.get(`/api/orders/${orderId}/details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  },

  // Profile picture handling
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/delivery/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get profile picture
  getProfilePicture: async (userId) => {
    try {
      const response = await apiClient.get(`/api/delivery/profile/picture/${userId}`, {
        responseType: 'blob'
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error fetching profile picture:', error);
      return null;
    }
  },

  // Utility function for file upload conversion
  convertToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  },

  // Validate order data structure
  validateOrderData: (order) => {
    if (!order) {
      throw new Error('Order data is required');
    }

    const requiredFields = ['orderId', 'deliveryAddress'];
    const missingFields = requiredFields.filter(field => !order[field]);

    if (missingFields.length > 0) {
      console.warn('Order missing required fields:', missingFields);
    }

    // Ensure customer object exists with fallbacks
    if (!order.customer) {
      order.customer = {
        userName: 'Customer',
        name: 'Customer',
        phoneNumber: null,
        email: null
      };
    }

    return order;
  },

  // Get delivery statistics
  getDeliveryStats: () => apiClient.get('/api/delivery/stats'),

  // Get earnings summary
  getEarnings: () => apiClient.get('/api/delivery/earnings'),
};

export default deliveryApi;
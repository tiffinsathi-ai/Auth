// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserPortal from './Pages/UserPortal';
import VendorPortal from './Pages/VendorPortal';
import DeliveryPortal from './Pages/DeliveryPortal';
import Login from './Pages/Login';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import PaymentManagement from './Pages/Admin/PaymentManagement';
import UserManagement from './Pages/Admin/UserManagement';
import VendorManagement from './Pages/Admin/VendorManagement';
import AdminProfile from './Pages/Admin/AdminProfile';
import { jwtDecode } from 'jwt-decode';
import ActivitiesPage from './Pages/Admin/ActivitiesPage';
import DeliveryLayout from './components/Delivery/DeliveryLayout';
import DeliveryDashboard from './Pages/Delivery/DeliveryDashboard';
import DeliveryProfile from './Pages/Delivery/DeliveryProfile';
import OrderDeliveries from './Pages/Delivery/OrderDeliveries';
import PaymentSuccess from './Pages/PaymentSuccess';
import PaymentFailure from './Pages/PaymentFailure';
import PaymentStatus from './Pages/PaymentStatus';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login onLogin={login} /> : <Navigate to={`/${user.role.toLowerCase()}`} />} 
          />
          <Route 
            path="/user/*" 
            element={user && user.role === 'USER' ? <UserPortal user={user} onLogout={logout} /> : <Navigate to="/login" />} 
          />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/payment/status/:paymentId" element={<PaymentStatus />} />


          <Route 
            path="/vendor/*" 
            element={user && user.role === 'VENDOR' ? <VendorPortal user={user} onLogout={logout} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/delivery/*" 
            element={user && user.role === 'DELIVERY' ? <DeliveryLayout user={user} onLogout={logout} /> : <Navigate to="/login" />} >
              <Route index element={<DeliveryDashboard user={user} onLogout={logout} />} />
              <Route path="profile" element={<DeliveryProfile user={user} onLogout={logout} />} />
              <Route path="deliveries" element={<OrderDeliveries  user={user} onLogout={logout} />} />
              <Route path="deliveries1" element={<DeliveryPortal  user={user} onLogout={logout} />} />
              </Route>
          <Route
            path="/admin/*"
            element={user && user.role === 'ADMIN' ? <AdminLayout user={user} onLogout={logout} /> : <Navigate to="/login" />}
          >
            <Route index element={<AdminDashboard user={user} onLogout={logout} />} />
            <Route path="payment-management" element={<PaymentManagement user={user} onLogout={logout} />} />
            <Route path="user-management" element={<UserManagement user={user} onLogout={logout} />} />
            <Route path="vendor-management" element={<VendorManagement user={user} onLogout={logout} />} />
            <Route path="profile" element={<AdminProfile user={user} onLogout={logout} />} />
            <Route path="activities" element={<ActivitiesPage user={user} onLogout={logout} />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
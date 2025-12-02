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
  CheckCircle
} from "lucide-react";

const API_BASE = "http://localhost:8080/api";

const VendorPortal = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [upcomingOrders, setUpcomingOrders] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);
  const [subscriptionFilter, setSubscriptionFilter] = useState("ALL");
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [selectedDeliveryPartner, setSelectedDeliveryPartner] = useState({});

  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders();
      loadUpcomingOrders();
      loadDeliveryPartners();
    } else if (activeTab === "subscriptions") {
      loadAllSubscriptions();
    }
  }, [activeTab, selectedDate]);

  const getToken = () => localStorage.getItem("token");

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    setDebugInfo("");
    try {
      console.log("Loading orders for date:", selectedDate);
      
      const url = `${API_BASE}/orders/vendor?date=${selectedDate}`;
      console.log("API URL:", url);
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log("Received orders data:", data);
      
      setDebugInfo(`Loaded ${Array.isArray(data) ? data.length : 0} orders for ${selectedDate}`);
      setOrders(Array.isArray(data) ? data : []);
      
    } catch (err) {
      console.error("Error loading orders:", err);
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
      console.log("Loading upcoming orders...");
      
      const res = await fetch(`${API_BASE}/orders/vendor/upcoming`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Upcoming orders response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log("Received upcoming orders data:", data);
      
      setUpcomingOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading upcoming orders:", err);
      setUpcomingOrders([]);
    } finally {
      setLoadingUpcoming(false);
    }
  };

  const loadAllSubscriptions = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("Loading all vendor subscriptions...");
      
      const res = await fetch(`${API_BASE}/subscriptions/vendor/all`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("All subscriptions response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      console.log("Received all subscriptions data:", data);
      
      if (Array.isArray(data)) {
        setAllSubscriptions(data);
        console.log(`Loaded ${data.length} subscriptions with statuses:`, 
          data.map(sub => sub.status));
      } else {
        setAllSubscriptions([]);
        console.error("Expected array but got:", typeof data, data);
      }
    } catch (err) {
      console.error("Error loading subscriptions:", err);
      setError(`Failed to load subscriptions: ${err.message}`);
      setAllSubscriptions([]);
    } finally {
      setLoading(false);
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
        loadOrders(); // Reload orders to get updated status
      } else {
        throw new Error("Failed to update order status");
      }
    } catch (err) {
      console.error("Failed to update order:", err);
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
      console.error("Failed to assign delivery partner:", err);
      setError("Failed to assign delivery partner");
    }
  };

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
      PAUSED: "bg-amber-100 text-amber-800 border-amber-200"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-green-600" />
            <h1 className="text-xl font-bold">Vendor Portal</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <User className="h-4 w-4" />
              <span>{user?.businessName || user?.vendorName || "Vendor"}</span>
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
      </header>

      {debugInfo && (
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded text-sm">
            {debugInfo}
          </div>
        </div>
      )}

      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
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
        </div>
      </nav>

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
        
        {activeTab === "orders" && renderOrders()}
        {activeTab === "subscriptions" && renderSubscriptions()}
      </main>
    </div>
  );

  function renderOrders() {
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
  }

  function renderSubscriptions() {
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
                className="bg-white border rounded-lg p-6 shadow-sm"
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
  }
};

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
    <div className="bg-white border rounded-lg p-6 shadow-sm">
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
                  deliveryPartners.find(p => p.partnerId == order.deliveryPersonId)?.name || 
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
    className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium ${
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
    emerald: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
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

const EmptyState = ({ text }) => (
  <div className="bg-white border rounded-lg p-12 text-center shadow-sm">
    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-500">{text}</p>
  </div>
);

export default VendorPortal;
// components/OrderCard.js
import React from 'react';
import { MapPin, Clock, Truck, CheckCircle, Navigation, Phone } from 'lucide-react';
import CustomerContact from './CustomerContact';

const OrderCard = ({ 
  order, 
  onPickUp, 
  onMarkDelivered, 
  onViewMap,
  onCallCustomer 
}) => {
  const getStatusColor = (status) => {
    const statusColors = {
      'READY_FOR_DELIVERY': 'bg-purple-100 text-purple-800 border-purple-200',
      'OUT_FOR_DELIVERY': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'DELIVERED': 'bg-green-100 text-green-800 border-green-200',
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'PREPARING': 'bg-orange-100 text-orange-800 border-orange-200',
      'CONFIRMED': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <CustomerContact customer={order.customer} />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">Order #{order.orderId}</h3>
          <p className="text-sm text-gray-600 flex items-center mt-1">
            <Clock className="h-4 w-4 mr-1" />
            Delivery: {order.deliveryDate} • {formatTime(order.preferredDeliveryTime)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
          {getStatusDisplayText(order.status)}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 flex items-start">
          <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{order.deliveryAddress}</span>
        </p>
      </div>

      {/* Order Items */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Order Details:</h4>
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          {order.orderMeals?.map((meal, index) => (
            <div key={index} className="flex justify-between text-sm">
              <div>
                <span className="font-medium text-gray-900">{meal.mealSetName}</span>
                <span className="text-gray-500 ml-2">({meal.mealSetType})</span>
              </div>
              <span className="font-medium text-gray-900">Qty: {meal.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {order.specialInstructions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Special Instructions:</strong> {order.specialInstructions}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        {order.status === 'READY_FOR_DELIVERY' && (
          <button
            onClick={() => onPickUp(order.orderId)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
          >
            <Truck className="h-4 w-4 mr-2" />
            Pick Up Order
          </button>
        )}
        
        {order.status === 'OUT_FOR_DELIVERY' && (
          <>
            <button
              onClick={() => onMarkDelivered(order.orderId)}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Delivered
            </button>
            
            <button
              onClick={() => onViewMap(order)}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center transition-colors"
            >
              <Navigation className="h-4 w-4 mr-2" />
              View Map
            </button>
            
            {order.customer?.phoneNumber && (
              <button
                onClick={() => onCallCustomer(order.customer.phoneNumber)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center transition-colors"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Customer
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
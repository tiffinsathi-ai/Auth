// components/MapModal.js
import React from 'react';
import Modal from './Modal';

const MapModal = ({ isOpen, onClose, order, userLocation }) => {
  const getStaticMapUrl = (address) => {
    if (!address) return null;
    
    const encodedAddress = encodeURIComponent(address);
    const size = '600x400';
    const zoom = '15';
    const markers = `color:red|label:D|${encodedAddress}`;
    
    // Using a free static map service as fallback
    return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=600&height=400&center=lonlat:85.3240,27.7172&zoom=14&apiKey=YOUR_GEOAPIFY_KEY`;
  };

  // Fallback to OpenStreetMap if no API key
  const getOSMUrl = (address) => {
    const encodedAddress = encodeURIComponent(address);
    return `https://www.openstreetmap.org/search?query=${encodedAddress}`;
  };

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    // Basic formatting for 10-digit numbers
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={order ? `Delivery Location - Order #${order.orderId}` : 'Delivery Location'}
      size="lg"
    >
      <div className="p-4">
        {order ? (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Customer Information
              </h4>
              <div className="flex items-start gap-4">
                {/* Profile Picture - Using placeholder since it's not in the DTO */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {order.customer?.userName ? (
                      <span className="text-blue-600 font-bold text-lg">
                        {order.customer.userName.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">Name</label>
                      <p className="font-semibold text-gray-900 truncate">
                        {order.customer?.userName || 'Customer'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">Phone</label>
                      <p className="font-medium text-gray-900">
                        {formatPhoneNumber(order.customer?.phoneNumber)}
                      </p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">Email</label>
                      <p className="text-gray-700 truncate">
                        {order.customer?.email || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Order Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Order ID:</span>
                  <p className="font-semibold">#{order.orderId}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <p className="font-semibold capitalize">{order.status?.toLowerCase()}</p>
                </div>
                {order.preferredDeliveryTime && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Preferred Time:</span>
                    <p className="font-semibold">{order.preferredDeliveryTime}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Delivery Address
              </h4>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 leading-relaxed">{order.deliveryAddress}</p>
                  {order.specialInstructions && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <span className="text-sm font-medium text-yellow-800">Special Instructions:</span>
                      <p className="text-sm text-yellow-700 mt-1">{order.specialInstructions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Map Visualization */}
            <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center relative">
                <div className="text-center text-white z-10">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="font-semibold">Delivery Location</p>
                  <p className="text-sm opacity-90 mt-1 max-w-xs mx-auto truncate">
                    {order.deliveryAddress}
                  </p>
                </div>
                
                {/* Animated Map Pin */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500 rotate-45 -mt-2 border-b-4 border-r-4 border-white"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Open in Maps
              </a>
              
              {order.customer?.phoneNumber && (
                <a
                  href={`tel:${order.customer.phoneNumber}`}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Customer
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg">No order selected</p>
            <p className="text-gray-400 text-sm mt-1">Please select an order to view delivery details</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MapModal;
// components/EnhancedMap.js
import React from 'react';
import { Map, Navigation, Phone } from 'lucide-react';

const EnhancedMap = ({ address, userLocation, customer, onClose }) => {
  if (!address) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No address provided</p>
        </div>
      </div>
    );
  }

  const encodedAddress = encodeURIComponent(address);
  
  return (
    <div className="w-full space-y-4">
      <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
        <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center p-4">
          <div className="text-center mb-4">
            <Map className="h-16 w-16 text-gray-400 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-800">Delivery Location</h4>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Customer:</strong> {customer?.userName || 'N/A'}
            </p>
            <p className="text-sm text-gray-600 max-w-md">
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
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Open in Google Maps
        </a>
        
        {customer?.phoneNumber && (
          <a 
            href={`tel:${customer.phoneNumber}`}
            className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center transition-colors"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call Customer
          </a>
        )}
      </div>
    </div>
  );
};

export default EnhancedMap;
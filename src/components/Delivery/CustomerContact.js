// components/CustomerContact.js
import React from 'react';
import { User, Phone, Mail, MessageCircle, MapPin } from 'lucide-react';

const CustomerContact = ({ customer, showActions = true, compact = false }) => {
  if (!customer) return null;

  if (compact) {
    return (
      <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{customer.userName}</p>
            {customer.phoneNumber && (
              <p className="text-xs text-gray-600">{customer.phoneNumber}</p>
            )}
          </div>
        </div>
        {showActions && customer.phoneNumber && (
          <div className="flex gap-1">
            <a 
              href={`tel:${customer.phoneNumber}`}
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Phone className="h-3 w-3" />
            </a>
            <a 
              href={`https://wa.me/${customer.phoneNumber.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
        <User className="h-4 w-4 mr-2" />
        Customer Contact
      </h4>
      
      <div className="flex items-center space-x-4">
        {/* Customer Profile Picture */}
        <div className="flex-shrink-0">
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
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{customer.userName}</p>
          
          <div className="flex flex-wrap gap-4 mt-2">
            {customer.phoneNumber && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-3 w-3 mr-1" />
                {customer.phoneNumber}
              </div>
            )}
            
            {customer.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-3 w-3 mr-1" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showActions && customer.phoneNumber && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-blue-200">
          <a 
            href={`tel:${customer.phoneNumber}`}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center transition-colors"
          >
            <Phone className="h-3 w-3 mr-1" />
            Call Customer
          </a>
          
          <a 
            href={`https://wa.me/${customer.phoneNumber.replace('+', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center transition-colors"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
};

export default CustomerContact; 
// layout/DeliveryFooter.js
import React from 'react';

const DeliveryFooter = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6 mt-auto flex-shrink-0">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 max-w-7xl mx-auto">
        <p className="text-sm text-gray-600">
          © 2025 Tiffin Sathi Delivery Portal
        </p>
        <p className="text-sm text-gray-500">
          Need help?{' '}
          <a 
            href="#support" 
            className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            Contact Support
          </a>
        </p>
      </div>
    </footer>
  );
};

export default DeliveryFooter;
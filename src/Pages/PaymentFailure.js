import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCw, Home, AlertTriangle } from 'lucide-react';

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const [retrying, setRetrying] = useState(false);
  
  const paymentId = searchParams.get('paymentId');
  const subscriptionId = searchParams.get('subscriptionId');
  const error = searchParams.get('error');

  const handleRetry = () => {
    setRetrying(true);
    // In a real application, you might want to redirect to the payment page
    // or call an API to retry the payment
    setTimeout(() => {
      if (subscriptionId) {
        window.location.href = `/user/subscription/${subscriptionId}/payment`;
      } else {
        window.location.href = '/user';
      }
    }, 1000);
  };

  const commonErrors = {
    'insufficient_funds': 'Insufficient balance in your account.',
    'transaction_declined': 'Transaction was declined by your bank.',
    'network_error': 'Network error occurred. Please check your internet connection.',
    'timeout': 'Payment request timed out. Please try again.',
    'invalid_card': 'Invalid card details provided.',
    'user_cancelled': 'You cancelled the payment.',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Failure Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Failed ❌</h1>
          <p className="text-lg text-gray-600">
            We couldn't process your payment. Please try again.
          </p>
          {paymentId && (
            <div className="mt-2 text-sm text-gray-500">
              Payment ID: {paymentId}
            </div>
          )}
        </div>

        {/* Error Details Card */}
        <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden mb-8">
          <div className="bg-red-50 px-6 py-4 border-b border-red-200">
            <h2 className="text-xl font-semibold text-red-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Payment Error Details
            </h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* Error Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-900">Payment Not Completed</h4>
                    <p className="text-sm text-red-700 mt-1">
                      {error && commonErrors[error] 
                        ? commonErrors[error] 
                        : 'An error occurred while processing your payment. Please try again or use a different payment method.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Troubleshooting Tips */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Troubleshooting Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Check Your Account</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Ensure sufficient balance</li>
                      <li>• Verify card details are correct</li>
                      <li>• Check daily transaction limits</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Try These Solutions</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Use a different payment method</li>
                      <li>• Try again after a few minutes</li>
                      <li>• Contact your bank if issues persist</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alternative Payment Methods</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['eSewa', 'Khalti', 'Card', 'Cash on Delivery'].map((method) => (
                    <div key={method} className="text-center">
                      <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-gray-600 font-medium">{method.charAt(0)}</span>
                      </div>
                      <span className="text-sm text-gray-600">{method}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Try Again'}
          </button>
          
          <Link
            to="/user"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          
          <Link
            to="/contact"
            className="inline-flex items-center justify-center px-6 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Contact Support
          </Link>
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 rounded-lg p-6 inline-block">
            <h4 className="font-medium text-gray-900 mb-2">Need immediate assistance?</h4>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Call us: <span className="font-medium">+977-9800000000</span>
              </p>
              <p className="text-sm text-gray-600">
                Email: <span className="font-medium">support@tiffinsathi.com</span>
              </p>
              <p className="text-xs text-gray-500 mt-4">
                Available 24/7 for payment-related queries
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
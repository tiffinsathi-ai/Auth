import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Package, Receipt } from 'lucide-react';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get('paymentId');
  const subscriptionId = searchParams.get('subscriptionId');

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails();
    }
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentDetails(data);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Successful! 🎉</h1>
          <p className="text-lg text-gray-600">
            Thank you for your subscription. Your order has been confirmed.
          </p>
          {paymentId && (
            <div className="mt-2 text-sm text-gray-500">
              Payment ID: {paymentId}
            </div>
          )}
        </div>

        {/* Payment Details Card */}
        <div className="bg-white rounded-xl shadow-lg border border-green-200 overflow-hidden mb-8">
          <div className="bg-green-50 px-6 py-4 border-b border-green-200">
            <h2 className="text-xl font-semibold text-green-900 flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Payment Confirmation
            </h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading payment details...</p>
              </div>
            ) : paymentDetails ? (
              <div className="space-y-6">
                {/* Payment Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {paymentDetails.paymentMethod}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {paymentDetails.paymentStatus}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Amount Paid</h3>
                      <p className="text-2xl font-bold text-green-600">
                        Rs. {paymentDetails.amount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    {paymentDetails.transactionId && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Transaction ID</h3>
                        <p className="text-sm font-mono text-gray-900">
                          {paymentDetails.transactionId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subscription Information */}
                {paymentDetails.subscription && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Subscription Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Subscription ID</h4>
                        <p className="font-medium text-gray-900">
                          {paymentDetails.subscription.subscriptionId}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {paymentDetails.subscription.status}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Start Date</h4>
                        <p className="font-medium text-gray-900">
                          {new Date(paymentDetails.subscription.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-bold">1</span>
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Payment Confirmed</p>
                        <p className="text-sm text-gray-600">Your payment has been verified and processed successfully.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold">2</span>
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Subscription Activated</p>
                        <p className="text-sm text-gray-600">Your meal subscription is now active and ready for delivery.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-bold">3</span>
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">First Delivery</p>
                        <p className="text-sm text-gray-600">Your first meal will be delivered as per your schedule.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Payment details not available</p>
                <p className="text-sm text-gray-500">Your subscription has been created successfully.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/user/orders"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Receipt className="h-5 w-5 mr-2" />
            View My Orders
          </Link>
          <Link
            to="/user/subscriptions"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Package className="h-5 w-5 mr-2" />
            My Subscriptions
          </Link>
          <Link
            to="/user"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            Dashboard
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-1 text-sm text-gray-500">
            <span>Need help?</span>
            <Link to="/contact" className="text-blue-600 hover:text-blue-700">
              Contact Support
            </Link>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
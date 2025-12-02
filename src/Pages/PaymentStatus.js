import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

const PaymentStatus = () => {
  const { paymentId } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (paymentId) {
      fetchPaymentStatus();
    }
  }, [paymentId]);

  const fetchPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/payments/${paymentId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayment(data);
      } else {
        setError('Failed to fetch payment status');
      }
    } catch (err) {
      setError('Error fetching payment status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-12 w-12 text-yellow-500" />;
      default:
        return <AlertCircle className="h-12 w-12 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking payment status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPaymentStatus}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            {payment ? getStatusIcon(payment.paymentStatus) : getStatusIcon('UNKNOWN')}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Status
          </h1>
          
          {payment && (
            <div className="mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.paymentStatus)}`}>
                {payment.paymentStatus}
              </span>
            </div>
          )}
          
          {paymentId && (
            <p className="text-sm text-gray-500">
              Payment ID: {paymentId}
            </p>
          )}
        </div>

        {payment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                <p className="font-semibold text-gray-900">{payment.paymentMethod}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Amount</p>
                <p className="font-semibold text-green-600">Rs. {payment.amount?.toFixed(2)}</p>
              </div>
            </div>

            {payment.transactionId && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Transaction ID</p>
                <p className="font-mono text-sm text-blue-800 break-all">{payment.transactionId}</p>
              </div>
            )}

            {payment.paidAt && (
              <div className="text-center text-sm text-gray-500">
                Paid at: {new Date(payment.paidAt).toLocaleString()}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              {payment?.paymentStatus === 'COMPLETED' 
                ? 'Your payment was successful! Your subscription is now active.'
                : payment?.paymentStatus === 'PENDING'
                ? 'Your payment is being processed. Please wait a moment.'
                : 'There was an issue with your payment. Please try again.'}
            </p>
            
            <div className="flex flex-col gap-3">
              {payment?.paymentStatus === 'COMPLETED' && (
                <a
                  href="/user/subscriptions"
                  className="block w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 text-center"
                >
                  View Subscription
                </a>
              )}
              
              {payment?.paymentStatus === 'FAILED' && (
                <a
                  href="/user"
                  className="block w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 text-center"
                >
                  Try Again
                </a>
              )}
              
              <a
                href="/user"
                className="block w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 text-center"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
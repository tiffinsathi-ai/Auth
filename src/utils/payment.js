/**
 * Utility functions for handling payments
 */

// Format amount for display
export const formatAmount = (amount) => {
  return `Rs. ${parseFloat(amount).toFixed(2)}`;
};

// Get payment method display name
export const getPaymentMethodName = (method) => {
  const names = {
    'ESEWA': 'eSewa',
    'KHALTI': 'Khalti',
    'CARD': 'Credit/Debit Card',
    'CASH_ON_DELIVERY': 'Cash on Delivery'
  };
  return names[method] || method;
};

// Get payment status color
export const getPaymentStatusColor = (status) => {
  const colors = {
    'COMPLETED': 'text-green-600 bg-green-100',
    'PENDING': 'text-yellow-600 bg-yellow-100',
    'FAILED': 'text-red-600 bg-red-100',
    'REFUNDED': 'text-blue-600 bg-blue-100'
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
};

// Create eSewa payment form
export const createEsewaForm = (paymentData) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = paymentData.paymentUrl;
  form.style.display = 'none';

  Object.entries(paymentData.paymentData).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  return form;
};

// Validate payment amount
export const validatePaymentAmount = (amount) => {
  const minAmount = 1; // Minimum payment amount
  const maxAmount = 100000; // Maximum payment amount
  
  if (amount < minAmount) {
    return `Minimum payment amount is Rs. ${minAmount}`;
  }
  
  if (amount > maxAmount) {
    return `Maximum payment amount is Rs. ${maxAmount}`;
  }
  
  return null;
};

// Simulate payment processing (for demo/testing)
export const simulatePayment = async (paymentMethod, amount) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate 80% success rate
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        resolve({
          success: true,
          transactionId: 'TXN' + Date.now(),
          message: 'Payment successful'
        });
      } else {
        reject({
          success: false,
          error: 'Payment failed. Please try again.'
        });
      }
    }, 2000);
  });
};
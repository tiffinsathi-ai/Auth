import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Filter,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import SearchFilter from '../../components/SearchFilter';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import AdminApi from '../../services/adminApi';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter options
  const filterOptions = [
    { value: 'ALL', label: 'All Payments' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'REFUNDED', label: 'Refunded' }
  ];

  // Payment method options for filtering
  const paymentMethodOptions = [
    { value: 'ALL', label: 'All Methods' },
    { value: 'ESEWA', label: 'eSewa' },
    { value: 'KHALTI', label: 'Khalti' },
    { value: 'CARD', label: 'Card' },
    { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery' }
  ];

  // Stats state
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const paymentsData = await AdminApi.getPayments();
      setPayments(paymentsData);
      calculateStats(paymentsData);
    } catch (err) {
      console.error('Error loading payments:', err);
      setError('Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData) => {
    const totalRevenue = paymentsData
      .filter(p => p.paymentStatus === 'COMPLETED')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    const pendingPayments = paymentsData
      .filter(p => p.paymentStatus === 'PENDING')
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    const completedPayments = paymentsData.filter(p => p.paymentStatus === 'COMPLETED').length;
    const failedPayments = paymentsData.filter(p => p.paymentStatus === 'FAILED').length;

    setStats({
      totalRevenue,
      pendingPayments,
      completedPayments,
      failedPayments
    });
  };

  // Filter payments based on search and filter criteria
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterValue === 'ALL' || 
      payment.paymentStatus === filterValue;

    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleExportPayments = () => {
    // Simple CSV export functionality
    const headers = [
      'Payment ID',
      'User Name',
      'User Email',
      'Vendor Name',
      'Package Name',
      'Amount',
      'Payment Method',
      'Payment Status',
      'Transaction ID',
      'Date'
    ].join(',');

    const csvData = filteredPayments.map(payment => [
      payment.paymentId,
      payment.userName,
      payment.userEmail,
      payment.vendorName,
      payment.packageName,
      payment.amount,
      payment.paymentMethod,
      payment.paymentStatus,
      payment.transactionId,
      payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'N/A'
    ].join(',')).join('\n');

    const csv = `${headers}\n${csvData}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'REFUNDED':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-600 mt-1">Manage payment transactions and settlements</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleExportPayments}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          
          <button
            onClick={loadPayments}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.pendingPayments)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.completedPayments}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.failedPayments}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border-0 py-3 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
              placeholder="Search by Payment ID, User, Vendor, or Transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative min-w-[200px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full rounded-lg border-0 py-3 pl-10 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payments...</p>
          </div>
        ) : currentPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-500">
              {searchTerm || filterValue !== 'ALL' 
                ? 'Try adjusting your search or filter criteria' 
                : 'No payment data available'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User & Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPayments.map((payment) => (
                    <tr key={payment.paymentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.paymentId}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.paymentMethod}
                          </div>
                          {payment.transactionId && (
                            <div className="text-xs text-gray-400">
                              TXN: {payment.transactionId}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.userName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.userEmail || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400">
                            Vendor: {payment.vendorName || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.packageName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.durationDays ? `${payment.durationDays} days` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(payment.paymentStatus)}`}>
                          {getStatusIcon(payment.paymentStatus)}
                          {payment.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.paidAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              currentItemsCount={currentPayments.length}
            />
          </>
        )}
      </div>

      {/* Payment Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Payment Details"
        size="lg"
      >
        {selectedPayment && (
          <div className="space-y-6">
            {/* Payment Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Payment Information</h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Payment ID</dt>
                    <dd className="text-sm text-gray-900">{selectedPayment.paymentId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Transaction ID</dt>
                    <dd className="text-sm text-gray-900">{selectedPayment.transactionId || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Payment Method</dt>
                    <dd className="text-sm text-gray-900">{selectedPayment.paymentMethod}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Amount</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedPayment.amount)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Status & Dates</h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Payment Status</dt>
                    <dd className="text-sm">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedPayment.paymentStatus)}`}>
                        {getStatusIcon(selectedPayment.paymentStatus)}
                        {selectedPayment.paymentStatus}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Paid At</dt>
                    <dd className="text-sm text-gray-900">
                      {formatDate(selectedPayment.paidAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Subscription Status</dt>
                    <dd className="text-sm text-gray-900">{selectedPayment.subscriptionStatus}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* User & Vendor Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">User Information</h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">User Name</dt>
                    <dd className="text-sm text-gray-900">{selectedPayment.userName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Email</dt>
                    <dd className="text-sm text-gray-900">{selectedPayment.userEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Phone</dt>
                    <dd className="text-sm text-gray-900">{selectedPayment.userPhone || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Vendor Information</h4>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Vendor Name</dt>
                    <dd className="text-sm text-gray-900">{selectedPayment.vendorName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Vendor Email</dt>
                    <dd className="text-sm text-gray-900">{selectedPayment.vendorEmail}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Package Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Package Information</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Package Name</dt>
                  <dd className="text-sm text-gray-900">{selectedPayment.packageName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Package ID</dt>
                  <dd className="text-sm text-gray-900">{selectedPayment.packageId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Duration</dt>
                  <dd className="text-sm text-gray-900">
                    {selectedPayment.durationDays ? `${selectedPayment.durationDays} days` : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Package Price</dt>
                  <dd className="text-sm text-gray-900">
                    {formatCurrency(selectedPayment.packagePrice)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Subscription Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Subscription Information</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Subscription ID</dt>
                  <dd className="text-sm text-gray-900">{selectedPayment.subscriptionId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Subscription Status</dt>
                  <dd className="text-sm text-gray-900">{selectedPayment.subscriptionStatus}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentManagement;
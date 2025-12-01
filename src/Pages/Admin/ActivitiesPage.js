import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Filter, 
  Search, 
  Download,
  Eye,
  User,
  Store,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';
import AdminApi from '../../services/adminApi';
import Pagination from '../../components/Pagination';

const ActivitiesPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock activities data - replace with actual API call
  const mockActivities = [
    { id: 1, action: 'New vendor registration', target: 'Spice Kitchen', user: 'system', time: '2 minutes ago', type: 'vendor', status: 'pending' },
    { id: 2, action: 'User account created', target: 'john@example.com', user: 'system', time: '5 minutes ago', type: 'user', status: 'success' },
    { id: 3, action: 'Payment processed', target: 'Order #12345', user: 'system', time: '1 hour ago', type: 'payment', status: 'success' },
    { id: 4, action: 'Vendor approved', target: 'Healthy Bites', user: 'Admin User', time: '2 hours ago', type: 'vendor', status: 'success' },
    { id: 5, action: 'User role updated', target: 'Alice Johnson', user: 'Admin User', time: '3 hours ago', type: 'user', status: 'success' },
    { id: 6, action: 'Vendor rejected', target: 'Taste of India', user: 'Admin User', time: '4 hours ago', type: 'vendor', status: 'warning' },
    { id: 7, action: 'System backup', target: 'Database', user: 'system', time: '6 hours ago', type: 'system', status: 'success' },
    { id: 8, action: 'Failed login attempt', target: 'admin@tiffinsathi.com', user: 'system', time: '8 hours ago', type: 'security', status: 'error' },
    { id: 9, action: 'Order completed', target: 'Order #12346', user: 'system', time: '1 day ago', type: 'order', status: 'success' },
    { id: 10, action: 'New subscription', target: 'Premium Plan', user: 'system', time: '1 day ago', type: 'subscription', status: 'success' },
  ];

  useEffect(() => {
    // Simulate API call
    const fetchActivities = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const activitiesData = await AdminApi.getActivities();
        setTimeout(() => {
          setActivities(mockActivities);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getActivityIcon = (type) => {
    const icons = {
      vendor: Store,
      user: User,
      payment: CreditCard,
      system: Clock,
      security: AlertTriangle,
      order: CreditCard,
      subscription: CheckCircle
    };
    return icons[type] || Clock;
  };

  const getStatusColor = (status) => {
    const colors = {
      success: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100',
      pending: 'text-blue-600 bg-blue-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    const icons = {
      success: CheckCircle,
      warning: AlertTriangle,
      error: XCircle,
      pending: Clock
    };
    return icons[status] || Clock;
  };

  const typeOptions = [
    { value: 'ALL', label: 'All Types' },
    { value: 'user', label: 'User Activities' },
    { value: 'vendor', label: 'Vendor Activities' },
    { value: 'payment', label: 'Payment Activities' },
    { value: 'system', label: 'System Activities' },
    { value: 'security', label: 'Security Activities' }
  ];

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || activity.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Paginate activities
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  const exportActivities = () => {
    const csvContent = [
      ['Action', 'Target', 'User', 'Time', 'Type', 'Status'],
      ...filteredActivities.map(activity => [
        activity.action,
        activity.target,
        activity.user,
        activity.time,
        activity.type,
        activity.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Activities</h1>
                <p className="text-gray-600 mt-1">Monitor all system activities and events</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={exportActivities}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full rounded-lg border-0 py-3 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                placeholder="Search activities by action, target, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative min-w-[200px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full rounded-lg border-0 py-3 pl-10 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedActivities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  const StatusIcon = getStatusIcon(activity.status);
                  const statusColor = getStatusColor(activity.status);
                  
                  return (
                    <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <ActivityIcon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {activity.action}
                            </div>
                            <div className="text-sm text-gray-500">
                              {activity.target}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{activity.user}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {activity.time}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                          <StatusIcon className="h-3 w-3" />
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {paginatedActivities.length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-500">
                {searchTerm || typeFilter !== 'ALL' 
                  ? 'Try adjusting your search or filters'
                  : 'No activities recorded yet'
                }
              </p>
            </div>
          )}
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredActivities.length}
            currentItemsCount={paginatedActivities.length}
          />
        </div>
      </div>
    </div>
  );
};

export default ActivitiesPage;
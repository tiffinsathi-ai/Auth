import React, { useState, useEffect } from 'react';
import { Users, Store, CreditCard, TrendingUp, Package, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminApi from '../../services/adminApi';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    pendingApprovals: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, vendors] = await Promise.all([
        AdminApi.getUsers(),
        AdminApi.getVendors()
      ]);

      // Calculate stats
      const totalUsers = users.length;
      const totalVendors = vendors.length;
      const pendingApprovals = vendors.filter(v => v.status === 'PENDING').length;
      
      // For monthly revenue, you might need to implement a separate API
      // For now, we'll calculate a mock revenue based on vendors
      const monthlyRevenue = totalVendors * 150; // Mock calculation

      setStats({
        totalUsers,
        totalVendors,
        pendingApprovals,
        monthlyRevenue
      });

      // Generate recent activities
      const activities = [
        ...vendors.slice(0, 3).map(vendor => ({
          id: `vendor-${vendor.vendorId}`,
          action: vendor.status === 'PENDING' ? 'New vendor registration' : 'Vendor approved',
          target: vendor.businessName,
          time: new Date(vendor.createdAt).toLocaleDateString(),
          type: 'vendor'
        })),
        ...users.slice(0, 2).map(user => ({
          id: `user-${user.id}`,
          action: 'User account created',
          target: user.email,
          time: new Date(user.createdAt).toLocaleDateString(),
          type: 'user'
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

      setRecentActivities(activities);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      change: '+12%',
      link: '/admin/user-management'
    },
    {
      title: 'Total Vendors',
      value: stats.totalVendors,
      icon: Store,
      color: 'green',
      change: '+8%',
      link: '/admin/vendor-management'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: Clock,
      color: 'yellow',
      change: stats.pendingApprovals > 0 ? `+${stats.pendingApprovals}` : '0',
      link: '/admin/vendor-management?filter=pending'
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: 'purple',
      change: '+15%',
      link: '/admin/payment-management'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-600' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: 'text-yellow-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-600' }
    };
    return colors[color] || colors.blue;
  };

  const getActivityIcon = (type) => {
    const icons = {
      vendor: Store,
      user: Users,
      payment: CreditCard
    };
    return icons[type] || Package;
  };

  const getActivityColor = (type) => {
    const colors = {
      vendor: 'text-green-600 bg-green-100',
      user: 'text-blue-600 bg-blue-100',
      payment: 'text-purple-600 bg-purple-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = getColorClasses(stat.color);
          
          return (
            <Link
              key={index}
              to={stat.link}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-sm font-medium ${colorClasses.text} mt-1`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
                  <Icon className={`h-6 w-6 ${colorClasses.icon}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            <Link 
              to="/admin/activities" 
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type);
                const activityColor = getActivityColor(activity.type);
                
                return (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${activityColor}`}>
                      <ActivityIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {activity.target} • {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No recent activities</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/admin/user-management"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <Users className="h-6 w-6 text-gray-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600">Manage Users</h3>
              <p className="text-sm text-gray-500">View and manage user accounts</p>
            </Link>
            
            <Link
              to="/admin/vendor-management"
              className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
            >
              <Store className="h-6 w-6 text-gray-400 group-hover:text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900 group-hover:text-green-600">Vendor Approvals</h3>
              <p className="text-sm text-gray-500">Review pending applications</p>
            </Link>
            
            <Link
              to="/admin/payment-management"
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
            >
              <CreditCard className="h-6 w-6 text-gray-400 group-hover:text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900 group-hover:text-purple-600">Payments</h3>
              <p className="text-sm text-gray-500">View transactions and reports</p>
            </Link>
            
            <button
              onClick={fetchDashboardData}
              className="p-4 border border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors group text-left"
            >
              <TrendingUp className="h-6 w-6 text-gray-400 group-hover:text-yellow-600 mb-2" />
              <h3 className="font-medium text-gray-900 group-hover:text-yellow-600">Refresh Data</h3>
              <p className="text-sm text-gray-500">Update dashboard statistics</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
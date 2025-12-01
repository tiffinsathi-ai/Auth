import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Edit, 
  Trash2, 
  Mail, 
  MoreVertical,
  UserCheck,
  UserX,
  Shield,
  Calendar,
  Phone,
  Eye,
  Download,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import AdminApi from '../../services/adminApi';
import Pagination from '../../components/Pagination';
import ConfirmationModal from '../../components/ConfirmationModal';
import Modal from '../../components/Modal';
import SearchFilter from '../../components/SearchFilter';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [actionMenu, setActionMenu] = useState(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  
  const itemsPerPage = 8;

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      ACTIVE: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: UserCheck,
        label: 'Active'
      },
      BLOCK: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: UserX,
        label: 'Blocked'
      }
    };

    const config = statusConfig[status] || statusConfig.ACTIVE;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  // Role badge component
  const RoleBadge = ({ role }) => {
    const roleColors = {
      ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
      VENDOR: 'bg-blue-100 text-blue-800 border-blue-200',
      USER: 'bg-gray-100 text-gray-800 border-gray-200',
      DELIVERY: 'bg-orange-100 text-orange-800 border-orange-200'
    };

    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleColors[role] || roleColors.USER}`}>
        <Shield className="h-3 w-3" />
        {role}
      </span>
    );
  };

  // API functions
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminApi.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, status) => {
    setIsLoadingAction(true);
    try {
      const updatedUser = await AdminApi.updateUserStatus(userId, status);
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ));
      return updatedUser;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status');
      throw err;
    } finally {
      setIsLoadingAction(false);
    }
  };

  const updateUserRole = async (userId, role) => {
    setIsLoadingAction(true);
    try {
      const updatedUser = await AdminApi.updateUserRole(userId, role);
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ));
      return updatedUser;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role');
      throw err;
    } finally {
      setIsLoadingAction(false);
    }
  };

  const deleteUser = async (userId) => {
    setIsLoadingAction(true);
    try {
      await AdminApi.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      throw err;
    } finally {
      setIsLoadingAction(false);
    }
  };

  const updateUser = async (userId, userData) => {
    setIsLoadingAction(true);
    try {
      const updatedUser = await AdminApi.updateUser(userId, userData);
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ));
      return updatedUser;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
      throw err;
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.phoneNumber?.includes(searchTerm);
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  // Paginate users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'BLOCK', label: 'Blocked' }
  ];

  const roleOptions = [
    { value: 'ALL', label: 'All Roles' },
    { value: 'USER', label: 'User' },
    { value: 'VENDOR', label: 'Vendor' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'DELIVERY', label: 'Delivery' }
  ];

  // Event handlers
  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      userName: user.userName,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture
    });
    setIsEditModalOpen(true);
    setActionMenu(null);
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
    setActionMenu(null);
  };

  const handleStatusChange = (user) => {
    setSelectedUser(user);
    setIsStatusModalOpen(true);
    setActionMenu(null);
  };

  const handleRoleChange = (user) => {
    setSelectedUser(user);
    setEditForm(prev => ({ ...prev, role: user.role }));
    setIsRoleModalOpen(true);
    setActionMenu(null);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
    setActionMenu(null);
  };

  const confirmStatusChange = async () => {
    if (selectedUser) {
      const newStatus = selectedUser.status === 'ACTIVE' ? 'BLOCK' : 'ACTIVE';
      await updateUserStatus(selectedUser.id, newStatus);
      setIsStatusModalOpen(false);
      setSelectedUser(null);
    }
  };

  const confirmRoleChange = async () => {
    if (selectedUser && editForm.role) {
      await updateUserRole(selectedUser.id, editForm.role);
      setIsRoleModalOpen(false);
      setSelectedUser(null);
    }
  };

  const confirmDelete = async () => {
    if (selectedUser) {
      await deleteUser(selectedUser.id);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleSaveEdit = async () => {
    if (selectedUser) {
      await updateUser(selectedUser.id, editForm);
      setIsEditModalOpen(false);
      setSelectedUser(null);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Role', 'Status', 'Created Date'],
      ...filteredUsers.map(user => [
        user.userName,
        user.email,
        user.phoneNumber || 'N/A',
        user.role,
        user.status,
        new Date(user.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.action-menu')) {
        setActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage all users in the system</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={exportUsers}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {users.filter(u => u.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Blocked Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {users.filter(u => u.status === 'BLOCK').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <UserX className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admin Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {users.filter(u => u.role === 'ADMIN').length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={statusOptions}
        searchPlaceholder="Search users by name, email, or phone..."
      />

      {/* Additional Filter for Role */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm"
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="rounded-md bg-red-50 p-4 mx-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Users</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {user.profilePicture ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                src={user.profilePicture}
                                alt={user.userName}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                <Mail className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.userName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {user.phoneNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleStatusChange(user)}
                          className="cursor-pointer transition-transform hover:scale-105"
                        >
                          <StatusBadge status={user.status} />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end">
                          <div className="relative action-menu">
                            <button
                              onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </button>
                            
                            {actionMenu === user.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
                                <button
                                  onClick={() => handleView(user)}
                                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit Profile
                                </button>
                                <button
                                  onClick={() => handleRoleChange(user)}
                                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Shield className="h-4 w-4" />
                                  Change Role
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete User
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {paginatedUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'ALL' || roleFilter !== 'ALL' 
                    ? 'Try adjusting your search or filters'
                    : 'No users in the system yet'
                  }
                </p>
              </div>
            )}
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredUsers.length}
              currentItemsCount={paginatedUsers.length}
            />
          </>
        )}
      </div>

      {/* View User Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="User Details"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              {selectedUser.profilePicture ? (
                <img
                  src={selectedUser.profilePicture}
                  alt={selectedUser.userName}
                  className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm">
                  <Mail className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{selectedUser.userName}</h4>
                <p className="text-gray-600">{selectedUser.email}</p>
                <div className="flex gap-2 mt-2">
                  <RoleBadge role={selectedUser.role} />
                  <StatusBadge status={selectedUser.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <p className="text-gray-900">{selectedUser.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
                <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-gray-900">{new Date(selectedUser.updatedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-gray-900 font-mono text-sm">{selectedUser.id}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEdit(selectedUser);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit User
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Profile"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={editForm.userName || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, userName: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="text"
                value={editForm.phoneNumber || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter phone number"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isLoadingAction}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoadingAction ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Status Change Confirmation */}
      <ConfirmationModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={confirmStatusChange}
        title={`${selectedUser?.status === 'ACTIVE' ? 'Block' : 'Activate'} User`}
        message={`Are you sure you want to ${selectedUser?.status === 'ACTIVE' ? 'block' : 'activate'} ${selectedUser?.userName}? ${selectedUser?.status === 'ACTIVE' ? 'They will no longer be able to access their account.' : 'They will regain access to their account.'}`}
        confirmText={selectedUser?.status === 'ACTIVE' ? 'Block User' : 'Activate User'}
        type={selectedUser?.status === 'ACTIVE' ? 'warning' : 'success'}
        isLoading={isLoadingAction}
      />

      {/* Role Change Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Change User Role"
        size="sm"
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Change the role for <span className="font-semibold text-gray-900">{selectedUser?.userName}</span>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
            <select
              value={editForm.role || selectedUser?.role}
              onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="USER">USER</option>
              <option value="VENDOR">VENDOR</option>
              <option value="ADMIN">ADMIN</option>
              <option value="DELIVERY">DELIVERY</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRoleChange}
              disabled={isLoadingAction}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoadingAction ? 'Updating...' : 'Change Role'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.userName}? This action cannot be undone and all user data will be permanently removed.`}
        confirmText="Delete User"
        type="delete"
        isLoading={isLoadingAction}
      />
    </div>
  );
};

export default UserManagement;
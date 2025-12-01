import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Store, 
  Eye, 
  CheckCircle, 
  XCircle, 
  MoreVertical,
  UserCheck,
  UserX,
  Clock,
  Download,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Utensils,
  FileText,
  ExternalLink
} from 'lucide-react';
import AdminApi from '../../services/adminApi';
import Pagination from '../../components/Pagination';
import ConfirmationModal from '../../components/ConfirmationModal';
import Modal from '../../components/Modal';
import SearchFilter from '../../components/SearchFilter';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionMenu, setActionMenu] = useState(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  
  const actionMenuRefs = useRef({});
  const itemsPerPage = 8;

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      PENDING: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        label: 'Pending'
      },
      APPROVED: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: UserCheck,
        label: 'Approved'
      },
      REJECTED: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: UserX,
        label: 'Rejected'
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  // API functions
  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminApi.getVendors();
      setVendors(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vendors');
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateVendorStatus = async (vendorId, status, reason = '') => {
    setIsLoadingAction(true);
    try {
      const updatedVendor = await AdminApi.updateVendorStatus(vendorId, status, reason);
      setVendors(vendors.map(vendor => 
        vendor.vendorId === vendorId ? updatedVendor : vendor
      ));
      return updatedVendor;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update vendor status');
      throw err;
    } finally {
      setIsLoadingAction(false);
    }
  };

  const deleteVendor = async (vendorId) => {
    setIsLoadingAction(true);
    try {
      await AdminApi.deleteVendor(vendorId);
      setVendors(vendors.filter(vendor => vendor.vendorId !== vendorId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vendor');
      throw err;
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Fetch vendors on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutside = Object.values(actionMenuRefs.current).every(ref => {
        return ref && !ref.contains(event.target);
      });
      
      if (isOutside) {
        setActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and search vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      const matchesSearch = vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vendor.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vendor.businessEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vendor.phone?.includes(searchTerm);
      const matchesStatus = statusFilter === 'ALL' || vendor.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [vendors, searchTerm, statusFilter]);

  // Paginate vendors
  const paginatedVendors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVendors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVendors, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);

  const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  // Event handlers
  const handleView = (vendor) => {
    console.log('View vendor:', vendor);
    setSelectedVendor(vendor);
    setIsViewModalOpen(true);
    setActionMenu(null);
  };

  const handleApprove = (vendor) => {
    setSelectedVendor(vendor);
    setIsApproveModalOpen(true);
    setActionMenu(null);
  };

  const handleReject = (vendor) => {
    setSelectedVendor(vendor);
    setRejectionReason('');
    setIsRejectModalOpen(true);
    setActionMenu(null);
  };

  const handleDelete = (vendor) => {
    setSelectedVendor(vendor);
    setIsDeleteModalOpen(true);
    setActionMenu(null);
  };

  const confirmApprove = async () => {
    if (selectedVendor) {
      await updateVendorStatus(selectedVendor.vendorId, 'APPROVED');
      setIsApproveModalOpen(false);
      setSelectedVendor(null);
    }
  };

  const confirmReject = async () => {
    if (selectedVendor && rejectionReason.trim()) {
      await updateVendorStatus(selectedVendor.vendorId, 'REJECTED', rejectionReason);
      setIsRejectModalOpen(false);
      setSelectedVendor(null);
      setRejectionReason('');
    }
  };

  const confirmDelete = async () => {
    if (selectedVendor) {
      await deleteVendor(selectedVendor.vendorId);
      setIsDeleteModalOpen(false);
      setSelectedVendor(null);
    }
  };

  const exportVendors = () => {
    const csvContent = [
      ['Business Name', 'Owner', 'Email', 'Phone', 'Status', 'Cuisine Type', 'Registered Date'],
      ...filteredVendors.map(vendor => [
        vendor.businessName,
        vendor.ownerName,
        vendor.businessEmail,
        vendor.phone,
        vendor.status,
        vendor.cuisineType || 'N/A',
        new Date(vendor.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendors-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = vendors.length;
    const pending = vendors.filter(v => v.status === 'PENDING').length;
    const approved = vendors.filter(v => v.status === 'APPROVED').length;
    const rejected = vendors.filter(v => v.status === 'REJECTED').length;
    
    return { total, pending, approved, rejected };
  }, [vendors]);

  // Document viewer component
  const DocumentViewer = ({ title, documentUrl }) => {
    if (!documentUrl) return null;

    return (
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <a
          href={documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          View
        </a>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
            <p className="text-gray-600 mt-1">Manage and approve vendor applications</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={exportVendors}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={fetchVendors}
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
              <p className="text-sm font-medium text-gray-600">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.rejected}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <UserX className="h-6 w-6 text-red-600" />
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
        searchPlaceholder="Search vendors by business name, owner, email, or phone..."
      />

      {/* Vendors Table */}
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
                  <h3 className="text-sm font-medium text-red-800">Error Loading Vendors</h3>
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
                      Business
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedVendors.map((vendor) => (
                    <tr key={vendor.vendorId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {vendor.profilePicture ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                src={vendor.profilePicture}
                                alt={vendor.businessName}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                <Store className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {vendor.businessName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vendor.ownerName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {vendor.businessEmail}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {vendor.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Utensils className="h-4 w-4 text-gray-400" />
                            {vendor.cuisineType || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {vendor.businessAddress ? `${vendor.businessAddress.substring(0, 30)}...` : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={vendor.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end">
                          <div 
                            ref={el => actionMenuRefs.current[vendor.vendorId] = el}
                            className="relative"
                          >
                            <button
                              onClick={() => setActionMenu(actionMenu === vendor.vendorId ? null : vendor.vendorId)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </button>
                            
                            {actionMenu === vendor.vendorId && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                                <button
                                  onClick={() => handleView(vendor)}
                                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </button>
                                
                                {vendor.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(vendor)}
                                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleReject(vendor)}
                                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Reject
                                    </button>
                                  </>
                                )}
                                
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={() => handleDelete(vendor)}
                                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Delete Vendor
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
            
            {paginatedVendors.length === 0 && (
              <div className="text-center py-12">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'ALL' 
                    ? 'Try adjusting your search or filters'
                    : 'No vendors in the system yet'
                  }
                </p>
              </div>
            )}
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredVendors.length}
              currentItemsCount={paginatedVendors.length}
            />
          </>
        )}
      </div>

      {/* View Vendor Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Vendor Details"
        size="lg"
      >
        {selectedVendor && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              {selectedVendor.profilePicture ? (
                <img
                  src={selectedVendor.profilePicture}
                  alt={selectedVendor.businessName}
                  className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm">
                  <Store className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{selectedVendor.businessName}</h4>
                <p className="text-gray-600">{selectedVendor.ownerName}</p>
                <div className="flex gap-2 mt-2">
                  <StatusBadge status={selectedVendor.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Business Information</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Business Email</label>
                    <p className="text-sm text-gray-900">{selectedVendor.businessEmail}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Phone</label>
                    <p className="text-sm text-gray-900">{selectedVendor.phone}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Address</label>
                    <p className="text-sm text-gray-900">{selectedVendor.businessAddress || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Business Details</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Cuisine Type</label>
                    <p className="text-sm text-gray-900">{selectedVendor.cuisineType || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Capacity</label>
                    <p className="text-sm text-gray-900">{selectedVendor.capacity || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Years in Business</label>
                    <p className="text-sm text-gray-900">{selectedVendor.yearsInBusiness || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">Uploaded Documents</h5>
              <div className="space-y-3">
                <DocumentViewer 
                  title="FSSAI License" 
                  documentUrl={selectedVendor.fssaiLicenseUrl} 
                />
                <DocumentViewer 
                  title="PAN Card" 
                  documentUrl={selectedVendor.panCardUrl} 
                />
                <DocumentViewer 
                  title="Bank Proof" 
                  documentUrl={selectedVendor.bankProofUrl} 
                />
                <DocumentViewer 
                  title="Menu Card" 
                  documentUrl={selectedVendor.menuCardUrl} 
                />
              </div>
            </div>

            {selectedVendor.description && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Description</h5>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedVendor.description}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {selectedVendor.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleReject(selectedVendor);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleApprove(selectedVendor);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Approve Confirmation */}
      <ConfirmationModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={confirmApprove}
        title="Approve Vendor"
        message={`Are you sure you want to approve ${selectedVendor?.businessName}? This vendor will be activated and can start receiving orders.`}
        confirmText="Approve Vendor"
        type="success"
        isLoading={isLoadingAction}
      />

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectionReason('');
        }}
        title="Reject Vendor Application"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-gray-700 mb-3">
              Please provide a reason for rejecting <span className="font-semibold">{selectedVendor?.businessName}</span>:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection (e.g., Missing documents, incomplete information, failed verification)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows="4"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsRejectModalOpen(false);
                setRejectionReason('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmReject}
              disabled={!rejectionReason.trim() || isLoadingAction}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoadingAction ? 'Rejecting...' : 'Reject Vendor'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete ${selectedVendor?.businessName}? This action cannot be undone and all vendor data will be permanently removed.`}
        confirmText="Delete Vendor"
        type="delete"
        isLoading={isLoadingAction}
      />
    </div>
  );
};

export default VendorManagement;
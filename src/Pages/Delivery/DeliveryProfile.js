// pages/DeliveryProfile.js
import React, { useState, useEffect } from 'react';
import {
  User,
  Camera,
  Edit3,
  Save,
  X,
  Lock,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Truck,
  FileText,
  Shield,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { deliveryApi } from '../../services/deliveryApi';
import Modal from '../../components/Delivery/Modal';

const DeliveryProfile = () => {
  const [deliveryPartner, setDeliveryPartner] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    address: "",
    vehicleInfo: "",
    licenseNumber: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState('AVAILABLE');

  useEffect(() => {
    fetchDeliveryProfile();
  }, []);

  const fetchDeliveryProfile = async () => {
    try {
      const response = await deliveryApi.getProfile();
      setDeliveryPartner(response.data);
      setFormData({
        name: response.data.name || "",
        phoneNumber: response.data.phoneNumber || "",
        address: response.data.address || "",
        vehicleInfo: response.data.vehicleInfo || "",
        licenseNumber: response.data.licenseNumber || "",
      });
      setAvailabilityStatus(response.data.availabilityStatus || 'AVAILABLE');
      setLoading(false);
    } catch (error) {
      console.error("Error fetching delivery profile:", error);
      setMessage("Error loading profile");
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await deliveryApi.convertToBase64(file);
        setProfileImage(base64);
      } catch (error) {
        console.error("Error converting image:", error);
        setMessage("Error uploading image");
      }
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updateData = {
        ...formData,
        profilePicture: profileImage || deliveryPartner.profilePicture,
      };

      const response = await deliveryApi.updateProfile(updateData);
      setDeliveryPartner(response.data);
      setIsEditing(false);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage(error.response?.data?.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      await deliveryApi.changePassword(passwordData);
      setMessage("Password changed successfully!");
      setIsChangePasswordOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage(error.response?.data?.message || "Error changing password");
    }
  };

  const toggleAvailability = async () => {
    try {
      await deliveryApi.toggleAvailability();
      const newStatus = availabilityStatus === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
      setAvailabilityStatus(newStatus);
      setMessage(`You are now ${newStatus.toLowerCase()}`);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error toggling availability:", error);
      setMessage("Failed to update availability");
    }
  };

  const getAvailabilityColor = () => {
    switch (availabilityStatus) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-200';
      case 'BUSY': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'OFFLINE': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!deliveryPartner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600">Error loading profile</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Partner Profile</h1>
              <p className="text-gray-600">Manage your delivery information and availability</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={toggleAvailability}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${getAvailabilityColor()}`}
              >
                {availabilityStatus === 'AVAILABLE' ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                <span>
                  {availabilityStatus === 'AVAILABLE' ? 'Available' : 
                   availabilityStatus === 'BUSY' ? 'Busy' : 'Offline'}
                </span>
              </button>

              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="flex items-center justify-center gap-2 bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </button>
              
              <button
                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save"}
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.includes("Error")
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Image & Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {deliveryPartner.profilePicture || profileImage ? (
                      <img
                        src={profileImage || deliveryPartner.profilePicture || deliveryPartner.profilePictureUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-2 right-2 bg-orange-600 text-white p-2 rounded-full cursor-pointer hover:bg-orange-700 transition-colors shadow-lg">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 text-center">
                  {deliveryPartner.name}
                </h2>
                <p className="text-gray-600">Delivery Partner</p>
                <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                  deliveryPartner.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {deliveryPartner.isActive ? "ACTIVE" : "INACTIVE"}
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm truncate">{deliveryPartner.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Truck className="w-4 h-4" />
                  <span className="text-sm">{deliveryPartner.vehicleInfo || "No vehicle info"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Joined {new Date(deliveryPartner.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Delivery Stats</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Today's Deliveries:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Deliveries:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium text-green-600">100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Delivery Information
              </h3>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900 p-2 bg-gray-50 rounded-lg">
                      <User className="w-4 h-4" />
                      {deliveryPartner.name}
                    </div>
                  )}
                </div>

                {/* Email - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 text-gray-900 p-2 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4" />
                    {deliveryPartner.email}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900 p-2 bg-gray-50 rounded-lg">
                      <Phone className="w-4 h-4" />
                      {deliveryPartner.phoneNumber}
                    </div>
                  )}
                </div>

                {/* Vehicle Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Information
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.vehicleInfo}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleInfo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="e.g., Honda Activa - White"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900 p-2 bg-gray-50 rounded-lg">
                      <Truck className="w-4 h-4" />
                      {deliveryPartner.vehicleInfo || "Not provided"}
                    </div>
                  )}
                </div>

                {/* License Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, licenseNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Enter your license number"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900 p-2 bg-gray-50 rounded-lg">
                      <FileText className="w-4 h-4" />
                      {deliveryPartner.licenseNumber || "Not provided"}
                    </div>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Enter your address"
                    />
                  ) : (
                    <div className="flex items-start gap-2 text-gray-900 p-2 bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span>{deliveryPartner.address || "Not provided"}</span>
                    </div>
                  )}
                </div>

                {/* Vendor Info */}
                {deliveryPartner.vendorName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Vendor
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 p-2 bg-gray-50 rounded-lg">
                      <Shield className="w-4 h-4" />
                      {deliveryPartner.vendorName}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        title="Change Password"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="Confirm new password"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsChangePasswordOpen(false)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Change Password
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeliveryProfile;
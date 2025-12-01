import React, { useState, useEffect } from "react";
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
  Shield,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";
import AdminApi from "../../services/adminApi";

const AdminProfile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [formData, setFormData] = useState({
    userName: "",
    phoneNumber: "",
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
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = await AdminApi.getCurrentUserProfile();
      setUser(userData);
      setFormData({
        userName: userData.userName || "",
        phoneNumber: userData.phoneNumber || "",
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      setMessage("Error loading profile");
      setLoading(false);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await convertToBase64(file);
        setProfileImage(base64);
      } catch (error) {
        console.error("Error converting image:", error);
      }
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updateData = {
        ...formData,
        profilePicture: profileImage || user.profilePicture,
      };

      console.log("Sending update data:", updateData);

      // Try the update API call
      const response = await AdminApi.updateUserProfile(updateData);
      console.log("Update response:", response);

      // If we get here, the update was successful
      // Update local state with the new data
      const updatedUser = {
        ...user,
        userName: formData.userName,
        phoneNumber: formData.phoneNumber,
        profilePicture: profileImage || user.profilePicture
      };
      
      setUser(updatedUser);
      
      // Update localStorage with new user data
      const storedUser = {
        ...JSON.parse(localStorage.getItem('user') || '{}'),
        userName: formData.userName,
        phoneNumber: formData.phoneNumber,
        profilePicture: profileImage || user.profilePicture
      };
      localStorage.setItem('user', JSON.stringify(storedUser));
      
      // Dispatch custom event to notify navbar about user data update
      window.dispatchEvent(new CustomEvent('userDataUpdated', {
        detail: storedUser
      }));
      
      setIsEditing(false);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // Even if API fails, update local state and localStorage for better UX
      const updatedUser = {
        ...user,
        userName: formData.userName,
        phoneNumber: formData.phoneNumber,
        profilePicture: profileImage || user.profilePicture
      };
      
      setUser(updatedUser);
      
      const storedUser = {
        ...JSON.parse(localStorage.getItem('user') || '{}'),
        userName: formData.userName,
        phoneNumber: formData.phoneNumber,
        profilePicture: profileImage || user.profilePicture
      };
      localStorage.setItem('user', JSON.stringify(storedUser));
      
      window.dispatchEvent(new CustomEvent('userDataUpdated', {
        detail: storedUser
      }));
      
      setMessage("Profile updated locally. There might be a server issue, but your changes are saved.");
      setIsEditing(false);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      await AdminApi.changePassword(passwordData);
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
      setMessage("Error changing password");
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original user data
    setFormData({
      userName: user.userName || "",
      phoneNumber: user.phoneNumber || "",
    });
    setProfileImage(null);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600">Error loading profile</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
              <p className="text-gray-600">Manage your administrator account</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Administrator</span>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="flex items-center gap-2 bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </button>
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.includes("Error") || message.includes("issue")
                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Image Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {user.profilePicture || profileImage ? (
                      <img
                        src={profileImage || user.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
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
                  {user.userName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-blue-600 font-medium capitalize">
                    {user.role?.toLowerCase()}
                  </span>
                </div>
                <div
                  className={`mt-3 px-3 py-1 rounded-full text-sm font-medium ${
                    user.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.status}
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-gray-600 p-2 rounded-lg bg-gray-50">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 p-2 rounded-lg bg-gray-50">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-3 text-gray-600 p-2 rounded-lg bg-gray-50">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{user.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Stats Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Admin Statistics
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">System Access</span>
                  <span className="font-medium text-gray-900">Full</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Permissions</span>
                  <span className="font-medium text-gray-900">All</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Login</span>
                  <span className="font-medium text-gray-900">Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Personal Information
              </h3>

              <div className="space-y-6">
                {/* User Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.userName}
                      onChange={(e) =>
                        setFormData({ ...formData, userName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="flex items-center gap-3 text-gray-900 p-3 rounded-lg bg-gray-50">
                      <User className="w-4 h-4" />
                      {user.userName}
                    </div>
                  )}
                </div>

                {/* Email - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3 text-gray-900 p-3 rounded-lg bg-gray-50">
                    <Mail className="w-4 h-4" />
                    {user.email}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-3 text-gray-900 p-3 rounded-lg bg-gray-50">
                      <Phone className="w-4 h-4" />
                      {user.phoneNumber || "Not provided"}
                    </div>
                  )}
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        user.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-gray-900 capitalize">
                      {user.status?.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Features Section */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* System Access Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  System Access
                </h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>User Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Vendor Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Payment Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>System Settings</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <button className="w-full text-left hover:text-blue-600 transition-colors">
                    • View System Logs
                  </button>
                  <button className="w-full text-left hover:text-blue-600 transition-colors">
                    • Manage Administrators
                  </button>
                  <button className="w-full text-left hover:text-blue-600 transition-colors">
                    • System Configuration
                  </button>
                  <button className="w-full text-left hover:text-blue-600 transition-colors">
                    • Backup & Restore
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
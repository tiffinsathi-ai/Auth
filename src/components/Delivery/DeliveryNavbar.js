// layout/DeliveryNavbar.js
import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Settings,
  LogOut,
  UserCircle,
  Menu,
  Truck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deliveryApi } from "../../services/deliveryApi";
import logo from "../../assets/logo.png";
import defaultUser from "../../assets/login.jpg";

const designTokens = {
  colors: {
    secondary: {
      main: "#D94826",
      hover: "#5FA535",
    },
    accent: {
      red: "#D94826",
    },
    background: {
      primary: "#FFFFFF",
    },
    text: {
      primary: "#212529",
      secondary: "#6C757D",
    },
    border: {
      light: "#E9ECEF",
    },
  },
};

const DeliveryNavbar = ({ onToggleSidebar }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // ---------------- FETCH USER ----------------
  const fetchUser = async () => {
    try {
      setLoading(true);
      let userData = await deliveryApi.getCurrentUser();
      if (!userData) {
        userData = {
          userName: "Delivery Partner",
          email: "delivery@tiffinsathi.com",
        };
      }
      setUser(userData);
      setProfilePicture(userData.profilePicture || null);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (e) {
      console.log("Fallback to local user");
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
      else {
        setUser({
          userName: "Delivery Partner",
          email: "delivery@tiffinsathi.com",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------- EFFECTS ----------------
  useEffect(() => { fetchUser(); }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------------- HELPERS ----------------
  const getDisplayName = () =>
    user?.userName || user?.name || "Delivery Partner";

  const getUserEmail = () =>
    user?.email || "delivery@tiffinsathi.com";

  const getProfileSrc = () => {
    if (profilePicture) {
      if (profilePicture.startsWith("data:")) return profilePicture;
      return `data:image/jpeg;base64,${profilePicture}`;
    }
    return defaultUser;
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  // ---------------- LOADING SKELETON ----------------
  if (loading) {
    return (
      <nav className="sticky top-0 z-50 bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-gray-100 lg:hidden">
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <img src={logo} className="w-10 h-10" />
              <h1 className="text-2xl font-bold text-green-600 hidden sm:block">
                Delivery Portal
              </h1>
            </div>
          </div>
          <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
        </div>
      </nav>
    );
  }

  // ---------------- UI ----------------
  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        backgroundColor: designTokens.colors.background.primary,
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        {/* ---- LEFT LOGO ---- */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>

          <div className="flex items-center gap-3">
            <img src={logo} className="w-10 h-10" />
            <h1
              className="text-2xl font-bold hidden sm:block"
              style={{
                fontFamily: "'Brush Script MT', cursive",
                color: designTokens.colors.secondary.main,
              }}
            >
              Delivery Portal
            </h1>
          </div>
        </div>

        {/* ---- RIGHT ITEMS ---- */}
        <div className="flex items-center gap-4">
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Bell size={22} />
            <span
              className="absolute -top-1 -right-1 text-xs w-4 h-4 rounded-full text-white flex items-center justify-center"
              style={{ backgroundColor: designTokens.colors.accent.red }}
            >
              3
            </span>
          </button>

          {/* ---- DROPDOWN ---- */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200">
                <img src={getProfileSrc()} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-medium hidden sm:block">
                {getDisplayName()}
              </span>
            </button>

            {isDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg overflow-hidden"
                style={{
                  backgroundColor: designTokens.colors.background.primary,
                  border: `1px solid ${designTokens.colors.border.light}`,
                }}
              >
                {/* USER INFO */}
                <div className="px-4 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border bg-gray-200">
                      <img src={getProfileSrc()} className="w-full h-full object-cover" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        {getDisplayName()}
                      </p>
                      <p className="text-xs text-gray-600">{getUserEmail()}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Truck size={12} className="text-orange-500" />
                        <span className="text-xs text-orange-600 font-medium">
                          Delivery Partner
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MENU OPTIONS */}
                <div className="py-2">
                  <button
                    onClick={() => navigate("/delivery/dashboard")}
                    className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-50"
                  >
                    <Truck size={18} />
                    <span className="text-sm">My Deliveries</span>
                  </button>

                  <button
                    onClick={() => navigate("/delivery/profile")}
                    className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-50"
                  >
                    <UserCircle size={18} />
                    <span className="text-sm">My Profile</span>
                  </button>

                  <button
                    className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-gray-50"
                    onClick={() => navigate("/delivery/settings")}
                  >
                    <Settings size={18} />
                    <span className="text-sm">Settings</span>
                  </button>
                </div>

                {/* LOGOUT */}
                <div className="border-t border-gray-200">
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
};

export default DeliveryNavbar;

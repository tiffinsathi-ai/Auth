// layout/DeliverySidebar.js
import React, { useState } from "react";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Clock,
  BarChart3,
  User,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const designTokens = {
  colors: {
    secondary: {
      main: "#F97316", // ORANGE for Delivery sidebar (change if needed)
    },
    background: {
      primary: "#FFFFFF",
    },
    text: {
      primary: "#212529",
      inverse: "#FFFFFF",
    },
    border: {
      light: "#E9ECEF",
    },
  },
};

const DeliverySidebar = ({ isOpen }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const location = useLocation();

  const menuItems = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/delivery",
    },
    {
      id: "deliveries",
      icon: Package,
      label: "My Deliveries",
      path: "/delivery/deliveries",
    },
    {
      id: "routes",
      icon: MapPin,
      label: "Delivery Routes",
      path: "/delivery/routes",
    },
    {
      id: "schedule",
      icon: Clock,
      label: "Schedule",
      path: "/delivery/schedule",
    },
    {
      id: "performance",
      icon: BarChart3,
      label: "Performance",
      path: "/delivery/performance",
    },
    {
      id: "profile",
      icon: User,
      label: "My Profile",
      path: "/delivery/profile",
    },
  ];

  if (!isOpen) return null;

  return (
    <aside
      className="w-64 sticky top-16 border-r flex-shrink-0"
      style={{
        backgroundColor: designTokens.colors.background.primary,
        borderColor: designTokens.colors.border.light,
        height: "calc(100vh - 64px)",
        overflow: "hidden",
      }}
    >
      <nav className="p-4 overflow-hidden h-full">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isHovered = hoveredItem === item.id;
          const marginTop = index === 0 ? "0" : "0.5rem";

          return (
            <Link
              key={item.id}
              to={item.path}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: isActive
                  ? designTokens.colors.secondary.main
                  : isHovered
                  ? "#F3F4F6"
                  : "transparent",
                color: isActive
                  ? designTokens.colors.text.inverse
                  : designTokens.colors.text.primary,
                textDecoration: "none",
                fontWeight: isActive ? "bold" : "normal",
                marginTop: marginTop,
                border: isActive
                  ? `1px solid ${designTokens.colors.secondary.main}`
                  : "1px solid transparent",
              }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default DeliverySidebar;

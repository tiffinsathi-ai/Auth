// components/MapModal.js
import React from "react";
import Modal from "./Modal";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Navigation,
  UserCircle,
  Map,
} from "lucide-react";

const MapModal = ({ isOpen, onClose, order, userLocation }) => {
  const getMapUrl = (address) => {
    if (!address) return null;
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;
};

  const formatPhoneNumber = (phone) => {
    if (!phone) return "N/A";
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  };

  return (
    
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        order
          ? `Delivery Location - Order #${order.orderId}`
          : "Delivery Location"
      }
      size="lg"
    >
      <div className="p-4">
        {order ? (
          <div className="space-y-4">
            {/* -------------------- CUSTOMER INFO -------------------- */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h4>

              <div className="flex items-start gap-4">
                {/* Profile Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {order.customer?.profilePicture ? (
                      <img
                        src={order.customer.profilePicture}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : order.customer?.userName ? (
                      <span className="text-blue-600 font-bold text-lg">
                        {order.customer.userName.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <UserCircle className="w-8 h-8 text-blue-400" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                        Name
                      </label>
                      <p className="font-semibold text-gray-900 truncate">
                        {order.customer?.userName || "Customer"}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                        Phone
                      </label>
                      <p className="font-medium text-gray-900">
                        {formatPhoneNumber(order.customer?.phoneNumber)}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                        Email
                      </label>
                      <p className="text-gray-700 truncate">
                        {order.customer?.email || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* -------------------- ORDER DETAILS -------------------- */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Map className="w-5 h-5" />
                Order Details
              </h4>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Order ID:</span>
                  <p className="font-semibold">#{order.orderId}</p>
                </div>

                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <p className="font-semibold capitalize">
                    {order.status?.toLowerCase()}
                  </p>
                </div>

                {order.preferredDeliveryTime && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">
                      Preferred Time:
                    </span>
                    <p className="font-semibold">
                      {order.preferredDeliveryTime}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* -------------------- DELIVERY ADDRESS -------------------- */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Address
              </h4>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-gray-800 leading-relaxed">
                    {order.deliveryAddress}
                  </p>

                  {order.specialInstructions && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <span className="text-sm font-medium text-yellow-800">
                        Special Instructions:
                      </span>
                      <p className="text-sm text-yellow-700 mt-1">
                        {order.specialInstructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* -------------------- GOOGLE MAP -------------------- */}
            <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
              {getMapUrl(order.deliveryAddress) ? (
                <iframe
                  title="Google Map"
                  src={getMapUrl(order.deliveryAddress)}
                  width="100%"
                  height="240"
                  className="border-0"
                  loading="lazy"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                  <MapPin className="w-10 h-10" />
                </div>
              )}
            </div>

            {/* -------------------- ACTION BUTTONS -------------------- */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  order.deliveryAddress
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <Navigation className="w-5 h-5" />
                Open in Maps
              </a>

              {order.customer?.phoneNumber && (
                <a
                  href={`tel:${order.customer.phoneNumber}`}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors font-medium"
                >
                  <Phone className="w-5 h-5" />
                  Call Customer
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <UserCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No order selected</p>
            <p className="text-gray-400 text-sm mt-1">
              Please select an order to view delivery details
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MapModal;

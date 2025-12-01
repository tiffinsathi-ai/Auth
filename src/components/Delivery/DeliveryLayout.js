import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DeliveryNavbar from './DeliveryNavbar';
import DeliverySidebar from './DeliverySidebar';
import DeliveryFooter from './DeliveryFooter';

const designTokens = {
  colors: {
    background: {
      secondary: '#F8F9FA'
    }
  }
};

const DeliveryLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div 
      className="h-screen flex flex-col" 
      style={{ backgroundColor: designTokens.colors.background.secondary }}
    >
      <DeliveryNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
    
      <div className="flex flex-1 h-full overflow-hidden">
        
        <div className={`h-full sticky top-0 overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}>
          <DeliverySidebar isOpen={sidebarOpen} />
        </div>
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <Outlet />
          </div>
          
          <DeliveryFooter />
        </main>
      </div>
    </div>
  );
};

export default DeliveryLayout;
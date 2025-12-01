import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import AdminFooter from './AdminFooter';

const designTokens = {
  colors: {
    background: {
      secondary: '#F8F9FA'
    }
  }
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div 
      className="h-screen flex flex-col" 
      style={{ backgroundColor: designTokens.colors.background.secondary }}
    >
      <AdminNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
    
      <div className="flex flex-1 h-full overflow-hidden">
        
        <div className={`h-full sticky top-0 overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}>
          <AdminSidebar isOpen={sidebarOpen} />
        </div>
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <Outlet />
          </div>
          
          <AdminFooter />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
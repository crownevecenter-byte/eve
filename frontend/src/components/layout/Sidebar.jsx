// frontend/src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wrench,
  Settings,
  LogOut,
  FileText
} from 'lucide-react';

const Sidebar = ({ user, logout }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/owner/dashboard', icon: <LayoutDashboard size={20} />, roles: ['COMPANY_OWNER'] },
    { name: 'Dashboard', path: '/branch/dashboard', icon: <LayoutDashboard size={20} />, roles: ['BRANCH_OWNER', 'BRANCH_MANAGER'] },
    { name: 'Branches', path: '/owner/branches', icon: <Settings size={20} />, roles: ['COMPANY_OWNER'] },
    { name: 'Inventory', path: '/branch/inventory', icon: <Package size={20} />, roles: ['COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER'] },
    { name: 'Products', path: '/branch/products', icon: <ShoppingCart size={20} />, roles: ['COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER'] },
    { name: 'Services', path: '/branch/services', icon: <Wrench size={20} />, roles: ['COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER'] },
    { name: 'Orders', path: '/branch/orders', icon: <Package size={20} />, roles: ['COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER'] },
    { name: 'Reports', path: '/owner/reports', icon: <FileText size={20} />, roles: ['COMPANY_OWNER'] },
    { name: 'Reports', path: '/branch/reports', icon: <FileText size={20} />, roles: ['BRANCH_OWNER', 'BRANCH_MANAGER'] },
    { name: 'Personnel', path: '/owner/users', icon: <Settings size={20} />, roles: ['COMPANY_OWNER'] },
    { name: 'Settings', path: '/owner/settings', icon: <Settings size={20} />, roles: ['COMPANY_OWNER'] },
  ];

  const filteredNav = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-72 bg-[#0A0A0A] border-r border-white/5 hidden lg:flex flex-col p-8 fixed h-full z-40">
      <div className="mb-12 flex items-center gap-4">
        <div className="logo-icon"><span>CE</span></div>
        <div>
          <h1 className="text-xl font-bold tracking-tighter uppercase leading-none text-orange-600">Crown <span className="text-[#FF4D00]">Eve</span></h1>
          <p className="text-[8px] uppercase tracking-[0.3em] text-[#888] font-black mt-1">Management Node</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {filteredNav.map((item, idx) => (
          <Link
            key={idx}
            to={item.path}
            className={`flex items-center space-x-4 p-4 rounded-lg transition-all ${location.pathname === item.path
                ? 'bg-[#FF4D00] text-orange-600 shadow-xl shadow-[#FF4D00]/20'
                : 'text-[#BDBDB8] hover:text-orange-600 hover:bg-white/5'
              }`}
          >
            {item.icon}
            <span className="font-bold text-sm tracking-wide">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="pt-8 border-t border-white/5 space-y-4">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-4 p-4 rounded-lg text-[#888] hover:text-[#FF4D00] hover:bg-[#FF4D00]/5 transition-all"
        >
          <LogOut size={20} />
          <span className="font-bold text-sm tracking-wide">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

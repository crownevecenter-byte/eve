// frontend/src/components/layout/TopBar.jsx
import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import SearchInput from '../SearchInput';
import { Link } from 'react-router-dom';

const TopBar = ({ user, logout, isMinimal = false }) => {
  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center space-x-4">
         {isMinimal && <Link to="/" className="text-xl font-black italic tracking-tighter">CROWN EV</Link>}
         {!isMinimal && <button className="lg:hidden p-2 hover:bg-white/5 rounded-xl"><Menu /></button>}
         <div className="hidden lg:flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-slate-500">
            <span>Terminal</span>
            <span className="w-1 h-1 bg-slate-700 rounded-full" />
            <span className="text-blue-500">{user?.branchName || 'Global'}</span>
         </div>
      </div>
      
      <div className="flex items-center space-x-6">
        {!isMinimal && (
          <SearchInput
            className="hidden md:block w-56"
            variant="dark"
            label="Global search..."
          />
        )}
        <div className="flex items-center space-x-3 bg-slate-900 p-1.5 pr-4 rounded-full border border-white/5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold leading-none">{user?.name?.split(' ')[0] || 'User'}</p>
            <p className="text-[8px] text-slate-500 uppercase tracking-widest">{user?.role?.replace('_', ' ') || 'Guest'}</p>
          </div>
        </div>
        {isMinimal && (
          <button onClick={logout} className="p-2 text-red-900 hover:text-red-500 transition-all">
            <LogOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;

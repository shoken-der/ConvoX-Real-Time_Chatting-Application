import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import useChat from '../../hooks/useChat';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const { setCurrentChat } = useChat();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleHome = () => {
    if (setCurrentChat) {
      setCurrentChat(null);
    }
    navigate('/');
  };

  const handleProfileSetup = () => {
    navigate('/profile-setup');
  };

  return (
    <div className="hidden lg:flex flex-col h-full w-[76px] bg-surface-elevated border-r border-border items-center py-6 shadow-xl relative z-20">
      {/* Logo */}
      <div className="mb-8 cursor-pointer" onClick={handleHome} title="Home">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all">
          <MessageSquare className="text-white w-5 h-5" />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom: Avatar + Logout */}
      <div className="flex flex-col items-center gap-3 pt-4 border-t border-border/50">
        <div 
          className="relative cursor-pointer hover:opacity-80 transition-opacity group" 
          onClick={handleProfileSetup}
          title="Edit Profile"
        >
          <img
            src={currentUser?.photoUrl || `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'U'}&background=635BFF&color=fff&size=40`}
            alt=""
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#2A3245] ring-offset-2 ring-offset-[#1F2937] group-hover:ring-[#635BFF] transition-all"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-surface rounded-full"></div>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-text-muted hover:bg-danger/10 hover:text-danger transition-all"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

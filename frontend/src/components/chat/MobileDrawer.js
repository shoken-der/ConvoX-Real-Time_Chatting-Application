import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import useChat from '../../hooks/useChat';

const MobileDrawer = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const { setCurrentChat } = useChat();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  const handleHome = () => {
    if (setCurrentChat) {
      setCurrentChat(null);
    }
    navigate('/');
    onClose();
  };

  const handleProfileSetup = () => {
    navigate('/profile-setup');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="absolute top-0 left-0 h-full w-[260px] bg-surface shadow-premium-lg flex flex-col p-6 animate-slide-in-left border-r border-border/50">
        <div className="flex items-center justify-between mb-8">
          <div 
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg cursor-pointer hover:shadow-primary/40 transition-shadow"
            onClick={handleHome}
            title="Home"
          >
            <MessageSquare className="text-white w-5 h-5" />
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-main transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* User Card */}
        <div 
          className="flex items-center gap-3 p-3 bg-surface-elevated rounded-2xl mb-6 cursor-pointer hover:bg-surface-hover transition-colors group border border-border/30"
          onClick={handleProfileSetup}
          title="Edit Profile"
        >
          <img
            src={currentUser?.photoUrl || `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'U'}&background=635BFF&color=fff`}
            alt=""
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#2A3245] ring-offset-2 ring-offset-[#1F2937] group-hover:ring-[#635BFF] transition-all"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] font-bold text-text-main truncate group-hover:text-primary transition-colors">{currentUser?.displayName || 'User'}</h4>
            <p className="text-[11px] text-success font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
              Online
            </p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Logout */}
        <div className="pt-4 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-danger hover:bg-danger/10 transition-all text-[14px] font-semibold"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;

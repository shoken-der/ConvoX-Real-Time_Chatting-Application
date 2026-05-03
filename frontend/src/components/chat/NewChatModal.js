import React, { useState, useEffect } from "react";
import { X, Search, MessageSquare, UserPlus } from "lucide-react";
import { getAllUsers } from "../../services/ChatService";
import { useAuth } from "../../contexts/AuthContext";

const UserCard = ({ user, onSelect }) => {
  const initials = user?.displayName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  
  return (
    <div 
      onClick={() => onSelect(user)}
      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-hover cursor-pointer transition-all border border-transparent hover:border-border/40 group active:scale-[0.98]"
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-elevated flex-shrink-0 group-hover:shadow-md transition-all">
        {user.photoUrl ? (
          <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-text-main font-bold">
            {initials}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[15px] font-bold text-text-main truncate tracking-tight">{user.displayName || "User"}</h4>
        <p className="text-[12px] text-text-muted font-medium truncate">{user.email}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:text-white transition-all border border-border/30">
        <MessageSquare size={18} />
      </div>
    </div>
  );
};

const NewChatModal = ({ isOpen, onClose, onSelectUser }) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const res = await getAllUsers();
          if (res) {
            const others = res.filter(u => u.id !== currentUser?.id);
            setUsers(others);
          }
        } catch (err) {
          console.error("NewChatModal - Error fetching users:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen, currentUser?.id]);

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      <div className="bg-surface w-full max-w-[480px] rounded-[28px] shadow-premium-lg relative z-10 flex flex-col overflow-hidden animate-zoom-in max-h-[85vh] border border-border/60">
        {/* Header */}
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-black text-text-main tracking-tight">New Message</h2>
            <p className="text-[13px] text-text-muted font-medium">Start a new conversation with someone</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-surface-elevated text-text-muted hover:text-text-main flex items-center justify-center transition-all border border-border/30"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 pb-0">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-11 pr-4 py-3.5 bg-surface-elevated border border-border/40 focus:border-primary/30 rounded-2xl text-[14px] outline-none transition-all font-medium text-text-main placeholder:text-text-muted/60 focus:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-[300px] custom-scrollbar">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                  <div className="w-12 h-12 bg-surface-elevated rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-elevated rounded-full w-1/3" />
                    <div className="h-3 bg-surface-elevated/50 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <UserCard key={user.id} user={user} onSelect={onSelectUser} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-surface-elevated rounded-3xl flex items-center justify-center mb-4 border border-border/30">
                <UserPlus className="text-text-muted" size={28} />
              </div>
              <p className="text-text-muted text-[14px] font-medium px-10">
                {search ? "No users found" : "No users available to message right now."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;

import { useState, useEffect, useMemo, useRef } from "react";
import { getUser } from "../../services/ChatService";
import { MoreVertical, EyeOff, Trash2 } from "lucide-react";

const Avatar = ({ user, isOnline, isSelected }) => {
  const initials = user?.displayName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  
  const gradients = [
    "from-[#635BFF] to-[#7C3AED]",
    "from-[#0EA5E9] to-[#2563EB]",
    "from-[#EC4899] to-[#D946EF]",
    "from-[#F59E0B] to-[#EF4444]",
    "from-[#10B981] to-[#059669]",
  ];
  
  const gradient = gradients[(user?.id || 0) % gradients.length];

  return (
    <div className="relative flex-shrink-0">
      <div className={`w-[48px] h-[48px] rounded-xl overflow-hidden transition-all duration-300 ring-2 ring-offset-2 ring-offset-[#0B0F19] ${isSelected ? 'shadow-md shadow-[#635BFF]/20 ring-[#635BFF]' : 'ring-[#2A3245] shadow-sm'}`}>
        {user?.photoUrl ? (
          <img
            className="w-full h-full object-cover"
            src={user.photoUrl}
            alt={user.displayName}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-[16px] font-black text-white tracking-tighter">{initials}</span>
          </div>
        )}
      </div>
      {isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-[3px] border-surface bg-success shadow-sm" />
      )}
    </div>
  );
};

export default function Contact({ chatRoom, onlineUsersId, currentUser, isSelected, typingStatus = {}, onHide, onDelete }) {
  const [contact, setContact] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const member = chatRoom?.members?.find((m) => m.id !== currentUser?.id);
    if (!member) return;

    if (member.displayName) {
      setContact(member);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await getUser(member.id || member);
        if (res) setContact(res);
      } catch (err) {
        // silently fail
      }
    };
    fetchData();
  }, [chatRoom, currentUser?.id]);

  const isOnline = onlineUsersId?.some(id => String(id) === String(contact.id));
  const lastMessage = chatRoom?.lastMessage;

  const timeString = useMemo(() => {
    const raw = lastMessage?.createdAt || chatRoom?.updatedAt || chatRoom?.createdAt;
    if (!raw) return "";
    const date = new Date(raw);
    if (isNaN(date.getTime())) return "";
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const isThisWeek = (now - date) < 7 * 24 * 60 * 60 * 1000;

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
    } else if (isYesterday) {
      return "Yesterday";
    } else if (isThisWeek) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }, [lastMessage, chatRoom]);

  const handleHideClick = (e) => {
    e.stopPropagation();
    onHide && onHide(chatRoom.id);
    setShowMenu(false);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete && onDelete(chatRoom.id);
  };

  return (
    <div
      className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 relative overflow-hidden ${
        isSelected
          ? "bg-[#171D2E]"
          : "hover:bg-[#13182A]"
      }`}
    >

      <Avatar user={contact} isOnline={isOnline} isSelected={isSelected} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className={`text-[15px] font-semibold truncate tracking-tight ${
            isSelected ? "text-white" : "text-[#F9FAFB] group-hover:text-white"
          }`}>
            {contact.displayName || contact.email?.split('@')[0] || "User"}
          </h4>
          <div className="flex items-center gap-2">
             {timeString && (
               <span className={`text-[11px] font-medium shrink-0 ${
                 isSelected ? "text-[#635BFF]" : "text-[#6B7280]"
               }`}>
                 {timeString}
               </span>
             )}
             
             {/* Menu Toggle */}
             <button 
               onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
               className={`p-1 rounded-full hover:bg-[#2A3245] text-[#6B7280] transition-all opacity-0 group-hover:opacity-100 ${showMenu ? 'opacity-100' : ''}`}
             >
               <MoreVertical size={14} />
             </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[13px] truncate ${
            isSelected ? "text-[#6B7280]" : "text-[#6B7280]"
          }`}>
            {typingStatus[chatRoom.id]?.isTyping ? (
              <span className="text-primary font-bold animate-pulse italic">Typing...</span>
            ) : lastMessage ? (
              <>
                {lastMessage.sender === currentUser?.id && <span className="font-bold mr-1 opacity-70">You:</span>}
                {(lastMessage.content || lastMessage.message) ? (lastMessage.content || lastMessage.message) : (lastMessage.imageUrl || lastMessage.fileUrl) ? "📷 Image" : "File"}
              </>
            ) : (
              <span className="italic opacity-60">Start chatting 👋</span>
            )}
          </p>
          
          {/* Delete Icon (Visible on hover) */}
          <button 
            onClick={handleDeleteClick}
            className="p-2 rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100"
            title="Delete Chat"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div 
          ref={menuRef}
          className="absolute right-4 top-12 z-50 bg-surface-elevated rounded-2xl shadow-premium-lg border border-border/60 py-1.5 w-48 animate-zoom-in"
          onClick={e => e.stopPropagation()}
        >
          <button 
            onClick={handleHideClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-text-secondary hover:bg-surface-hover hover:text-text-main transition-colors"
          >
            <EyeOff size={16} />
            <span>Hide from list</span>
          </button>
        </div>
      )}
    </div>
  );
}

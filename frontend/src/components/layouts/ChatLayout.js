import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useChat from "../../hooks/useChat";
import { Search, Plus, MessageSquare, LogOut, X, Download } from "lucide-react";
import MobileDrawer from "../chat/MobileDrawer";
import ChatRooms from "../chat/ChatRooms";
import Welcome from "../chat/Welcome";
import ChatRoom from "../chat/ChatRoom";
import NewChatModal from "../chat/NewChatModal";
import ErrorMessage from "../layouts/ErrorMessage";
import { useAuth } from "../../contexts/AuthContext";
import { getChatRoomOfUsers, createChatRoom, hideChatRoom, deleteChatRoom } from "../../services/ChatService";

export default function ChatLayout() {
  const { chatRooms, updateChatRooms, currentChat, setCurrentChat, searchQuery, setSearchQuery, refresh, selectedImage, setSelectedImage } = useChat();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const handleChatChange = useCallback(
    (chat) => {
      setCurrentChat(chat);
    },
    [setCurrentChat]
  );

  const handleSelectUser = async (user) => {
    setIsNewChatModalOpen(false);
    setSearchQuery("");

    try {
      let room = await getChatRoomOfUsers(currentUser.id, user.id);
      if (!room) {
        room = await createChatRoom({ senderId: currentUser.id, receiverId: user.id });
      }
      await refresh();
      setCurrentChat(room);
    } catch (err) {
      console.error("Failed to start chat:", err);
      alert("Failed to start chat: " + (err.response?.data?.message || err.message));
    }
  };

  const handleHideChat = async (roomId) => {
    try {
      if (updateChatRooms && chatRooms) {
        updateChatRooms(chatRooms.filter(r => r.id !== roomId));
      }
      await hideChatRoom(roomId, currentUser.id);
      if (currentChat?.id === roomId) {
        setCurrentChat(null);
      }
      refresh();
    } catch (err) {
      console.error("Failed to hide chat:", err);
    }
  };

  const handleDeleteChat = async (roomId) => {
    try {
      if (updateChatRooms && chatRooms) {
        updateChatRooms(chatRooms.filter(r => r.id !== roomId));
      }
      await deleteChatRoom(roomId);
      if (currentChat?.id === roomId) {
        setCurrentChat(null);
      }
      refresh();
    } catch (err) {
      console.error("Failed to delete chat:", err);
      alert("Failed to delete chat: " + (err.response?.data?.message || err.message));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#0B0F19] overflow-hidden font-sans relative text-[#F9FAFB]">
      <ErrorMessage />

      {/* Fullscreen Glassmorphic Image Previewer */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          {/* Preview Card */}
          <div
            className="relative z-10 flex flex-col max-w-[90vw] md:max-w-[600px] lg:max-w-[800px] max-h-[98vh] animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#111827]/90 backdrop-blur-md border border-[#2A3245] rounded-t-2xl">
              <span className="text-[13px] font-medium text-[#9CA3AF] truncate max-w-[200px]">Image Preview</span>
              <div className="flex items-center gap-2">
                {/* Download */}
                <a
                  href={selectedImage}
                  download
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#635BFF]/20 hover:bg-[#635BFF]/30 border border-[#635BFF]/30 rounded-lg text-[#635BFF] text-[12px] font-semibold transition-all"
                >
                  <Download size={14} />
                  Download
                </a>
                {/* Close */}
                <button
                  onClick={() => setSelectedImage(null)}
                  className="w-8 h-8 flex items-center justify-center bg-[#1F2937] hover:bg-[#2A3245] border border-[#2A3245] rounded-lg text-[#9CA3AF] hover:text-[#F9FAFB] transition-all"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="bg-[#0B0F19]/60 backdrop-blur-sm border-x border-b border-[#2A3245] rounded-b-2xl overflow-hidden flex items-center justify-center p-2 lg:p-3">
              <img
                src={selectedImage}
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      <NewChatModal 
        isOpen={isNewChatModalOpen} 
        onClose={() => setIsNewChatModalOpen(false)}
        onSelectUser={handleSelectUser}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex-1 flex min-w-0 overflow-hidden">
          <div
            className={`${
              currentChat ? "hidden md:flex" : "flex"
            } flex-col w-full md:w-[320px] lg:w-[340px] bg-[#111827] border-r border-[#1F2232] h-full shrink-0 relative z-10`}
          >
            <div className="p-6 pb-2 flex flex-col gap-6">
              {/* Logo + New Chat Header */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#635BFF] flex items-center justify-center shadow-lg shadow-[#635BFF]/20">
                    <MessageSquare className="text-white w-5 h-5" />
                  </div>
                  <h1 className="text-[20px] font-bold tracking-wide">ConvoX</h1>
                </div>
                
                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="p-2 w-10 h-10 rounded-xl bg-[#635BFF]/10 text-[#635BFF] hover:bg-[#635BFF]/20 flex items-center justify-center transition-all active:scale-95 shadow-sm border border-[#635BFF]/20"
                  title="New Chat"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Search */}
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Search users or chats..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#171923] border border-[#2A3245] focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] rounded-xl text-[13px] outline-none transition-all font-medium placeholder:text-[#6B7280] text-[#F9FAFB]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="px-6 py-3">
               <h3 className="text-[12px] font-medium text-[#6B7280]">Recent Chats</h3>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-1 custom-scrollbar">
              <ChatRooms 
                onChatChange={handleChatChange} 
                onUserClick={handleSelectUser} 
                onHideChat={handleHideChat} 
                onDeleteChat={handleDeleteChat}
              />
            </div>

            {/* Profile / Logout */}
            <div className="shrink-0 bg-[#171923] border border-[#2A3245] mx-2 mb-2 rounded-2xl py-3 px-4 flex items-center justify-between">
               <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/profile-setup')}>
                  <img src={currentUser?.photoUrl || `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'U'}&background=635BFF&color=fff`} className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#2A3245] ring-offset-2 ring-offset-[#171923] group-hover:ring-[#635BFF] transition-all" alt="" />
                  <div className="flex flex-col">
                     <span className="text-[13px] font-semibold text-white">{currentUser?.displayName?.split(' ')[0]}</span>
                     <span className="text-[11px] text-[#10B981] font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Online
                     </span>
                  </div>
               </div>
               <button onClick={handleLogout} className="p-2 text-[#6B7280] hover:text-red-500 transition-colors">
                 <LogOut size={18} />
               </button>
            </div>
          </div>

          <div
            className={`${
              currentChat ? "flex" : "hidden md:flex"
            } flex-1 bg-[#0F1321] h-full relative z-0`}
          >
            {currentChat ? (
              <ChatRoom />
            ) : (
              <Welcome />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

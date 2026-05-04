import React from "react";
import useChat from "../../hooks/useChat";
import { useAuth } from "../../contexts/AuthContext";
import Contact from "./Contact";
import { MessageCircle } from "lucide-react";

const ChatRooms = ({ onChatChange, onUserClick, onHideChat, onDeleteChat }) => {
  const { sortedRooms = [], searchQuery, loading, hasInitiallyLoaded, currentChat, onlineUsersId, typingStatus } = useChat();
  const { currentUser } = useAuth();

  const displayRooms = sortedRooms;

  // Show skeleton ONLY when actively loading AND we have no cached data yet.
  // hasInitiallyLoaded being true means rooms have been fetched at least once,
  // so we never show a skeleton if we already have data in the list.
  if (loading && !hasInitiallyLoaded && sortedRooms.length === 0) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3.5 rounded-2xl animate-pulse">
            <div className="w-[52px] h-[52px] bg-surface-elevated rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3 py-1">
              <div className="flex justify-between">
                <div className="h-4 bg-surface-elevated rounded-full w-1/3" />
                <div className="h-2.5 bg-surface-elevated/50 rounded-full w-12" />
              </div>
              <div className="h-3 bg-surface-elevated/50 rounded-full w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show empty state ONLY after we have confirmed there are no conversations
  // (hasInitiallyLoaded ensures we don't flash this before the first fetch)
  if (hasInitiallyLoaded && displayRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-10 text-center animate-fade-in">
        <div className="w-16 h-16 bg-surface-elevated rounded-3xl flex items-center justify-center mb-4 border border-border/40">
          <MessageCircle className="text-text-muted" size={28} />
        </div>
        <h3 className="text-[15px] font-black text-text-main mb-1">
          {searchQuery?.trim() ? "No results found" : "No conversations yet"}
        </h3>
        <p className="text-[13px] text-text-muted font-medium leading-relaxed">
          {searchQuery?.trim() ? "Try a different name" : "Start chatting 👋"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {displayRooms.map((room) => (
        <div key={room.id} onClick={() => onChatChange(room)}>
          <Contact
            chatRoom={room}
            onlineUsersId={onlineUsersId}
            currentUser={currentUser}
            isSelected={currentChat?.id === room.id}
            typingStatus={typingStatus}
            onHide={onHideChat}
            onDelete={onDeleteChat}
          />
        </div>
      ))}
    </div>
  );
};

export default ChatRooms;

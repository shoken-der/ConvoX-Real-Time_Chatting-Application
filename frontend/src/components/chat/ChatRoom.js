import { useState, useEffect, useRef, useCallback } from "react";
import { sendMessage, markMessageSeen, uploadFile } from "../../services/ChatService";
import { useAuth } from "../../contexts/AuthContext";
import useChat from "../../hooks/useChat";
import useMessages from "../../hooks/useMessages";
import Message from "./Message";
import ChatHeaderInfo from "./ChatHeaderInfo";
import ChatForm from "./ChatForm";
import { MessageSquare, AlertCircle } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

function MessageSkeleton({ self }) {
  return (
    <div className={`flex flex-col ${self ? "items-end" : "items-start"} mb-5 px-4 animate-pulse`}>
      <div className={`h-11 rounded-[20px] ${self ? "w-44 bg-primary/10 rounded-br-none" : "w-52 bg-surface-elevated rounded-bl-none"}`} />
    </div>
  );
}

function DateSeparator({ date }) {
  const getLabel = () => {
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMMM d, yyyy");
  };
  return (
    <div className="flex justify-center my-6">
      <span className="text-[11px] font-medium text-[#F9FAFB] px-4 py-1.5 rounded-[12px] bg-[#171923]">
        {getLabel()}
      </span>
    </div>
  );
}

function ConnectionBanner({ connected }) {
  if (connected) return null;
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-warning/10 border-b border-warning/20 text-warning text-[11px] font-bold">
      <AlertCircle size={13} className="animate-pulse" />
      Reconnecting...
    </div>
  );
}

export default function ChatRoom() {
  const { currentUser } = useAuth();
  const { currentChat, socket, connected, onlineUsersId, setSelectedImage, emit, messagesLoading } = useChat();

  const {
    messages,
    loading,
    hasMore,
    loadMore,
    isTyping,
    typingUser,
    updateLocalMessage,
    updateLocalReactions,
    addLocalMessage,
    resolveOptimisticMessage
  } = useMessages(currentChat?.id, socket, currentUser?.id, connected);

  // Buffer typing user to avoid glitch during 700ms fade-out
  const [displayTypingUser, setDisplayTypingUser] = useState(null);
  useEffect(() => {
    if (typingUser) {
      setDisplayTypingUser(typingUser);
    } else if (!isTyping) {
      const timer = setTimeout(() => setDisplayTypingUser(null), 800);
      return () => clearTimeout(timer);
    }
  }, [typingUser, isTyping]);

  const [replyMessage, setReplyMessage] = useState(null);
  const scrollRef = useRef();
  const observer = useRef();
  const loadMoreObserver = useRef();
  const isInitialScrollRef = useRef(true); // Track if this is the first scroll

  // Reset scroll flag when chat changes so new chats always scroll instantly
  useEffect(() => {
    isInitialScrollRef.current = true;
    setReplyMessage(null);
  }, [currentChat?.id]);

  // Bulk-seen: When opening a chat, mark ALL unread messages from the other user as seen.
  // This is far more reliable than relying solely on IntersectionObserver for the last message.
  useEffect(() => {
    if (!currentChat?.id || !currentUser?.id || messages.length === 0) return;

    const unread = messages.filter(m => {
      const senderId = m.sender?.id || m.senderId || m.sender;
      const isFromOther = String(senderId) !== String(currentUser.id);
      const isRealId = m.id && !String(m.id).startsWith("temp-");
      const notSeenYet = !m.seenBy?.some(u => u.id === currentUser.id || String(u) === String(currentUser.id));
      return isFromOther && isRealId && notSeenYet && !m.isDeleted;
    });

    if (unread.length === 0) return;

    // Fire all seen requests in parallel — backend handles them idempotently
    unread.forEach(m => {
      markMessageSeen(m.id, currentUser.id)
        .then(updatedMsg => updateLocalMessage(updatedMsg))
        .catch(() => {}); // Silently ignore; will retry on next open
    });
  // Only run when messages array reference changes or chat changes, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat?.id, messages.length]);

  // lastMessageRef: Used as a fallback to mark the very last message seen
  // in case bulk-seen misses it (e.g., it arrived after the bulk sweep)
  const lastMessageRef = useCallback((node) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting) {
        const lastMsg = messages[messages.length - 1];
        if (
          lastMsg &&
          lastMsg.sender !== currentUser.id &&
          !String(lastMsg.id || "").startsWith("temp-") &&
          !lastMsg.seenBy?.some((u) => u.id === currentUser.id)
        ) {
          try {
            const updatedMsg = await markMessageSeen(lastMsg.id, currentUser.id);
            updateLocalMessage(updatedMsg);
          } catch (err) {
            // silently fail
          }
        }
      }
    });
    if (node) observer.current.observe(node);
  }, [messages, currentUser?.id, updateLocalMessage]);

  // Infinite scroll top
  const topRef = (node) => {
    if (loadMoreObserver.current) loadMoreObserver.current.disconnect();
    loadMoreObserver.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) loadMore();
    });
    if (node) loadMoreObserver.current.observe(node);
  };

  const prevMessagesLength = useRef(messages.length);
  const prevIsTyping = useRef(isTyping);

  useEffect(() => {
    const hasNewMessage = messages.length > prevMessagesLength.current;
    const typingStarted = isTyping && !prevIsTyping.current;

    if (scrollRef.current) {
      if (isInitialScrollRef.current && messages.length > 0 && !loading && !messagesLoading) {
        // Initial load: instant scroll, no animation to avoid jank
        scrollRef.current.scrollIntoView({ behavior: "instant" });
        isInitialScrollRef.current = false;
      } else if (hasNewMessage || typingStarted) {
        // New message or typing: smooth scroll
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }

    prevMessagesLength.current = messages.length;
    prevIsTyping.current = isTyping;
  }, [messages.length, isTyping, loading, messagesLoading]);

  const handleFormSubmit = async (message, fileOrData = null) => {
    const receiverId = currentChat.members.find((m) => m.id !== currentUser.id)?.id;
    const content = (typeof message === "string" ? message : "") || "";
    const tempId = `temp-${Date.now()}`;

    const isFile = fileOrData instanceof File;
    const localImageUrl = isFile ? URL.createObjectURL(fileOrData) : (fileOrData?.url || null);

    // Build a complete replyTo object — include id, imageUrl, fileType, senderName
    // so the reply preview shows a thumbnail even during the optimistic phase
    const replyToObj = replyMessage ? {
      id: replyMessage.id || null,
      content: replyMessage.content || replyMessage.message || null,
      imageUrl: replyMessage.imageUrl || replyMessage.mediaUrl || null,
      fileType: replyMessage.fileType || null,
      senderName: replyMessage.senderName || null,
    } : null;

    // 1. Create optimistic message for instant UI update (sender only)
    const optimisticMsg = {
      id: tempId,
      tempId: tempId,
      chatRoomId: currentChat.id,
      sender: currentUser.id,
      senderName: currentUser.displayName,
      content: content,
      replyTo: replyToObj,
      imageUrl: localImageUrl,
      fileType: isFile ? fileOrData.type : (fileOrData?.fileType || null),
      fileSize: isFile ? fileOrData.size : (fileOrData?.fileSize || 0),
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      isUploading: isFile,
      reactions: [],
      seenBy: []
    };

    // 2. Add to UI immediately (zero latency for sender)
    addLocalMessage(optimisticMsg);
    setReplyMessage(null);

    // 3. Lightweight placeholder broadcast to receiver
    emit("sendMessage", {
      id: tempId,
      tempId: tempId,
      chatRoomId: currentChat.id,
      sender: currentUser.id,
      senderName: currentUser.displayName,
      content: content,
      replyTo: replyToObj,
      imageUrl: null,           // No image yet — receiver shows spinner
      fileType: isFile ? fileOrData.type : (fileOrData?.fileType || null),
      fileSize: isFile ? fileOrData.size : (fileOrData?.fileSize || 0),
      createdAt: new Date().toISOString(),
      isUploading: isFile,
      isOptimistic: true,
      reactions: [],
      seenBy: [],
      receiverId
    });

    // 4. Process file & save to database in background
    (async () => {
      let finalFileData = isFile ? null : fileOrData;

      if (isFile) {
        try {
          const uploadRes = await uploadFile(fileOrData, () => {});
          finalFileData = { url: uploadRes.url, fileType: uploadRes.fileType, fileSize: uploadRes.fileSize };
        } catch (err) {
          console.error("Upload failed:", err);
          return;
        }
      }

      const messageBody = {
        tempId: tempId,
        receiverId: receiverId,
        chatRoomId: currentChat.id,
        senderId: currentUser.id,
        content: content,
        replyToId: replyToObj?.id || null,
        imageUrl: finalFileData?.url || null,
        fileType: finalFileData?.fileType || null,
        fileSize: finalFileData?.fileSize || null,
      };

      try {
        const res = await sendMessage(messageBody);
        // Replace optimistic message with real confirmed data
        resolveOptimisticMessage(tempId, { ...res, imageUrl: res.imageUrl || localImageUrl });
      } catch (err) {
        console.error("Failed to persist message:", err);
      }
    })();
  };

  const renderMessages = () => {
    const items = [];
    let lastDate = null;
    messages.forEach((m, index) => {
      const msgDate = m.createdAt ? new Date(m.createdAt).toDateString() : null;
      if (msgDate && msgDate !== lastDate) {
        items.push(<DateSeparator key={`date-${msgDate}`} date={m.createdAt} />);
        lastDate = msgDate;
      }
      items.push(
        <div key={m.id || index} ref={index === messages.length - 1 ? lastMessageRef : null} className="px-6 lg:px-12">
          <Message
            message={m}
            self={currentUser.id}
            senderUser={currentChat.members.find(mem => mem.id === m.sender)}
            onReply={() => setReplyMessage(m)}
            socket={socket}
            receiverId={currentChat.members.find((mem) => mem.id !== currentUser.id)?.id}
            onMessageUpdated={updateLocalMessage}
            onReactionsUpdated={updateLocalReactions}
            onImageClick={(url) => setSelectedImage(url)}
          />
        </div>
      );
    });
    return items;
  };

  if (!currentChat) return null;

  return (
    <div className="flex flex-col h-full w-full bg-[#0F1321] relative overflow-hidden">
      {/* Figma Spec Gradient Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(60% 60% at 0% 0%, rgba(99, 91, 255, 0.08) 0%, rgba(15, 19, 33, 0) 100%)',
        }}
      />

      <div className="flex-1 flex flex-col w-full h-full relative z-10 overflow-hidden">
        <ConnectionBanner connected={connected} />

        <div className="w-full shrink-0 relative z-50">
          <ChatHeaderInfo chatRoom={currentChat} currentUser={currentUser} onlineUsersId={onlineUsersId} />
        </div>

        <div className="flex-1 overflow-y-auto pt-2 pb-4 custom-scrollbar relative z-0">
          <div className="flex flex-col justify-end min-h-full px-3 md:px-4 w-full">
            <div ref={topRef} className="h-1 w-full" />

            {(loading || messagesLoading) && messages.length === 0 ? (
              <div className="flex flex-col gap-1">
                {[...Array(5)].map((_, i) => (
                  <MessageSkeleton key={i} self={i % 2 === 0} />
                ))}
              </div>
            ) : !loading && !messagesLoading && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] gap-4 animate-zoom-in">
                <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center shadow-premium border border-border/40">
                  <MessageSquare className="text-primary w-8 h-8 opacity-40" />
                </div>
                <div className="text-center">
                  <h3 className="text-[18px] font-black text-text-main mb-1">No messages yet</h3>
                  <p className="text-[14px] font-medium text-text-secondary">Send a message to start the conversation 👋</p>
                </div>
              </div>
            ) : (
              <>
                {loading && messages.length > 0 && (
                  <div className="flex justify-center py-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-pulse" />
                      <div className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-pulse delay-150" />
                      <div className="w-1.5 h-1.5 bg-primary/30 rounded-full animate-pulse delay-300" />
                    </div>
                  </div>
                )}
                {renderMessages()}

                {/* Typing Indicator */}
                <div className={`transition-all duration-700 overflow-hidden ${isTyping ? "max-h-20 opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"}`}>
                  <div className={`flex items-center gap-2.5 mb-6 ${isTyping ? "animate-slide-up" : ""}`}>
                    <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 shadow-sm ring-2 ring-[#2A3245] ring-offset-2 ring-offset-[#0F1321] bg-[#2A3245]">
                      <img
                        src={displayTypingUser?.photo || `https://ui-avatars.com/api/?name=${displayTypingUser?.name || 'User'}&background=635BFF&color=fff`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="bg-[#1B1E2B]/80 backdrop-blur-sm text-[#F9FAFB] rounded-[18px] rounded-bl-[4px] px-4 py-2 flex items-center gap-2 border border-[#2A3245]/50 shadow-sm">
                      <span className="text-[13px] font-medium">{displayTypingUser?.name || 'Someone'} is typing</span>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-[#635BFF] rounded-full animate-bounce [animation-duration:1s]" />
                        <span className="w-1.5 h-1.5 bg-[#635BFF] rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-[#635BFF] rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div ref={scrollRef} className="h-1" />
        </div>

        <div className="w-full shrink-0 relative z-50 bg-transparent px-3 lg:px-4 py-2.5 min-h-[76px] flex flex-col justify-center">
          <ChatForm
            handleFormSubmit={handleFormSubmit}
            currentChat={currentChat}
            currentUser={currentUser}
            replyMessage={replyMessage}
            setReplyMessage={setReplyMessage}
          />
        </div>
      </div>
    </div>
  );
}

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getChatRooms, getMessagesOfChatRoom, markMessageSeen, baseURL } from "../services/ChatService";
import { useAuth } from "./AuthContext";
import useSocket from "../hooks/useSocket";
import axios from "axios";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { currentUser } = useAuth();
  const [chatRooms, setChatRooms] = useState(() => {
    const saved = localStorage.getItem("chatRooms");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(() => {
    // If we have cached rooms, treat as initially loaded so we never show blank
    const saved = localStorage.getItem("chatRooms");
    return saved ? JSON.parse(saved).length > 0 : false;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentChat, setCurrentChat] = useState(() => {
    const saved = sessionStorage.getItem("currentChat");
    return saved ? JSON.parse(saved) : null;
  });
  const [messages, setMessages] = useState([]);
  const [messageCache, setMessageCache] = useState(() => {
    const saved = localStorage.getItem("messageCache");
    return saved ? JSON.parse(saved) : {};
  });
  const [typingStatus, setTypingStatus] = useState({}); // { roomId: { name, photo, isTyping } }
  const [onlineUsersId, setOnlineUsersId] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  // Refs to avoid stale closures
  const currentChatRef = useRef(null);
  const fetchRequestIdRef = useRef(0); // Stale request guard

  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  // Use our STOMP-based socket hook
  const { socket, connected, emit, on, subscribe } = useSocket();

  // Persistence effects
  useEffect(() => {
    localStorage.setItem("chatRooms", JSON.stringify(chatRooms));
  }, [chatRooms]);

  useEffect(() => {
    localStorage.setItem("messageCache", JSON.stringify(messageCache));
  }, [messageCache]);

  useEffect(() => {
    if (currentChat) {
      sessionStorage.setItem("currentChat", JSON.stringify(currentChat));
    } else {
      sessionStorage.removeItem("currentChat");
    }
  }, [currentChat]);

  // fetchData: does NOT depend on currentChat — uses ref snapshot to avoid
  // re-creating the callback (and re-triggering the effect) on every chat switch.
  const fetchData = useCallback(async () => {
    if (!currentUser?.id) return;

    // Stale request guard: increment the request ID; if it changes by the time
    // the response arrives, we know a newer request was issued and we discard this one.
    const requestId = ++fetchRequestIdRef.current;

    // Only show the skeleton if we have nothing cached yet
    if (!hasInitiallyLoaded && chatRooms.length === 0) setLoading(true);

    try {
      const rooms = await getChatRooms(currentUser.id);

      // Discard stale responses
      if (requestId !== fetchRequestIdRef.current) return;

      setChatRooms(rooms || []);
      setHasInitiallyLoaded(true);

      // Use ref snapshot — avoids currentChat in deps
      const activeChat = currentChatRef.current;
      if (activeChat) {
        const stillExists = (rooms || []).some(r => r.id === activeChat.id);
        if (!stillExists) {
          setCurrentChat(null);
        }
      }
    } catch (err) {
      console.error("ChatContext - Fetch failed:", err);
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchData();
    }
  }, [currentUser?.id, connected, fetchData]);

  const fetchMessages = useCallback(async (roomId, page = 0) => {
    if (!roomId) return;
    if (page === 0) setMessagesLoading(true);
    try {
      const res = await getMessagesOfChatRoom(roomId, page, 50);
      const chronMessages = [...res].reverse();

      if (page === 0) {
        setMessages(chronMessages);
        setMessageCache(prev => ({ ...prev, [roomId]: chronMessages }));
      } else {
        setMessages(prev => {
          const updated = [...chronMessages, ...prev];
          setMessageCache(cache => ({ ...cache, [roomId]: updated }));
          return updated;
        });
      }
      return res;
    } finally {
      if (page === 0) setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentChat?.id) {
      // Show cached messages instantly, then fetch fresh data in background
      if (messageCache[currentChat.id]) {
        setMessages(messageCache[currentChat.id]);
      } else {
        setMessages([]);
      }
      fetchMessages(currentChat.id, 0);
    } else {
      setMessages([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat?.id]);

  // Handle incoming data (shared by both subscriptions)
  const handleIncomingMessage = useCallback((data) => {
    const activeChat = currentChatRef.current;
    const roomId = data.chatRoomId;

    if (!roomId) return;

    // Helper to apply an update to a list of messages
    const updateMessageList = (prev) => {
      if (data.type === "REACTION") {
        // Only apply REACTION events from the OTHER user.
        // Our own reactions are already handled optimistically in Message.js,
        // so applying them again from the STOMP echo would cause duplication/reappearance bugs.
        if (String(data.senderId) === String(currentUser?.id)) return prev;
        return prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m);
      } else if (data.type === "EDIT") {
        return prev.map(m => m.id === data.messageId ? { ...m, ...data, id: data.messageId, imageUrl: m.imageUrl || data.imageUrl } : m);
      } else if (data.type === "DELETE") {
        return prev.map(m => m.id === data.messageId ? { ...m, isDeleted: true, content: "This message was deleted", imageUrl: null } : m);
      } else if (data.type === "SEEN") {
        return prev.map(m => m.id === data.messageId ? {
          ...m,
          // Only update seen-specific fields — NEVER overwrite reactions, imageUrl, etc.
          // Overwriting reactions here is what caused the "reaction reappears" bug.
          seenBy: data.seenBy || m.seenBy,
          id: data.messageId,
          imageUrl: m.imageUrl || data.imageUrl,
          fileType: m.fileType || data.fileType,
          isEdited: data.isEdited !== undefined ? data.isEdited : m.isEdited,
          isDeleted: data.isDeleted !== undefined ? data.isDeleted : m.isDeleted,
        } : m);
      } else if (!data.type) {
        const dataId = data.id ? String(data.id) : null;
        const dataTempId = data.tempId ? String(data.tempId) : null;

        const matchIndex = prev.findIndex(m =>
          (dataId && String(m.id) === dataId) ||
          (dataTempId && String(m.tempId) === dataTempId) ||
          (dataTempId && String(m.id) === dataTempId)
        );

        if (matchIndex !== -1) {
          const newMsgs = [...prev];
          const existing = newMsgs[matchIndex];
          const resolvedImageUrl = data.imageUrl || existing.imageUrl || null;
          const resolvedIsUploading = resolvedImageUrl ? false : (data.isUploading !== undefined ? data.isUploading : existing.isUploading);
          newMsgs[matchIndex] = { ...existing, ...data, imageUrl: resolvedImageUrl, isUploading: resolvedIsUploading, isOptimistic: false };
          return newMsgs;
        }

        // Instant Seen: If this is a new message from the other person in the active chat,
        // mark it as seen — but ONLY if it has a real numeric ID (not a tempId from optimistic send)
        const isRealId = data.id && !String(data.id).startsWith("temp-");
        if (
          activeChat &&
          String(roomId) === String(activeChat.id) &&
          data.sender !== currentUser.id &&
          isRealId
        ) {
          markMessageSeen(data.id, currentUser.id).catch(() => {});
        }

        return [...prev, { ...data, isUploading: data.isUploading === true }];
      }
      return prev;
    };

    // 1. Update current messages state if this room is active
    if (activeChat && String(roomId) === String(activeChat.id)) {
      setMessages(prev => updateMessageList(prev));
    }

    // 2. Update message cache for persistence
    setMessageCache(prevCache => {
      const roomMessages = prevCache[roomId] || [];
      return {
        ...prevCache,
        [roomId]: updateMessageList(roomMessages)
      };
    });

    // 3. Update sidebar chat room preview
    if (!data.type || data.type === "EDIT" || data.type === "DELETE") {
      setChatRooms(prevRooms => {
        const roomExists = prevRooms.some(r => r.id === roomId);
        if (roomExists) {
          return prevRooms.map(room => {
            if (room.id === roomId) {
              const isCurrentlyActive = currentChatRef.current?.id === room.id;
              return {
                ...room,
                lastMessage: data,
                unreadCount: isCurrentlyActive ? room.unreadCount : (room.unreadCount || 0) + 1,
                updatedAt: new Date().toISOString()
              };
            }
            return room;
          });
        } else {
          fetchData();
          return prevRooms;
        }
      });
    }
  }, [fetchData, currentUser?.id]);

  // Update typing status — called by useMessages to thread typing state up to context
  // (used by Contact.js sidebar "Typing..." label)
  const updateTypingStatus = useCallback((roomId, typingInfo) => {
    setTypingStatus(prev => ({
      ...prev,
      [roomId]: typingInfo
    }));
  }, []);

  // PERMANENT USER SUBSCRIPTION: Never restarts on chat change
  useEffect(() => {
    if (!socket?.current?.connected || !currentUser?.id) return;

    const userSub = socket.current.subscribe(`/topic/user/${currentUser.id}`, (frame) => {
      handleIncomingMessage(JSON.parse(frame.body));
    });

    const presenceSub = socket.current.subscribe("/topic/presence", (frame) => {
      const data = JSON.parse(frame.body);
      setOnlineUsersId(prev => {
        if (data.online) {
          if (prev.some(id => String(id) === String(data.userId))) return prev;
          return [...prev, data.userId];
        } else {
          return prev.filter(id => String(id) !== String(data.userId));
        }
      });

      // Update lastSeen in chatRooms members so headers stay fresh
      setChatRooms(prevRooms => prevRooms.map(room => ({
        ...room,
        members: room.members.map(m =>
          String(m.id) === String(data.userId)
            ? { ...m, lastSeen: data.lastSeen || new Date().toISOString() }
            : m
        )
      })));
    });

    return () => {
      try { userSub.unsubscribe(); } catch (e) {}
      try { presenceSub.unsubscribe(); } catch (e) {}
    };
  }, [socket, currentUser?.id, connected, handleIncomingMessage]);

  // ROOM-SPECIFIC SUBSCRIPTION: Restarts ONLY when chat changes
  // NOTE: Typing subscription intentionally removed from here — handled by useMessages
  // to prevent duplicate callbacks. useMessages threads typing state back up via updateTypingStatus.
  useEffect(() => {
    if (!socket?.current?.connected || !currentChat?.id) return;

    const roomSub = socket.current.subscribe(`/topic/chat/${currentChat.id}`, (frame) => {
      handleIncomingMessage(JSON.parse(frame.body));
    });

    return () => {
      try { roomSub.unsubscribe(); } catch (e) {}
    };
  }, [socket, currentChat?.id, connected, handleIncomingMessage]);

  // Initial fetch for online users
  useEffect(() => {
    if (connected && currentUser?.id) {
      setTimeout(() => {
        axios.get(`${baseURL}/presence/online`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }).then(res => {
          setOnlineUsersId(res.data || []);
        }).catch(() => {});
      }, 500);
    }
  }, [connected, currentUser?.id]);

  const filteredRooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return chatRooms;
    return chatRooms.filter(room => {
      const otherMembers = room.members?.filter(m => m.id !== currentUser?.id) || [];
      return otherMembers.some(member => {
        return (
          member.displayName?.toLowerCase().includes(query) ||
          member.email?.toLowerCase().includes(query)
        );
      });
    });
  }, [chatRooms, searchQuery, currentUser?.id]);

  const sortedRooms = useMemo(() => {
    return [...filteredRooms].sort((a, b) => {
      const aTime = new Date(a.lastMessage?.createdAt || a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.lastMessage?.createdAt || b.updatedAt || b.createdAt || 0).getTime();
      return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
    });
  }, [filteredRooms]);

  const updateChatRooms = useCallback((newRooms) => {
    setChatRooms(newRooms);
  }, []);

  const value = {
    chatRooms,
    filteredRooms,
    sortedRooms,
    loading,
    hasInitiallyLoaded,
    searchQuery,
    setSearchQuery,
    currentChat,
    setCurrentChat,
    onlineUsersId,
    setOnlineUsersId,
    typingStatus,
    updateTypingStatus,
    selectedImage,
    setSelectedImage,
    messages,
    setMessages,
    messagesLoading,
    messageCache,
    setMessageCache,
    updateChatRooms,
    refresh: fetchData,
    socket,
    connected,
    on,
    emit,
    subscribe
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChatContext must be used within a ChatProvider");
  return context;
};

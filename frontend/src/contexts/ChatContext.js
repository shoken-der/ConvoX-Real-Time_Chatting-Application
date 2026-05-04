import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getAllUsers, getChatRooms, getMessagesOfChatRoom, markMessageSeen, baseURL } from "../services/ChatService";
import { useAuth } from "./AuthContext";
import useSocket from "../hooks/useSocket";
import axios from "axios";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { currentUser } = useAuth();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageCache, setMessageCache] = useState({}); // { roomId: messages[] }
  const [typingStatus, setTypingStatus] = useState({}); // { roomId: { name, photo, isTyping } }
  const [onlineUsersId, setOnlineUsersId] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const currentChatRef = useRef(null);

  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  // Use our new STOMP-based socket hook
  const { socket, connected, emit, on, subscribe } = useSocket();

  useEffect(() => {
    const savedChat = sessionStorage.getItem("currentChat");
    if (savedChat) {
      try {
        setCurrentChat(JSON.parse(savedChat));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (currentChat) {
      sessionStorage.setItem("currentChat", JSON.stringify(currentChat));
    } else {
      sessionStorage.removeItem("currentChat");
    }
  }, [currentChat]);

  const fetchData = useCallback(async () => {
    if (!currentUser?.id) return;
    if (!hasInitiallyLoaded) setLoading(true);
    try {
      const rooms = await getChatRooms(currentUser.id);
      setChatRooms(rooms || []);
      setHasInitiallyLoaded(true);
      if (currentChat) {
        const stillExists = (rooms || []).some(r => r.id === currentChat.id);
        if (!stillExists) {
          setCurrentChat(null);
        }
      }
    } catch (err) {
      console.error("ChatContext - Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, currentChat, hasInitiallyLoaded]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchData();
    }
  }, [currentUser?.id, connected, fetchData]);

  const fetchMessages = useCallback(async (roomId, page = 0) => {
    if (!roomId) return;
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
    } catch (err) {
      console.error("Fetch Messages Error:", err);
      return [];
    }
  }, []);

  useEffect(() => {
    if (currentChat?.id) {
      // Check cache first for instant load
      if (messageCache[currentChat.id]) {
        setMessages(messageCache[currentChat.id]);
      } else {
        setMessages([]); // Only clear if not in cache
      }
      fetchMessages(currentChat.id, 0);
    } else {
      setMessages([]);
    }
  }, [currentChat?.id]); // Note: removed fetchMessages from deps to avoid re-triggering if only callback identity changes

  // Handle incoming data (Shared by both subscriptions)
  const handleIncomingMessage = useCallback((data) => {
    const activeChat = currentChatRef.current;
    const roomId = data.chatRoomId;

    if (!roomId) return;

    // Helper to update a list of messages based on incoming event
    const updateMessageList = (prev) => {
      if (data.type === "REACTION") {
        return prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m);
      } else if (data.type === "EDIT") {
        return prev.map(m => m.id === data.messageId ? { ...m, ...data, id: data.messageId, imageUrl: m.imageUrl || data.imageUrl } : m);
      } else if (data.type === "DELETE") {
        return prev.map(m => m.id === data.messageId ? { ...m, isDeleted: true, content: "This message was deleted", imageUrl: null } : m);
      } else if (data.type === "SEEN") {
        return prev.map(m => m.id === data.messageId ? { 
          ...m, 
          ...data, 
          id: data.messageId, 
          imageUrl: m.imageUrl || data.imageUrl,
          fileType: m.fileType || data.fileType 
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
        
        // Instant Seen: If this is a new message from the other person in the active chat, mark it as seen instantly
        if (activeChat && String(roomId) === String(activeChat.id) && data.sender !== currentUser.id) {
          markMessageSeen(data.id, currentUser.id);
        }

        return [...prev, { ...data, isUploading: data.isUploading === true }];
      }
      return prev;
    };

    // 1. Update current messages state if active
    if (activeChat && String(roomId) === String(activeChat.id)) {
      setMessages(prev => updateMessageList(prev));
    }

    // 2. Update message cache for persistent storage
    setMessageCache(prevCache => {
      const roomMessages = prevCache[roomId] || [];
      return {
        ...prevCache,
        [roomId]: updateMessageList(roomMessages)
      };
    });

    // 3. Update Sidebar (Chat Rooms)
    if (!data.type || data.type === "EDIT" || data.type === "DELETE") {
      setChatRooms(prevRooms => {
        const roomExists = prevRooms.some(r => r.id === roomId);
        if (roomExists) {
          return prevRooms.map(room => {
            if (room.id === roomId) {
              const isCurrentlyActive = activeChat?.id === room.id;
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
  }, [fetchData]);

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
  useEffect(() => {
    if (!socket?.current?.connected || !currentChat?.id) return;
    
    const roomSub = socket.current.subscribe(`/topic/chat/${currentChat.id}`, (frame) => {
      handleIncomingMessage(JSON.parse(frame.body));
    });

    // Global Typing Subscription for the active chat
    const typingSub = socket.current.subscribe(`/topic/chat/${currentChat.id}/typing`, (frame) => {
      const data = JSON.parse(frame.body);
      if (String(data.senderId) === String(currentUser.id)) return;

      const roomId = data.chatRoomId;
      setTypingStatus(prev => ({
        ...prev,
        [roomId]: {
          name: data.senderName || "Someone",
          photo: data.senderPhoto,
          isTyping: data.typing !== false
        }
      }));

      // Auto-clear typing status after 4 seconds
      if (data.typing !== false) {
        setTimeout(() => {
          setTypingStatus(prev => {
            if (prev[roomId]) return { ...prev, [roomId]: { ...prev[roomId], isTyping: false } };
            return prev;
          });
        }, 4000);
      }
    });

    return () => {
      try { roomSub.unsubscribe(); } catch (e) {}
      try { typingSub.unsubscribe(); } catch (e) {}
    };
  }, [socket, currentChat?.id, connected, handleIncomingMessage, currentUser?.id]);

  // Initial fetch for online users
  useEffect(() => {
    if (connected && currentUser?.id) {
       // Small delay to ensure backend has processed the connection and markOnline
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
      
      // WhatsApp style: Newest first
      return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
    });
  }, [filteredRooms, onlineUsersId, currentUser?.id]);

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
    selectedImage,
    setSelectedImage,
    messages,
    setMessages,
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

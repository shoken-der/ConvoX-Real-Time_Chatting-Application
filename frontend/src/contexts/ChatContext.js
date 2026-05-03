import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getAllUsers, getChatRooms, getMessagesOfChatRoom, baseURL } from "../services/ChatService";
import { useAuth } from "./AuthContext";
import useSocket from "../hooks/useSocket";
import axios from "axios";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
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
      } else {
        setMessages(prev => [...chronMessages, ...prev]);
      }
      return res;
    } catch (err) {
      console.error("Fetch Messages Error:", err);
      return [];
    }
  }, []);

  useEffect(() => {
    if (currentChat?.id) {
      fetchMessages(currentChat.id, 0);
    } else {
      setMessages([]);
    }
  }, [currentChat?.id, fetchMessages]);

  // Handle incoming data (Shared by both subscriptions)
  const handleIncomingMessage = useCallback((data) => {
    const activeChat = currentChatRef.current;

    // 1. Update Messages if it's the current chat
    if (activeChat && String(data.chatRoomId) === String(activeChat.id)) {
      setMessages(prev => {
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
            // If incoming data has a real image URL, always use it.
            // If incoming data has no image URL, preserve whatever we already have.
            const resolvedImageUrl = data.imageUrl || existing.imageUrl || null;
            // Stop the loading spinner only when we have a real (non-null) imageUrl
            // OR when the sender explicitly marks isUploading as false.
            const resolvedIsUploading = resolvedImageUrl
              ? false
              : (data.isUploading !== undefined ? data.isUploading : existing.isUploading);
            newMsgs[matchIndex] = { 
              ...existing, 
              ...data, 
              imageUrl: resolvedImageUrl,
              isUploading: resolvedIsUploading,
              isOptimistic: false 
            };
            return newMsgs;
          }
          // New message from receiver's perspective: preserve isUploading from sender's signal
          return [...prev, { 
            ...data, 
            isUploading: data.isUploading === true ? true : false 
          }];
        }
        return prev;
      });
    }

    // 2. Update Sidebar (Chat Rooms) - Only for new messages or edits
    if (!data.type || data.type === "EDIT" || data.type === "DELETE") {
      setChatRooms(prevRooms => {
        const roomExists = prevRooms.some(r => r.id === data.chatRoomId);
        if (roomExists) {
          return prevRooms.map(room => {
            if (room.id === data.chatRoomId) {
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
          if (prev.includes(data.userId)) return prev;
          return [...prev, data.userId];
        } else {
          return prev.filter(id => id !== data.userId);
        }
      });
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

    return () => {
      try { roomSub.unsubscribe(); } catch (e) {}
    };
  }, [socket, currentChat?.id, connected, handleIncomingMessage]);

  // Initial fetch for online users
  useEffect(() => {
    if (connected && currentUser?.id) {
       axios.get(`${baseURL}/presence/online`, {
         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
       }).then(res => {
         setOnlineUsersId(res.data || []);
       }).catch(() => {});
    }
  }, [connected, currentUser?.id]);

  const filteredUsers = useMemo(() => {
    // We no longer render non-chat users in the sidebar search.
    // This state is kept for the NewChatModal which fetches its own data.
    return [];
  }, []);

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
      // First sort by online status
      const aOtherMember = a.members?.find(m => m.id !== currentUser?.id);
      const bOtherMember = b.members?.find(m => m.id !== currentUser?.id);
      
      const aOnline = aOtherMember ? onlineUsersId.includes(aOtherMember.id) : false;
      const bOnline = bOtherMember ? onlineUsersId.includes(bOtherMember.id) : false;

      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;

      // If same online status, sort by time
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [filteredRooms, onlineUsersId, currentUser?.id]);

  const updateChatRooms = useCallback((newRooms) => {
    setChatRooms(newRooms);
  }, []);

  const value = {
    users,
    chatRooms,
    filteredUsers,
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

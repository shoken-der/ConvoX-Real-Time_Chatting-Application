import { useState, useEffect, useCallback, useRef } from "react";
import { getMessagesOfChatRoom } from "../services/ChatService";
import { useChatContext } from "../contexts/ChatContext";

export default function useMessages(currentChatId, socket, currentUserId, connected) {
  const { messages, setMessages } = useChatContext();
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimerRef = useRef(null);
  const LIMIT = 50;

  // Typing indicator logic still belongs here as it's room-specific and transient
  useEffect(() => {
    if (!connected || !socket?.current?.connected || !currentChatId) return;
    const client = socket.current;

    try {
      const typingSub = client.subscribe(`/topic/chat/${currentChatId}/typing`, (frame) => {
        const data = JSON.parse(frame.body);
        if (String(data.senderId) === String(currentUserId)) return;

        if (data.typing !== false) {
          setIsTyping(true);
          setTypingUser({ name: data.senderName || "Someone", photo: data.senderPhoto });
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => {
            setIsTyping(true); // Keep user data
            setIsTyping(false);
          }, 4000);
        } else {
          setIsTyping(false);
        }
      });
      return () => {
        try { typingSub.unsubscribe(); } catch (e) {}
      };
    } catch (err) {
      console.error("Typing subscribe error:", err);
    }
  }, [connected, currentChatId, currentUserId, socket]);

  const loadMore = async () => {
    if (!loading && hasMore && currentChatId) {
      const nextPage = page + 1;
      setLoading(true);
      try {
        const res = await getMessagesOfChatRoom(currentChatId, nextPage, LIMIT);
        if (res.length < LIMIT) setHasMore(false);
        const chronMessages = [...res].reverse();
        setMessages(prev => [...chronMessages, ...prev]);
        setPage(nextPage);
      } catch (err) {
        console.error("Load More Error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const updateLocalMessage = useCallback((updatedMsg) => {
    setMessages(prev => prev.map(m => {
      if (m.id === updatedMsg.id) {
        // IMAGE GUARD: Don't let null fields from status updates wipe out our image/file data
        return {
          ...m,
          ...updatedMsg,
          imageUrl: updatedMsg.imageUrl || m.imageUrl,
          fileType: updatedMsg.fileType || m.fileType,
          fileSize: updatedMsg.fileSize || m.fileSize,
          isUploading: updatedMsg.imageUrl ? false : m.isUploading // If we got a real URL, stop loading
        };
      }
      return m;
    }));
  }, [setMessages]);

  const addLocalMessage = useCallback((newMsg) => {
    setMessages(prev => {
       if (prev.some(m => m.id === newMsg.id || (newMsg.tempId && m.tempId === newMsg.tempId))) return prev;
       return [...prev, newMsg];
    });
  }, [setMessages]);

  const resolveOptimisticMessage = useCallback((tempId, realMsg) => {
    setMessages(prev => prev.map(m => m.tempId === tempId ? realMsg : m));
  }, [setMessages]);

  return {
    messages,
    loading,
    hasMore,
    loadMore,
    isTyping,
    typingUser,
    updateLocalMessage,
    addLocalMessage,
    resolveOptimisticMessage
  };
}

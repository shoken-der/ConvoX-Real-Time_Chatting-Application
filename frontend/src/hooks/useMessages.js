import { useState, useEffect, useCallback, useRef } from "react";
import { getMessagesOfChatRoom } from "../services/ChatService";
import { useChatContext } from "../contexts/ChatContext";

export default function useMessages(currentChatId, socket, currentUserId, connected) {
  const { messages, setMessages, updateTypingStatus } = useChatContext();
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimerRef = useRef(null);
  const LIMIT = 50;

  // Reset pagination state when switching chats — prevents page 2 fetch on a new chat
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setIsTyping(false);
    setTypingUser(null);
  }, [currentChatId]);

  // Single typing subscription — the ONLY place we subscribe to typing events.
  // ChatContext no longer has a duplicate subscription.
  // We thread the typing state back up to ChatContext via updateTypingStatus
  // so the sidebar Contact.js "Typing..." label still works.
  useEffect(() => {
    if (!connected || !socket?.current?.connected || !currentChatId) return;
    const client = socket.current;

    try {
      const typingSub = client.subscribe(`/topic/chat/${currentChatId}/typing`, (frame) => {
        const data = JSON.parse(frame.body);
        if (String(data.senderId) === String(currentUserId)) return;

        const roomId = data.chatRoomId || currentChatId;

        if (data.typing !== false) {
          const userInfo = { name: data.senderName || "Someone", photo: data.senderPhoto };
          setIsTyping(true);
          setTypingUser(userInfo);

          // Update sidebar typing status too
          updateTypingStatus(roomId, { ...userInfo, isTyping: true });

          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => {
            setIsTyping(false);
            updateTypingStatus(roomId, { name: data.senderName, photo: data.senderPhoto, isTyping: false });
          }, 4000);
        } else {
          setIsTyping(false);
          setTypingUser(null);
          updateTypingStatus(roomId, { name: data.senderName, photo: data.senderPhoto, isTyping: false });
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        }
      });

      return () => {
        try { typingSub.unsubscribe(); } catch (e) {}
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      };
    } catch (err) {
      console.error("Typing subscribe error:", err);
    }
  }, [connected, currentChatId, currentUserId, socket, updateTypingStatus]);

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
        return {
          ...m,
          ...updatedMsg,
          imageUrl: updatedMsg.imageUrl || m.imageUrl,
          fileType: updatedMsg.fileType || m.fileType,
          fileSize: updatedMsg.fileSize || m.fileSize,
          isUploading: updatedMsg.imageUrl ? false : m.isUploading
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
    setMessages(prev => prev.map(m => m.tempId === tempId ? { ...realMsg, isOptimistic: false } : m));
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

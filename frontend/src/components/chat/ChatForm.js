import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Smile, Plus, X, File } from "lucide-react";
import Picker from "emoji-picker-react";
import { useDropzone } from 'react-dropzone';
import useChat from "../../hooks/useChat";
import { useToast } from "../../contexts/ToastContext";

export default function ChatForm({ handleFormSubmit, currentChat, currentUser, replyMessage, setReplyMessage }) {
  const { addToast } = useToast();
  const { emit } = useChat();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false); // Use ref to avoid stale closures

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast({ type: "error", title: "File too large", message: "Max upload size is 10MB." });
      return;
    }
    setSelectedFile(file);
  };

  const { getRootProps, getInputProps, open } = useDropzone({ 
    onDrop, 
    noClick: true,
    accept: { 'image/*': [], 'application/pdf': [], 'video/*': [] }
  });

  const handleEmojiClick = (event, emojiObject) => {
    setMessage(prev => (prev || "") + (emojiObject?.emoji || ""));
    handleTyping();
  };

  const sendStopTyping = useCallback(() => {
    if (!isTypingRef.current || !currentChat || !currentUser) return;
    const receiverId = currentChat.members.find((m) => m.id !== currentUser.id)?.id;
    isTypingRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emit("stopTyping", {
      senderId: currentUser.id,
      senderName: currentUser.displayName || currentUser.username,
      senderPhoto: currentUser.photoUrl,
      receiverId,
      chatRoomId: currentChat.id,
      typing: false
    });
  }, [currentChat, currentUser, emit]);

  const handleTyping = useCallback(() => {
    if (!currentChat || !currentUser) return;
    const receiverId = currentChat.members.find((m) => m.id !== currentUser.id)?.id;

    // Send start-typing only once per burst
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emit("typing", {
        senderId: currentUser.id,
        senderName: currentUser.displayName || currentUser.username,
        senderPhoto: currentUser.photoUrl,
        receiverId,
        chatRoomId: currentChat.id,
        typing: true
      });
    }

    // Reset the stop-typing timer on every keystroke
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping();
    }, 800);
  }, [currentChat, currentUser, emit, sendStopTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    const currentMsg = message;
    const currentFile = selectedFile;
    
    // Clear UI immediately for WhatsApp-like speed
    setMessage("");
    setShowEmojiPicker(false);
    setSelectedFile(null);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendStopTyping();

    // Call parent handler IMMEDIATELY with the raw file for optimistic UI
    handleFormSubmit(currentMsg, currentFile);
  };

  // Cleanup typing on unmount or chat change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      // Reset ref on chat change so next chat starts fresh
      isTypingRef.current = false;
    };
  }, [currentChat?.id]);

  return (
    <div {...getRootProps()} className="w-full relative">
      <input {...getInputProps()} />

      {/* Overlays (Reply/File) — sit above the bar */}
      <div className="absolute bottom-full left-0 right-0 mb-1 flex flex-col gap-1.5">
        {replyMessage && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#1F2937] border-l-4 border-[#635BFF] rounded-xl shadow-md animate-zoom-in mx-1">
            <div className="flex-1 truncate mr-3">
              <p className="text-[10px] font-black text-[#635BFF] uppercase tracking-wider">Replying to</p>
              <p className="text-[13px] truncate font-medium text-[#9CA3AF]">
                {replyMessage.imageUrl && !replyMessage.content && !replyMessage.message ? "📷 Photo" : (replyMessage.message || replyMessage.content)}
              </p>
            </div>
            {replyMessage.imageUrl && (
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 mr-2">
                <img src={replyMessage.imageUrl} alt="Reply" className="w-full h-full object-cover" />
              </div>
            )}
            <button onClick={() => setReplyMessage(null)} className="p-1.5 rounded-full hover:bg-[#2A3245] transition-colors text-[#6B7280] hover:text-[#F9FAFB] ml-2"><X size={16} /></button>
          </div>
        )}

        {selectedFile && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#1F2937] rounded-xl shadow-md border border-[#2A3245] animate-zoom-in mx-1">
            <div className="flex items-center gap-3 flex-1 truncate">
              <div className="w-9 h-9 rounded-lg bg-[#635BFF]/10 flex items-center justify-center text-[#635BFF] overflow-hidden shrink-0">
                {selectedFile.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <File size={18} />
                )}
              </div>
              <div className="truncate">
                <p className="text-[13px] font-semibold truncate text-[#F9FAFB]">{selectedFile.name}</p>
              </div>
            </div>
            <button onClick={() => setSelectedFile(null)} className="p-1.5 rounded-full hover:bg-[#2A3245] transition-colors text-[#6B7280] hover:text-[#F9FAFB] ml-2"><X size={16} /></button>
          </div>
        )}
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <Picker onEmojiClick={handleEmojiClick} theme="dark" />
        </div>
      )}

      {/* WhatsApp-style Input Row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">

        {/* Pill — full width */}
        <div className="flex-1 flex items-center gap-1 bg-[#1F2937] rounded-[28px] px-3 min-h-[52px] border border-[#2A3245] focus-within:border-[#635BFF]/30 transition-colors duration-200">

          {/* Left: Emoji */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-[#6B7280] hover:text-[#9CA3AF] transition-colors shrink-0"
          >
            <Smile size={22} strokeWidth={1.5} />
          </button>

          {/* Left: Attachment */}
          <button
            type="button"
            onClick={open}
            className="p-2 text-[#6B7280] hover:text-[#9CA3AF] transition-colors shrink-0"
          >
            <Plus size={22} strokeWidth={1.5} />
          </button>

          {/* Textarea */}
          <textarea
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-[#F9FAFB] placeholder:text-[#6B7280] text-[14px] font-normal resize-none max-h-[120px] py-[14px] custom-scrollbar leading-relaxed shadow-none"
            value={message}
            rows={1}
            onBlur={sendStopTyping}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
                e.target.style.height = 'auto';
              }
            }}
          />

        </div>

        {/* Send Button — WhatsApp-style circle */}
        <button
          type="submit"
          disabled={!message.trim() && !selectedFile}
          className="w-[52px] h-[52px] bg-gradient-to-br from-[#635BFF] to-[#7C3AED] hover:opacity-90 text-white rounded-full flex items-center justify-center transition-all shrink-0 shadow-md shadow-[#635BFF]/20 disabled:opacity-40 active:scale-95"
        >
          <Send size={20} strokeWidth={2} className="ml-0.5" />
        </button>
      </form>
    </div>
  );
}

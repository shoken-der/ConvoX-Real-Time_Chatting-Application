import { useState, useRef, useEffect, useMemo, memo } from "react";
import { 
  Reply, 
  Trash2, 
  Smile, 
  Download,
  FileText,
  Check,
  CheckCheck
} from "lucide-react";
import { toggleReaction, deleteMessage, editMessage } from "../../services/ChatService";

const Message = memo(({ message, self, senderUser, onReply, socket, receiverId, onMessageUpdated, onImageClick }) => {
  const isDeleted = message.isDeleted || message.deleted;
  const senderId = message.sender?.id || message.senderId || message.sender;
  const isSelf = Boolean(self && senderId && String(self) === String(senderId));
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message || "");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const editInputRef = useRef();

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  const handleReaction = async (emoji) => {
    try {
      const res = await toggleReaction(message.id, { userId: self, emoji });
      if (res && res.reactions !== undefined) {
        onMessageUpdated && onMessageUpdated(res);
        // Broadcast reaction update to other user via STOMP
        if (socket?.current?.connected) {
          socket.current.publish({
            destination: "/app/chat.reaction",
            body: JSON.stringify({
              type: "REACTION",
              chatRoomId: message.chatRoomId,
              messageId: message.id,
              reactions: res.reactions,
            }),
          });
        }
      }
      setShowReactions(false);
    } catch (err) {
      console.error("Error toggling reaction:", err);
    }
  };

  const handleDelete = async () => {
    // Optimistic update: show "This message was deleted" instantly
    onMessageUpdated && onMessageUpdated({ 
      ...message,
      isDeleted: true, 
      content: isSelf ? "You deleted this message" : "This message was deleted",
      imageUrl: null 
    });
    
    try {
      await deleteMessage(message.id, self);
      // Broadcast delete event to other user via STOMP
      if (socket?.current?.connected) {
        socket.current.publish({
          destination: "/app/chat.deleteMessage",
          body: JSON.stringify({
            type: "DELETE",
            chatRoomId: message.chatRoomId,
            messageId: message.id,
            receiverId,
          }),
        });
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleEditSubmit = async () => {
    if (!editText.trim() || editText === message.message) {
      setIsEditing(false);
      return;
    }
    setIsSubmittingEdit(true);
    try {
      const res = await editMessage(message.id, editText.trim());
      onMessageUpdated && onMessageUpdated(res);
      if (socket?.current?.connected) {
        socket.current.publish({
          destination: "/app/chat.editMessage",
          body: JSON.stringify({
            type: "EDIT",
            chatRoomId: message.chatRoomId,
            messageId: message.id,
            content: res.content || editText.trim(),
          }),
        });
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Edit error:", err);
    }
    setIsSubmittingEdit(false);
  };

  const groupedReactions = useMemo(() => {
    return message.reactions?.reduce((acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = [];
      acc[r.emoji].push(r.userId);
      return acc;
    }, {}) || {};
  }, [message.reactions]);

  const text =
    message.content ||
    message.text ||
    message.message ||
    "";

  const imageUrl =
    message.imageUrl ||
    message.mediaUrl ||
    message.fileUrl ||
    message.attachmentUrl ||
    "";

  const renderFile = () => {
    // Show spinner if we're explicitly uploading/receiving,
    // even if imageUrl hasn't arrived yet.
    const isReceivingFile = message.isUploading === true || message.isUploading === "true";

    if (isReceivingFile && !imageUrl) {
      // Phase 1: receiver is waiting for the real image
      return (
        <div
          className={`relative rounded-xl overflow-hidden ${isSelf ? 'border border-[#635BFF]/30' : 'border border-[#2A3245]'} ${text ? "mb-1.5" : ""}`}
        >
          <div className="w-[220px] h-[160px] bg-[#111827] flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-[#635BFF]/30 border-t-[#635BFF] rounded-full animate-spin" />
            <span className="text-[10px] font-bold text-[#635BFF] uppercase tracking-widest animate-pulse">Receiving...</span>
          </div>
        </div>
      );
    }

    if (!imageUrl || isDeleted) return null;

    const isImage = message.fileType?.startsWith("image/") || 
                    imageUrl.startsWith("data:image/") ||
                    imageUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ||
                    imageUrl.includes("picsum.photos");

    if (isImage) {
      // Only show spinner for sender's own upload still in progress
      const isLoading = isSelf && message.isUploading;

      return (
        <div
          className={`relative rounded-xl overflow-hidden cursor-pointer group/img ${isSelf ? 'border border-[#635BFF]/30' : 'border border-[#2A3245]'} ${text ? "mb-1.5" : ""}`}
          onClick={() => !isLoading && onImageClick && onImageClick(imageUrl)}
        >
          {isLoading ? (
            <div className="relative w-[220px] min-h-[160px] bg-[#111827] flex flex-col items-center justify-center overflow-hidden rounded-xl">
              <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 scale-110" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-[#635BFF]/30 border-t-[#635BFF] rounded-full animate-spin" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-md">Sending...</span>
              </div>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt="Shared media"
              className="w-full max-w-[220px] object-cover transition-transform duration-500 group-hover/img:scale-105"
              onError={(e) => {
                 e.target.src = "https://via.placeholder.com/400?text=Image+Load+Error";
              }}
            />
          )}
          <div className="absolute bottom-2 right-2 bg-[#0B0C10]/70 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
             <span className="text-[10px] text-[#F9FAFB] font-medium">
               {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
             </span>
             {isSelf && (
               <div className="flex ml-0.5 text-[#635BFF]">
                 {message.seenBy?.length > 0 ? <CheckCheck size={12} /> : <Check size={12} />}
               </div>
             )}
          </div>
          {!isLoading && <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors duration-300" />}
        </div>
      );
    }

    return (
      <div className={`mt-2 mb-1 flex items-center gap-3 p-3 rounded-2xl ${isSelf ? "bg-white/10 border border-white/10" : "bg-surface border border-border/40"}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelf ? "bg-white/20 text-white" : "bg-surface-elevated text-primary shadow-sm"}`}>
          <FileText size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">Document</p>
          <p className="text-[10px] opacity-80 font-medium uppercase tracking-tight">{(message.fileSize / 1024).toFixed(1)} KB</p>
        </div>
        <a href={imageUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-black/10 rounded-full transition-colors">
          <Download size={18} />
        </a>
      </div>
    );
  };

    const isImageOnly = imageUrl && !text && !isDeleted;

    return (
    <div className={`flex flex-col ${isSelf ? "items-end" : "items-start"} mb-4 group/msg w-full animate-fade-in`}>
      <div className={`flex items-end gap-2.5 w-full max-w-[65%] ${isSelf ? "justify-end" : "justify-start"} relative`}>
        {!isSelf && (
           <div className="w-8 h-8 rounded-xl overflow-hidden mb-1 flex-shrink-0 shadow-sm ring-2 ring-[#2A3245] ring-offset-2 ring-offset-[#0F1321] bg-[#2A3245] animate-pulse">
             <img src={senderUser?.photoUrl || `https://ui-avatars.com/api/?name=${message.senderName || senderUser?.displayName || 'User'}&background=635BFF&color=fff`} alt="" className="w-full h-full object-cover" onLoad={(e) => e.target.parentElement.classList.remove('animate-pulse')} />
           </div>
        )}
        
        <div className="relative group/bubble">
          <div
            className={`
              transition-all duration-300
              ${isImageOnly ? "p-0 bg-transparent" : "px-3 py-2"}
              ${isSelf 
                ? (isImageOnly ? "" : "bg-gradient-to-br from-[#635BFF] to-[#6B4FFF] text-white rounded-[16px] rounded-br-[4px] shadow-sm shadow-[#635BFF]/10") 
                : (isImageOnly ? "" : "bg-[#1F2937] border border-[#2A3245] text-[#F9FAFB] rounded-[16px] rounded-bl-[4px]")
              }
              ${isDeleted ? "opacity-50 italic text-sm" : ""}
            `}
          >
            {message.replyTo && !isDeleted && (
              <div className={`mb-2 p-2 rounded-xl text-[12px] border-l-4 flex items-center justify-between gap-3 ${isSelf ? "bg-white/10 border-white/40 text-white/90" : "bg-surface border-primary/30 text-text-secondary"}`}>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold mb-0.5 opacity-70">Replying to</p>
                  <p className="truncate italic font-medium">
                    {message.replyTo.imageUrl && !message.replyTo.content ? "📷 Photo" : (message.replyTo.content || message.replyTo.message)}
                  </p>
                </div>
                {message.replyTo.imageUrl && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 shadow-sm">
                    <img src={message.replyTo.imageUrl} alt="Reply preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}

            {renderFile()}

            {isEditing ? (
              <div className="space-y-2 min-w-[200px]">
                <textarea
                  ref={editInputRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-inherit focus:ring-0 resize-none font-medium"
                  rows={2}
                />
                <div className="flex gap-2 justify-end pt-2 border-t border-white/10">
                  <button onClick={() => setIsEditing(false)} className="text-[10px] uppercase font-bold opacity-60 hover:opacity-100">Cancel</button>
                  <button onClick={handleEditSubmit} disabled={isSubmittingEdit} className="text-[10px] uppercase font-bold hover:scale-105">Save</button>
                </div>
              </div>
            ) : (
              <>
                {!text && !imageUrl && !message.fileType && !isDeleted && (
                  <p className="text-sm opacity-70">Unsupported message</p>
                )}
                {text && (
                  <div className="flex items-end justify-between gap-3 min-w-[60px]">
                    <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                      {isDeleted 
                        ? (isSelf ? "You deleted this message" : "This message was deleted") 
                        : text}
                    </p>
                    <div className={`flex items-center gap-1 shrink-0 relative top-1 ${isSelf ? "text-white/80" : "text-[#6B7280]"}`}>
                       {message.isEdited && <span className="text-[9px] italic mr-0.5">Edited</span>}
                       <span className="text-[10px] font-medium">
                         {message.createdAt && !isNaN(new Date(message.createdAt).getTime()) ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                       </span>
                       {isSelf && (
                         <div className="flex ml-0.5">
                           {message.seenBy?.length > 0 ? <CheckCheck size={12} /> : <Check size={12} />}
                         </div>
                       )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions on hover */}
          {!isDeleted && (
            <div className={`absolute top-0 opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 flex items-center gap-1 ${isSelf ? "right-full mr-3" : "left-full ml-3"}`}>
              <button onClick={onReply} className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-main transition-colors shadow-sm bg-surface border border-border/40"><Reply size={16} /></button>
              
              <div className="relative">
                <button onClick={() => setShowReactions(!showReactions)} className="p-2 rounded-xl hover:bg-surface-elevated text-text-muted hover:text-text-main transition-colors shadow-sm bg-surface border border-border/40"><Smile size={16} /></button>
                {showReactions && (
                  <div className={`absolute bottom-full mb-3 flex items-center gap-1 bg-surface-elevated p-2 rounded-[16px] shadow-premium-lg border border-border/60 z-[60] animate-zoom-in ${isSelf ? "right-0" : "left-0"}`}>
                    {["❤️", "👍", "🔥", "😂", "😮", "😢"].map((emoji) => (
                      <button key={emoji} onClick={() => handleReaction(emoji)} className="hover:scale-125 transition-transform p-2 text-xl hover:bg-surface-hover rounded-xl">
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isSelf && (
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-xl hover:bg-danger/10 text-text-muted hover:text-danger transition-colors shadow-sm bg-surface border border-border/40"
                  title="Delete message"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}

          {/* Reactions */}
          {Object.keys(groupedReactions).length > 0 && !isDeleted && (
            <div className={`absolute -bottom-2.5 flex gap-1 bg-surface-elevated border border-border/50 rounded-full px-2 py-1 shadow-premium ${isSelf ? "right-4" : "left-4"}`}>
              {Object.entries(groupedReactions).map(([emoji, users]) => (
                <button key={emoji} onClick={() => handleReaction(emoji)} className="flex items-center gap-1 hover:scale-110 transition-transform">
                  <span className="text-[12px]">{emoji}</span>
                  {users.length > 1 && <span className="text-[9px] font-black text-text-muted">{users.length}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Message.displayName = "Message";
export default Message;

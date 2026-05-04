import { useMemo } from "react";
import useChat from "../../hooks/useChat";
import { ChevronLeft } from "lucide-react";
import { getPresenceText } from "../../utils/presence";

export default function ChatHeaderInfo({ chatRoom, currentUser, onlineUsersId }) {
  const { users, setCurrentChat } = useChat();

  const contact = useMemo(() => {
    const member = chatRoom?.members?.find((m) => m.id !== currentUser?.id);
    if (!member) return { displayName: "User" };
    return users.find((u) => u.id === (member.id || member)) || member;
  }, [chatRoom, currentUser?.id, users]);

  const isOnline = onlineUsersId?.some(id => String(id) === String(contact.id));

  return (
    <div className="flex items-center justify-between w-full px-4 lg:px-6 py-2.5 bg-[#111827] border-b border-[#2A3245] relative z-50 shrink-0 min-h-[59px]">
      <div className="flex items-center gap-3">
        {/* Back button — mobile */}
        <button
          onClick={() => setCurrentChat(null)}
          className="md:hidden p-1.5 -ml-1 text-[#6B7280] hover:text-[#F9FAFB] transition-colors"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-[#2A3245] ring-offset-2 ring-offset-[#111827]">
            <img
              className="w-full h-full object-cover"
              src={contact.photoUrl || `https://ui-avatars.com/api/?name=${contact.displayName || 'U'}&background=635BFF&color=fff`}
              alt={contact.displayName}
            />
          </div>
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0B0C10] bg-[#10B981]" />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <h4 className="text-[16px] font-semibold text-[#F9FAFB] truncate leading-tight">
            {contact.displayName}
          </h4>
          <span className={`text-[12px] font-medium ${isOnline ? "text-[#10B981]" : "text-[#6B7280]"}`}>
            {getPresenceText(contact, isOnline)}
          </span>
        </div>
      </div>
    </div>
  );
}

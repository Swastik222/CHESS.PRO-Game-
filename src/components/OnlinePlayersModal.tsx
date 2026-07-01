import React, { useState } from "react";
import { Users, X, Swords, MessageSquare, Send } from "lucide-react";

interface OnlinePlayersModalProps {
  onlineUsers: { id: string; username: string }[];
  onClose: () => void;
  onChallenge: (targetId: string) => void;
  onSendMessage: (targetId: string, text: string) => void;
}

export const OnlinePlayersModal: React.FC<OnlinePlayersModalProps> = ({
  onlineUsers,
  onClose,
  onChallenge,
  onSendMessage
}) => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");

  const handleSend = (e: React.FormEvent, targetId: string) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(targetId, chatInput.trim());
      setChatInput("");
      setActiveChat(null); // Optional: close chat after sending, or keep it open
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#111115] w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Online Players ({onlineUsers.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {onlineUsers.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No other players are currently online.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {onlineUsers.map(u => (
                <div key={u.id} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{u.username}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveChat(activeChat === u.id ? null : u.id)}
                        className="p-2 bg-gray-200 dark:bg-white/10 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 rounded-lg transition-colors"
                        title="Send Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onChallenge(u.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Swords className="w-4 h-4" />
                        Challenge
                      </button>
                    </div>
                  </div>
                  
                  {activeChat === u.id && (
                    <form onSubmit={(e) => handleSend(e, u.id)} className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-white dark:bg-black/50 border border-gray-300 dark:border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="p-1.5 bg-green-600 text-white rounded-lg disabled:opacity-50 hover:bg-green-700 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

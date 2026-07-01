import React, { useState, useEffect, useRef } from "react";
import { X, Send, Swords } from "lucide-react";
import { cn } from "../lib/utils";
import { Socket } from "socket.io-client";
import { PlayerInfo } from "../App";

interface OnlinePlayersModalProps {
  onClose: () => void;
  onlineUsers: {id: string, username: string}[];
  user: PlayerInfo;
  socket: Socket | null;
  onChallenge: (targetUser: string) => void;
}

export const OnlinePlayersModal: React.FC<OnlinePlayersModalProps> = ({ onClose, onlineUsers, user, socket, onChallenge }) => {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    
    const handleGlobalChat = (msg: { sender: string; text: string }) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on("global_chat", handleGlobalChat);
    return () => {
      socket.off("global_chat", handleGlobalChat);
    };
  }, [socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && socket) {
      socket.emit("global_chat", { sender: user.username, text: chatInput.trim() });
      setChatInput("");
    }
  };

  const otherUsers = onlineUsers.filter(u => u.username !== user.username);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="bg-white/90 dark:bg-[#111115]/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl w-full max-w-3xl h-[70vh] shadow-2xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Side: Players List */}
        <div className="w-1/3 min-w-[220px] border-r border-gray-200 dark:border-white/10 flex flex-col bg-gray-50/50 dark:bg-[#0a0a0c]/50">
          <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-black/50">
            <h2 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white uppercase">Online ({onlineUsers.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {otherUsers.length === 0 ? (
              <div className="text-xs text-center text-gray-500 py-4">No other players online</div>
            ) : (
              otherUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{u.username}</span>
                  </div>
                  <button 
                    onClick={() => {
                      onChallenge(u.username);
                      onClose();
                    }}
                    className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/40 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Challenge Player"
                  >
                    <Swords className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
            <div className="flex items-center justify-between p-2 mt-4 rounded-lg bg-gray-200/50 dark:bg-white/5 opacity-60">
               <div className="flex items-center gap-2 overflow-hidden">
                 <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                 <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user.username} (You)</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Global Chat */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-black/50">
            <h2 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white uppercase">Global Lobby Chat</h2>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-[#1d1d20] text-gray-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
             {messages.length === 0 && (
               <div className="text-center text-xs text-gray-500 my-auto">Welcome to the Global Lobby.<br/>Say hi!</div>
             )}
             {messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col max-w-[85%]", m.sender === user.username ? "self-end items-end" : "self-start items-start")}>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 px-1">{m.sender}</span>
                  <div className={cn(
                    "px-3 py-2 text-sm shadow-sm",
                    m.sender === user.username 
                      ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm" 
                      : "bg-gray-100 text-gray-900 dark:bg-[#1a1a1c] dark:text-gray-100 border border-gray-200 dark:border-[#2a2a2c] rounded-2xl rounded-tl-sm"
                  )}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChatSubmit} className="p-3 border-t border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/50 flex gap-2">
             <input 
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white dark:bg-[#0a0a0c] border border-gray-200 dark:border-[#2a2a2c] rounded-full px-4 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
             />
             <button type="submit" disabled={!chatInput.trim()} className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full transition-colors flex-shrink-0">
                <Send className="w-4 h-4 ml-0.5" />
             </button>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { GameMode, PlayerInfo } from "../App";
import { Bot, Users, Globe, LogIn, Puzzle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface HomeProps {
  onStart: (mode: GameMode, room?: string, level?: number) => void;
  user: PlayerInfo | null;
  onSetUser: (user: PlayerInfo) => void;
}

export function Home({ onStart, user, onSetUser }: HomeProps) {
  const [roomInput, setRoomInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [aiLevel, setAiLevel] = useState(2);

  const handleCreateRoom = () => {
    if ("Notification" in window) Notification.requestPermission();
    const newRoom = uuidv4().substring(0, 8);
    onStart("online", newRoom);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomInput.trim()) {
      if ("Notification" in window) Notification.requestPermission();
      onStart("online", roomInput.trim());
    }
  };

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      onSetUser({ username: usernameInput.trim(), isGuest: true });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 py-12 px-4">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">Play Chess Online</h2>
        <p className="text-lg text-gray-500 dark:text-[#7e7e81]">
          Challenge the AI, play locally with a friend, or compete online with End-to-End encrypted chat.
        </p>
      </div>

      {!user ? (
        <div className="max-w-md mx-auto bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#2a2a2c] rounded-xl p-6 shadow-md dark:shadow-sm">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <LogIn className="w-5 h-5" />
            Join as Guest
          </h3>
          <form onSubmit={handleGuestLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-[#a1a1a5]">Username</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter a username"
                className="w-full bg-gray-50 dark:bg-[#1d1d20] border border-gray-200 dark:border-[#2a2a2c] rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-[#2a2a2c] dark:hover:bg-[#3a3a3d] text-gray-900 dark:text-white rounded-lg px-4 py-2 font-medium transition-colors border border-gray-300 dark:border-[#3a3a3d]"
            >
              Continue
            </button>
          </form>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Daily Puzzle */}
          <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#2a2a2c] rounded-2xl hover:border-purple-500/50 hover:shadow-lg dark:hover:shadow-purple-500/10 transition-all duration-300 group cursor-pointer shadow-sm"
               onClick={() => onStart("puzzle")}>
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Puzzle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Daily Puzzle</h3>
            <p className="text-sm text-gray-500 dark:text-[#7e7e81] mb-4 flex-1">Find the best move in curated chess puzzles.</p>
            <button className="w-full bg-purple-100 dark:bg-purple-600/20 hover:bg-purple-200 dark:hover:bg-purple-600/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              Solve Now
            </button>
          </div>

          {/* AI Mode */}
          <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#2a2a2c] rounded-2xl hover:border-blue-500/50 hover:shadow-lg dark:hover:shadow-blue-500/10 transition-all duration-300 group shadow-sm">
            <div 
              onClick={() => onStart("ai", undefined, aiLevel)}
              className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 cursor-pointer"
            >
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Play vs AI</h3>
            <p className="text-sm text-gray-500 dark:text-[#7e7e81] mb-4 flex-1">Practice against our local AI engine.</p>
            <div className="w-full flex gap-2 mt-auto">
               <select 
                  value={aiLevel}
                  onChange={(e) => setAiLevel(Number(e.target.value))}
                  className="bg-gray-50 dark:bg-[#1d1d20] border border-gray-200 dark:border-[#2a2a2c] text-gray-900 dark:text-[#e1e1e3] text-xs rounded-lg px-2 py-2 flex-1 focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
               >
                  <option value={1}>Level 1</option>
                  <option value={2}>Level 2</option>
                  <option value={3}>Level 3</option>
               </select>
               <button 
                  onClick={() => onStart("ai", undefined, aiLevel)} 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
               >
                  PLAY
               </button>
            </div>
          </div>

          {/* Local Mode */}
          <button
            onClick={handleCreateRoom}
            className="flex flex-col items-center text-center p-8 bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#2a2a2c] rounded-2xl hover:border-green-500/50 hover:shadow-lg dark:hover:shadow-green-500/10 transition-all duration-300 group shadow-sm"
          >
            <div className="w-16 h-16 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Local Network</h3>
            <p className="text-sm text-gray-500 dark:text-[#7e7e81]">Play with a friend across devices on the same network.</p>
          </button>

          {/* Online Mode */}
          <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#2a2a2c] rounded-2xl relative shadow-sm hover:border-orange-500/50 hover:shadow-lg dark:hover:shadow-orange-500/10 transition-all duration-300 group">
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Play Online</h3>
            <p className="text-sm text-gray-500 dark:text-[#7e7e81] mb-6 flex-1">Create or join a private room.</p>
            
            <div className="w-full space-y-3 mt-auto">
              <button
                onClick={handleCreateRoom}
                className="w-full bg-orange-100 dark:bg-orange-600/20 hover:bg-orange-200 dark:hover:bg-orange-600/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Create Room
              </button>
              
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-[#2a2a2c]"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] text-gray-400 dark:text-[#7e7e81] tracking-widest uppercase">OR</span>
                <div className="flex-grow border-t border-gray-200 dark:border-[#2a2a2c]"></div>
              </div>

              <form onSubmit={handleJoinRoom} className="flex gap-2">
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="Room Code"
                  className="flex-grow bg-gray-50 dark:bg-[#1d1d20] border border-gray-200 dark:border-[#2a2a2c] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50 transition-colors uppercase"
                  required
                />
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

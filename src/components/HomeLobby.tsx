import React, { useState } from "react";
import { cn } from "../lib/utils";
import {
  Trophy,
  Bot,
  Users,
  Lightbulb,
  Settings,
  User,
  Sparkles,
  Gamepad2,
} from "lucide-react";

interface HomeLobbyProps {
  user: any;
  onSelectMode: (mode: "ai" | "local" | "online", roomId: string | null, aiLevel?: number) => void;
  onOpenLeaderboard: () => void;
  onOpenPuzzles: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
}

export const HomeLobby: React.FC<HomeLobbyProps> = ({
  user,
  onSelectMode,
  onOpenLeaderboard,
  onOpenPuzzles,
  onOpenSettings,
  onOpenProfile,
  onOpenLogin,
}) => {
  const [roomIdInput, setRoomIdInput] = useState("");
  const [aiLevel, setAiLevel] = useState(2);

  const handleCreateOnlineGame = () => {
    if (!user) {
      onOpenLogin();
      return;
    }
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    onSelectMode("online", code);
  };

  const handleJoinOnlineGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenLogin();
      return;
    }
    if (roomIdInput.trim()) {
      onSelectMode("online", roomIdInput.trim().toUpperCase());
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-12 px-4 transition-colors">
      {/* Hero Header Card */}
      <div className="bg-gradient-to-r from-[#111115] to-[#1d1d22] border border-white/10 rounded-3xl p-6 md:p-10 mb-8 md:mb-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="flex flex-col gap-3 relative z-10 text-center md:text-left">
          <span className="text-xs text-blue-400 uppercase font-black tracking-widest bg-blue-500/10 px-3 py-1 rounded-full w-max mx-auto md:mx-0">
            CHESS MASTERS LIVE
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Refine Strategy. <br className="hidden md:block" /> Outplay the Engine.
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-md">
            Engage with master-level AI bots, test your wits with daily grandmaster puzzles, or play E2E secure encrypted matches online.
          </p>
        </div>
        <div className="w-40 h-40 bg-[#1d1d24] rounded-2xl flex items-center justify-center p-4 border border-white/10 shadow-inner shrink-0 rotate-6 hover:rotate-0 transition-all duration-300">
          <div className="grid grid-cols-2 gap-2.5 w-full h-full opacity-60">
            <div className="bg-blue-500/20 rounded-md" />
            <div className="bg-white/10 rounded-md" />
            <div className="bg-white/10 rounded-md" />
            <div className="bg-purple-500/20 rounded-md" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Interactive Play Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <h2 className="text-lg font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            SELECT MATCH MODE
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* VS Bot */}
            <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between h-64 shadow-xl transition-all hover:bg-white/40 dark:hover:bg-[#1a1a20]/30 group relative">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl group-hover:bg-blue-500/20 transition-all">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setAiLevel(lvl)}
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded transition-colors",
                        aiLevel === lvl
                          ? "bg-blue-600 text-white"
                          : "bg-black/10 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      L{lvl}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                  AI Bot Challenge
                </h3>
                <p className="text-xs text-gray-600 dark:text-[#a1a1a5] mt-1 leading-relaxed">
                  Test your skills against our custom engine, ranging from level 1 (Easy) up to level 4 (Master).
                </p>
              </div>
              <button
                onClick={() => onSelectMode("ai", null, aiLevel)}
                className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Gamepad2 className="w-4 h-4" />
                PLAY VS BOT (LVL {aiLevel})
              </button>
            </div>

            {/* Pass & Play */}
            <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between h-64 shadow-xl transition-all hover:bg-white/40 dark:hover:bg-[#1a1a20]/30 group">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl group-hover:bg-purple-500/20 transition-all w-max">
                <Users className="w-6 h-6" />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors">
                  Pass & Play
                </h3>
                <p className="text-xs text-gray-600 dark:text-[#a1a1a5] mt-1 leading-relaxed">
                  Challenge a friend next to you. High-contrast labels guide turn orientations dynamically.
                </p>
              </div>
              <button
                onClick={() => onSelectMode("local", null)}
                className="mt-4 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Gamepad2 className="w-4 h-4" />
                PASS & PLAY PVP
              </button>
            </div>
          </div>

          {/* Online Match Arena */}
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-xl mt-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Online Match Arena
            </h3>
            <p className="text-xs text-gray-600 dark:text-[#a1a1a5] mb-6">
              Create a custom room or enter an opponent's code to play real-time encrypted secure chess matches.
            </p>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <button
                onClick={handleCreateOnlineGame}
                className="w-full md:w-1/2 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Gamepad2 className="w-4 h-4" />
                CREATE ONLINE ROOM
              </button>

              <div className="w-full md:w-px h-px md:h-10 bg-white/20" />

              <form onSubmit={handleJoinOnlineGame} className="w-full md:w-1/2 flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER ROOM CODE..."
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  className="flex-1 bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-center tracking-wider focus:outline-none focus:border-blue-500/50 uppercase dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!roomIdInput.trim()}
                  className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl text-xs hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  JOIN
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Menu Shortcuts Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <h2 className="text-lg font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            COMMUNITY & LABS
          </h2>

          <div className="flex flex-col gap-4">
            {/* Daily Puzzles */}
            <button
              onClick={onOpenPuzzles}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/10 transition-all text-left group"
            >
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:bg-amber-500/20 transition-all">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Daily Puzzles</h3>
                <p className="text-xs text-gray-600 dark:text-[#a1a1a5] mt-0.5">
                  Engage with tactical daily mate positions.
                </p>
              </div>
            </button>

            {/* Global Leaderboards */}
            <button
              onClick={onOpenLeaderboard}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/10 transition-all text-left group"
            >
              <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl group-hover:bg-yellow-500/20 transition-all">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Global Leaderboard</h3>
                <p className="text-xs text-gray-600 dark:text-[#a1a1a5] mt-0.5">
                  See how the top ranked chess masters score.
                </p>
              </div>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/10 transition-all text-left group"
            >
              <div className="p-3 bg-gray-500/10 text-gray-500 rounded-xl group-hover:bg-gray-500/20 transition-all">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Settings</h3>
                <p className="text-xs text-gray-600 dark:text-[#a1a1a5] mt-0.5">
                  Customize your boards and premium custom pieces.
                </p>
              </div>
            </button>

            {/* My Profile */}
            <button
              onClick={() => {
                if (user) onOpenProfile();
                else onOpenLogin();
              }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/30 dark:bg-black/30 border border-white/20 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/10 transition-all text-left group"
            >
              <div className="p-3 bg-green-500/10 text-green-500 rounded-xl group-hover:bg-green-500/20 transition-all">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">My Profile</h3>
                <p className="text-xs text-gray-600 dark:text-[#a1a1a5] mt-0.5">
                  View your Elo ratings, game logs, and review historic matches.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

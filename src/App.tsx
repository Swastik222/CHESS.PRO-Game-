import { useState, useEffect } from "react";
import { GameView } from "./components/GameView";
import { Home } from "./components/Home";
import { Leaderboard } from "./components/Leaderboard";
import { PuzzleView } from "./components/PuzzleView";
import { SettingsModal } from "./components/SettingsModal";
import { Moon, Sun, User, Share2, Settings } from "lucide-react";
import { cn } from "./lib/utils";
import { BoardTheme, PieceStyle } from "./types";

export type GameMode = "ai" | "local" | "online" | "puzzle" | null;
export interface PlayerInfo {
  username: string;
  isGuest: boolean;
}

export default function App() {
  const [mode, setMode] = useState<GameMode>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [user, setUser] = useState<PlayerInfo | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [aiLevel, setAiLevel] = useState<number>(2);
  const [boardTheme, setBoardTheme] = useState<BoardTheme>("green");
  const [pieceStyle, setPieceStyle] = useState<PieceStyle>("classic");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room && user && !mode) {
      setMode("online");
      setRoomId(room);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, mode]);

  const handleStartGame = (selectedMode: GameMode, room?: string, level?: number) => {
    if (!user) {
      setUser({ username: `Guest_${Math.floor(Math.random() * 10000)}`, isGuest: true });
    }
    setMode(selectedMode);
    if (room) setRoomId(room);
    if (level) setAiLevel(level);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Chess Masters',
        text: 'Join me for a game of Chess Masters! Play AI, local, or online.',
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-[#0a0a0b] text-gray-900 dark:text-[#e1e1e3] font-sans overflow-hidden transition-colors">
      {(!mode || showLeaderboard) && (
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2c] bg-white dark:bg-[#121214] transition-colors">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setMode(null); setShowLeaderboard(false); }}>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-2xl pb-1">♞</span> CHESS.<span className="text-gray-500 dark:text-[#7e7e81]">PRO</span>
            </h1>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-[#1d1d20] border border-gray-200 dark:border-[#3a3a3d] rounded text-[10px] text-gray-500 dark:text-[#a1a1a5] font-mono hidden sm:inline-block">v2.4.0 ENCRYPTED</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
              <span className="text-xs text-gray-500 dark:text-[#a1a1a5] font-medium">OFFLINE MODE READY</span>
            </div>
            
            <div className="hidden sm:flex bg-gray-100 dark:bg-[#1d1d20] rounded-lg p-1 border border-gray-200 dark:border-[#2a2a2c]">
              <button 
                onClick={() => { setMode(null); setShowLeaderboard(false); }}
                className={cn("px-3 py-1 text-xs font-semibold rounded-md transition-colors", !showLeaderboard && !mode ? "bg-white dark:bg-[#2a2a2c] text-gray-900 dark:text-white shadow-sm dark:shadow-none" : "text-gray-500 dark:text-[#7e7e81] hover:text-gray-900 dark:hover:text-[#e1e1e3]")}
              >
                PLAY
              </button>
              <button 
                onClick={() => setShowLeaderboard(true)}
                className={cn("px-3 py-1 text-xs font-semibold rounded-md transition-colors", showLeaderboard ? "bg-white dark:bg-[#2a2a2c] text-gray-900 dark:text-white shadow-sm dark:shadow-none" : "text-gray-500 dark:text-[#7e7e81] hover:text-gray-900 dark:hover:text-[#e1e1e3]")}
              >
                LEADERBOARD
              </button>
              <button 
                onClick={handleShare}
                className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-[#7e7e81] hover:text-gray-900 dark:hover:text-[#e1e1e3] transition-colors"
              >
                SHARE
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-[#7e7e81] hover:text-gray-900 dark:hover:text-[#e1e1e3] transition-colors flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" /> SETTINGS
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                {user ? user.username.substring(0, 2).toUpperCase() : "GU"}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-none text-gray-900 dark:text-white">{user ? user.username : "NOT LOGGED IN"}</span>
                <span className="text-[10px] text-gray-500 dark:text-[#7e7e81]">UNRANKED</span>
              </div>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-[#2a2a2c] transition-colors text-gray-500 dark:text-[#7e7e81] ml-2"
                title="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {showLeaderboard ? (
            <Leaderboard />
          ) : mode === "puzzle" ? (
            <PuzzleView onExit={() => setMode(null)} darkMode={darkMode} boardTheme={boardTheme} pieceStyle={pieceStyle} />
          ) : mode ? (
            <GameView mode={mode as any} user={user} roomId={roomId} aiLevel={aiLevel} onExit={() => setMode(null)} darkMode={darkMode} boardTheme={boardTheme} pieceStyle={pieceStyle} />
          ) : (
            <Home onStart={handleStartGame} user={user} onSetUser={setUser} />
          )}
        </div>
      </main>
      
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)}
          boardTheme={boardTheme}
          setBoardTheme={setBoardTheme}
          pieceStyle={pieceStyle}
          setPieceStyle={setPieceStyle}
        />
      )}
    </div>
  );
}

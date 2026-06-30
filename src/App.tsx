import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { GameView } from "./components/GameView";
import { Home } from "./components/Home";
import { Leaderboard } from "./components/Leaderboard";
import { PuzzleView } from "./components/PuzzleView";
import { SettingsModal } from "./components/SettingsModal";
import { LoginModal } from "./components/LoginModal";
import { ProfileModal } from "./components/ProfileModal";
import { Moon, Sun, User, Share2, Settings, LogOut } from "lucide-react";
import { cn } from "./lib/utils";
import { BoardTheme, PieceStyle } from "./types";

export type GameMode = "ai" | "local" | "online" | "puzzle" | null;
export interface PlayerInfo {
  username: string;
  isGuest: boolean;
  uid?: string;
  rating?: number;
  gamesPlayed?: number;
  gamesWon?: number;
}

export default function App() {
  const [mode, setMode] = useState<GameMode>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [user, setUser] = useState<PlayerInfo | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [aiLevel, setAiLevel] = useState<number>(2);
  const [boardTheme, setBoardTheme] = useState<BoardTheme>("green");
  const [pieceStyle, setPieceStyle] = useState<PieceStyle>("classic");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({
              uid: firebaseUser.uid,
              username: data.displayName || "Player",
              isGuest: data.isGuest || false,
              rating: data.rating || 1200,
              gamesPlayed: data.gamesPlayed || 0,
              gamesWon: data.gamesWon || 0,
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              username: firebaseUser.displayName || `Guest_${firebaseUser.uid.substring(0,5)}`,
              isGuest: firebaseUser.isAnonymous,
              rating: 1200,
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser({
            uid: firebaseUser.uid,
            username: firebaseUser.displayName || `Guest_${firebaseUser.uid.substring(0,5)}`,
            isGuest: firebaseUser.isAnonymous,
            rating: 1200,
          });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

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
      setShowLogin(true);
      return;
    }
    setMode(selectedMode);
    if (room) setRoomId(room);
    if (level) setAiLevel(level);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setMode(null);
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
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-indigo-950 dark:via-purple-900 dark:to-slate-900 text-gray-900 dark:text-[#e1e1e3] font-sans overflow-hidden transition-colors relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-400/20 dark:bg-pink-600/20 blur-[120px] pointer-events-none" />
      
      {(!mode || showLeaderboard) && (
        <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-md transition-colors">
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
            
            <div className="hidden sm:flex bg-white/20 dark:bg-black/20 rounded-lg p-1 border border-white/20 dark:border-white/10 backdrop-blur-sm">
              <button 
                onClick={() => { setMode(null); setShowLeaderboard(false); }}
                className={cn("px-3 py-1 text-xs font-semibold rounded-md transition-colors", !showLeaderboard && !mode ? "bg-white/60 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white")}
              >
                PLAY
              </button>
              <button 
                onClick={() => setShowLeaderboard(true)}
                className={cn("px-3 py-1 text-xs font-semibold rounded-md transition-colors", showLeaderboard ? "bg-white/60 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white")}
              >
                LEADERBOARD
              </button>
              <button 
                onClick={handleShare}
                className="px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                SHARE
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" /> SETTINGS
              </button>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:bg-white/30 dark:hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                    onClick={() => setShowProfile(true)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold leading-none text-gray-900 dark:text-white">{user.username}</span>
                      <span className="text-[10px] text-gray-600 dark:text-gray-300">{user.rating ? `${user.rating} ELO` : 'UNRANKED'}</span>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="p-1 rounded hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300 ml-1" title="Log Out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button onClick={() => setShowLogin(true)} className="px-4 py-1.5 bg-blue-600/90 backdrop-blur hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm">
                  LOGIN
                </button>
              )}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-1 rounded hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300 ml-2"
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

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} />
      )}

      {showProfile && user && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}

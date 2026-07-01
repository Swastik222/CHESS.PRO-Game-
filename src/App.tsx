import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { io } from "socket.io-client";
import { GameView } from "./components/GameView";
import { HomeLobby } from "./components/HomeLobby";
import { Leaderboard } from "./components/Leaderboard";
import { PuzzleView } from "./components/PuzzleView";
import { SettingsModal } from "./components/SettingsModal";
import { LoginModal } from "./components/LoginModal";
import { ProfileModal } from "./components/ProfileModal";
import { OnlinePlayersModal } from "./components/OnlinePlayersModal";
import { Moon, Sun, User, Share2, Settings, Sparkles, Users, Trophy } from "lucide-react";
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
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [onlineUsersCount, setOnlineUsersCount] = useState<number>(0);
  const [onlineUsersList, setOnlineUsersList] = useState<{id: string, username: string}[]>([]);
  const [showOnlinePlayers, setShowOnlinePlayers] = useState(false);
  const [globalSocket, setGlobalSocket] = useState<any>(null);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "players", firebaseUser.uid);
        
        getDoc(userRef).then(async (docSnapshot) => {
          if (!docSnapshot.exists()) {
            try {
              await setDoc(userRef, {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || `Guest_${firebaseUser.uid.substring(0,5)}`,
                isGuest: firebaseUser.isAnonymous,
                rating: 1200,
                gamesPlayed: 0,
                gamesWon: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } catch (e) {
              console.error("Failed to create player profile", e);
            }
          }
          
          unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
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
            }
          }, (error) => {
            console.error("Error fetching user data:", error);
          });
        });
      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
        setUser(null);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const newSocket = io(window.location.origin);
    setGlobalSocket(newSocket);
    
    if (user && user.username) {
      newSocket.on("connect", () => {
        newSocket.emit("register_user", user.username);
      });
    }
    newSocket.on("online_users", (users: {id: string, username: string}[]) => {
      setOnlineUsersCount(users.length);
      setOnlineUsersList(users);
    });

    newSocket.on("receive_challenge", (data: { fromUsername: string, roomId: string }) => {
      if (window.confirm(`${data.fromUsername} challenged you! Accept?`)) {
         newSocket.emit("accept_challenge", { toUsername: data.fromUsername, roomId: data.roomId });
         handleStartGame("online", data.roomId);
      } else {
         newSocket.emit("reject_challenge", { toUsername: data.fromUsername });
      }
    });

    newSocket.on("challenge_accepted", (data: { roomId: string }) => {
       handleStartGame("online", data.roomId);
    });

    newSocket.on("challenge_rejected", () => {
       alert("Your challenge was rejected.");
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

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
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase sign out failed", e);
    }
    setUser(null);
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
        <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/20 dark:border-white/10 bg-white/40 dark:bg-[#0a0a0c]/80 backdrop-blur-md transition-colors">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setMode(null); setShowLeaderboard(false); }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
                  Chess Masters
                </h1>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-500 rounded text-[10px] font-bold uppercase hidden sm:inline-block">PRO</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Outplay the engine or connect online</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => user ? setShowOnlinePlayers(true) : setShowLogin(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/20 dark:bg-[#1a1a1d] hover:bg-white/30 dark:hover:bg-white/10 rounded-full border border-white/20 dark:border-white/5 shadow-sm transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-700 dark:text-gray-300 font-bold">{Math.max(1, onlineUsersCount)} Online</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full bg-white/20 dark:bg-[#1a1a1d] border border-white/20 dark:border-white/5 hover:bg-white/30 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300 shadow-sm"
                title="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {user ? (
                <button 
                  className="flex items-center gap-3 hover:bg-white/30 dark:hover:bg-white/10 p-1.5 pr-3 rounded-full border border-white/20 dark:border-white/5 transition-colors bg-white/20 dark:bg-[#1a1a1d] shadow-sm"
                  onClick={() => setShowProfile(true)}
                >
                  <div className="flex flex-col text-right hidden sm:flex">
                    <span className="text-xs font-bold leading-none text-gray-900 dark:text-white mb-0.5">{user.username}</span>
                    <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 flex items-center justify-end gap-1">
                      <Trophy className="w-3 h-3" /> ELO {user.rating || 1200}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3a3a3c] to-[#1e1e1f] border border-white/10 flex items-center justify-center text-gray-300">
                    <User className="w-4 h-4" />
                  </div>
                </button>
              ) : (
                <button onClick={() => setShowLogin(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-colors shadow-sm">
                  LOGIN
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col">
          {showLeaderboard ? (
            <Leaderboard />
          ) : mode === "puzzle" ? (
            <PuzzleView onExit={() => setMode(null)} darkMode={darkMode} boardTheme={boardTheme} pieceStyle={pieceStyle} />
          ) : mode ? (
            <GameView mode={mode as any} user={user} roomId={roomId} aiLevel={aiLevel} onExit={() => setMode(null)} darkMode={darkMode} boardTheme={boardTheme} pieceStyle={pieceStyle} soundEnabled={soundEnabled} />
          ) : (
            <HomeLobby 
              user={user} 
              onSelectMode={(m, room, level) => {
                if (level) setAiLevel(level);
                handleStartGame(m, room || undefined);
              }}
              onOpenLeaderboard={() => setShowLeaderboard(true)}
              onOpenPuzzles={() => handleStartGame("puzzle")}
              onOpenSettings={() => setShowSettings(true)}
              onOpenProfile={() => setShowProfile(true)}
              onOpenLogin={() => setShowLogin(true)}
            />
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
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {showLogin && (
        <LoginModal 
          onClose={() => setShowLogin(false)} 
          onGuestFallback={(localUser) => {
            setUser(localUser);
            setShowLogin(false);
          }}
        />
      )}

      {showProfile && user && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}

      {showOnlinePlayers && user && (
        <OnlinePlayersModal 
          onlineUsers={onlineUsersList}
          user={user}
          socket={globalSocket}
          onClose={() => setShowOnlinePlayers(false)}
          onChallenge={(targetUsername) => {
             const newRoomId = Math.random().toString(36).substring(2, 9);
             globalSocket?.emit("challenge_user", { targetUsername, fromUsername: user.username, roomId: newRoomId });
             alert(`Challenge sent to ${targetUsername}! Waiting for response...`);
          }}
        />
      )}
    </div>
  );
}

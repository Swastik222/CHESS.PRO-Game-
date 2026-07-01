import React, { useState, useEffect } from "react";
import { GameMode, PlayerInfo } from "../App";
import { Bot, Users, Globe, LogIn, Puzzle, Swords, User } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { signInAnonymously } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { io, Socket } from "socket.io-client";

interface HomeProps {
  onStart: (mode: GameMode, room?: string, level?: number) => void;
  user: PlayerInfo | null;
  onSetUser: (user: PlayerInfo) => void;
}

export function Home({ onStart, user, onSetUser }: HomeProps) {
  const [roomInput, setRoomInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [aiLevel, setAiLevel] = useState(2);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [incomingChallenge, setIncomingChallenge] = useState<{ fromUsername: string, roomId: string } | null>(null);
  const [pendingChallenge, setPendingChallenge] = useState<{ targetUsername: string, roomId: string } | null>(null);

  useEffect(() => {
    if (user && user.username) {
      const newSocket = io(window.location.origin);
      setSocket(newSocket);

      newSocket.on("connect", () => {
        newSocket.emit("register_user", user.username);
      });

      newSocket.on("online_users", (users: string[]) => {
        setOnlineUsers(users.filter(u => u !== user.username));
      });

      newSocket.on("receive_challenge", (data: { fromUsername: string, roomId: string }) => {
        setIncomingChallenge(data);
      });

      newSocket.on("challenge_accepted", (data: { roomId: string }) => {
        setPendingChallenge(null);
        onStart("online", data.roomId);
      });

      newSocket.on("challenge_rejected", () => {
        setPendingChallenge(null);
        alert("Challenge was rejected.");
      });

      newSocket.on("challenge_cancelled", () => {
        setIncomingChallenge(null);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const handleChallenge = (targetUsername: string) => {
    if (socket && user) {
      const newRoom = uuidv4().substring(0, 8);
      socket.emit("challenge_user", { targetUsername, fromUsername: user.username, roomId: newRoom });
      setPendingChallenge({ targetUsername, roomId: newRoom });
    }
  };

  const handleAcceptChallenge = () => {
    if (socket && incomingChallenge) {
      socket.emit("accept_challenge", { toUsername: incomingChallenge.fromUsername, roomId: incomingChallenge.roomId });
      onStart("online", incomingChallenge.roomId);
      setIncomingChallenge(null);
    }
  };

  const handleRejectChallenge = () => {
    if (socket && incomingChallenge) {
      socket.emit("reject_challenge", { toUsername: incomingChallenge.fromUsername });
      setIncomingChallenge(null);
    }
  };

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

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    
    try {
      setIsLoggingIn(true);
      const result = await signInAnonymously(auth);
      const fbUser = result.user;

      const userRef = doc(db, "players", fbUser.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: fbUser.uid,
          displayName: usernameInput.trim(),
          isGuest: true,
          rating: 1000,
          gamesPlayed: 0,
          gamesWon: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      // We don't need to call onSetUser here, the auth state listener in App.tsx will handle it
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/admin-restricted-operation') {
        alert("Anonymous Sign-In is disabled. Please enable it in Firebase Console.");
      } else if (err.code === 'auth/network-request-failed') {
        alert("Network request failed. Please check your connection or open the app in a new tab.");
      } else {
        alert(err.message || "Failed to log in as guest");
      }
    } finally {
      setIsLoggingIn(false);
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
        <div className="max-w-md mx-auto bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <LogIn className="w-5 h-5" />
            Join as Guest
          </h3>
          <form onSubmit={handleGuestLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">Username</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter a username"
                className="w-full bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50 backdrop-blur-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-medium transition-colors border border-blue-500/20 backdrop-blur disabled:opacity-50"
            >
              {isLoggingIn ? "Joining..." : "Continue"}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
            {/* Daily Puzzle */}
            <div className="flex flex-col items-center text-center p-8 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl hover:border-purple-500/50 hover:shadow-xl transition-all duration-300 group cursor-pointer shadow-lg"
                 onClick={() => onStart("puzzle")}>
              <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 backdrop-blur-sm">
                <Puzzle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Daily Puzzle</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-1">Find the best move in curated chess puzzles.</p>
              <button className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-700 dark:text-purple-300 border border-purple-500/20 rounded-lg px-4 py-2 text-sm font-medium transition-colors backdrop-blur-sm">
                Solve Now
              </button>
            </div>

            {/* AI Mode */}
            <div className="flex flex-col items-center text-center p-8 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 group shadow-lg">
              <div 
                onClick={() => onStart("ai", undefined, aiLevel)}
                className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 cursor-pointer backdrop-blur-sm"
              >
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Play vs AI</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-1">Practice against our local AI engine.</p>
              <div className="w-full flex gap-2 mt-auto">
                 <select 
                    value={aiLevel}
                    onChange={(e) => setAiLevel(Number(e.target.value))}
                    className="bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 text-gray-900 dark:text-white text-xs rounded-lg px-2 py-2 flex-1 focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer backdrop-blur-sm"
                 >
                    <option value={1} className="text-black">Level 1</option>
                    <option value={2} className="text-black">Level 2</option>
                    <option value={3} className="text-black">Level 3</option>
                 </select>
                 <button 
                    onClick={() => onStart("ai", undefined, aiLevel)} 
                    className="bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm backdrop-blur"
                 >
                    PLAY
                 </button>
              </div>
            </div>

            {/* Local Mode */}
            <button
              onClick={handleCreateRoom}
              className="flex flex-col items-center text-center p-8 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl hover:border-green-500/50 hover:shadow-xl transition-all duration-300 group shadow-lg"
            >
              <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 backdrop-blur-sm">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Local Network</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Play with a friend across devices on the same network.</p>
            </button>

            {/* Online Mode */}
            <div className="flex flex-col items-center text-center p-8 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl relative shadow-lg hover:border-orange-500/50 hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-orange-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 backdrop-blur-sm">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Play Online</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 flex-1">Create or join a private room.</p>
              
              <div className="w-full space-y-3 mt-auto">
                <button
                  onClick={handleCreateRoom}
                  className="w-full bg-orange-600/20 hover:bg-orange-600/30 text-orange-700 dark:text-orange-400 border border-orange-500/20 rounded-lg px-4 py-2 text-sm font-medium transition-colors backdrop-blur-sm"
                >
                  Create Room
                </button>
                
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-white/20 dark:border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-[10px] text-gray-500 dark:text-gray-400 tracking-widest uppercase">OR</span>
                  <div className="flex-grow border-t border-white/20 dark:border-white/10"></div>
                </div>

                <form onSubmit={handleJoinRoom} className="flex gap-2">
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    placeholder="Room Code"
                    className="flex-grow bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500/50 transition-colors uppercase backdrop-blur-sm"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-orange-600/90 hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm backdrop-blur"
                  >
                    Join
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Online Users List */}
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg flex flex-col max-h-[600px]">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/20 dark:border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Players Online ({onlineUsers.length})</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {onlineUsers.length === 0 ? (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                  No other players online right now.
                </div>
              ) : (
                onlineUsers.map(u => (
                  <div key={u} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 backdrop-blur-sm transition-colors group">
                    <div className="flex items-center gap-3 truncate pr-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{u}</span>
                    </div>
                    <button
                      onClick={() => handleChallenge(u)}
                      className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title={`Challenge ${u}`}
                    >
                      <Swords className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Incoming Challenge Modal */}
      {incomingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Swords className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Match Challenge!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <span className="font-bold text-gray-900 dark:text-white">{incomingChallenge.fromUsername}</span> has challenged you to a match.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={handleRejectChallenge}
                className="flex-1 py-2.5 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
              >
                Decline
              </button>
              <button 
                onClick={handleAcceptChallenge}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/30"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pending Challenge Modal */}
      {pendingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-orange-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Swords className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Challenging {pendingChallenge.targetUsername}...</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Waiting for them to accept.
            </p>
            <button 
              onClick={() => {
                socket?.emit("cancel_challenge", { toUsername: pendingChallenge.targetUsername });
                setPendingChallenge(null);
              }}
              className="w-full py-2.5 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

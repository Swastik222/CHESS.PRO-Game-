import React, { useEffect, useState } from "react";
import { X, Trophy, Swords, Medal, Clock, Activity } from "lucide-react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { PlayerInfo } from "../App";

interface MatchRecord {
  id: string;
  opponent: string;
  result: "win" | "loss" | "draw";
  mode: string;
  createdAt: Date;
}

export function ProfileModal({ user, onClose }: { user: PlayerInfo; onClose: () => void }) {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      if (!user.uid) {
        setLoading(false);
        return;
      }
      try {
        const matchesRef = collection(db, "users", user.uid, "matches");
        const q = query(matchesRef, orderBy("createdAt", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        
        const history: MatchRecord[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          history.push({
            id: doc.id,
            opponent: data.opponent,
            result: data.result,
            mode: data.mode,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });
        setMatches(history);
      } catch (err) {
        console.error("Error fetching match history:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMatches();
  }, [user.uid]);

  const winRate = user.gamesPlayed && user.gamesPlayed > 0 
    ? Math.round((user.gamesWon || 0) / user.gamesPlayed * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-white/20 dark:border-white/10">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <UserAvatar username={user.username} />
            {user.username}'s Profile
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1d1d20] text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <section className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Player Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Medal className="w-5 h-5 text-yellow-500" />} label="Rating" value={user.rating || 1200} />
              <StatCard icon={<Swords className="w-5 h-5 text-gray-500" />} label="Games Played" value={user.gamesPlayed || 0} />
              <StatCard icon={<Trophy className="w-5 h-5 text-green-500" />} label="Games Won" value={user.gamesWon || 0} />
              <StatCard icon={<Activity className="w-5 h-5 text-blue-500" />} label="Win Rate" value={`${winRate}%`} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              Recent Match History
            </h3>
            
            {loading ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading history...</div>
            ) : matches.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1a1c] rounded-xl border border-dashed border-gray-200 dark:border-[#2a2a2c]">
                No games played yet. Get on the board!
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#1a1a1c] border border-gray-100 dark:border-[#2a2a2c]">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${match.result === 'win' ? 'bg-green-500' : match.result === 'loss' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                          vs {match.opponent}
                        </div>
                        <div className="text-xs font-medium text-gray-500">
                          {match.mode === 'ai' ? 'Vs Bot' : match.mode === 'online' ? 'Online Match' : match.mode === 'local' ? 'Pass & Play' : match.mode} • {match.createdAt.toLocaleDateString()} {match.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      match.result === 'win' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      match.result === 'loss' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {match.result}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-gray-50 dark:bg-[#1a1a1c] border border-gray-100 dark:border-[#2a2a2c] rounded-xl p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function UserAvatar({ username }: { username: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
      {username.substring(0, 2).toUpperCase()}
    </div>
  );
}

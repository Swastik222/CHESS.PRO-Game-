import { useState, useEffect } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

interface LeaderboardEntry {
  username: string;
  wins: number;
  rating: number;
  isGuest: boolean;
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const usersRef = collection(db, "users");
        // We order by rating first, which uses the default single-field index.
        const q = query(usersRef, orderBy("rating", "desc"), limit(100));
        const querySnapshot = await getDocs(q);
        
        const data: LeaderboardEntry[] = [];
        querySnapshot.forEach((doc) => {
          const user = doc.data();
          data.push({
            username: user.displayName || "Player",
            wins: user.gamesWon || 0,
            rating: user.rating || 1200,
            isGuest: user.isGuest || false
          });
        });
        
        // Filter out guests and users with 0 wins to show only real players who won matches
        const realPlayers = data.filter(player => !player.isGuest && player.wins > 0);
        setEntries(realPlayers.slice(0, 50)); // Show top 50
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 transition-colors">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 text-yellow-500 rounded-2xl flex items-center justify-center shadow-lg transition-colors">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Global Leaderboard</h2>
          <p className="text-gray-600 dark:text-gray-300">Top ranked players around the world</p>
        </div>
      </div>

      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl transition-colors">
        {loading ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-300">Loading rankings...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-300">No ranked players yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/30 dark:bg-black/30 border-b border-white/20 dark:border-white/10 transition-colors">
                <th className="p-4 font-semibold text-xs text-gray-600 dark:text-gray-400 w-16 text-center uppercase tracking-widest">Rank</th>
                <th className="p-4 font-semibold text-xs text-gray-600 dark:text-gray-400 uppercase tracking-widest">Player</th>
                <th className="p-4 font-semibold text-xs text-gray-600 dark:text-gray-400 text-right uppercase tracking-widest">Rating</th>
                <th className="p-4 font-semibold text-xs text-gray-600 dark:text-gray-400 text-right uppercase tracking-widest">Wins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20 dark:divide-white/10">
              {entries.map((entry, idx) => (
                <tr key={entry.username} className="hover:bg-white/40 dark:hover:bg-white/10 transition-colors">
                  <td className="p-4 text-center font-medium">
                    {idx === 0 ? <Trophy className="w-5 h-5 text-yellow-500 mx-auto" /> : 
                     idx === 1 ? <Medal className="w-5 h-5 text-zinc-400 mx-auto" /> : 
                     idx === 2 ? <Award className="w-5 h-5 text-amber-600 mx-auto" /> : 
                     <span className="text-gray-600 dark:text-gray-400 font-mono">{idx + 1}</span>}
                  </td>
                  <td className="p-4 font-medium flex items-center gap-3 text-gray-900 dark:text-white">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {entry.username.substring(0, 2).toUpperCase()}
                    </div>
                    {entry.username}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-blue-700 dark:text-blue-300">{entry.rating}</td>
                  <td className="p-4 text-right text-gray-600 dark:text-gray-300 font-mono">{entry.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

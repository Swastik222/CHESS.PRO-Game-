import { useState, useEffect } from "react";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  username: string;
  wins: number;
  rating: number;
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(res => res.json())
      .then(data => {
        setEntries(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch leaderboard", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 transition-colors">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-white dark:bg-[#1d1d20] border border-gray-200 dark:border-[#2a2a2c] text-yellow-500 rounded-2xl flex items-center justify-center shadow-sm dark:shadow-none transition-colors">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Global Leaderboard</h2>
          <p className="text-gray-500 dark:text-[#7e7e81]">Top ranked players around the world</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#2a2a2c] rounded-2xl overflow-hidden shadow-sm dark:shadow-none transition-colors">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-[#7e7e81]">Loading rankings...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-[#7e7e81]">No ranked players yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0e0e10] border-b border-gray-200 dark:border-[#2a2a2c] transition-colors">
                <th className="p-4 font-semibold text-xs text-gray-500 dark:text-[#a1a1a5] w-16 text-center uppercase tracking-widest">Rank</th>
                <th className="p-4 font-semibold text-xs text-gray-500 dark:text-[#a1a1a5] uppercase tracking-widest">Player</th>
                <th className="p-4 font-semibold text-xs text-gray-500 dark:text-[#a1a1a5] text-right uppercase tracking-widest">Rating</th>
                <th className="p-4 font-semibold text-xs text-gray-500 dark:text-[#a1a1a5] text-right uppercase tracking-widest">Wins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a2c]">
              {entries.map((entry, idx) => (
                <tr key={entry.username} className="hover:bg-gray-50 dark:hover:bg-[#1d1d20] transition-colors">
                  <td className="p-4 text-center font-medium">
                    {idx === 0 ? <Trophy className="w-5 h-5 text-yellow-500 mx-auto" /> : 
                     idx === 1 ? <Medal className="w-5 h-5 text-zinc-400 mx-auto" /> : 
                     idx === 2 ? <Award className="w-5 h-5 text-amber-600 mx-auto" /> : 
                     <span className="text-gray-500 dark:text-[#7e7e81] font-mono">{idx + 1}</span>}
                  </td>
                  <td className="p-4 font-medium flex items-center gap-3 text-gray-900 dark:text-white">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {entry.username.substring(0, 2).toUpperCase()}
                    </div>
                    {entry.username}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">{entry.rating}</td>
                  <td className="p-4 text-right text-gray-500 dark:text-[#a1a1a5] font-mono">{entry.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

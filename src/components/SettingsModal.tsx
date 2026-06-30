import React from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { BoardTheme, PieceStyle } from "../types";

interface SettingsModalProps {
  onClose: () => void;
  boardTheme: BoardTheme;
  setBoardTheme: (theme: BoardTheme) => void;
  pieceStyle: PieceStyle;
  setPieceStyle: (style: PieceStyle) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, boardTheme, setBoardTheme, pieceStyle, setPieceStyle }) => {
  const themes: { id: BoardTheme; name: string; colors: string[] }[] = [
    { id: "classic", name: "Classic", colors: ["#f0d9b5", "#b58863"] },
    { id: "green", name: "Green", colors: ["#ffffdd", "#86a666"] },
    { id: "blue", name: "Blue", colors: ["#dee3e6", "#8ca2ad"] },
    { id: "purple", name: "Purple", colors: ["#e8e6ee", "#8374a4"] },
    { id: "dark", name: "Dark", colors: ["#8c8c8c", "#404040"] },
    { id: "wood", name: "Wood", colors: ["#e6d3a8", "#a87b4f"] },
  ];

  const pieceStyles: { id: PieceStyle; name: string }[] = [
    { id: "classic", name: "Classic" },
    { id: "alpha", name: "Alpha" },
    { id: "cburnett", name: "CBurnett" },
    { id: "merida", name: "Merida" },
    { id: "pirouetti", name: "Pirouetti" },
    { id: "staunty", name: "Staunty" },
    { id: "fantasy", name: "Fantasy" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-[#2a2a2c] rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-[#2a2a2c]">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1d1d20] text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-widest">Board Theme</h3>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setBoardTheme(theme.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all",
                    boardTheme === theme.id ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-gray-200 dark:border-[#2a2a2c] hover:border-blue-300 dark:hover:border-[#3a3a3d]"
                  )}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex border border-gray-200 dark:border-[#2a2a2c]">
                    <div className="flex-1" style={{ backgroundColor: theme.colors[0] }}></div>
                    <div className="flex-1" style={{ backgroundColor: theme.colors[1] }}></div>
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-[#a1a1a5]">{theme.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-widest">Piece Style</h3>
            <div className="grid grid-cols-2 gap-3">
              {pieceStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setPieceStyle(style.id)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-sm font-medium transition-all text-center",
                    pieceStyle === style.id ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" : "border-gray-200 dark:border-[#2a2a2c] hover:border-blue-300 dark:hover:border-[#3a3a3d] text-gray-700 dark:text-[#a1a1a5]"
                  )}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

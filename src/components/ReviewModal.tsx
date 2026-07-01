import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { X } from "lucide-react";

interface ReviewModalProps {
  match: {
    opponent: string;
    history?: string[];
  };
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ match, onClose }) => {
  const [fen, setFen] = useState("start");
  const [currentIdx, setCurrentIdx] = useState(match.history?.length || 0);

  useEffect(() => {
    const game = new Chess();
    const history = match.history || [];
    for (let i = 0; i < currentIdx; i++) {
      try {
        game.move(history[i]);
      } catch (err) {
        // Safe fallback
      }
    }
    setFen(game.fen());
  }, [currentIdx, match]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0a0a0b] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 dark:border-[#2a2a2c] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1c] transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-6 border-b border-gray-200 dark:border-[#2a2a2c]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Review Match vs {match.opponent}
          </h2>
        </div>
        <div className="p-6 flex flex-col items-center flex-1 overflow-y-auto">
          <div className="w-full max-w-[400px] mb-6">
            <Chessboard
              options={{
                position: fen,
                allowDragging: false,
                darkSquareStyle: { backgroundColor: "#779556" },
                lightSquareStyle: { backgroundColor: "#ebecd0" }
              }}
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentIdx(0)}
              disabled={currentIdx === 0}
              className="p-2 bg-gray-100 dark:bg-[#1a1a1c] hover:bg-gray-200 dark:hover:bg-[#2a2a2c] disabled:opacity-50 disabled:cursor-not-allowed rounded text-gray-900 dark:text-white transition-colors"
            >
              Start
            </button>
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="p-2 bg-gray-100 dark:bg-[#1a1a1c] hover:bg-gray-200 dark:hover:bg-[#2a2a2c] disabled:opacity-50 disabled:cursor-not-allowed rounded text-gray-900 dark:text-white transition-colors"
            >
              Prev
            </button>
            <span className="font-mono text-sm dark:text-white">
              {currentIdx} / {match.history?.length || 0}
            </span>
            <button
              onClick={() =>
                setCurrentIdx(
                  Math.min(match.history?.length || 0, currentIdx + 1)
                )
              }
              disabled={currentIdx === (match.history?.length || 0)}
              className="p-2 bg-gray-100 dark:bg-[#1a1a1c] hover:bg-gray-200 dark:hover:bg-[#2a2a2c] disabled:opacity-50 disabled:cursor-not-allowed rounded text-gray-900 dark:text-white transition-colors"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentIdx(match.history?.length || 0)}
              disabled={currentIdx === (match.history?.length || 0)}
              className="p-2 bg-gray-100 dark:bg-[#1a1a1c] hover:bg-gray-200 dark:hover:bg-[#2a2a2c] disabled:opacity-50 disabled:cursor-not-allowed rounded text-gray-900 dark:text-white transition-colors"
            >
              End
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

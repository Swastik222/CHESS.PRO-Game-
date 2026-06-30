import React, { useState, useEffect, useMemo } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { ArrowLeft, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { dailyPuzzles, Puzzle } from "../data/puzzles";
import { BoardTheme, PieceStyle } from "../types";
import { THEME_COLORS } from "./GameView";
import { getCustomPieces } from "../lib/pieces";

export function PuzzleView({ onExit, darkMode = true, boardTheme = "green", pieceStyle = "classic" }: { onExit: () => void; darkMode?: boolean; boardTheme?: BoardTheme; pieceStyle?: PieceStyle }) {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [game, setGame] = useState(new Chess());
  const [moveIndex, setMoveIndex] = useState(0);
  const [status, setStatus] = useState<"playing" | "success" | "failed">("playing");
  
  const [hintSquare, setHintSquare] = useState<string | null>(null);

  useEffect(() => {
    // Pick a random puzzle on mount
    const puzzle = dailyPuzzles[Math.floor(Math.random() * dailyPuzzles.length)];
    setCurrentPuzzle(puzzle);
    const newGame = new Chess(puzzle.fen);
    setGame(newGame);
    setHintSquare(null);
  }, []);

  const playerColor = useMemo(() => {
    if (!currentPuzzle) return "white";
    const fenParts = currentPuzzle.fen.split(" ");
    return fenParts[1] === "w" ? "white" : "black";
  }, [currentPuzzle]);

  function onDrop({ sourceSquare, targetSquare, piece }: any) {
    if (status !== "playing" || !currentPuzzle) return false;

    const possibleMoves = game.moves({ verbose: true });
    const isMoveValid = possibleMoves.some(
      (m: any) => m.from === sourceSquare && m.to === targetSquare
    );

    if (!isMoveValid) return false;

    const newGame = new Chess(game.fen());
    const move = newGame.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1]?.toLowerCase() ?? "q"
    });

    if (move) {
      const uciMove = move.from + move.to;
      const expectedMove = currentPuzzle.moves[moveIndex];

      if (uciMove === expectedMove) {
        setHintSquare(null);
        setGame(newGame);
        if (moveIndex + 1 >= currentPuzzle.moves.length) {
          setStatus("success");
        } else {
          setMoveIndex(moveIndex + 1);
          // AI counter move
          setTimeout(() => {
            const aiGame = new Chess(newGame.fen());
            const aiExpectedMove = currentPuzzle.moves[moveIndex + 1];
            aiGame.move({
              from: aiExpectedMove.substring(0, 2),
              to: aiExpectedMove.substring(2, 4),
              promotion: aiExpectedMove.length === 5 ? aiExpectedMove[4] : undefined
            });
            setGame(aiGame);
            if (moveIndex + 2 >= currentPuzzle.moves.length) {
               setStatus("success");
            } else {
               setMoveIndex(moveIndex + 2);
            }
          }, 500);
        }
        return true;
      } else {
        setStatus("failed");
        setHintSquare(null);
        setTimeout(() => {
           // Reset the game to let them try again
           const tempGame = new Chess(currentPuzzle.fen);
           for(let i = 0; i < moveIndex; i++) {
               const pMove = currentPuzzle.moves[i];
               tempGame.move({
                   from: pMove.substring(0,2),
                   to: pMove.substring(2,4),
                   promotion: pMove.length === 5 ? pMove[4] : undefined
               });
           }
           setGame(tempGame);
           setStatus("playing");
        }, 1000);
        return false;
      }
    }
    return false;
  }

  if (!currentPuzzle) return null;

  return (
    <div className="flex flex-col flex-1 h-full bg-transparent text-gray-900 dark:text-white transition-colors relative">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-md transition-colors relative z-10">
        <button onClick={onExit} className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-bold text-lg">Daily Puzzle</h2>
          <div className="text-xs text-gray-600 dark:text-gray-300">Rating: {currentPuzzle.rating}</div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-1 py-4 lg:p-4 lg:overflow-y-auto overflow-visible w-full relative z-10">
        <div className="w-full max-w-[600px] aspect-square border-4 border-white/30 dark:border-white/10 shadow-2xl relative bg-white/50 dark:bg-black/50 backdrop-blur-md transition-colors">
           {status === "failed" && (
              <div className="absolute inset-0 bg-red-500/20 z-10 flex items-center justify-center">
                 <XCircle className="w-24 h-24 text-red-500 drop-shadow-lg" />
              </div>
           )}
           {status === "success" && (
              <div className="absolute inset-0 bg-green-500/20 z-10 flex items-center justify-center flex-col gap-4">
                 <CheckCircle className="w-24 h-24 text-green-500 drop-shadow-lg" />
                 <div className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-md">Puzzle Solved!</div>
                 <button onClick={() => {
                    const puzzle = dailyPuzzles[Math.floor(Math.random() * dailyPuzzles.length)];
                    setCurrentPuzzle(puzzle);
                    setGame(new Chess(puzzle.fen));
                    setMoveIndex(0);
                    setHintSquare(null);
                    setStatus("playing");
                 }} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">Next Puzzle</button>
              </div>
           )}
          <Chessboard
            options={{
              position: game.fen(),
              onPieceDrop: onDrop,
              boardOrientation: playerColor,
              darkSquareStyle: { backgroundColor: THEME_COLORS[boardTheme].dark },
              lightSquareStyle: { backgroundColor: THEME_COLORS[boardTheme].light },
              pieces: getCustomPieces(pieceStyle),
              animationDurationInMs: 200,
              squareStyles: hintSquare ? {
                [hintSquare]: { backgroundColor: "rgba(255, 255, 0, 0.4)" }
              } : undefined
            }}
          />
        </div>
        <div className="mt-8 text-center text-gray-600 dark:text-gray-300 max-w-md flex flex-col items-center gap-4">
            <p>Find the best move for {playerColor}. The puzzle will automatically respond if your move is correct.</p>
            <button
               onClick={() => {
                 if (status === "playing" && currentPuzzle) {
                   const expectedMove = currentPuzzle.moves[moveIndex];
                   if (expectedMove) {
                     setHintSquare(expectedMove.substring(0, 2));
                   }
                 }
               }}
               className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 rounded-lg font-bold transition-colors backdrop-blur-sm"
            >
              <Lightbulb className="w-4 h-4" />
              Need a Hint?
            </button>
        </div>
      </div>
    </div>
  );
}

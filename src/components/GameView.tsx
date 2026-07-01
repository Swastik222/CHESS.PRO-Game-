import React, { useState } from "react";
import { Chessboard } from "react-chessboard";
import { GameMode, PlayerInfo } from "../App";
import { useChessGame } from "../hooks/useChessGame";
import { Copy, LogOut, Send, ShieldCheck, Clock, RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Bot, Users, User } from "lucide-react";
import { cn } from "../lib/utils";
import { calculateAccuracy, getCalibratedAccuracies, getPerformanceRating } from "../lib/engine";
import { Chess } from "chess.js";

import { BoardTheme, PieceStyle } from "../types";
import { getCustomPieces } from "../lib/pieces";
import { saveMatchResult } from "../lib/firebase";

interface GameViewProps {
  mode: GameMode;
  user: PlayerInfo | null;
  roomId: string;
  aiLevel?: number;
  onExit: () => void;
  darkMode?: boolean;
  boardTheme?: BoardTheme;
  pieceStyle?: PieceStyle;
  soundEnabled?: boolean;
}

export const THEME_COLORS: Record<BoardTheme, { light: string; dark: string }> = {
  classic: { light: "#f0d9b5", dark: "#b58863" },
  green: { light: "#ffffdd", dark: "#86a666" },
  blue: { light: "#dee3e6", dark: "#8ca2ad" },
  purple: { light: "#e8e6ee", dark: "#8374a4" },
  dark: { light: "#8c8c8c", dark: "#404040" },
  wood: { light: "#e6d3a8", dark: "#a87b4f" }
};

export function GameView({ mode, user, roomId, aiLevel, onExit, darkMode = true, boardTheme = "green", pieceStyle = "classic", soundEnabled = true }: GameViewProps) {
  const {
    game,
    opponent,
    playerColor,
    wTime,
    bTime,
    messages,
    history,
    isEncrypted,
    resignedBy,
    undoRequest,
    handleUndoResponse,
    makeMove,
    requestUndo,
    sendMessage,
    resignMatch
  } = useChessGame(mode || "ai", user, roomId, aiLevel, soundEnabled);

  const [chatInput, setChatInput] = useState("");
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});

  const [showResultModal, setShowResultModal] = useState(true);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const matchLogged = React.useRef(false);

  const isMatchOver = game.isGameOver() || !!resignedBy;
  const currentReviewIndex = reviewIndex !== null ? reviewIndex : history.length;

  React.useEffect(() => {
    if (isMatchOver && user && user.uid && !matchLogged.current) {
      matchLogged.current = true;
      
      if (history.length === 0) {
        return; // Don't count games with no moves
      }

      let result: "win" | "loss" | "draw" = "draw";
      
      if (resignedBy) {
        result = resignedBy === playerColor ? "loss" : "win";
      } else if (game.isCheckmate()) {
        result = game.turn() === playerColor ? "loss" : "win";
      } else if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
        result = "draw";
      }

      const oppName = mode === "ai" ? `Bot (Lvl ${aiLevel || 2})` : (opponent || "Unknown");
      saveMatchResult(user.uid, oppName, mode || "ai", result, history.map(h => h.san));
    }
  }, [isMatchOver, user, playerColor, resignedBy, game, mode, opponent, history]);

  const reviewFen = React.useMemo(() => {
    if (!isMatchOver) return game.fen();
    if (currentReviewIndex >= history.length) return game.fen();
    
    const tempGame = new Chess();
    for (let i = 0; i < currentReviewIndex; i++) {
        tempGame.move(history[i].san || history[i]);
    }
    return tempGame.fen();
  }, [isMatchOver, currentReviewIndex, game, history]);

  function getMoveOptions(square: string) {
    const moves = game.moves({
      square,
      verbose: true,
    }) as any[];
    if (moves.length === 0) {
      return false;
    }

    const newSquares: Record<string, any> = {};
    moves.map((move: any) => {
      newSquares[move.to] = {
        background:
          game.get(move.to) && game.get(move.to).color !== game.get(square as any).color
            ? "radial-gradient(circle, rgba(255,0,0,.3) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.3) 25%, transparent 25%)",
        borderRadius: "50%",
      };
      return move;
    });
    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)",
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick({ square }: { piece: any, square: string }) {
    if (game.isGameOver() || resignedBy) return;

    if (!moveFrom) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    if (!optionSquares[square]) {
      const hasMoveOptions = getMoveOptions(square);
      setMoveFrom(hasMoveOptions ? square : null);
      if (!hasMoveOptions) setOptionSquares({});
      return;
    }

    const moveResult = makeMove({
      from: moveFrom,
      to: square,
      promotion: "q",
    });

    if (moveResult) {
      setMoveFrom(null);
      setOptionSquares({});
    }
  }

  const onDrop = ({ sourceSquare, targetSquare, piece }: any) => {
    if (resignedBy) return false;
    const moveResult = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: piece && piece.pieceType && piece.pieceType.length > 1 ? piece.pieceType[1].toLowerCase() : "q",
    });
    if (moveResult) {
      setMoveFrom(null);
      setOptionSquares({});
    }
    return moveResult;
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput.trim());
      setChatInput("");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const myTime = mode === "local" ? (game.turn() === "w" ? wTime : bTime) : (playerColor === "w" ? wTime : bTime);
  const oppTime = mode === "local" ? (game.turn() === "w" ? bTime : wTime) : (playerColor === "w" ? bTime : wTime);

  return (
    <div className="flex flex-col xl:flex-row flex-1 min-h-full xl:h-full w-full xl:overflow-hidden overflow-y-auto">
      {/* Left Aside (Match Intel, Players, Controls) */}
      <aside className="w-full xl:w-72 border-b xl:border-b-0 xl:border-r border-white/20 dark:border-white/10 bg-white/30 dark:bg-black/30 backdrop-blur-md flex flex-col p-3 xl:p-4 gap-3 xl:gap-6 shrink-0 transition-colors order-2 xl:order-1 overflow-y-auto max-h-[40vh] xl:max-h-none">
        <section>
          <h3 className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-3">Match Intelligence</h3>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 flex flex-col gap-1 transition-colors backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate mr-2">{mode === "local" ? "White Accuracy" : "Your Accuracy"}</span>
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                  {calculateAccuracy(history.filter((_, i) => i % 2 === (mode === 'local' ? 0 : (playerColor === 'w' ? 0 : 1))).map(m => m.grade).filter(Boolean))}%
                </span>
              </div>
              <div className="w-full bg-black/10 dark:bg-white/10 h-1 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${calculateAccuracy(history.filter((_, i) => i % 2 === (mode === 'local' ? 0 : (playerColor === 'w' ? 0 : 1))).map(m => m.grade).filter(Boolean))}%` }}
                ></div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 flex flex-col gap-1 transition-colors backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate mr-2">{mode === "local" ? "Black Accuracy" : "Opponent Accuracy"}</span>
                <span className="text-[10px] font-bold text-red-500 dark:text-red-400">
                  {calculateAccuracy(history.filter((_, i) => i % 2 === (mode === 'local' ? 1 : (playerColor === 'w' ? 1 : 0))).map(m => m.grade).filter(Boolean))}%
                </span>
              </div>
              <div className="w-full bg-black/10 dark:bg-white/10 h-1 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-red-500" 
                  style={{ width: `${calculateAccuracy(history.filter((_, i) => i % 2 === (mode === 'local' ? 1 : (playerColor === 'w' ? 1 : 0))).map(m => m.grade).filter(Boolean))}%` }}
                ></div>
              </div>
            </div>

            <button 
              onClick={requestUndo}
              disabled={history.length === 0}
              className="w-full py-2.5 bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70 disabled:opacity-50 border border-white/20 dark:border-white/10 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 text-gray-900 dark:text-white mt-2 backdrop-blur-sm"
            >
              <RotateCcw className="w-3 h-3" />
              UNDO LAST MOVE
            </button>
          </div>
        </section>



        {mode === "online" && (
          <section className="flex flex-col gap-2 mt-auto">
            <div className="p-3 rounded-lg bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 flex flex-col gap-2 transition-colors backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div className="text-[10px] font-bold text-gray-500 dark:text-[#7e7e81] uppercase tracking-widest">
                  {!opponent ? "Waiting for opponent..." : "Match Room"}
                </div>
                {!opponent && (
                   <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={roomId?.toUpperCase() || ''}
                  className="flex-1 bg-white dark:bg-[#0a0a0b] border border-gray-200 dark:border-[#2a2a2c] rounded px-2 py-1.5 text-xs text-gray-900 dark:text-white font-mono truncate outline-none transition-colors text-center"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(roomId?.toUpperCase() || '');
                    alert("Room code copied! Share this with your opponent.");
                  }}
                  className="p-1.5 shrink-0 bg-gray-100 dark:bg-[#1d1d20] hover:bg-gray-200 dark:hover:bg-[#2a2a2c] border border-gray-300 dark:border-[#3a3a3d] rounded text-gray-900 dark:text-white transition-colors"
                  title="Copy Room Code"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>
        )}

        {!isMatchOver && (
          <section className={mode !== "online" ? "mt-auto" : ""}>
            <button
              onClick={resignMatch}
              className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-3 h-3" />
              RESIGN MATCH
            </button>
          </section>
        )}
      </aside>

      {/* Main Board Area */}
      <section className="flex-1 flex flex-col items-center justify-center bg-transparent px-2 py-4 xl:p-8 xl:overflow-y-auto transition-colors order-1 xl:order-2 w-full relative z-10 shrink-0">
        <div className="w-full max-w-[600px] flex justify-between items-end mb-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-sm border border-white/20 dark:border-white/10 flex items-center justify-center shadow-sm">
              {mode === "ai" ? <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <Users className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-white leading-none mb-1 shadow-sm px-2 py-1 rounded bg-white/20 dark:bg-black/20 backdrop-blur-sm">
                {mode === "local" ? (game.turn() === "w" ? "Black" : "White") : (opponent || (mode === "online" ? "Waiting for opponent..." : "Opponent"))}
              </div>
            </div>
          </div>
          <div className="text-xl font-mono font-bold text-gray-900 dark:text-white bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 px-3 py-1 rounded-md leading-none shadow-sm">
            {formatTime(oppTime)}
          </div>
        </div>

        <div className="w-full max-w-[600px] aspect-square border-4 border-white/30 dark:border-white/10 shadow-2xl relative bg-white/50 dark:bg-black/50 backdrop-blur-md transition-colors">
          <Chessboard
            options={{
              position: reviewFen,
              onPieceDrop: onDrop,
              onSquareClick: onSquareClick,
              boardOrientation: mode === "local" ? (game.turn() === "w" ? "white" : "black") : (playerColor === "w" ? "white" : "black"),
              darkSquareStyle: { backgroundColor: THEME_COLORS[boardTheme].dark },
              lightSquareStyle: { backgroundColor: THEME_COLORS[boardTheme].light },
              pieces: getCustomPieces(pieceStyle),
              animationDurationInMs: 200,
              squareStyles: optionSquares
            }}
          />
        </div>

        <div className="w-full max-w-[600px] flex justify-between items-start mt-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-sm border border-white/20 dark:border-white/10 flex items-center justify-center shadow-sm">
              <User className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-white leading-none mb-1 shadow-sm px-2 py-1 rounded bg-white/20 dark:bg-black/20 backdrop-blur-sm">
                {mode === "local" ? (game.turn() === "w" ? "White" : "Black") : (user?.username || "You")}
              </div>
            </div>
          </div>
          <div className="text-xl font-mono font-bold text-gray-900 dark:text-white bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 px-3 py-1 rounded-md leading-none shadow-sm">
            {formatTime(myTime)}
          </div>
        </div>

        {/* Review Controls */}
        {isMatchOver && !showResultModal && (
          <div className="w-full max-w-[600px] mt-4 lg:mt-6 flex flex-col gap-2">
            {currentReviewIndex > 0 && history[currentReviewIndex - 1]?.grade && (
              <div className={cn(
                "text-center font-bold text-sm tracking-widest uppercase", 
                 history[currentReviewIndex - 1].grade === "Blunder" ? "text-red-500" : 
                 history[currentReviewIndex - 1].grade === "Mistake" ? "text-orange-400" : 
                 history[currentReviewIndex - 1].grade === "Inaccuracy" ? "text-yellow-500" : "text-green-500"
              )}>
                 {history[currentReviewIndex - 1].san} - {history[currentReviewIndex - 1].grade}
              </div>
            )}
            <div className="w-full bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl p-3 flex items-center justify-between shadow-xl transition-colors">
              <button 
                onClick={() => setShowResultModal(true)}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                SHOW RESULTS
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setReviewIndex(0)}
                  disabled={currentReviewIndex === 0}
                  className="p-2 bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded text-gray-900 dark:text-white transition-colors border border-white/20 dark:border-white/10 backdrop-blur-sm"
                >
                  <ChevronsLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setReviewIndex(Math.max(0, currentReviewIndex - 1))}
                  disabled={currentReviewIndex === 0}
                  className="p-2 bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded text-gray-900 dark:text-white transition-colors border border-white/20 dark:border-white/10 backdrop-blur-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-16 text-center font-mono font-bold text-gray-900 dark:text-white text-sm">
                  {currentReviewIndex} / {history.length}
                </div>
                <button 
                  onClick={() => setReviewIndex(Math.min(history.length, currentReviewIndex + 1))}
                  disabled={currentReviewIndex === history.length}
                  className="p-2 bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded text-gray-900 dark:text-white transition-colors border border-white/20 dark:border-white/10 backdrop-blur-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setReviewIndex(history.length)}
                  disabled={currentReviewIndex === history.length}
                  className="p-2 bg-white/50 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded text-gray-900 dark:text-white transition-colors border border-white/20 dark:border-white/10 backdrop-blur-sm"
                >
                  <ChevronsRight className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={async () => {
                  if (!isMatchOver) {
                    if (confirm("Are you sure you want to exit? You will forfeit this match.")) {
                      if (history.length > 0) {
                        const oppName = mode === "ai" ? `Bot (Lvl ${aiLevel || 2})` : (opponent || "Unknown");
                        await saveMatchResult(user?.uid || "", oppName, mode || "ai", "loss", history.map(h => h.san));
                      }
                      onExit();
                    }
                  } else {
                    onExit();
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
              >
                EXIT
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Right Aside (History, Chat) */}
      <aside className="w-full xl:w-80 border-t xl:border-t-0 xl:border-l border-white/20 dark:border-white/10 bg-white/30 dark:bg-black/30 backdrop-blur-md flex flex-col shrink-0 transition-colors order-3 xl:max-h-none">
        <div className="flex border-b border-white/20 dark:border-white/10 shrink-0 transition-colors">
          <div className="flex-1 py-2 xl:py-3 text-center text-[10px] font-bold text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white backdrop-blur-sm">
            MATCH HISTORY
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 xl:p-4 space-y-2 max-h-[40vh] xl:max-h-none min-h-[150px]">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-[#7e7e81] text-[11px] font-mono mt-4 italic">No moves yet...</div>
          ) : (
            history.reduce((result: any[], move, index) => {
              if (index % 2 === 0) {
                result.push([move]);
              } else {
                result[result.length - 1].push(move);
              }
              return result;
            }, []).map((pair, idx) => (
              <div key={idx} className="flex text-[11px] font-mono mb-1">
                <span className="w-8 text-gray-500 dark:text-[#7e7e81]">{idx + 1}.</span>
                <span className="flex-1 flex flex-col">
                  <span className="text-gray-900 dark:text-[#e1e1e3]">{pair[0]?.san}</span>
                  {pair[0]?.grade && pair[0]?.grade !== "Best" && pair[0]?.grade !== "Excellent" && pair[0]?.grade !== "Good" && (
                     <span className={cn("text-[9px] mt-0.5", pair[0].grade === "Blunder" ? "text-red-500" : pair[0].grade === "Mistake" ? "text-orange-400" : "text-yellow-500")}>
                        {pair[0].grade}
                     </span>
                  )}
                  {pair[0]?.grade && (pair[0]?.grade === "Best" || pair[0]?.grade === "Excellent" || pair[0]?.grade === "Good") && (
                     <span className="text-[9px] mt-0.5 text-green-500">
                        {pair[0].grade}
                     </span>
                  )}
                </span>
                <span className="flex-1 flex flex-col">
                  {pair[1] ? (
                     <>
                        <span className="text-gray-900 dark:text-[#e1e1e3]">{pair[1].san}</span>
                        {pair[1].grade && pair[1].grade !== "Best" && pair[1].grade !== "Excellent" && pair[1].grade !== "Good" && (
                           <span className={cn("text-[9px] mt-0.5", pair[1].grade === "Blunder" ? "text-red-500" : pair[1].grade === "Mistake" ? "text-orange-400" : "text-yellow-500")}>
                              {pair[1].grade}
                           </span>
                        )}
                        {pair[1].grade && (pair[1].grade === "Best" || pair[1].grade === "Excellent" || pair[1].grade === "Good") && (
                           <span className="text-[9px] mt-0.5 text-green-500">
                              {pair[1].grade}
                           </span>
                        )}
                     </>
                  ) : <span className="text-gray-500 dark:text-[#7e7e81] italic">...waiting</span>}
                </span>
              </div>
            ))
          )}
        </div>

        {mode === "online" && (
          <div className="h-48 xl:h-64 border-t border-gray-200 dark:border-[#2a2a2c] flex flex-col bg-gray-50 dark:bg-[#0a0a0b] shrink-0 transition-colors">
            <div className="flex justify-between items-center p-2 xl:p-3 border-b border-gray-200 dark:border-[#2a2a2c] transition-colors">
              <span className="text-[10px] font-bold text-gray-500 dark:text-[#7e7e81] tracking-widest uppercase">SECURE CHAT</span>
              {isEncrypted && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-green-500">
                  <ShieldCheck className="w-3 h-3" /> E2E
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex flex-col max-w-[90%]", msg.sender === user?.username ? "ml-auto items-end" : "mr-auto items-start")}>
                  <div className="text-[9px] text-gray-600 dark:text-gray-400 mb-0.5 uppercase tracking-wider">{msg.sender}</div>
                  <div className={cn("px-2.5 py-1.5 rounded text-[11px] text-gray-900 dark:text-white font-medium shadow-sm backdrop-blur-sm", msg.sender === user?.username ? "bg-blue-500/20 rounded-tr-none" : "bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-tl-none")}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleChatSubmit} className="p-3 relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Secure message..."
                className="w-full bg-white/50 dark:bg-black/50 border border-white/20 dark:border-white/10 rounded-lg px-3 py-2 text-[11px] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50 pr-8 transition-colors backdrop-blur-sm"
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim()} 
                className="absolute right-5 top-5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </aside>

      {/* Match Over Modal */}
      {(game.isGameOver() || resignedBy) && showResultModal && (
        <div className="fixed inset-0 z-50 bg-[#000000]/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transition-colors">
            <div className="p-6 border-b border-white/20 dark:border-white/10 text-center shrink-0 transition-colors">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {resignedBy 
                  ? "Resignation" 
                  : game.isCheckmate() ? "Checkmate!" : game.isDraw() ? "Draw!" : "Match Over!"}
              </h2>
              <p className="text-gray-500 dark:text-[#a1a1a5]">
                {resignedBy
                  ? `${resignedBy === 'w' ? 'Black' : 'White'} wins the match.`
                  : game.isCheckmate() 
                    ? `${game.turn() === 'w' ? 'Black' : 'White'} wins the match.` 
                    : "The match ended in a draw."}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-[#0a0a0b] transition-colors">
              {(() => {
                const matchResult: "win" | "loss" | "draw" = resignedBy 
                  ? (resignedBy === playerColor ? "loss" : "win")
                  : game.isCheckmate()
                    ? (game.turn() === playerColor ? "loss" : "win")
                    : "draw";

                const botRating = aiLevel === 1 ? 800 : aiLevel === 2 ? 1200 : aiLevel === 3 ? 1600 : 2000;
                const baseOpponentRating = mode === "ai" ? botRating : 1500;

                const { playerAccuracy, opponentAccuracy } = getCalibratedAccuracies(
                  history,
                  playerColor,
                  matchResult,
                  mode,
                  aiLevel
                );

                const playerRatingEst = getPerformanceRating(playerAccuracy, baseOpponentRating, matchResult);
                const opponentRatingEst = getPerformanceRating(opponentAccuracy, playerRatingEst, matchResult === "win" ? "loss" : matchResult === "loss" ? "win" : "draw");

                const isPlayerWhite = playerColor === 'w';
                const pMoves = history.filter((_, i) => i % 2 === (isPlayerWhite ? 0 : 1));
                const oMoves = history.filter((_, i) => i % 2 === (isPlayerWhite ? 1 : 0));
                
                const pValid = pMoves.filter(m => m.grade && m.grade !== "..." && m.grade !== "").length;
                const oValid = oMoves.filter(m => m.grade && m.grade !== "..." && m.grade !== "").length;
                
                const pBestExcellent = pMoves.filter(m => m.grade === "Best" || m.grade === "Excellent").length;
                const oBestExcellent = oMoves.filter(m => m.grade === "Best" || m.grade === "Excellent").length;
                
                const playerMatchRate = pValid > 0 ? Math.round((pBestExcellent / pValid) * 100) : 0;
                const opponentMatchRate = oValid > 0 ? Math.round((oBestExcellent / oValid) * 100) : 0;

                const getGradeCount = (isPlayer: boolean, grade: string) => {
                  const targetColorIdx = isPlayer ? (isPlayerWhite ? 0 : 1) : (isPlayerWhite ? 1 : 0);
                  const playerGrades = history.filter((_, i) => i % 2 === targetColorIdx).map(m => m.grade);
                  return playerGrades.filter(g => g === grade).length;
                };

                return (
                  <>
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="p-4 rounded-xl bg-white dark:bg-[#1d1d20] border border-gray-200 dark:border-[#2a2a2c] text-center shadow-sm dark:shadow-none transition-colors">
                        <div className="text-[10px] font-bold text-gray-500 dark:text-[#7e7e81] uppercase tracking-widest mb-1">Your Accuracy</div>
                        <div className="text-6xl font-bold text-green-600 dark:text-green-400">
                          {playerAccuracy}%
                        </div>
                        <div className="text-sm font-bold text-gray-500 dark:text-[#a1a1a5] mt-2">
                          Performance Rating: <span className="text-blue-500 dark:text-blue-400">{playerRatingEst}</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#1d1d20] border border-gray-200 dark:border-[#2a2a2c] text-center shadow-sm dark:shadow-none transition-colors">
                        <div className="text-[10px] font-bold text-gray-500 dark:text-[#7e7e81] uppercase tracking-widest mb-1">Opponent Accuracy</div>
                        <div className="text-6xl font-bold text-red-600 dark:text-red-400">
                          {opponentAccuracy}%
                        </div>
                        <div className="text-sm font-bold text-gray-500 dark:text-[#a1a1a5] mt-2">
                          Performance Rating: <span className="text-blue-500 dark:text-blue-400">{opponentRatingEst}</span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Prediction Move Breakdown */}
                    <div className="p-5 rounded-xl bg-white dark:bg-[#1d1d20] border border-gray-200 dark:border-[#2a2a2c] mb-8 transition-colors shadow-sm dark:shadow-none">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                        PREDICTION & ACCURACY BREAKDOWN
                      </h3>
                      
                      <div className="grid grid-cols-3 text-center border-b border-gray-200 dark:border-[#2a2a2c] pb-2 mb-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <div>YOU</div>
                        <div>MOVE QUALITY</div>
                        <div>OPPONENT</div>
                      </div>

                      {[
                        { name: "Excellent", desc: "Very high quality", countKey: "Excellent", color: "text-green-600 dark:text-green-400 font-bold" },
                        { name: "Best", desc: "Top choice / Engine prediction", countKey: "Best", color: "text-green-500 dark:text-green-300 font-semibold" },
                        { name: "Good", desc: "Solid developing move", countKey: "Good", color: "text-blue-500 dark:text-blue-400" },
                        { name: "Inaccuracy", desc: "Slightly suboptimal", countKey: "Inaccuracy", color: "text-yellow-600 dark:text-yellow-400" },
                        { name: "Mistake", desc: "Gives up some advantage", countKey: "Mistake", color: "text-orange-500 dark:text-orange-400" },
                        { name: "Blunder", desc: "Critical error / Material loss", countKey: "Blunder", color: "text-red-500 dark:text-red-400 font-bold" }
                      ].map((row) => {
                        const pCount = getGradeCount(true, row.countKey);
                        const oCount = getGradeCount(false, row.countKey);
                        return (
                          <div key={row.name} className="grid grid-cols-3 items-center text-center py-2 border-b border-gray-100 dark:border-[#202023] last:border-b-0 text-sm font-medium transition-colors">
                            <div className="font-mono text-gray-900 dark:text-white bg-gray-50 dark:bg-black/20 py-1 rounded w-16 mx-auto">{pCount}</div>
                            <div>
                              <div className={cn("text-xs font-bold", row.color)}>{row.name}</div>
                              <div className="text-[9px] text-gray-500 dark:text-[#7e7e81] font-normal leading-tight hidden sm:block">{row.desc}</div>
                            </div>
                            <div className="font-mono text-gray-900 dark:text-white bg-gray-50 dark:bg-black/20 py-1 rounded w-16 mx-auto">{oCount}</div>
                          </div>
                        );
                      })}

                      <div className="grid grid-cols-3 items-center text-center mt-6 pt-4 border-t border-gray-200 dark:border-[#2a2a2c] text-xs font-bold text-gray-500 uppercase tracking-widest">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{playerMatchRate}%</div>
                        <div className="text-gray-900 dark:text-white leading-tight">ENGINE PREDICTION MATCH</div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">{opponentMatchRate}%</div>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="mb-4">
                <h3 className="text-[10px] font-bold text-gray-500 dark:text-[#7e7e81] uppercase tracking-widest mb-3">Full Match History</h3>
                <div className="space-y-1">
                  {history.reduce((result: any[], move, index) => {
                    if (index % 2 === 0) result.push([move]);
                    else result[result.length - 1].push(move);
                    return result;
                  }, []).map((pair, idx) => (
                    <div key={idx} className="flex text-sm font-mono bg-white dark:bg-[#1d1d20] rounded border border-gray-200 dark:border-[#2a2a2c] overflow-hidden shadow-sm dark:shadow-none transition-colors">
                      <div className="w-12 bg-gray-100 dark:bg-[#2a2a2c] text-gray-500 dark:text-[#7e7e81] flex items-center justify-center font-bold transition-colors">{idx + 1}</div>
                      <div className="flex-1 flex items-center justify-between px-4 py-2 border-r border-gray-200 dark:border-[#2a2a2c] transition-colors">
                        <span className="text-gray-900 dark:text-white">{pair[0]?.san}</span>
                        {pair[0]?.grade && (
                          <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold", 
                            pair[0].grade === "Best" ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400" :
                            pair[0].grade === "Excellent" ? "bg-green-100 dark:bg-green-400/20 text-green-600 dark:text-green-300" :
                            pair[0].grade === "Good" ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400" :
                            pair[0].grade === "Inaccuracy" ? "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" :
                            pair[0].grade === "Mistake" ? "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400" :
                            "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                          )}>
                            {pair[0].grade}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-between px-4 py-2">
                        {pair[1] ? (
                          <>
                            <span className="text-gray-900 dark:text-white">{pair[1]?.san}</span>
                            {pair[1]?.grade && (
                              <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold", 
                                pair[1].grade === "Best" ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400" :
                                pair[1].grade === "Excellent" ? "bg-green-100 dark:bg-green-400/20 text-green-600 dark:text-green-300" :
                                pair[1].grade === "Good" ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400" :
                                pair[1].grade === "Inaccuracy" ? "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" :
                                pair[1].grade === "Mistake" ? "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400" :
                                "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                              )}>
                                {pair[1].grade}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500 dark:text-[#7e7e81] italic">...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-[#2a2a2c] bg-white dark:bg-[#121214] shrink-0 flex justify-end gap-3 transition-colors">
              <button
                onClick={() => {
                  setShowResultModal(false);
                  setReviewIndex(0);
                }}
                className="px-6 py-2 bg-gray-100 dark:bg-[#1d1d20] text-gray-900 dark:text-white font-bold rounded-lg border border-gray-300 dark:border-[#3a3a3d] hover:bg-gray-200 dark:hover:bg-[#2a2a2c] transition-colors"
              >
                Review Match
              </button>
              <button
                onClick={onExit}
                className="px-6 py-2 bg-blue-600 dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-blue-700 dark:hover:bg-gray-200 transition-colors"
              >
                Return to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {undoRequest && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-white dark:bg-[#111115] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
             <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
               <RotateCcw className="w-6 h-6" />
             </div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Undo Request</h3>
             <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                <strong className="text-gray-900 dark:text-white">{undoRequest}</strong> has requested to undo the last move.
             </p>
             <div className="flex items-center gap-3">
               <button 
                 onClick={() => handleUndoResponse(false)}
                 className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-[#1d1d20] hover:bg-gray-200 dark:hover:bg-[#2a2a2c] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors"
               >
                 Decline
               </button>
               <button 
                 onClick={() => handleUndoResponse(true)}
                 className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-md"
               >
                 Accept
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { PieceStyle } from "../types";
import { Chess } from "chess.js";
import { motion } from "motion/react";

/**
 * Calculates a stable square-to-pieceId mapping by replaying SAN or UCI moves
 * from a starting FEN. This ensures pieces have a constant ID for layout animations.
 */
export function getPieceIdMapping(startingFen: string, moves: string[]): Record<string, string> {
  let normalizedFen = startingFen.trim();
  const fields = normalizedFen.split(/\s+/);
  if (fields.length < 6) {
    const defaults = ["w", "KQkq", "-", "0", "1"];
    const missingCount = 6 - fields.length;
    const defaultSlice = defaults.slice(defaults.length - missingCount);
    normalizedFen = [...fields, ...defaultSlice].join(" ");
  }

  const game = new Chess(normalizedFen);
  const mapping: Record<string, string> = {};
  
  // 1. Scan the starting board and assign initial IDs
  const pieceCounts: Record<string, number> = {};
  const board = game.board();
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const file = String.fromCharCode(97 + c);
        const rank = 8 - r;
        const square = `${file}${rank}`;
        const pieceCode = `${piece.color}${piece.type.toUpperCase()}`; // e.g. "wP", "bK"
        
        if (pieceCounts[pieceCode] === undefined) {
          pieceCounts[pieceCode] = 0;
        }
        const id = `${pieceCode}_${pieceCounts[pieceCode]}`;
        pieceCounts[pieceCode]++;
        mapping[square] = id;
      }
    }
  }

  // 2. Replay all moves and update mapping
  for (const moveStr of moves) {
    const movesVerbose = game.moves({ verbose: true }) as any[];
    
    // Find matching verbose move by SAN or UCI
    let verboseMove = movesVerbose.find(m => m.san === moveStr);
    if (!verboseMove && moveStr.length >= 4) {
      const from = moveStr.substring(0, 2);
      const to = moveStr.substring(2, 4);
      const prom = moveStr.length === 5 ? moveStr[4] : undefined;
      verboseMove = movesVerbose.find(m => m.from === from && m.to === to && (!prom || m.promotion === prom));
    }

    if (!verboseMove) {
      // If we can't find the move, skip to keep map from breaking
      break;
    }
    
    const { from, to, flags } = verboseMove;
    const color = game.turn();
    const pieceId = mapping[from];
    
    // Make the move on the game
    game.move(verboseMove);
    
    if (flags.includes('k')) { // King side castling
      const rank = color === 'w' ? '1' : '8';
      mapping[`g${rank}`] = mapping[`e${rank}`];
      mapping[`f${rank}`] = mapping[`h${rank}`];
      delete mapping[`e${rank}`];
      delete mapping[`h${rank}`];
    } else if (flags.includes('q')) { // Queen side castling
      const rank = color === 'w' ? '1' : '8';
      mapping[`c${rank}`] = mapping[`e${rank}`];
      mapping[`d${rank}`] = mapping[`a${rank}`];
      delete mapping[`e${rank}`];
      delete mapping[`a${rank}`];
    } else if (flags.includes('e')) { // En passant
      mapping[to] = pieceId;
      delete mapping[from];
      const capturedSquare = `${to[0]}${from[1]}`;
      delete mapping[capturedSquare];
    } else {
      // Normal move or capture
      mapping[to] = pieceId;
      delete mapping[from];
    }
  }
  
  return mapping;
}

export const getCustomPieces = (pieceStyle: PieceStyle, mapping?: Record<string, string>) => {
  const pieces = ["wP", "wN", "wB", "wR", "wQ", "wK", "bP", "bN", "bB", "bR", "bQ", "bK"];
  const customPieces: Record<string, (props: { squareWidth: number; isDragging: boolean; square?: string }) => React.JSX.Element> = {};

  pieces.forEach((piece) => {
    customPieces[piece] = ({ squareWidth, isDragging, square }) => {
      const pieceId = square && mapping ? mapping[square] : undefined;
      
      // Map 'classic' to lichess standard 'cburnett'
      const actualStyle = pieceStyle === "classic" ? "cburnett" : pieceStyle;
      const src = `https://lichess1.org/assets/piece/${actualStyle}/${piece}.svg`;

      return (
        <motion.div
          layoutId={pieceId}
          layout={!!pieceId}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 28,
            mass: 0.7
          }}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab",
            zIndex: isDragging ? 50 : 1
          }}
        >
          <img
            src={src}
            alt={piece}
            referrerPolicy="no-referrer"
            style={{ 
              width: "100%", 
              height: "100%",
              transform: isDragging ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.15s ease",
              userSelect: "none"
            }}
          />
        </motion.div>
      );
    };
  });

  return customPieces;
};

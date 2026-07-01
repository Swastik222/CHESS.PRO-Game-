import { Chess } from "chess.js";

const pieceValues: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
};

// Advanced Piece-Square Tables (PST) for White, mirrored for Black
const pawnPST = [
  [  0,  0,  0,  0,  0,  0,  0,  0],
  [ 50, 50, 50, 50, 50, 50, 50, 50],
  [ 10, 10, 20, 30, 30, 20, 10, 10],
  [  5,  5, 10, 25, 25, 10,  5,  5],
  [  0,  0,  0, 20, 20,  0,  0,  0],
  [  5, -5,-10,  0,  0,-10, -5,  5],
  [  5, 10, 10,-20,-20, 10, 10,  5],
  [  0,  0,  0,  0,  0,  0,  0,  0]
];

const knightPST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const bishopPST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const rookPST = [
  [  0,  0,  0,  0,  0,  0,  0,  0],
  [  5, 10, 10, 10, 10, 10, 10,  5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [  0,  0,  0,  5,  5,  0,  0,  0]
];

const queenPST = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0,  -5],
  [  0,  0,  5,  5,  5,  5,  0,   0],
  [-10,  5,  5,  5,  5,  5,  5,-10],
  [-10,  0,  5,  0,  0,  5,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const kingPST = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20]
];

const kingEndgamePST = [
  [-50,-40,-30,-20,-20,-30,-40,-50],
  [-30,-20,-10,  0,  0,-10,-20,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-30,  0,  0,  0,  0,-30,-30],
  [-50,-30,-30,-30,-30,-30,-30,-50]
];

export function evaluateBoard(game: Chess): number {
  let score = 0;
  const fen = game.fen();
  const boardPart = fen.split(' ')[0];
  
  let r = 0;
  let c = 0;
  let whitePiecesMaterial = 0;
  let blackPiecesMaterial = 0;
  let hasWhiteQueen = false;
  let hasBlackQueen = false;
  let whiteKingPos: {r: number, c: number} | null = null;
  let blackKingPos: {r: number, c: number} | null = null;
  
  for (let i = 0; i < boardPart.length; i++) {
    const char = boardPart[i];
    if (char === '/') {
      r++;
      c = 0;
    } else if (char >= '1' && char <= '8') {
      c += parseInt(char, 10);
    } else {
      const isWhite = char >= 'A' && char <= 'Z';
      const type = char.toLowerCase();
      const pieceVal = pieceValues[type];
      
      if (type === 'q') {
        if (isWhite) hasWhiteQueen = true;
        else hasBlackQueen = true;
      } else if (type !== 'k') {
        if (isWhite) whitePiecesMaterial += pieceVal;
        else blackPiecesMaterial += pieceVal;
      }
      
      const pr = isWhite ? r : 7 - r;
      const pc = c;
      let psqtBonus = 0;
      
      if (type === 'p') psqtBonus = pawnPST[pr][pc];
      else if (type === 'n') psqtBonus = knightPST[pr][pc];
      else if (type === 'b') psqtBonus = bishopPST[pr][pc];
      else if (type === 'r') psqtBonus = rookPST[pr][pc];
      else if (type === 'q') psqtBonus = queenPST[pr][pc];
      else if (type === 'k') {
        psqtBonus = kingPST[pr][pc];
        if (isWhite) whiteKingPos = {r: pr, c: pc};
        else blackKingPos = {r: pr, c: pc};
      }
      
      const total = pieceVal + psqtBonus;
      score += isWhite ? total : -total;
      
      c++;
    }
  }
  
  // Endgame adjustment for kings
  const endgame = (!hasWhiteQueen && !hasBlackQueen) || 
                  (hasWhiteQueen && whitePiecesMaterial <= 1300 && !hasBlackQueen) || 
                  (hasBlackQueen && blackPiecesMaterial <= 1300 && !hasWhiteQueen) || 
                  (hasWhiteQueen && hasBlackQueen && whitePiecesMaterial <= 900 && blackPiecesMaterial <= 900);
                  
  if (endgame) {
    if (whiteKingPos) {
      score -= kingPST[whiteKingPos.r][whiteKingPos.c];
      score += kingEndgamePST[whiteKingPos.r][whiteKingPos.c];
    }
    if (blackKingPos) {
      score += kingPST[blackKingPos.r][blackKingPos.c];
      score -= kingEndgamePST[blackKingPos.r][blackKingPos.c];
    }
  }
  
  return score;
}

const tt = new Map<string, { depth: number; score: number; flag: number }>();
const TT_EXACT = 0;
const TT_ALPHA = 1;
const TT_BETA = 2;

function limitTT() {
  if (tt.size > 100000) {
    tt.clear();
  }
}

export function minimax(game: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number {
  if (depth === 0) {
    return evaluateBoard(game);
  }

  let fen = "";
  if (depth >= 3) {
    fen = game.fen();
    const ttEntry = tt.get(fen);
    if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.flag === TT_EXACT) return ttEntry.score;
      if (ttEntry.flag === TT_ALPHA && ttEntry.score <= alpha) return alpha;
      if (ttEntry.flag === TT_BETA && ttEntry.score >= beta) return beta;
    }
  }

  const moves = game.moves({ verbose: true });
  
  if (moves.length === 0) {
    if (game.isCheckmate()) {
      return isMaximizingPlayer ? -20000 : 20000;
    }
    return 0; // Stalemate or draw
  }
  
  if (game.isDraw()) {
    return 0;
  }

  moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.captured) {
      scoreA += 10 * pieceValues[a.captured] - pieceValues[a.piece];
    }
    if (b.captured) {
      scoreB += 10 * pieceValues[b.captured] - pieceValues[b.piece];
    }
    if (a.promotion) scoreA += pieceValues[a.promotion] * 10;
    if (b.promotion) scoreB += pieceValues[b.promotion] * 10;
    return scoreB - scoreA;
  });

  let bestVal = isMaximizingPlayer ? -Infinity : Infinity;
  const originalAlpha = alpha;
  const originalBeta = beta;

  if (isMaximizingPlayer) {
    for (const move of moves) {
      game.move(move.san);
      const value = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      bestVal = Math.max(bestVal, value);
      alpha = Math.max(alpha, bestVal);
      if (beta <= alpha) break;
    }
  } else {
    for (const move of moves) {
      game.move(move.san);
      const value = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      bestVal = Math.min(bestVal, value);
      beta = Math.min(beta, bestVal);
      if (beta <= alpha) break;
    }
  }

  if (depth >= 3) {
    let flag = TT_EXACT;
    if (isMaximizingPlayer) {
      if (bestVal <= originalAlpha) flag = TT_ALPHA;
      else if (bestVal >= beta) flag = TT_BETA;
    } else {
      if (bestVal >= originalBeta) flag = TT_BETA;
      else if (bestVal <= alpha) flag = TT_ALPHA;
    }
    limitTT();
    tt.set(fen, { depth, score: bestVal, flag });
  }

  return bestVal;
}

export function getBestMove(game: Chess, depth: number): { move: string, score: number, allEvaluations?: { move: string, score: number }[] } {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return { move: "", score: 0 };

  // Sort root moves by captures/promotions first to maximize alpha-beta pruning efficiency
  moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.captured) {
      scoreA += 10 * pieceValues[a.captured] - pieceValues[a.piece];
    }
    if (b.captured) {
      scoreB += 10 * pieceValues[b.captured] - pieceValues[b.piece];
    }
    if (a.promotion) scoreA += pieceValues[a.promotion] * 10;
    if (b.promotion) scoreB += pieceValues[b.promotion] * 10;
    return scoreB - scoreA;
  });

  let bestMoves: string[] = [];
  const rootIsWhite = game.turn() === 'w';
  let bestScore = rootIsWhite ? -Infinity : Infinity;
  let alpha = -Infinity;
  let beta = Infinity;
  const allEvaluations: { move: string, score: number }[] = [];

  for (const move of moves) {
    game.move(move.san);
    const score = minimax(game, depth - 1, alpha, beta, !rootIsWhite);
    game.undo();

    allEvaluations.push({ move: move.san, score });

    if (rootIsWhite) {
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move.san];
        alpha = Math.max(alpha, score);
      } else if (score === bestScore) {
        bestMoves.push(move.san);
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMoves = [move.san];
        beta = Math.min(beta, score);
      } else if (score === bestScore) {
        bestMoves.push(move.san);
      }
    }
  }

  // Pick a random move among the equal-scoring best moves to add natural variety
  const bestMove = bestMoves[Math.floor(Math.random() * bestMoves.length)] || moves[0].san;
  return { move: bestMove, score: bestScore, allEvaluations };
}

// Helper to convert centipawn score to winning probability for White
// v = 0 -> P = 0.5, v = +400 -> P = 0.91, v = -400 -> P = 0.09
export function getWinProbability(score: number): number {
  return 1 / (1 + Math.pow(10, -score / 400));
}

export function getMaterialValue(game: Chess, color: 'w' | 'b'): number {
  let value = 0;
  const board = game.board();
  for (const row of board) {
    for (const piece of row) {
      if (piece && piece.color === color) {
        if (piece.type === 'p') value += 1;
        else if (piece.type === 'n') value += 3;
        else if (piece.type === 'b') value += 3;
        else if (piece.type === 'r') value += 5;
        else if (piece.type === 'q') value += 9;
      }
    }
  }
  return value;
}

export interface MoveGradeContext {
  numLegalMoves?: number;
  san?: string;
  allEvaluations?: { move: string; score: number }[];
  historyLength?: number;
  boardBeforeFen?: string;
  boardAfterReplyFen?: string;
}

export function getMoveGrade(
  scoreBefore: number,
  scoreAfter: number,
  isWhite: boolean,
  context?: MoveGradeContext
): string {
  const pBefore = isWhite ? getWinProbability(scoreBefore) : (1 - getWinProbability(scoreBefore));
  const pAfter = isWhite ? getWinProbability(scoreAfter) : (1 - getWinProbability(scoreAfter));
  
  // Loss in win probability
  const deltaP = pBefore - pAfter;
  
  // 1. Forced Move
  if (context?.numLegalMoves === 1) {
    return "Forced";
  }

  // 2. Book Move
  if (context?.historyLength !== undefined && context.historyLength <= 4) {
    // Treat the first 2 full moves as Book if they don't significantly worsen the position, 
    // and are common opening moves
    const isCommonMove = isWhite
      ? ["e4", "d4", "Nf3", "c4"].includes(context.san || "")
      : ["e5", "c5", "Nf6", "e6", "d5", "c6", "g6"].includes(context.san || "");
      
    if ((context.historyLength <= 2 || isCommonMove) && deltaP <= 0.03) {
      return "Book";
    }
  }

  // 3. Brilliant Move (!!)
  if (
    context?.boardBeforeFen &&
    context?.boardAfterReplyFen &&
    deltaP <= 0.04 &&
    pAfter >= 0.40
  ) {
    try {
      const gameBefore = new Chess(context.boardBeforeFen);
      const gameAfterReply = new Chess(context.boardAfterReplyFen);
      const playerColor = isWhite ? 'w' : 'b';
      const opponentColor = isWhite ? 'b' : 'w';

      const matPlayerBefore = getMaterialValue(gameBefore, playerColor);
      const matOpponentBefore = getMaterialValue(gameBefore, opponentColor);
      const matPlayerAfter = getMaterialValue(gameAfterReply, playerColor);
      const matOpponentAfter = getMaterialValue(gameAfterReply, opponentColor);

      const balBefore = matPlayerBefore - matOpponentBefore;
      const balAfter = matPlayerAfter - matOpponentAfter;

      if (balAfter < balBefore) {
        return "Brilliant";
      }
    } catch (e) {
      // ignore
    }
  }

  // 4. Great Move (!)
  if (context?.allEvaluations && context.allEvaluations.length >= 2 && deltaP <= 0.02) {
    const evals = [...context.allEvaluations];
    evals.sort((a, b) => {
      return isWhite ? b.score - a.score : a.score - b.score;
    });

    const bestScore = evals[0].score;
    const secondBestScore = evals[1].score;

    const pBest = isWhite ? getWinProbability(bestScore) : (1 - getWinProbability(bestScore));
    const pSecondBest = isWhite ? getWinProbability(secondBestScore) : (1 - getWinProbability(secondBestScore));

    if (pBest - pSecondBest >= 0.12 && pBest >= 0.45) {
      return "Great Move";
    }
  }

  if (deltaP <= 0.03) return "Best";       // Lost <= 3% win probability
  if (deltaP <= 0.08) return "Excellent";  // Lost <= 8%
  if (deltaP <= 0.15) return "Good";       // Lost <= 15%
  if (deltaP <= 0.25) return "Inaccuracy"; // Lost <= 25%
  if (deltaP <= 0.40) return "Mistake";    // Lost <= 40%
  return "Blunder";                        // Lost > 40% (critical mistake)
}

export function calculateAccuracy(grades: string[]): number {
  const validGrades = grades.filter(g => g !== "..." && g !== "");
  if (validGrades.length === 0) return 100;
  
  const weights: Record<string, number> = {
    "Brilliant": 100,
    "Great Move": 100,
    "Best": 100,
    "Excellent": 90,
    "Book": 100,
    "Forced": 100,
    "Good": 75,
    "Inaccuracy": 50,
    "Mistake": 20,
    "Blunder": 0
  };
  
  const total = validGrades.reduce((acc, g) => acc + (weights[g] !== undefined ? weights[g] : 75), 0);
  return Math.round(total / validGrades.length);
}

// Calibrates raw game accuracies to reflect outcomes and bot levels reasonably
export function getCalibratedAccuracies(
  history: { san: string; grade: string }[],
  playerColor: 'w' | 'b',
  result: 'win' | 'loss' | 'draw',
  mode: string,
  aiLevel?: number
): { playerAccuracy: number; opponentAccuracy: number } {
  const isPlayerWhite = playerColor === 'w';
  
  // Extract move grades for player and opponent
  const playerGrades = history
    .filter((_, i) => i % 2 === (isPlayerWhite ? 0 : 1))
    .map(m => m.grade)
    .filter(g => g && g !== "...");
    
  const opponentGrades = history
    .filter((_, i) => i % 2 === (isPlayerWhite ? 1 : 0))
    .map(m => m.grade)
    .filter(g => g && g !== "...");

  let playerAcc = calculateAccuracy(playerGrades);
  let opponentAcc = calculateAccuracy(opponentGrades);

  // If playing against a bot, adjust the bot's accuracy dynamically based on level
  if (mode === "ai") {
    const level = aiLevel || 2;
    // Expected accuracies: Lvl 1: ~45%, Lvl 2: ~68%, Lvl 3: ~84%, Lvl 4: ~94%
    const expectedBotAcc = level === 1 ? 45 : level === 2 ? 68 : level === 3 ? 84 : 94;
    
    // Smooth raw opponent accuracy with expected level baseline
    opponentAcc = Math.round(opponentAcc * 0.3 + expectedBotAcc * 0.7);
    
    if (result === "win") {
      // If player won, the bot's accuracy MUST be lower than player's to reflect the loss
      if (opponentAcc >= playerAcc) {
        opponentAcc = Math.max(30, playerAcc - 6);
      }
      playerAcc = Math.min(100, playerAcc + 2);
    } else if (result === "loss") {
      // If player lost, the player's accuracy should be lower than bot's
      if (playerAcc >= opponentAcc) {
        playerAcc = Math.max(30, opponentAcc - 6);
      }
    }
  } else {
    // Multiplayer or Local match calibration
    if (result === "win" && opponentAcc >= playerAcc) {
      opponentAcc = Math.max(30, playerAcc - 2);
    } else if (result === "loss" && playerAcc >= opponentAcc) {
      playerAcc = Math.max(30, opponentAcc - 2);
    }
  }

  return { playerAccuracy: playerAcc, opponentAccuracy: opponentAcc };
}

// Estimates Performance Rating based on opponent baseline, game result, and accuracy
export function getPerformanceRating(accuracy: number, opponentRating: number, result: 'win' | 'loss' | 'draw'): number {
  const resultModifier = result === 'win' ? 200 : result === 'loss' ? -200 : 0;
  // Dynamic accuracy scaler: average performance baseline is around 70% accuracy for the rating
  const accuracyModifier = (accuracy - 70) * 16;
  
  return Math.max(100, Math.min(3000, Math.round(opponentRating + resultModifier + accuracyModifier)));
}

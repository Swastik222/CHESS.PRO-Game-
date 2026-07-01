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

function isEndgame(game: Chess): boolean {
  let whitePiecesMaterial = 0;
  let blackPiecesMaterial = 0;
  let hasWhiteQueen = false;
  let hasBlackQueen = false;
  
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        if (piece.type === 'q') {
          if (piece.color === 'w') hasWhiteQueen = true;
          else hasBlackQueen = true;
        } else if (piece.type !== 'k') {
          const val = pieceValues[piece.type];
          if (piece.color === 'w') whitePiecesMaterial += val;
          else blackPiecesMaterial += val;
        }
      }
    }
  }
  
  if (!hasWhiteQueen && !hasBlackQueen) return true;
  if (hasWhiteQueen && whitePiecesMaterial <= 1300 && !hasBlackQueen) return true;
  if (hasBlackQueen && blackPiecesMaterial <= 1300 && !hasWhiteQueen) return true;
  if (hasWhiteQueen && hasBlackQueen && whitePiecesMaterial <= 900 && blackPiecesMaterial <= 900) return true;
  
  return false;
}

export function evaluateBoard(game: Chess): number {
  let score = 0;
  const board = game.board();
  const endgame = isEndgame(game);
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const pieceVal = pieceValues[piece.type];
        let psqtBonus = 0;
        
        // Mirror files/ranks as appropriate for Black
        const pr = piece.color === 'w' ? r : 7 - r;
        const pc = c;
        
        if (piece.type === 'p') {
          psqtBonus = pawnPST[pr][pc];
        } else if (piece.type === 'n') {
          psqtBonus = knightPST[pr][pc];
        } else if (piece.type === 'b') {
          psqtBonus = bishopPST[pr][pc];
        } else if (piece.type === 'r') {
          psqtBonus = rookPST[pr][pc];
        } else if (piece.type === 'q') {
          psqtBonus = queenPST[pr][pc];
        } else if (piece.type === 'k') {
          psqtBonus = endgame ? kingEndgamePST[pr][pc] : kingPST[pr][pc];
        }
        
        const total = pieceVal + psqtBonus;
        score += piece.color === 'w' ? total : -total;
      }
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
  const fen = game.fen();
  const ttEntry = tt.get(fen);
  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.flag === TT_EXACT) return ttEntry.score;
    if (ttEntry.flag === TT_ALPHA && ttEntry.score <= alpha) return alpha;
    if (ttEntry.flag === TT_BETA && ttEntry.score >= beta) return beta;
  }

  if (game.isCheckmate()) {
    // The current player is checkmated, so the other player wins
    return game.turn() === 'w' ? -20000 : 20000;
  }
  if (game.isDraw()) {
    return 0;
  }
  if (depth === 0) {
    return evaluateBoard(game);
  }

  const moves = game.moves({ verbose: true });
  moves.sort((a, b) => {
    let scoreA = a.captured ? 10 : 0;
    let scoreB = b.captured ? 10 : 0;
    if (a.promotion) scoreA += 5;
    if (b.promotion) scoreB += 5;
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

  // Store in Transposition Table
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

  return bestVal;
}

export function getBestMove(game: Chess, depth: number): { move: string, score: number, allEvaluations?: { move: string, score: number }[] } {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return { move: "", score: 0 };

  // Sort root moves by captures/promotions first to maximize alpha-beta pruning efficiency
  moves.sort((a, b) => {
    let scoreA = a.captured ? 10 : 0;
    let scoreB = b.captured ? 10 : 0;
    if (a.promotion) scoreA += 5;
    if (b.promotion) scoreB += 5;
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
  if (context?.historyLength !== undefined && context.historyLength <= 8 && context.san) {
    const isCommonMove = isWhite
      ? ["e4", "d4", "Nf3", "c4", "g3", "Nc3"].includes(context.san)
      : ["e5", "c5", "Nf6", "e6", "d5", "g6", "c6", "d6", "Nc6"].includes(context.san);
    if (isCommonMove && deltaP <= 0.03) {
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

  if (deltaP <= 0.02) return "Best";       // Lost <= 2% win probability (matches engine prediction)
  if (deltaP <= 0.06) return "Excellent";  // Lost <= 6%
  if (deltaP <= 0.13) return "Good";       // Lost <= 13%
  if (deltaP <= 0.23) return "Inaccuracy"; // Lost <= 23%
  if (deltaP <= 0.38) return "Mistake";    // Lost <= 38%
  return "Blunder";                        // Lost > 38% (critical mistake)
}

export function calculateAccuracy(grades: string[]): number {
  const validGrades = grades.filter(g => g !== "..." && g !== "");
  if (validGrades.length === 0) return 100;
  
  const weights: Record<string, number> = {
    "Brilliant": 100,
    "Great Move": 100,
    "Excellent": 100,
    "Best": 95,
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

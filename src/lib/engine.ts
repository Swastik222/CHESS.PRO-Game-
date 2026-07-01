import { Chess } from "chess.js";

const pieceValues: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
};

const centerBonus = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  0, 10, 20, 20, 10,  0,-10],
  [-10,  0, 10, 20, 20, 10,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
];

export function evaluateBoard(game: Chess): number {
  let totalEvaluation = 0;
  const board = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const val = pieceValues[piece.type] + centerBonus[i][j];
        totalEvaluation += piece.color === 'w' ? val : -val;
      }
    }
  }
  return totalEvaluation;
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

export function getBestMove(game: Chess, depth: number): { move: string, score: number } {
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

  for (const move of moves) {
    game.move(move.san);
    const score = minimax(game, depth - 1, alpha, beta, !rootIsWhite);
    game.undo();

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
  return { move: bestMove, score: bestScore };
}

// Helper to convert centipawn score to winning probability for White
// v = 0 -> P = 0.5, v = +400 -> P = 0.91, v = -400 -> P = 0.09
export function getWinProbability(score: number): number {
  return 1 / (1 + Math.pow(10, -score / 400));
}

export function getMoveGrade(scoreBefore: number, scoreAfter: number, isWhite: boolean): string {
  const pBefore = isWhite ? getWinProbability(scoreBefore) : (1 - getWinProbability(scoreBefore));
  const pAfter = isWhite ? getWinProbability(scoreAfter) : (1 - getWinProbability(scoreAfter));
  
  // Loss in win probability
  const deltaP = pBefore - pAfter;
  
  if (deltaP <= 0.02) return "Best";       // Lost <= 2% win probability (matches engine prediction)
  if (deltaP <= 0.06) return "Excellent";  // Lost <= 6%
  if (deltaP <= 0.15) return "Good";       // Lost <= 15%
  if (deltaP <= 0.25) return "Inaccuracy"; // Lost <= 25%
  if (deltaP <= 0.40) return "Mistake";    // Lost <= 40%
  return "Blunder";                        // Lost > 40% (critical mistake)
}

export function calculateAccuracy(grades: string[]): number {
  const validGrades = grades.filter(g => g !== "..." && g !== "");
  if (validGrades.length === 0) return 100;
  
  const weights: Record<string, number> = {
    "Excellent": 100,
    "Best": 95,
    "Good": 75,
    "Inaccuracy": 50,
    "Mistake": 20,
    "Blunder": 0
  };
  
  const total = validGrades.reduce((acc, g) => acc + (weights[g] || 0), 0);
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
        opponentAcc = Math.max(30, playerAcc - Math.round(Math.random() * 4 + 4));
      }
      playerAcc = Math.min(100, playerAcc + 2);
    } else if (result === "loss") {
      // If player lost, the player's accuracy should be lower than bot's
      if (playerAcc >= opponentAcc) {
        playerAcc = Math.max(30, opponentAcc - Math.round(Math.random() * 4 + 4));
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

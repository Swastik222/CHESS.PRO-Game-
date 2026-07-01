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

export function minimax(game: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number {
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

  if (isMaximizingPlayer) {
    let bestVal = -Infinity;
    for (const move of moves) {
      game.move(move.san);
      const value = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      bestVal = Math.max(bestVal, value);
      alpha = Math.max(alpha, bestVal);
      if (beta <= alpha) break;
    }
    return bestVal;
  } else {
    let bestVal = Infinity;
    for (const move of moves) {
      game.move(move.san);
      const value = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      bestVal = Math.min(bestVal, value);
      beta = Math.min(beta, bestVal);
      if (beta <= alpha) break;
    }
    return bestVal;
  }
}

export function getBestMove(game: Chess, depth: number): { move: string, score: number } {
  const moves = game.moves();
  if (moves.length === 0) return { move: "", score: 0 };

  let bestMove = "";
  let bestScore = game.turn() === 'w' ? -Infinity : Infinity;

  // Shuffle moves to add some variety among equal-score moves
  moves.sort(() => Math.random() - 0.5);

  for (const move of moves) {
    game.move(move);
    const score = minimax(game, depth - 1, -Infinity, Infinity, game.turn() === 'w');
    game.undo();

    if (game.turn() === 'w') {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  if (!bestMove) bestMove = moves[0];
  return { move: bestMove, score: bestScore };
}

export function getMoveGrade(scoreBefore: number, scoreAfter: number, isWhite: boolean): string {
  const delta = isWhite ? (scoreAfter - scoreBefore) : (scoreBefore - scoreAfter);
  
  if (delta >= -10) return "Best";
  if (delta >= -30) return "Excellent";
  if (delta >= -80) return "Good";
  if (delta >= -150) return "Inaccuracy";
  if (delta >= -300) return "Mistake";
  return "Blunder";
}

export function calculateAccuracy(grades: string[]): number {
  if (grades.length === 0) return 100;
  
  const weights: Record<string, number> = {
    "Best": 100,
    "Excellent": 90,
    "Good": 75,
    "Inaccuracy": 50,
    "Mistake": 20,
    "Blunder": 0
  };
  
  const total = grades.reduce((acc, g) => acc + (weights[g] || 0), 0);
  return Math.round(total / grades.length);
}

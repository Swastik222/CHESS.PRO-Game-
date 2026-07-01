import { Chess } from "chess.js";
import { getBestMove, getMoveGrade, minimax } from "./engine";

self.onmessage = (e: MessageEvent) => {
  const { id, type, fen, depth, scoreBefore, isWhite, alpha, beta, isMaximizingPlayer } = e.data;

  if (type === "getBestMove") {
    const game = new Chess(fen);
    const result = getBestMove(game, depth);
    self.postMessage({ id, result });
  } else if (type === "evaluatePosition") {
    const game = new Chess(fen);
    const score = minimax(game, depth, alpha !== undefined ? alpha : -Infinity, beta !== undefined ? beta : Infinity, isMaximizingPlayer);
    self.postMessage({ id, result: score });
  } else if (type === "getGrade") {
    const game = new Chess(fen);
    const scoreAfter = getBestMove(game, depth).score;
    const grade = getMoveGrade(scoreBefore, scoreAfter, isWhite);
    self.postMessage({ id, result: grade });
  }
};


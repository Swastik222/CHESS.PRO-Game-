import { Chess } from "chess.js";
import { getBestMove, getMoveGrade } from "./engine";

self.onmessage = (e: MessageEvent) => {
  const { id, type, fen, depth, scoreBefore, isWhite } = e.data;

  if (type === "getBestMove") {
    const game = new Chess(fen);
    const result = getBestMove(game, depth);
    self.postMessage({ id, type: "bestMoveResult", result });
  } else if (type === "getGrade") {
    const game = new Chess(fen);
    const scoreAfter = getBestMove(game, depth).score;
    const grade = getMoveGrade(scoreBefore, scoreAfter, isWhite);
    self.postMessage({ id, type: "gradeResult", result: grade });
  }
};

import EngineWorker from './engine.worker?worker';
import { Chess } from 'chess.js';

class WorkerPool {
  private workers: { worker: Worker; busy: boolean }[] = [];
  private queue: { task: any; resolve: (val: any) => void }[] = [];
  private messageId = 0;
  private callbacks = new Map<number, (data: any) => void>();
  private poolSize: number;

  constructor() {
    this.poolSize = Math.max(4, typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4);
  }

  private init() {
    if (this.workers.length > 0) return;
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new EngineWorker();
      worker.onmessage = (e) => {
        const { id, result } = e.data;
        if (this.callbacks.has(id)) {
          this.callbacks.get(id)!(result);
          this.callbacks.delete(id);
        }
        
        const workerEntry = this.workers.find(w => w.worker === worker);
        if (workerEntry) {
          workerEntry.busy = false;
        }
        this.processQueue();
      };
      this.workers.push({ worker, busy: false });
    }
  }

  public runTask(type: string, data: any): Promise<any> {
    this.init();
    return new Promise((resolve) => {
      const id = this.messageId++;
      this.callbacks.set(id, resolve);
      this.queue.push({ task: { id, type, ...data }, resolve });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.queue.length === 0) return;
    const idleWorker = this.workers.find(w => !w.busy);
    if (!idleWorker) return;

    const { task } = this.queue.shift()!;
    idleWorker.busy = true;
    idleWorker.worker.postMessage(task);
  }
}

const pool = new WorkerPool();

export function asyncGetBestMove(fen: string, depth: number, useAIWorker: boolean = false): Promise<{ move: string; score: number }> {
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true });
  
  if (moves.length === 0) {
    return Promise.resolve({ move: "", score: 0 });
  }

  // If depth is extremely low or only 1 move is available, sequential search on a single worker is faster than parallel overhead
  if (depth <= 1 || moves.length === 1) {
    return pool.runTask('getBestMove', { fen, depth });
  }

  // Sort moves like in getBestMove for better parallel performance
  moves.sort((a, b) => {
    let scoreA = a.captured ? 10 : 0;
    let scoreB = b.captured ? 10 : 0;
    if (a.promotion) scoreA += 5;
    if (b.promotion) scoreB += 5;
    return scoreB - scoreA;
  });

  const rootIsWhite = game.turn() === 'w';

  // Run searches for each move's child position in parallel!
  const promises = moves.map(async (move) => {
    const childGame = new Chess(fen);
    childGame.move(move.san);
    const isMaximizing = childGame.turn() === 'w';
    
    // Evaluate the child position at depth - 1
    const score = await pool.runTask('evaluatePosition', {
      fen: childGame.fen(),
      depth: depth - 1,
      alpha: -Infinity,
      beta: Infinity,
      isMaximizingPlayer: isMaximizing
    });
    
    return { move: move.san, score };
  });

  return Promise.all(promises).then((results) => {
    let best = results[0];
    for (const res of results) {
      if (rootIsWhite) {
        if (res.score > best.score) {
          best = res;
        }
      } else {
        if (res.score < best.score) {
          best = res;
        }
      }
    }
    return best;
  });
}

// Keep signature for compatibility
export function asyncGetGrade(fen: string, depth: number, scoreBefore: number, isWhite: boolean): Promise<string> {
  return pool.runTask('getGrade', { fen, depth, scoreBefore, isWhite });
}

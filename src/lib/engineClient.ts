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

export function asyncGetBestMove(fen: string, depth: number, useAIWorker: boolean = false): Promise<{ move: string; score: number; allEvaluations?: { move: string; score: number }[] }> {
  return pool.runTask('getBestMove', { fen, depth }).then((res) => {
    return {
      move: res.move,
      score: res.score,
      allEvaluations: res.allEvaluations
    };
  });
}

// Keep signature for compatibility
export function asyncGetGrade(fen: string, depth: number, scoreBefore: number, isWhite: boolean): Promise<string> {
  return pool.runTask('getGrade', { fen, depth, scoreBefore, isWhite });
}

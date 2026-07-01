import EngineWorker from './engine.worker?worker';
import { Chess } from 'chess.js';

class WorkerPool {
  private workers: { worker: Worker; busy: boolean }[] = [];
  private queue: { task: any; resolve: (val: any) => void }[] = [];
  private messageId = 0;
  private poolSize: number;

  constructor(size?: number) {
    this.poolSize = size || Math.max(2, typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4);
  }

  private init() {
    if (this.workers.length > 0) return;
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new EngineWorker();
      worker.onmessage = (e) => {
        const { id, result } = e.data;
        // Find the resolve callback from the task queue that was matched to this id
        // Wait, we need a callbacks map
        this.processMessage(id, result, worker);
      };
      this.workers.push({ worker, busy: false });
    }
  }

  private callbacks = new Map<number, (data: any) => void>();

  private processMessage(id: number, result: any, worker: Worker) {
    if (this.callbacks.has(id)) {
      this.callbacks.get(id)!(result);
      this.callbacks.delete(id);
    }
    
    const workerEntry = this.workers.find(w => w.worker === worker);
    if (workerEntry) {
      workerEntry.busy = false;
    }
    this.processQueue();
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

// Separate pools for AI Bot and Background Grading to avoid blocking each other
const aiPool = new WorkerPool(2); 
const gradingPool = new WorkerPool(Math.max(2, (typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4) - 2));

export function asyncGetBestMove(fen: string, depth: number, useAIWorker: boolean = false): Promise<{ move: string; score: number; allEvaluations?: { move: string; score: number }[] }> {
  const pool = useAIWorker ? aiPool : gradingPool;
  
  // Directly run standard getBestMove which utilizes proper alpha-beta pruning
  // This is much faster than parallelizing without root alpha-beta sharing
  return pool.runTask('getBestMove', { fen, depth }).then((res) => ({
    move: res.move,
    score: res.score,
    allEvaluations: res.allEvaluations
  }));
}

// Keep signature for compatibility
export function asyncGetGrade(fen: string, depth: number, scoreBefore: number, isWhite: boolean): Promise<string> {
  return gradingPool.runTask('getGrade', { fen, depth, scoreBefore, isWhite });
}

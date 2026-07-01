import EngineWorker from './engine.worker?worker';

let worker: Worker;
let messageId = 0;
const callbacks = new Map<number, (data: any) => void>();

export function getEngineWorker() {
  if (!worker) {
    worker = new EngineWorker();
    worker.onmessage = (e) => {
      const { id, type, result } = e.data;
      if (callbacks.has(id)) {
        callbacks.get(id)!(result);
        callbacks.delete(id);
      }
    };
  }
  return worker;
}

export function asyncGetBestMove(fen: string, depth: number): Promise<{ move: string; score: number }> {
  return new Promise((resolve) => {
    const id = messageId++;
    callbacks.set(id, resolve);
    getEngineWorker().postMessage({ id, type: 'getBestMove', fen, depth });
  });
}

export function asyncGetGrade(fen: string, depth: number, scoreBefore: number, isWhite: boolean): Promise<string> {
  return new Promise((resolve) => {
    const id = messageId++;
    callbacks.set(id, resolve);
    getEngineWorker().postMessage({ id, type: 'getGrade', fen, depth, scoreBefore, isWhite });
  });
}

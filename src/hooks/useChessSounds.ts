import { useEffect, useCallback, useState } from 'react';

export function useChessSounds(enabled: boolean) {
  const [sounds, setSounds] = useState<{
    move: HTMLAudioElement;
    capture: HTMLAudioElement;
    checkmate: HTMLAudioElement;
  } | null>(null);

  useEffect(() => {
    setSounds({
      move: new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3"),
      capture: new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3"),
      checkmate: new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3")
    });
  }, []);

  const playMove = useCallback(() => {
    if (enabled && sounds?.move) {
      sounds.move.currentTime = 0;
      sounds.move.play().catch(() => {});
    }
  }, [enabled, sounds]);

  const playCapture = useCallback(() => {
    if (enabled && sounds?.capture) {
      sounds.capture.currentTime = 0;
      sounds.capture.play().catch(() => {});
    }
  }, [enabled, sounds]);

  const playCheckmate = useCallback(() => {
    if (enabled && sounds?.checkmate) {
      sounds.checkmate.currentTime = 0;
      sounds.checkmate.play().catch(() => {});
    }
  }, [enabled, sounds]);

  return { playMove, playCapture, playCheckmate };
}

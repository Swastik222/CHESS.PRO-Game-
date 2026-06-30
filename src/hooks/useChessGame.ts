import { useState, useEffect, useCallback, useRef } from "react";
import { Chess, Move } from "chess.js";
import { io, Socket } from "socket.io-client";
import { CryptoManager } from "../lib/crypto";
import { getBestMove, getMoveGrade, calculateAccuracy } from "../lib/engine";

export type GameMode = "ai" | "local" | "online" | "puzzle";

interface PlayerInfo {
  username: string;
  isGuest: boolean;
}

export interface MoveHistory {
  san: string;
  grade: string;
}

export function useChessGame(mode: GameMode, user: PlayerInfo | null, roomId?: string, aiLevel: number = 2) {
  const [game, setGame] = useState(new Chess());
  const [socket, setSocket] = useState<Socket | null>(null);
  const [opponent, setOpponent] = useState<string | null>(mode === "ai" ? "AI Master" : null);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [messages, setMessages] = useState<{ sender: string; text: string; id: string }[]>([]);
  const [history, setHistory] = useState<MoveHistory[]>([]);
  
  // Timers
  const [wTime, setWTime] = useState(600); // 10 mins
  const [bTime, setBTime] = useState(600);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cryptoManagerRef = useRef<CryptoManager>(new CryptoManager());
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [resignedBy, setResignedBy] = useState<string | null>(null);

  // Initialize socket for online/local
  useEffect(() => {
    if (mode === "online" || mode === "local") {
      const newSocket = io();
      setSocket(newSocket);

      newSocket.on("connect", () => {
        if (roomId && user) {
          newSocket.emit("join_room", roomId, user.username);
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [mode, roomId, user]);

  // Handle Socket Events
  useEffect(() => {
    if (!socket || !user) return;

    socket.on("room_state", (roomData) => {
      // Determine color based on join order
      if (roomData.players[0] === user.username) {
        setPlayerColor("w");
        setOpponent(roomData.players[1] || null);
      } else {
        setPlayerColor("b");
        setOpponent(roomData.players[0] || null);
      }
      
      const newGame = new Chess();
      if (roomData.fen && roomData.fen !== "start") {
         newGame.load(roomData.fen);
      }
      setGame(newGame);
      setHistory(roomData.history || []);
    });

    socket.on("user_joined", async (username: string) => {
      setOpponent(username);
      if (Notification.permission === "granted" && document.hidden) {
        new Notification("Chess Masters", { body: `${username} joined the match!` });
      }
      
      // Initiate key exchange
      const pubKey = await cryptoManagerRef.current.generateKeyPair();
      const rawKey = await cryptoManagerRef.current.getPublicKeyRaw();
      socket.emit("public_key", roomId, { username: user.username, publicKey: rawKey });
    });

    socket.on("user_left", () => {
      setOpponent(null);
      setIsEncrypted(false);
    });

    socket.on("public_key", async (data: { username: string, publicKey: JsonWebKey }) => {
      // If we don't have a key pair yet, generate one and send ours back
      if (!cryptoManagerRef.current.getPublicKeyRaw().catch(()=>null)) {
         await cryptoManagerRef.current.generateKeyPair();
         const rawKey = await cryptoManagerRef.current.getPublicKeyRaw();
         socket.emit("public_key", roomId, { username: user.username, publicKey: rawKey });
      }
      
      await cryptoManagerRef.current.deriveSharedSecret(data.publicKey);
      setIsEncrypted(true);
    });

    socket.on("move", (moveData: { fen: string, move: any }) => {
      const newGame = new Chess(moveData.fen);
      setGame(newGame);
      setHistory(prev => [...prev, typeof moveData.move === 'string' ? { san: moveData.move, grade: '' } : moveData.move]);
    });

    socket.on("chat_message", async (msg: { sender: string; payload: any, id: string }) => {
       try {
          const text = isEncrypted 
            ? await cryptoManagerRef.current.decrypt(msg.payload)
            : msg.payload.text; // fallback
          setMessages(prev => [...prev, { sender: msg.sender, text, id: msg.id }]);
          
          if (Notification.permission === "granted" && document.hidden) {
            new Notification("Chess Masters Chat", { body: `${msg.sender}: ${text}` });
          }
       } catch (e) {
          console.error("Failed to decrypt message");
       }
    });

    socket.on("undo_request", () => {
       // Auto accept for simplicity, or could prompt user
       if (window.confirm(`${opponent} requested an undo. Accept?`)) {
          const newGame = new Chess(game.fen());
          newGame.undo();
          newGame.undo(); // undo both turns if needed, or just one
          const newFen = newGame.fen();
          socket.emit("undo_accept", roomId, newFen);
       } else {
          socket.emit("undo_reject", roomId);
       }
    });

    socket.on("undo_accepted", (newFen: string) => {
        const newGame = new Chess(newFen);
        setGame(newGame);
        setHistory(prev => prev.slice(0, -1)); // approx
    });

    socket.on("resign", (color: string) => {
       setResignedBy(color);
    });

    return () => {
      socket.off("room_state");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("public_key");
      socket.off("move");
      socket.off("chat_message");
      socket.off("undo_request");
      socket.off("undo_accepted");
      socket.off("resign");
    };
  }, [socket, roomId, user, game, opponent, isEncrypted]);

  // Timers
  useEffect(() => {
    if (game.isGameOver() || (mode !== "ai" && !opponent)) return;

    timerRef.current = setInterval(() => {
      if (game.turn() === "w") {
        setWTime(t => Math.max(0, t - 1));
      } else {
        setBTime(t => Math.max(0, t - 1));
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [game, opponent, mode]);

  const makeMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
    const possibleMoves = game.moves({ verbose: true });
    
    // check if move is valid
    const isMoveValid = possibleMoves.some(
      (m: any) => m.from === move.from && m.to === move.to
    );

    if (!isMoveValid) return false;

    // ensure it's our turn
    if (mode === "online" || mode === "local") {
       if (game.turn() !== playerColor) return false;
    }

    try {
      let scoreBefore = getBestMove(game, 2).score;

      const newGame = new Chess(game.fen());
      const result = newGame.move(move);
      
      if (result) {
        let grade = "";
        const scoreAfter = getBestMove(newGame, 1).score;
        grade = getMoveGrade(scoreBefore, scoreAfter, game.turn() === 'w');

        setGame(newGame);
        setHistory(prev => [...prev, { san: result.san, grade }]);

        if (socket && roomId) {
          socket.emit("move", roomId, { fen: newGame.fen(), move: { san: result.san, grade } });
          
          if (newGame.isGameOver()) {
            let winner = null;
            if (newGame.isCheckmate()) {
               winner = newGame.turn() === "w" ? "b" : "w";
            }
            socket.emit("match_end", {
               winner: winner === playerColor ? user?.username : opponent,
               loser: winner !== playerColor ? user?.username : opponent,
               isDraw: newGame.isDraw()
            });
          }
        } else if (mode === "ai" && newGame.turn() === "b" && !newGame.isGameOver()) {
            // AI Move
            setTimeout(() => {
                const aiGame = new Chess(newGame.fen());
                
                const aiScoreBefore = getBestMove(aiGame, 2).score;
                
                // Depth 3 for better AI, Depth 1 or 2 for easier
                const aiMoveInfo = getBestMove(aiGame, aiLevel);
                aiGame.move(aiMoveInfo.move);
                
                const aiScoreAfter = getBestMove(aiGame, 1).score;
                const aiGrade = getMoveGrade(aiScoreBefore, aiScoreAfter, false);
                
                setGame(aiGame);
                setHistory(prev => [...prev, { san: aiMoveInfo.move, grade: aiGrade }]);
            }, 500);
        }
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [game, mode, playerColor, socket, roomId, user, opponent]);

  const requestUndo = useCallback(() => {
     if (mode === "ai") {
        const newGame = new Chess(game.fen());
        newGame.undo(); // undo AI move
        newGame.undo(); // undo our move
        setGame(newGame);
        setHistory(prev => prev.slice(0, -2));
     } else if (socket && roomId) {
        socket.emit("undo_request", roomId);
     }
  }, [game, mode, socket, roomId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!user) return;
    const msgId = Math.random().toString(36).substr(2, 9);
    
    // Optimistic update
    setMessages(prev => [...prev, { sender: user.username, text, id: msgId }]);

    if (socket && roomId) {
       let payload;
       if (isEncrypted) {
         payload = await cryptoManagerRef.current.encrypt(text);
       } else {
         payload = { text }; // unencrypted fallback if key exchange failed
       }
       socket.emit("chat_message", roomId, { sender: user.username, payload, id: msgId });
    }
  }, [user, socket, roomId, isEncrypted]);

  const resignMatch = useCallback(() => {
    const currentTurn = mode === "local" ? game.turn() : playerColor;
    setResignedBy(currentTurn);
    if (socket && roomId) {
      socket.emit("resign", roomId, currentTurn);
      socket.emit("match_end", {
        winner: opponent,
        loser: user?.username,
        isDraw: false
      });
    }
  }, [socket, roomId, playerColor, opponent, user, mode, game]);

  return {
    game,
    opponent,
    playerColor,
    wTime,
    bTime,
    messages,
    history,
    isEncrypted,
    resignedBy,
    makeMove,
    requestUndo,
    sendMessage,
    resignMatch
  };
}

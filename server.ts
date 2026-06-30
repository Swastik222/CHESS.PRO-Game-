import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" },
  });
  const PORT = 3000;

  app.use(express.json());

  // In-memory data for leaderboard and active rooms
  const leaderboard = new Map<string, { username: string; wins: number; rating: number }>();
  // initial mock data
  leaderboard.set("guest_1", { username: "GrandmasterFlash", wins: 15, rating: 1850 });
  leaderboard.set("guest_2", { username: "ChessWizard", wins: 12, rating: 1720 });
  
  const rooms = new Map<string, { players: string[]; fen: string; history: any[] }>();

  app.get("/api/leaderboard", (req, res) => {
    const sorted = Array.from(leaderboard.values()).sort((a, b) => b.rating - a.rating);
    res.json(sorted);
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_room", (roomId: string, username: string) => {
      socket.join(roomId);
      const room = rooms.get(roomId) || { players: [], fen: "start", history: [] };
      if (!room.players.includes(username)) {
        room.players.push(username);
        if (room.players.length === 2 && room.fen === "start") {
           if (Math.random() > 0.5) {
             room.players.reverse();
           }
        }
      }
      rooms.set(roomId, room);
      io.to(roomId).emit("room_state", room);
      socket.broadcast.to(roomId).emit("user_joined", username);
    });

    socket.on("leave_room", (roomId: string, username: string) => {
      socket.leave(roomId);
      const room = rooms.get(roomId);
      if (room) {
        room.players = room.players.filter(p => p !== username);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit("room_state", room);
        }
      }
      socket.broadcast.to(roomId).emit("user_left", username);
    });

    socket.on("move", (roomId: string, moveData: any) => {
      const room = rooms.get(roomId);
      if (room) {
        room.fen = moveData.fen;
        room.history.push(moveData.move);
        socket.broadcast.to(roomId).emit("move", moveData);
      }
    });

    socket.on("undo_request", (roomId: string) => {
      socket.broadcast.to(roomId).emit("undo_request");
    });

    socket.on("undo_accept", (roomId: string, newFen: string) => {
       const room = rooms.get(roomId);
       if (room) {
         room.fen = newFen;
         room.history.pop();
       }
       io.to(roomId).emit("undo_accepted", newFen);
    });

    socket.on("undo_reject", (roomId: string) => {
       socket.broadcast.to(roomId).emit("undo_rejected");
    });

    socket.on("chat_message", (roomId: string, message: any) => {
      // Message is expected to be encrypted client-side
      socket.broadcast.to(roomId).emit("chat_message", message);
    });

    socket.on("resign", (roomId: string, color: string) => {
       socket.broadcast.to(roomId).emit("resign", color);
    });

    // Web Crypto Public Key Exchange
    socket.on("public_key", (roomId: string, data: { username: string, publicKey: JsonWebKey }) => {
      socket.broadcast.to(roomId).emit("public_key", data);
    });

    socket.on("match_end", (data: { winner: string, loser: string, isDraw: boolean }) => {
      if (!data.isDraw && data.winner) {
        // Update leaderboard
        const winnerId = data.winner;
        let pInfo = leaderboard.get(winnerId) || { username: data.winner, wins: 0, rating: 1200 };
        pInfo.wins += 1;
        pInfo.rating += 25;
        leaderboard.set(winnerId, pInfo);

        if (data.loser) {
            let lInfo = leaderboard.get(data.loser) || { username: data.loser, wins: 0, rating: 1200 };
            lInfo.rating = Math.max(100, lInfo.rating - 15);
            leaderboard.set(data.loser, lInfo);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

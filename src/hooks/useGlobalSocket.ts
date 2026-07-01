import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let globalSocket: Socket | null = null;

export function useGlobalSocket(user: any, onChallengeReceived: (data: any) => void, onChallengeAccepted: (roomId: string) => void, onChallengeRejected: () => void, onDirectMessage: (data: any) => void) {
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; username: string }[]>([]);

  useEffect(() => {
    if (!user) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
      return;
    }

    if (!globalSocket) {
      const port = window.location.port ? `:${window.location.port}` : '';
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      globalSocket = io(`${protocol}//${hostname}${port}`);
      
      globalSocket.on("connect", () => {
        globalSocket?.emit("register_global", { id: user.uid, username: user.username });
        globalSocket?.emit("get_online_users");
      });

      globalSocket.on("online_users_update", (users: { id: string; username: string }[]) => {
        setOnlineUsers(users.filter(u => u.id !== user.uid)); // Exclude self
      });

      globalSocket.on("challenge_received", (data) => {
        onChallengeReceived(data);
      });

      globalSocket.on("challenge_accepted_by_target", (roomId) => {
        onChallengeAccepted(roomId);
      });

      globalSocket.on("challenge_rejected_by_target", () => {
        onChallengeRejected();
      });

      globalSocket.on("direct_message_received", (data) => {
        onDirectMessage(data);
      });
    }

    return () => {
      // We don't necessarily disconnect here if we want to keep it alive across renders
      // But we should clean up listeners to avoid duplicates
      if (globalSocket) {
        globalSocket.off("online_users_update");
        globalSocket.off("challenge_received");
        globalSocket.off("challenge_accepted_by_target");
        globalSocket.off("challenge_rejected_by_target");
        globalSocket.off("direct_message_received");
      }
    };
  }, [user]);

  // Re-attach listeners when dependencies change
  useEffect(() => {
    if (globalSocket && user) {
      const handleOnlineUsersUpdate = (users: { id: string; username: string }[]) => {
        setOnlineUsers(users.filter(u => u.id !== user.uid));
      };
      globalSocket.on("online_users_update", handleOnlineUsersUpdate);
      globalSocket.on("challenge_received", onChallengeReceived);
      globalSocket.on("challenge_accepted_by_target", onChallengeAccepted);
      globalSocket.on("challenge_rejected_by_target", onChallengeRejected);
      globalSocket.on("direct_message_received", onDirectMessage);

      // Trigger fetch
      globalSocket.emit("get_online_users");

      return () => {
        globalSocket?.off("online_users_update", handleOnlineUsersUpdate);
        globalSocket?.off("challenge_received", onChallengeReceived);
        globalSocket?.off("challenge_accepted_by_target", onChallengeAccepted);
        globalSocket?.off("challenge_rejected_by_target", onChallengeRejected);
        globalSocket?.off("direct_message_received", onDirectMessage);
      };
    }
  }, [user, onChallengeReceived, onChallengeAccepted, onChallengeRejected, onDirectMessage]);

  const sendChallenge = (targetId: string, roomId: string) => {
    if (globalSocket && user) {
      globalSocket.emit("send_challenge", {
        targetId,
        fromId: user.uid,
        fromUsername: user.username,
        roomId
      });
    }
  };

  const acceptChallenge = (fromId: string, roomId: string) => {
    if (globalSocket && user) {
      globalSocket.emit("challenge_accepted", { fromId, roomId });
    }
  };

  const rejectChallenge = (fromId: string) => {
    if (globalSocket && user) {
      globalSocket.emit("challenge_rejected", { fromId });
    }
  };

  const sendDirectMessage = (targetId: string, text: string) => {
    if (globalSocket && user) {
      globalSocket.emit("send_direct_message", {
        targetId,
        fromId: user.uid,
        fromUsername: user.username,
        text
      });
    }
  };

  return { onlineUsers, sendChallenge, acceptChallenge, rejectChallenge, sendDirectMessage };
}

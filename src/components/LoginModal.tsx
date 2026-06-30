import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { X, LogIn, UserCircle } from "lucide-react";

export function LoginModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || "Player",
          isGuest: false,
          rating: 1200,
          gamesPlayed: 0,
          gamesWon: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      const result = await signInAnonymously(auth);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: `Guest_${user.uid.substring(0, 5)}`,
          isGuest: true,
          rating: 1000,
          gamesPlayed: 0,
          gamesWon: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-white/20 dark:border-white/10">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Login</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1d1d20] text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}
          
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
          
          <div className="flex items-center gap-3 my-2 text-gray-400">
            <div className="h-px flex-1 bg-gray-200 dark:bg-[#2a2a2c]"></div>
            <span className="text-xs uppercase font-medium">Or</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-[#2a2a2c]"></div>
          </div>
          
          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-[#1d1d20] hover:bg-gray-200 dark:hover:bg-[#2a2a2c] border border-gray-200 dark:border-[#3a3a3d] text-gray-900 dark:text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            <UserCircle className="w-5 h-5" />
            Play as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

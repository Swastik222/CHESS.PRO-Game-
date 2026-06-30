import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, collection, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export async function saveMatchResult(
  userId: string,
  opponent: string,
  mode: string,
  result: "win" | "loss" | "draw"
) {
  try {
    const userRef = doc(db, "users", userId);
    
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) return;

      const data = userDoc.data();
      const currentGamesPlayed = data.gamesPlayed || 0;
      const currentGamesWon = data.gamesWon || 0;
      const currentRating = data.rating || 1200;

      let newRating = currentRating;
      let ratingChange = 0;
      if (result === "win") ratingChange = 15;
      else if (result === "loss") ratingChange = -15;

      newRating += ratingChange;

      transaction.update(userRef, {
        gamesPlayed: currentGamesPlayed + 1,
        gamesWon: currentGamesWon + (result === "win" ? 1 : 0),
        rating: Math.max(0, newRating),
        updatedAt: serverTimestamp(),
      });
    });

    const matchRef = doc(collection(db, "users", userId, "matches"));
    await setDoc(matchRef, {
      opponent: opponent || "Unknown",
      mode,
      result,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to save match result:", error);
  }
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Update user presence
        const userRef = doc(db, "users", currentUser.uid);
        const updatePresence = async () => {
          try {
            await setDoc(userRef, {
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || "User",
              photoURL: currentUser.photoURL,
              email: currentUser.email,
              lastSeen: serverTimestamp(),
              isOnline: true,
            }, { merge: true });
          } catch (error) {
            console.error("Error updating presence:", error);
          }
        };

        // Initial update
        updatePresence();

        // Periodic heartbeat (every 2 minutes)
        const intervalId = setInterval(updatePresence, 2 * 60 * 1000);

        return () => clearInterval(intervalId);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading ? (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
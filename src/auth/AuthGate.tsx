import { useState } from "react";
import { currentUser, type AppUser } from "@/auth/auth";
import Login from "@/pages/Login";

// Blocks the whole app (including ProgressProvider, which opens the
// per-user IndexedDB on mount) until a user is signed in.
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(currentUser());
  if (!user) return <Login onLogin={setUser} />;
  return <>{children}</>;
}

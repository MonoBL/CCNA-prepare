import { useState } from "react";
import { Lock, User as UserIcon } from "lucide-react";
import { USERS, login, type AppUser } from "@/auth/auth";

interface Props {
  onLogin: (user: AppUser) => void;
}

export default function Login({ onLogin }: Props) {
  const [selected, setSelected] = useState<string>(USERS[0].id);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const user = await login(selected, password);
    setBusy(false);
    if (user) {
      onLogin(user);
    } else {
      setError("Wrong password. Try again.");
      setPassword("");
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">CCNA 200-301 Trainer</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to load your own progress.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Choose user">
            {USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                role="radio"
                aria-checked={selected === u.id}
                onClick={() => {
                  setSelected(u.id);
                  setError(null);
                }}
                className={`flex flex-col items-center gap-2 rounded-lg border px-4 py-5 text-sm transition-colors ${
                  selected === u.id
                    ? "border-accent bg-surface text-slate-100"
                    : "border-slate-700 bg-surface text-slate-400 hover:border-slate-500"
                }`}
              >
                <UserIcon size={24} className={selected === u.id ? "text-accent" : ""} />
                <span className="font-medium">{u.displayName}</span>
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              <Lock size={12} /> Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-700 bg-surface px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-accent"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-700/50 bg-red-900/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || password.length === 0}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-slate-900 transition-opacity disabled:opacity-50"
          >
            {busy ? "Checking..." : `Sign in as ${USERS.find((u) => u.id === selected)?.displayName}`}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600">
          Progress is stored locally per user in this browser. Nothing is sent to any server.
        </p>
      </div>
    </div>
  );
}

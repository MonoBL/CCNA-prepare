import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bookmark, Trash2, PlayCircle } from "lucide-react";
import { getFavorites, toggleFavorite, isFav } from "@/lib/favorites";
import { getQuestion } from "@/data/content";
import { getDomain } from "@/data/content";
import type { Question } from "@/types";

export default function Favorites() {
  const navigate = useNavigate();
  const [favIds, setFavIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFavorites().then((ids) => { setFavIds(ids); setLoading(false); });
  }, []);

  const questions = favIds.map((id) => getQuestion(id)).filter(Boolean) as Question[];

  async function remove(qid: string) {
    const next = await toggleFavorite(qid);
    setFavIds(next);
  }

  async function clearAll() {
    for (const id of favIds) await toggleFavorite(id);
    setFavIds([]);
  }

  function startPractice() {
    navigate("/practice/run", {
      state: { questions: questions.sort(() => Math.random() - 0.5), mode: "practice" }
    });
  }

  if (loading) return <div className="p-6 text-slate-400">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <section className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark size={20} className="text-yellow-400 fill-yellow-400" />
            <h1 className="text-2xl font-semibold">Saved Questions</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {questions.length} question{questions.length !== 1 ? "s" : ""} bookmarked for later review.
          </p>
        </div>
        {questions.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-red-700 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} /> Clear all
          </button>
        )}
      </section>

      {questions.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-surface p-8 text-center">
          <Bookmark size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">No saved questions yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Tap the <span className="text-yellow-400">Save</span> button on any question while practising.
          </p>
          <Link
            to="/practice"
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            Start practising
          </Link>
        </div>
      ) : (
        <>
          <button
            onClick={startPractice}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            <PlayCircle size={18} />
            Practice all {questions.length} saved question{questions.length !== 1 ? "s" : ""}
          </button>

          <div className="space-y-2">
            {questions.map((q) => {
              const domain = getDomain(q.domain);
              return (
                <div
                  key={q.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-700 bg-surface px-4 py-3"
                >
                  <Bookmark size={14} className="mt-1 shrink-0 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 leading-snug">{q.stem}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded bg-slate-700 px-1.5 py-0.5">{q.subtopic}</span>
                      <span className="capitalize">{q.difficulty}</span>
                      <span>{domain?.name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(q.id)}
                    aria-label="Remove bookmark"
                    className="shrink-0 rounded p-1 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

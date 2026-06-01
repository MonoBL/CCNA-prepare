import { useState } from "react";
import { ExternalLink, GripHorizontal } from "lucide-react";
import type { Question, Answer } from "@/types";
import { correctIds } from "@/lib/grading";

interface Props {
  question: Question;
  answer: Answer;
  onChange: (a: Answer) => void;
  revealed: boolean;
  readOnly?: boolean;
}

function OptionRow({
  id,
  text,
  rationale,
  correct,
  selected,
  revealed,
  readOnly,
  onClick
}: {
  id: string;
  text: string;
  rationale: string;
  correct: boolean;
  selected: boolean;
  revealed: boolean;
  readOnly?: boolean;
  onClick: () => void;
}) {
  let bg = "border-slate-700 bg-surface";
  if (revealed) {
    if (correct) bg = "border-green-600 bg-green-900/30";
    else if (selected) bg = "border-red-600 bg-red-900/30";
    else bg = "border-slate-700 bg-surface opacity-60";
  } else if (selected) {
    bg = "border-accent bg-accent/10";
  }

  return (
    <div
      role={readOnly ? undefined : "button"}
      tabIndex={readOnly ? undefined : 0}
      onClick={readOnly || revealed ? undefined : onClick}
      onKeyDown={(e) => { if (!readOnly && !revealed && (e.key === "Enter" || e.key === " ")) onClick(); }}
      className={`rounded-lg border p-3 transition-colors ${bg} ${!readOnly && !revealed ? "cursor-pointer hover:border-slate-500" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${selected ? "border-accent bg-accent text-white" : "border-slate-500 text-slate-400"}`}>
          {id.toUpperCase()}
        </span>
        <span className="flex-1 text-sm">{text}</span>
        {revealed && (
          <span className="ml-2 shrink-0 text-lg">
            {correct ? "✓" : selected ? "✗" : ""}
          </span>
        )}
      </div>
      {revealed && (
        <p className="mt-2 pl-8 text-xs text-slate-400">{rationale}</p>
      )}
    </div>
  );
}

function DragDropQuestion({
  question,
  answer,
  onChange,
  revealed,
  readOnly
}: Props) {
  const [held, setHeld] = useState<string | null>(null);
  const mapping = answer.mapping ?? {};
  const zones = question.dropZones ?? [];
  const tokens = question.tokens ?? [];

  function assignToken(zoneId: string) {
    if (readOnly || revealed) return;
    if (held === null) return;
    const newMapping = { ...mapping, [zoneId]: held };
    onChange({ ...answer, mapping: newMapping });
    setHeld(null);
  }

  function clearZone(zoneId: string) {
    if (readOnly || revealed) return;
    const newMapping = { ...mapping };
    delete newMapping[zoneId];
    onChange({ ...answer, mapping: newMapping });
  }

  const usedTokens = new Set(Object.values(mapping));

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Tokens - click to select</p>
        <div className="flex flex-wrap gap-2">
          {tokens.map((t) => {
            const used = usedTokens.has(t.id);
            const selected = held === t.id;
            return (
              <button
                key={t.id}
                disabled={readOnly || revealed || (used && !selected)}
                onClick={() => setHeld(held === t.id ? null : t.id)}
                className={`flex items-center gap-1 rounded-md border px-3 py-1 text-sm transition-colors ${selected ? "border-accent bg-accent text-white" : used ? "border-slate-600 bg-slate-700 text-slate-500" : "border-slate-600 bg-surface text-slate-200 hover:border-slate-400"}`}
              >
                <GripHorizontal size={12} />
                {t.text}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Drop zones - click to assign</p>
        <div className="space-y-2">
          {zones.map((z) => {
            const assignedToken = mapping[z.id] ? tokens.find((t) => t.id === mapping[z.id]) : null;
            const isCorrect = revealed && mapping[z.id] === z.correctTokenId;
            const isWrong = revealed && mapping[z.id] && mapping[z.id] !== z.correctTokenId;
            const correctToken = revealed ? tokens.find((t) => t.id === z.correctTokenId) : null;

            let zoneCls = "border-slate-600 bg-surface/50";
            if (revealed) {
              zoneCls = isCorrect ? "border-green-600 bg-green-900/20" : isWrong ? "border-red-600 bg-red-900/20" : "border-slate-600 bg-surface/50 opacity-70";
            } else if (held !== null) {
              zoneCls = "border-accent/50 bg-accent/5 cursor-pointer hover:border-accent hover:bg-accent/10";
            }

            return (
              <div
                key={z.id}
                onClick={() => {
                  if (held !== null) assignToken(z.id);
                  else if (assignedToken && !readOnly && !revealed) clearZone(z.id);
                }}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${zoneCls}`}
              >
                <span className="text-sm text-slate-300">{z.label}</span>
                <span className="flex items-center gap-2">
                  {assignedToken ? (
                    <span className="rounded bg-slate-700 px-2 py-0.5 text-sm">{assignedToken.text}</span>
                  ) : (
                    <span className="text-xs text-slate-500">drop here</span>
                  )}
                  {revealed && (
                    <span className="text-lg">{isCorrect ? "✓" : isWrong ? "✗" : ""}</span>
                  )}
                </span>
              </div>
            );
          })}
          {revealed && (
            <div className="mt-2 rounded-lg border border-slate-700 bg-surface/50 p-3 text-xs text-slate-400">
              {zones.map((z) => {
                const correctToken = tokens.find((t) => t.id === z.correctTokenId);
                return (
                  <div key={z.id}>
                    <span className="text-slate-300">{z.label}</span> → <span className="text-green-400">{correctToken?.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuestionCard({ question, answer, onChange, revealed, readOnly }: Props) {
  const correct = correctIds(question);
  const options = question.options ?? [];

  function toggleOption(optionId: string) {
    if (question.type === "single") {
      onChange({ ...answer, selected: [optionId] });
    } else if (question.type === "multi") {
      const prev = answer.selected ?? [];
      const next = prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId];
      onChange({ ...answer, selected: next });
    }
  }

  const isSelected = (id: string) => (answer.selected ?? []).includes(id);

  return (
    <div className="space-y-4">
      {question.exhibit && (
        <pre className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-green-300">
          {question.exhibit}
        </pre>
      )}

      {question.image && (
        <img
          src={question.image}
          alt="Question exhibit"
          className="max-w-full rounded-lg border border-slate-700"
        />
      )}

      <p className="text-base leading-relaxed text-slate-100">{question.stem}</p>

      {(question.type === "single" || question.type === "multi") && (
        <div className="space-y-2">
          {question.type === "multi" && (
            <p className="text-xs text-slate-500">Select all that apply.</p>
          )}
          {options.map((opt) => (
            <OptionRow
              key={opt.id}
              id={opt.id}
              text={opt.text}
              rationale={opt.rationale}
              correct={opt.correct}
              selected={isSelected(opt.id)}
              revealed={revealed}
              readOnly={readOnly}
              onClick={() => toggleOption(opt.id)}
            />
          ))}
        </div>
      )}

      {question.type === "draganddrop" && (
        <DragDropQuestion
          question={question}
          answer={answer}
          onChange={onChange}
          revealed={revealed}
          readOnly={readOnly}
        />
      )}

      {revealed && (
        <div className="space-y-3 rounded-lg border border-slate-700 bg-surface p-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Explanation</p>
            <p className="text-sm text-slate-200">{question.explanation}</p>
          </div>
          {question.references.length > 0 && (
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">References</p>
              <ul className="space-y-1">
                {question.references.map((ref) => (
                  <li key={ref.url}>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      <ExternalLink size={11} />
                      {ref.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import type { ActionProposal, BrainMessage } from "@affiliate-ops/contracts";
import { FormEvent, useState } from "react";
import { agents } from "../data/agents";
import { askTeamBrain } from "../services/teamBrain";

interface ChatLine { id: string; author: string; content: string; proposal?: ActionProposal; decision?: "confirmed" | "rejected" }

export function TeamChatPanel() {
  const [agentId, setAgentId] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([{ id: "welcome", author: "Nova", content: "TeamBrain พร้อมแล้ว ถามเรื่องสินค้า ผลลัพธ์ คอนเทนต์ ลิงก์ หรือแผนการโพสต์ได้เลย" }]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    const userLine = { id: `user-${Date.now()}`, author: "You", content: message };
    setLines((current) => [...current, userLine]);
    setDraft("");
    setBusy(true);
    const recentMessages: BrainMessage[] = lines.slice(-6).map((line) => ({ id: line.id, role: line.author === "You" ? "user" : "assistant", content: line.content, createdAt: new Date().toISOString() }));
    try {
      const response = await askTeamBrain({ workspaceId: "pilot-workspace", conversationId: "browser-demo", ...(agentId ? { selectedAgentId: agentId } : {}), message, recentMessages });
      setLines((current) => [...current, { id: `assistant-${Date.now()}`, author: agents.find((agent) => agent.id === response.agentId)?.name ?? "Team", content: response.message, ...(response.type === "action_proposal" ? { proposal: response.proposal } : {}) }]);
    } catch (error) {
      const content = error instanceof Error ? error.message : "TeamBrain is temporarily unavailable";
      setLines((current) => [...current, { id: `error-${Date.now()}`, author: "System", content }]);
    } finally {
      setBusy(false);
    }
  }

  function decide(id: string, decision: "confirmed" | "rejected") {
    setLines((current) => current.map((line) => line.id === id ? { ...line, decision } : line));
  }

  return (
    <section className="team-chat card-surface">
      <div className="section-heading"><div><span className="eyebrow">TeamBrain</span><h2>Command the team</h2></div><span className="mock-badge">AI + safe fallback</span></div>
      <div className="chat-log" aria-live="polite">{lines.map((line) => <article className={`chat-line ${line.author === "You" ? "is-user" : ""}`} key={line.id}><b>{line.author}</b><p>{line.content}</p>{line.proposal && <div className="proposal-card"><small>{line.proposal.capability} · external action</small><strong>{line.proposal.title}</strong>{line.decision ? <em>{line.decision === "confirmed" ? "Confirmed in simulation only" : "Rejected"}</em> : <div><button type="button" onClick={() => decide(line.id, "confirmed")}>Confirm simulation</button><button type="button" onClick={() => decide(line.id, "rejected")}>Reject</button></div>}</div>}</article>)}</div>
      <form className="chat-composer" onSubmit={submit}>
        <select aria-label="Target agent" value={agentId} onChange={(event) => setAgentId(event.target.value)}>
          <option value="">Auto-route</option>
          {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.role}</option>)}
        </select>
        <textarea
          aria-label="Message to the team"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }}
          placeholder="Ask the team or prepare an action…"
          rows={3}
        />
        <button type="submit" disabled={busy}>{busy ? "Thinking…" : "Send"}</button>
      </form>
    </section>
  );
}

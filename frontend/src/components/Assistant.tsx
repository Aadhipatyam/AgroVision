import { useState, useRef, useEffect } from "react";
import type { CSSProperties } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";

type Mode = "verified" | "scheme" | "scheme_gap" | "weather" | "general" | "web" | "offtopic" | "chat";
type WebLink = { title: string; url: string };

type AskResponse = {
  answer: string;
  mode?: Mode;
  sources?: string[];
  links?: WebLink[];
};

type Message = {
  role: "user" | "assistant";
  text: string;
  mode?: Mode;
  sources?: string[];
  links?: WebLink[];
  error?: boolean;
};

export default function Assistant() {
  const { user } = useAuth();
  const region = user?.location ? `${user.location.district}, ${user.location.state}` : "";

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hello! Ask me anything about your crops." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const data = (await api.post("/assistant/ask", { question, region })) as unknown as AskResponse;
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.answer, mode: data.mode, sources: data.sources, links: data.links },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const text = /too many|limit/i.test(msg)
        ? msg
        : /token|authori[sz]|denied|jwt|expired/i.test(msg)
        ? "Your session has expired. Please log in again."
        : "Sorry, the assistant is unavailable right now. Please try again.";
      setMessages((m) => [...m, { role: "assistant", text, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.box}>
      <div style={styles.header}>AgroVision Assistant</div>

      <div style={styles.messages}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{ ...styles.row, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
          >
            <div
              style={{
                ...styles.bubble,
                ...(m.role === "user" ? styles.user : styles.bot),
                ...(m.error ? styles.err : {}),
              }}
            >
              {m.mode === "verified" && <div style={styles.badgeVerified}>✔ Verified from official sources</div>}
              {m.mode === "scheme" && (
                <div style={styles.badgeVerified}>📄 From official scheme documents. Rules change, confirm on the official portal</div>
              )}
              {m.mode === "scheme_gap" && (
                <div style={styles.badgeGeneral}>ℹ Not found in the official documents I have</div>
              )}
              {m.mode === "weather" && (
                <div style={styles.badgeWeb}>🌦 Based on live weather for your area</div>
              )}
              {m.mode === "web" && (
                <div style={styles.badgeWeb}>🌐 From ICAR / government websites. Please confirm with your KVK</div>
              )}
              {m.mode === "general" && (
                <div style={styles.badgeGeneral}>⚠ General guidance. Please confirm with your local KVK</div>
              )}

              <div>{m.text}</div>

              {(m.mode === "verified" || m.mode === "scheme" || m.mode === "weather") &&
                m.sources && m.sources.length > 0 && (
                  <div style={styles.sources}>Source: {m.sources.join(", ")}</div>
                )}

              {(m.mode === "web" || m.mode === "scheme" || m.mode === "scheme_gap") &&
                m.links && m.links.length > 0 && (
                  <div style={styles.sources}>
                    {m.mode === "web" ? "Sources:" : "Official portals:"}
                    {m.links.map((l, j) => (
                      <div key={j}>
                        <a href={l.url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                          {l.title.length > 70 ? l.title.slice(0, 70) + "…" : l.title}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        ))}
        {loading && <div style={styles.typing}>Thinking...</div>}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about crops, weather, schemes..."
          disabled={loading}
        />
        <button style={styles.button} onClick={send} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  box: { maxWidth: 560, margin: "0 auto", border: "1px solid #d0d7de", borderRadius: 12, display: "flex", flexDirection: "column", height: 560, background: "#fff", overflow: "hidden", fontFamily: "system-ui, sans-serif" },
  header: { padding: "12px 16px", background: "#2e7d32", color: "#fff", fontWeight: 600 },
  messages: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8, background: "#f6f8fa" },
  row: { display: "flex" },
  bubble: { maxWidth: "80%", padding: "10px 14px", borderRadius: 12, whiteSpace: "pre-wrap", lineHeight: 1.45, fontSize: 15 },
  user: { background: "#2e7d32", color: "#fff" },
  bot: { background: "#fff", color: "#1f2328", border: "1px solid #d0d7de" },
  err: { background: "#fff1f0", borderColor: "#ffa39e" },
  badgeVerified: { display: "inline-block", marginBottom: 6, padding: "2px 8px", borderRadius: 999, background: "#e6f4ea", color: "#1e6b2e", fontSize: 12, fontWeight: 600 },
  badgeWeb: { display: "inline-block", marginBottom: 6, padding: "2px 8px", borderRadius: 999, background: "#e3f0ff", color: "#0b4fa8", fontSize: 12, fontWeight: 600 },
  badgeGeneral: { display: "inline-block", marginBottom: 6, padding: "2px 8px", borderRadius: 999, background: "#fff4d6", color: "#8a5a00", fontSize: 12, fontWeight: 600 },
  sources: { marginTop: 8, fontSize: 12, color: "#656d76" },
  link: { color: "#0b4fa8", textDecoration: "underline", wordBreak: "break-word" },
  typing: { color: "#656d76", fontSize: 14, paddingLeft: 4 },
  inputRow: { display: "flex", gap: 8, padding: 12, borderTop: "1px solid #d0d7de", background: "#fff" },
  input: { flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #d0d7de", fontSize: 15 },
  button: { padding: "10px 18px", border: "none", borderRadius: 8, background: "#2e7d32", color: "#fff", fontWeight: 600, cursor: "pointer" },
};
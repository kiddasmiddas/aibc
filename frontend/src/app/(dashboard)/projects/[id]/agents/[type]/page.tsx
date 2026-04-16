"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSSE } from "@/lib/useSSE";
import { useAuthStore } from "@/stores/auth";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import Button from "@/components/ui/Button";
import AgentPreview from "@/components/preview/AgentPreview";
import type { ChatMessage, ChatHistoryResponse } from "@/types/chat";
import type { Project } from "@/types/project";
import type { GeneratedImage } from "@/lib/useSSE";

const AGENT_AVATARS: Record<string, string> = {
  web_developer: "\uD83D\uDC68\u200D\uD83D\uDCBB",
  designer: "\uD83D\uDC69\u200D\uD83C\uDFA8",
  crm_manager: "\uD83D\uDC68\u200D\uD83D\uDCBC",
  support: "\uD83D\uDC69\u200D\uD83D\uDD27",
  marketer: "\uD83D\uDC69\u200D\uD83D\uDCBB",
  seo: "\uD83D\uDD75\uFE0F",
  analyst: "\uD83D\uDC68\u200D\uD83D\uDD2C",
};

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isDesktop;
}

export default function AgentChatPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, fetchMe } = useAuthStore();
  const isDesktop = useIsDesktop();

  const projectId = params.id as string;
  const agentType = params.type as string;

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [models, setModels] = useState<{ id: string; name: string; provider: string; description: string }[]>([]);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");
  const [splitPercent, setSplitPercent] = useState(55);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const { streamingContent, isStreaming, generatedImages, sendMessage } = useSSE();
  const [projectImages, setProjectImages] = useState<GeneratedImage[]>([]);
  const agentInfo = project?.agents.find((a) => a.agent_type === agentType);

  const loadImages = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/files/images?token=${token}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) setProjectImages(json.data);
      }
    } catch { /* ignore */ }
  }, [projectId]);

  const loadData = useCallback(async () => {
    const [projRes, histRes, modelsRes] = await Promise.all([
      api.get<Project>(`/projects/${projectId}`),
      api.get<ChatHistoryResponse>(`/projects/${projectId}/agents/${agentType}/chat?limit=50&offset=0`),
      api.get<{ id: string; name: string; provider: string; description: string }[]>(`/models?agent_type=${agentType}`),
    ]);
    if (projRes.data) {
      setProject(projRes.data);
      const agent = projRes.data.agents.find((a) => a.agent_type === agentType);
      if (agent) setTaskCompleted(agent.task_completed);
    }
    if (histRes.data) setMessages(histRes.data.messages);
    if (modelsRes.data) setModels(modelsRes.data);
    if (agentType === "designer") await loadImages();
    setLoading(false);
  }, [projectId, agentType, loadImages]);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push("/login"); return; }
    if (!authLoading && isAuthenticated) { loadData(); }
  }, [authLoading, isAuthenticated, router, loadData]);

  // Resizable divider drag — only active while mouse is held down
  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(Math.max(pct, 30), 75));
    };
    const onUp = () => {
      dragging.current = false;
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const handleSend = async (content: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), agent_type: agentType, role: "user", content, metadata_: null, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const result = await sendMessage(`/projects/${projectId}/agents/${agentType}/chat`, content, selectedModel || undefined);
      if (result.content) {
        const assistantMsg: ChatMessage = { id: crypto.randomUUID(), agent_type: agentType, role: "assistant", content: result.content, metadata_: result.metadata?.error ? { limit_exceeded: true } : null, created_at: new Date().toISOString() };
        setMessages((prev) => [...prev, assistantMsg]);
        if (result.metadata?.site_updated) setIframeKey((k) => k + 1);
        if (result.images?.length > 0) setProjectImages((prev) => [...prev, ...result.images]);
        fetchMe();
      }
    } catch {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), agent_type: agentType, role: "assistant", content: "Произошла ошибка. Попробуйте ещё раз.", metadata_: null, created_at: new Date().toISOString() }]);
    }
  };

  const handleComplete = async () => { setCompleting(true); await api.patch(`/projects/${projectId}/agents/${agentType}/complete`, {}); setTaskCompleted(true); setCompleting(false); };

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gradient-soft">
        <div className="flex items-center gap-3 text-foreground/40">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!project || !agentInfo) {
    return (<div className="flex flex-1 items-center justify-center bg-gradient-soft"><p className="text-foreground/50">Агент не найден</p></div>);
  }

  const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
  const siteUrl = `/api/v1/projects/${projectId}/site?token=${accessToken ?? ""}`;

  const showChat = isDesktop || mobileView === "chat";
  const showPreview = isDesktop || mobileView === "preview";

  return (
    <div className="flex h-full flex-col bg-gradient-soft">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border bg-white px-4 lg:px-6 py-2.5 flex-shrink-0">
        <button onClick={() => router.push(`/projects/${projectId}`)} className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/40 hover:text-foreground hover:bg-muted transition-all flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12L6 8L10 4" /></svg>
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-xl flex-shrink-0">
          {AGENT_AVATARS[agentType] ?? "\uD83E\uDDD1\u200D\uD83D\uDCBC"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground text-sm truncate">{agentInfo.name}</h1>
          <p className="text-xs text-foreground/40 truncate">{project.name}</p>
        </div>

        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="hidden sm:block rounded-btn border border-border bg-white px-3 py-1.5 text-xs text-foreground/60 outline-none focus:border-accent transition-colors">
          <option value="">По умолчанию</option>
          {models.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
        </select>

        {taskCompleted ? (
          <span className="flex items-center gap-1 rounded-btn bg-green-50 border border-green-200 px-2.5 py-1.5 text-xs font-medium text-green-700 flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="10 3 4.5 8.5 2 6" /></svg>
            <span className="hidden sm:inline">Выполнено</span>
          </span>
        ) : (
          <Button size="sm" onClick={handleComplete} disabled={completing} className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0">
            {completing ? "..." : "\u2714 Завершить"}
          </Button>
        )}

        {/* Mobile toggle: chat <-> preview */}
        <button
          onClick={() => setMobileView(mobileView === "chat" ? "preview" : "chat")}
          className="lg:hidden flex h-9 items-center gap-1.5 rounded-btn bg-accent text-white px-4 text-sm font-medium hover:bg-accent-hover transition-all flex-shrink-0 shadow-sm"
        >
          {mobileView === "chat" ? (
            <>
              <span>{agentType === "designer" ? "Галерея" : "Сайт"}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3L9 7L5 11" /></svg>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11L5 7L9 3" /></svg>
              <span>Чат</span>
            </>
          )}
        </button>
      </div>

      {/* Split content */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Chat */}
        {showChat && (
          <div className="flex flex-col overflow-hidden" style={{ width: isDesktop ? `${splitPercent}%` : "100%" }}>
            <ChatWindow messages={messages} streamingContent={streamingContent} isStreaming={isStreaming} agentName={agentInfo.name} />
            <ChatInput onSend={handleSend} disabled={isStreaming} />
          </div>
        )}

        {/* Resizable divider — desktop only */}
        {isDesktop && (
          <div onMouseDown={startDrag} className="flex w-1.5 cursor-col-resize items-center justify-center bg-border/30 hover:bg-accent/20 active:bg-accent/30 transition-colors group flex-shrink-0">
            <div className="h-8 w-1 rounded-full bg-foreground/15 group-hover:bg-accent/40 transition-colors" />
          </div>
        )}

        {/* Preview panel */}
        {showPreview && (
          <div className="flex flex-col overflow-hidden" style={{ width: isDesktop ? `${100 - splitPercent}%` : "100%" }}>
            <AgentPreview
              agentType={agentType}
              projectId={projectId}
              projectName={project.name}
              siteUrl={siteUrl}
              iframeKey={iframeKey}
              onRefresh={() => { setIframeKey((k) => k + 1); if (agentType === "designer") loadImages(); }}
              isDragging={isDragging}
              images={[...projectImages, ...generatedImages]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

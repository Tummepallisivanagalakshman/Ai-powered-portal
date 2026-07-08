import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Send, Bot, User, Mic, Paperclip, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { chatWithAssistant } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/career-chat")({
  head: () => ({
    meta: [{ title: "AI Career Assistant — CareerSuccess" }],
  }),
  component: CareerChatPage,
});

interface Message {
  id: number;
  text: string;
  sender: "bot" | "user";
  timestamp: Date;
}

const SUGGESTIONS = [
  "How do I improve my resume for a Senior Frontend role?",
  "What skills should I learn to transition into System Design?",
  "How do I negotiate a higher product engineer offer?",
];

function CareerChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I am your AI Career Assistant. Ask me anything about resume formatting, interview strategies, or learning modules.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: messages.length + 1,
      text,
      sender: "user",
      timestamp: new Date(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputValue("");
    setTyping(true);

    try {
      const response = await chatWithAssistant({
        data: {
          messages: nextMessages.map((m) => ({
            role: m.sender === "bot" ? "assistant" : "user",
            content: m.text,
          })),
        },
      });
      setTyping(false);
      const botMsg: Message = {
        id: nextMessages.length + 2,
        text: response.reply,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setTyping(false);
      toast.error(err.message || "Failed to communicate with AI Assistant.");
    }
  };

  return (
    <AppShell
      title="AI Career Chat"
      subtitle="Interactive consultation on career paths, interview prep, and ATS optimization."
    >
      <div className="flex flex-col h-[70vh] rounded-3xl border border-border/60 bg-card overflow-hidden shadow-soft">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/40 bg-muted/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-md">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Career Mentor</h3>
            <p className="text-[10px] text-green-500 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Online
            </p>
          </div>
        </div>

        {/* Message Flow */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((msg) => {
            const isBot = msg.sender === "bot";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isBot ? "self-start" : "self-end flex-row-reverse ml-auto"}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white font-bold text-xs ${
                    isBot ? "bg-purple-600" : "bg-blue-600"
                  }`}
                >
                  {isBot ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                </div>

                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    isBot 
                      ? "bg-muted/40 border border-border/40 text-foreground" 
                      : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typing && (
            <div className="flex gap-3 max-w-[80%] self-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="rounded-2xl px-4 py-2.5 bg-muted/40 border border-border/40 text-foreground flex items-center gap-1">
                <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompts Grid */}
        {messages.length === 1 && (
          <div className="px-4 py-3 border-t border-border/40 bg-muted/5 space-y-2">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" /> Suggested Starters
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="text-left text-[11px] font-medium text-muted-foreground hover:text-blue-600 bg-card hover:bg-blue-600/5 border border-border/40 rounded-xl px-3 py-2 transition-all leading-normal"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-border/40 bg-background flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl border border-border/60 hover:bg-muted/50 h-10 w-10 shrink-0"
            onClick={() => toast.info("Voice recognition is a mock UI feature.")}
          >
            <Mic className="h-4.5 w-4.5 text-muted-foreground" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl border border-border/60 hover:bg-muted/50 h-10 w-10 shrink-0"
            onClick={() => toast.info("File attachment is a mock UI feature.")}
          >
            <Paperclip className="h-4.5 w-4.5 text-muted-foreground" />
          </Button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(inputValue)}
            placeholder="Type your question..."
            className="flex-1 rounded-xl border border-border/60 bg-muted/20 px-4 text-xs focus:border-blue-600 focus:outline-none"
          />

          <Button
            onClick={() => handleSend(inputValue)}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-10 px-4 font-semibold text-xs flex items-center justify-center gap-1.5"
          >
            <Send className="h-4 w-4" /> Send
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

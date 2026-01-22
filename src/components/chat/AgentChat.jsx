import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, User, Zap, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || "Function";
  const status = toolCall?.status || "pending";
  const results = toolCall?.results;

  const parsedResults = (() => {
    if (!results) return null;
    try {
      return typeof results === "string" ? JSON.parse(results) : results;
    } catch {
      return results;
    }
  })();

  const statusConfig = {
    pending: { icon: Clock, color: "text-slate-400", text: "Pending" },
    running: { icon: Loader2, color: "text-slate-500", text: "Running...", spin: true },
    in_progress: { icon: Loader2, color: "text-slate-500", text: "Running...", spin: true },
    completed: { icon: CheckCircle2, color: "text-green-600", text: "Success" },
    success: { icon: CheckCircle2, color: "text-green-600", text: "Success" },
    failed: { icon: CheckCircle2, color: "text-red-500", text: "Failed" },
  }[status] || { icon: Zap, color: "text-slate-500", text: "" };

  const Icon = statusConfig.icon;
  const formattedName = name.split(".").reverse().join(" ").toLowerCase();

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
          "hover:bg-slate-50",
          expanded ? "bg-slate-50 border-slate-300" : "bg-white border-slate-200"
        )}
      >
        <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
        <span className="text-slate-700">{formattedName}</span>
        {statusConfig.text && (
          <span className="text-slate-500">• {statusConfig.text}</span>
        )}
        {!statusConfig.spin && (toolCall.arguments_string || results) && (
          <ChevronRight className={cn("h-3 w-3 text-slate-400 transition-transform ml-auto", expanded && "rotate-90")} />
        )}
      </button>
      {expanded && !statusConfig.spin && parsedResults && (
        <div className="mt-1.5 ml-3 pl-3 border-l-2 border-slate-200">
          <pre className="bg-slate-50 rounded-md p-2 text-xs text-slate-600 whitespace-pre-wrap max-h-48 overflow-auto">
            {typeof parsedResults === "object" ? JSON.stringify(parsedResults, null, 2) : parsedResults}
          </pre>
        </div>
      )}
    </div>
  );
};

export default function AgentChat({ agentName = "lead_converter" }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  const initConversation = async () => {
    setInitializing(true);
    const conv = await base44.agents.createConversation({
      agent_name: agentName,
      metadata: { name: "Lead Conversion Session", started_at: new Date().toISOString() }
    });
    setConversation(conv);
    setMessages(conv.messages || []);
    setInitializing(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !conversation) return;
    setLoading(true);
    await base44.agents.addMessage(conversation, {
      role: "user",
      content: input
    });
    setInput("");
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Lead Conversion AI</h3>
            <p className="text-sm text-slate-500">Autonomous appointment booking</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 mx-auto mb-4 text-slate-200" />
            <h3 className="font-medium text-slate-700 mb-2">Start a conversation</h3>
            <p className="text-sm text-slate-500">
              Simulate a lead inquiry to see the AI in action
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  msg.role === "user" ? "bg-slate-900" : "bg-slate-100"
                )}>
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className={cn("max-w-[75%]")}>
                  {msg.content && (
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5",
                      msg.role === "user" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"
                    )}>
                      {msg.role === "user" ? (
                        <p className="text-sm">{msg.content}</p>
                      ) : (
                        <ReactMarkdown className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  )}
                  {msg.tool_calls?.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {msg.tool_calls.map((tc, i) => (
                        <FunctionDisplay key={i} toolCall={tc} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Simulate a lead message..."
            className="flex-1 border-slate-200"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
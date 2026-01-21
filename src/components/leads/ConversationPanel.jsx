import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Bot, User, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ConversationPanel({ lead, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadConversation();
  }, [lead.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversation = async () => {
    setLoading(true);
    const conversations = await base44.entities.Conversation.filter({ lead_id: lead.id }, "created_date");
    setMessages(conversations);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    await base44.entities.Conversation.create({
      lead_id: lead.id,
      role: "lead",
      message: newMessage,
      action_type: "message",
      channel: "chat"
    });
    
    setNewMessage("");
    await loadConversation();
    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-900">{lead.name}</h3>
          <p className="text-sm text-slate-500">{lead.email || lead.phone}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Bot className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No conversation yet</p>
            <p className="text-sm">Start the AI assistant to begin</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.role === "lead" ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  msg.role === "ai" ? "bg-slate-100" : "bg-slate-900"
                )}>
                  {msg.role === "ai" ? (
                    <Bot className="w-4 h-4 text-slate-600" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5",
                  msg.role === "lead" 
                    ? "bg-slate-900 text-white" 
                    : "bg-slate-100 text-slate-900"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    msg.role === "lead" ? "text-slate-400" : "text-slate-500"
                  )}>
                    {format(new Date(msg.created_date), "h:mm a")}
                  </p>
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
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border-slate-200 focus:border-slate-400"
            disabled={sending}
          />
          <Button 
            onClick={handleSend} 
            disabled={sending || !newMessage.trim()}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
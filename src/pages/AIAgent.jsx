import { useState } from "react";
import { base44 } from "@/api/base44Client";
import AgentChat from "../components/chat/AgentChat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, MessageSquare, Zap, Target, Clock, ArrowRight } from "lucide-react";

export default function AIAgent() {
  const [showChat, setShowChat] = useState(false);

  const features = [
    {
      icon: Zap,
      title: "Instant Response",
      description: "Responds to leads within seconds, 24/7"
    },
    {
      icon: Target,
      title: "Smart Qualification",
      description: "Silently scores leads on intent, budget, and timeline"
    },
    {
      icon: MessageSquare,
      title: "Natural Conversations",
      description: "Adapts tone based on vertical and context"
    },
    {
      icon: Clock,
      title: "Auto Follow-up",
      description: "Multi-day sequences to re-engage silent leads"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-6">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">
            Lead Conversion AI
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Your autonomous assistant that qualifies leads and books appointments without human intervention
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {features.map((feature, idx) => (
            <Card key={idx} className="p-5 bg-white border-0 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Chat Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Test the AI Agent</h2>
              <p className="text-slate-500">Simulate a lead conversation to see the AI in action</p>
            </div>
            {!showChat && (
              <Button 
                onClick={() => setShowChat(true)}
                className="bg-slate-900 hover:bg-slate-800"
              >
                Start Conversation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {showChat && <AgentChat />}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-slate-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Lead Arrives</h3>
                <p className="text-slate-500 text-sm">New leads are captured from any source - web, phone, walk-in</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-slate-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">AI Engages</h3>
                <p className="text-slate-500 text-sm">Instant, personalized response based on vertical and context</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-slate-600">3</span>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Qualification</h3>
                <p className="text-slate-500 text-sm">AI asks targeted questions to understand intent, budget, and timeline</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-slate-600">4</span>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Appointment Booking</h3>
                <p className="text-slate-500 text-sm">Qualified leads are automatically scheduled for test drives, showings, or services</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-slate-600">5</span>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Follow-up & Handoff</h3>
                <p className="text-slate-500 text-sm">Silent leads get automated follow-ups; complex cases escalate to humans</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { MessageSquare, Zap, Shield, Globe } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const FeatureCard = ({ icon: Icon, title, description, color }) => (
  <div className="bg-surface p-6 rounded-[20px] shadow-premium flex flex-col items-center text-center group hover:-translate-y-1 hover:shadow-glow-primary transition-all duration-300 border border-border/40">
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg`}>
      <Icon className="text-white" size={24} />
    </div>
    <h3 className="text-[15px] font-black text-text-main mb-1.5">{title}</h3>
    <p className="text-[12px] text-text-secondary leading-relaxed font-semibold px-2">{description}</p>
  </div>
);

const Welcome = () => {
  const { currentUser } = useAuth();

  const features = [
    { icon: Zap, title: "Fast", description: "Instant real-time messaging", color: "bg-indigo-500" },
    { icon: Shield, title: "Secure", description: "JWT protected endpoints", color: "bg-emerald-500" },
    { icon: Globe, title: "Real-time", description: "WebSocket powered chat", color: "bg-blue-500" },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
      {/* Premium background patterns */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-[600px] w-full flex flex-col items-center relative z-10 animate-fade-in-up">
        <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/20 mb-8 animate-bounce-slow">
          <MessageSquare className="text-white" size={40} />
        </div>

        <h1 className="text-[32px] md:text-[40px] font-black text-text-main mb-3 tracking-tighter text-center leading-tight">
          Welcome back, <span className="gradient-text">{currentUser?.displayName?.split(" ")[0] || "there"}</span>! 👋
        </h1>
        <p className="text-[15px] text-text-secondary text-center mb-12 max-w-[420px] font-medium leading-relaxed opacity-80">
          Pick a conversation from the left to start chatting, or click the <span className="font-bold text-primary">+</span> icon to find someone new.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Welcome;

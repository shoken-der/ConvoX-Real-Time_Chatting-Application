import React from 'react';
import { MessageSquare } from 'lucide-react';

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0F19] transition-all duration-700">
      <div className="relative">
        {/* Animated Rings */}
        <div className="absolute inset-0 -m-4 rounded-full border-2 border-[#635BFF]/20 animate-ping opacity-20" />
        <div className="absolute inset-0 -m-8 rounded-full border-2 border-[#635BFF]/10 animate-ping opacity-10 [animation-delay:0.5s]" />
        
        {/* Logo Icon */}
        <div className="relative w-24 h-24 rounded-3xl bg-[#635BFF] flex items-center justify-center shadow-[0_0_50px_rgba(99,91,255,0.3)] animate-float">
          <MessageSquare className="text-white w-12 h-12" />
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        <h1 className="text-3xl font-black text-white tracking-tighter animate-fade-in">
          ConvoX
        </h1>
        
        {/* Loading Bar */}
        <div className="w-48 h-1.5 bg-[#171923] rounded-full overflow-hidden border border-[#2A3245]">
          <div className="h-full bg-gradient-to-r from-[#635BFF] to-[#7C3AED] rounded-full animate-progress" />
        </div>
        
        <p className="text-[14px] text-[#6B7280] font-medium tracking-wide animate-pulse mt-2">
          Setting up your workspace...
        </p>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-12 text-[#6B7280] text-[12px] font-bold tracking-[0.2em] uppercase opacity-40">
        Premium Messaging
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 70%; transform: translateX(0%); }
          100% { width: 100%; transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
        .animate-float {
          animation: float 3s infinite ease-in-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default SplashScreen;

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ErrorMessage from "../layouts/ErrorMessage";
import { MessageSquare, Mail, Lock, Eye, EyeOff } from "lucide-react";
import ForgotPasswordModal from "./ForgotPasswordModal";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const { currentUser, login, setError } = useAuth();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.profileCompleted) navigate("/");
      else navigate("/profile-setup");
    }
  }, [currentUser, navigate]);

  async function handleFormSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await login(email, password);
      // AuthContext updates currentUser, useEffect handles redirect
    } catch (e) {
      setError(e.message || "Failed to login. Please check your credentials.");
    }
    setLoading(false);
  }

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-[#0F1321] relative overflow-hidden">
      {/* Figma Spec Gradient Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(60% 60% at 0% 0%, rgba(99, 91, 255, 0.08) 0%, rgba(15, 19, 33, 0) 100%)',
        }}
      />
      
      <ErrorMessage />
      
      {/* Decorative Blobs */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-[420px] w-full bg-[#111827]/80 backdrop-blur-xl rounded-[32px] shadow-premium-lg p-8 md:p-10 relative z-10 border border-white/5 animate-fade-in overflow-hidden">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-[#635BFF] to-[#7C3AED] rounded-[18px] flex items-center justify-center shadow-2xl shadow-primary/40 mx-auto mb-5 animate-bounce-slow">
            <MessageSquare className="text-white" size={28} />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">Welcome Back</h2>
          <p className="text-text-secondary text-[14px] font-medium">Log in to your account</p>
        </div>

        <form className="space-y-[18px]" onSubmit={handleFormSubmit}>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-[0.15em] px-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="email"
                required
                className="w-full pl-14 pr-6 py-[16px] rounded-[18px] bg-[#1F2937]/50 border border-white/5 focus:border-primary/50 focus:bg-[#1F2937] text-white focus:ring-0 text-[14px] font-medium transition-all outline-none placeholder:text-text-muted/50"
                placeholder="name@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between px-1">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-[0.15em]">Password</label>
              <button 
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
              >
                Forgot?
              </button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-14 pr-14 py-[16px] rounded-[18px] bg-[#1F2937]/50 border border-white/5 focus:border-primary/50 focus:bg-[#1F2937] text-white focus:ring-0 text-[14px] font-medium transition-all outline-none placeholder:text-text-muted/50"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-[18px] bg-gradient-to-r from-[#635BFF] to-[#7C3AED] text-white rounded-[18px] font-black text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30 mt-4 disabled:opacity-50 disabled:scale-100 uppercase tracking-wider"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-[14px] text-text-muted pt-6 font-medium">
            Don't have an account? <Link to="/register" className="font-bold text-primary hover:text-primary/80 transition-colors ml-1 underline underline-offset-4 decoration-primary/20">Join now</Link>
          </p>
        </form>
      </div>

      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => setIsForgotModalOpen(false)} 
      />
    </div>
  );
}

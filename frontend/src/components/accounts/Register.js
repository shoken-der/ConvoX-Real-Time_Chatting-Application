import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ErrorMessage from "../layouts/ErrorMessage";
import { MessageSquare, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentUser, register, setError } = useAuth();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.profileCompleted) navigate("/");
      else navigate("/profile-setup");
    }
  }, [currentUser, navigate]);

  async function handleRegister(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    if (!email.endsWith("@gmail.com")) {
      return setError("Only genuine @gmail.com accounts are allowed for registration.");
    }
    try {
      setError("");
      setLoading(true);
      await register(email, password);
      navigate("/verify-email", { state: { email, password } });
    } catch (e) {
      setError(e.message || "Failed to create an account.");
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

      
      {/* Decorative Blobs */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-[420px] w-full bg-[#111827]/80 backdrop-blur-xl rounded-[32px] shadow-premium-lg p-7 md:p-9 relative z-10 border border-white/5 animate-fade-in overflow-hidden">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-gradient-to-br from-[#635BFF] to-[#7C3AED] rounded-[16px] flex items-center justify-center shadow-2xl shadow-primary/40 mx-auto mb-4 animate-bounce-slow">
            <MessageSquare className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-black text-white mb-1 tracking-tighter">Join ConvoX</h2>
          <p className="text-text-secondary text-[13px] font-medium">Create your premium account</p>
        </div>

        <ErrorMessage />

        <form className="space-y-[15px]" onSubmit={handleRegister}>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] px-1">Gmail Address</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
              <input
                type="email"
                required
                className="w-full pl-14 pr-6 py-[14px] rounded-[16px] bg-[#1F2937]/50 border border-white/5 focus:border-primary/50 focus:bg-[#1F2937] text-white focus:ring-0 text-[13px] font-medium transition-all outline-none placeholder:text-text-muted/50"
                placeholder="you@gmail.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] px-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-14 pr-14 py-[14px] rounded-[16px] bg-[#1F2937]/50 border border-white/5 focus:border-primary/50 focus:bg-[#1F2937] text-white focus:ring-0 text-[13px] font-medium transition-all outline-none placeholder:text-text-muted/50"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] px-1">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                className={`w-full pl-14 pr-14 py-[14px] rounded-[16px] bg-[#1F2937]/50 border transition-all outline-none placeholder:text-text-muted/50 ${confirmPassword && password !== confirmPassword ? '!border-red-500 ring-2 ring-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-white/5 focus:border-primary/50 focus:bg-[#1F2937] text-white focus:ring-0 text-[13px] font-medium'}`}
                placeholder="••••••••"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-[16px] bg-gradient-to-r from-[#635BFF] to-[#7C3AED] text-white rounded-[16px] font-black text-[14px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30 mt-3 disabled:opacity-50 disabled:scale-100 uppercase tracking-wider"
          >
            {loading ? "Creating account..." : "Join Now"}
          </button>

          <p className="text-center text-[13px] text-text-muted pt-4 font-medium">
            Already have an account? <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors ml-1 underline underline-offset-4 decoration-primary/20">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

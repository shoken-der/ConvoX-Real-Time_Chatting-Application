import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import ErrorMessage from "../layouts/ErrorMessage";
import { ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";

export default function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, verifyEmail, resendOtp, setError, clearAuth } = useAuth();
  const { addToast } = useToast();
  const email = location.state?.email || currentUser?.email;
  const password = location.state?.password;

  const handleChangeEmail = () => {
    clearAuth();
    navigate("/register");
  };
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (currentUser?.enabled) {
      navigate("/profile-setup", { replace: true });
      return;
    }
    if (!email) {
      navigate("/register", { replace: true });
    }
  }, [email, currentUser, navigate]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return;

    setLoading(true);
    try {
      await verifyEmail(email, code, password);
      navigate("/profile-setup");
    } catch (err) {
      // Error handled by context
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp(email);
      setError("");
      addToast({ message: "Verification code resent successfully!", type: "success" });
    } catch (err) {}
    setResending(false);
  };

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-[#0F1321] relative overflow-hidden text-white font-sans">
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(60% 60% at 0% 0%, rgba(99, 91, 255, 0.08) 0%, rgba(15, 19, 33, 0) 100%)' }}
      />
      
      <ErrorMessage />

      {/* Decorative Blobs */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-[440px] w-full bg-[#111827]/80 backdrop-blur-xl rounded-[32px] shadow-premium-lg p-10 md:p-14 relative z-10 border border-white/5 animate-fade-in text-center">
        <button onClick={handleChangeEmail} className="absolute left-8 top-10 p-2 rounded-full hover:bg-white/5 transition-colors text-text-muted">
          <ArrowLeft size={20} />
        </button>

        <div className="w-20 h-20 bg-gradient-to-br from-[#635BFF] to-[#7C3AED] rounded-[24px] flex items-center justify-center shadow-2xl shadow-primary/40 mx-auto mb-8 animate-pulse-glow">
          <ShieldCheck className="text-white" size={36} />
        </div>

        <h2 className="text-3xl font-black text-white mb-3 tracking-tighter leading-tight">Verify Gmail</h2>
        
        <div className="mb-10 px-4">
          <p className="text-text-secondary text-[14px] font-medium leading-relaxed">
            We've sent a 6-digit code to <br/>
            <span className="text-primary font-bold">{email}</span>
          </p>
          <button 
            onClick={handleChangeEmail} 
            className="text-[12px] font-bold text-primary hover:underline mt-2 uppercase tracking-wider"
          >
            Change Email
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-10">
          <div className="flex justify-between gap-2.5">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-full h-14 bg-[#1F2937]/50 border border-white/10 rounded-[16px] text-center text-xl font-bold focus:border-primary/50 focus:bg-[#1F2937] transition-all outline-none"
              />
            ))}
          </div>

          <button 
            type="submit" 
            disabled={loading || otp.join("").length < 6}
            className="w-full py-[18px] bg-gradient-to-r from-[#635BFF] to-[#7C3AED] text-white rounded-[22px] font-black text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/30 mt-6 disabled:opacity-50 disabled:scale-100 uppercase tracking-widest"
          >
            {loading ? "Verifying..." : "Verify Account"}
          </button>

          <div className="pt-6">
            <button 
              type="button" 
              onClick={handleResend}
              disabled={resending}
              className="flex items-center justify-center gap-2 text-[13px] text-text-muted hover:text-white transition-colors mx-auto font-bold uppercase tracking-wider"
            >
              <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
              {resending ? "Resending..." : "Resend Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Mail, Lock, ShieldCheck, X, ArrowRight, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const { forgotPassword, resetPassword, setError } = useAuth();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password, 3: Success
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep(2);
      setError("");
    } catch (err) {}
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const otpCode = code.join("");
    if (otpCode.length < 6 || !newPassword) return;

    setLoading(true);
    try {
      await resetPassword(email, otpCode, newPassword);
      setStep(3);
      setError("");
    } catch (err) {}
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...code];
    newOtp[index] = value.substring(value.length - 1);
    setCode(newOtp);
    if (value && index < 5) inputRefs[index + 1].current.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="max-w-[440px] w-full bg-[#111827] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden relative animate-zoom-in">
        <button onClick={onClose} className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/5 transition-colors text-text-muted">
          <X size={20} />
        </button>

        <div className="p-10 md:p-12">
          {step === 1 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                <Mail size={32} />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Forgot Password?</h2>
              <p className="text-text-secondary text-sm mb-8">Enter your email and we'll send you a 6-digit code to reset your password.</p>
              
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-[18px] rounded-[22px] bg-[#1F2937]/50 border border-white/5 focus:border-primary/50 text-white outline-none text-[15px] font-medium"
                    placeholder="Enter your Gmail"
                  />
                </div>
                <button 
                  disabled={loading}
                  className="w-full py-[18px] bg-primary text-white rounded-[22px] font-black text-[15px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? "Sending..." : "Send Reset Code"}
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Verify & Reset</h2>
              <p className="text-text-secondary text-sm mb-8">Enter the code sent to <span className="text-primary font-bold">{email}</span> and your new password.</p>
              
              <form onSubmit={handleReset} className="space-y-8">
                <div className="flex justify-between gap-2">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-full h-12 bg-[#1F2937]/50 border border-white/10 rounded-[14px] text-center text-lg font-bold text-white focus:border-primary/50 outline-none"
                    />
                  ))}
                </div>

                <div className="relative group text-left">
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-widest px-2 mb-1 block">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-14 pr-14 py-[16px] rounded-[20px] bg-[#1F2937]/50 border border-white/5 focus:border-primary/50 text-white outline-none text-[14px] font-medium"
                      placeholder="••••••••"
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
                  disabled={loading || code.join("").length < 6 || !newPassword}
                  className="w-full py-[18px] bg-primary text-white rounded-[22px] font-black text-[15px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success mx-auto mb-6">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Success!</h2>
              <p className="text-text-secondary text-sm mb-10 px-4">Your password has been updated. You can now sign in with your new password.</p>
              <button 
                onClick={onClose}
                className="w-full py-[18px] bg-white text-black rounded-[22px] font-black text-[15px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

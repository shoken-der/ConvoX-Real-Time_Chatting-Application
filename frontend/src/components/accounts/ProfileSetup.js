import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { User, Check, RefreshCw, AlertCircle } from "lucide-react";
import axios from "axios";

const AVATAR_POOL = [
  "https://api.dicebear.com/7.x/personas/svg?seed=Felix",
  "https://api.dicebear.com/7.x/personas/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/personas/svg?seed=Viviane",
  "https://api.dicebear.com/7.x/personas/svg?seed=Jocelyn",
  "https://api.dicebear.com/7.x/personas/svg?seed=Toby",
  "https://api.dicebear.com/7.x/personas/svg?seed=George",
  "https://api.dicebear.com/7.x/personas/svg?seed=Buster",
  "https://api.dicebear.com/7.x/personas/svg?seed=Sheba",
  "https://api.dicebear.com/7.x/personas/svg?seed=Jasper",
  "https://api.dicebear.com/7.x/personas/svg?seed=Loki",
  "https://api.dicebear.com/7.x/personas/svg?seed=Nala",
  "https://api.dicebear.com/7.x/personas/svg?seed=Abby",
  "https://api.dicebear.com/7.x/personas/svg?seed=Bailey",
  "https://api.dicebear.com/7.x/personas/svg?seed=Coco",
  "https://api.dicebear.com/7.x/personas/svg?seed=Daisy",
  "https://api.dicebear.com/7.x/personas/svg?seed=Ginger",
  "https://api.dicebear.com/7.x/personas/svg?seed=Holly",
  "https://api.dicebear.com/7.x/personas/svg?seed=Ivy",
  "https://api.dicebear.com/7.x/personas/svg?seed=Jade",
  "https://api.dicebear.com/7.x/personas/svg?seed=Kali"
];

const API_BASE_URL = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) || "http://localhost:8080";

export default function ProfileSetup() {
  const { currentUser, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const [randomAvatars, setRandomAvatars] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (currentUser.displayName) setDisplayName(currentUser.displayName);
    if (currentUser.photoUrl) setSelectedAvatar(currentUser.photoUrl);
    generateAvatars(currentUser.photoUrl);
  }, [currentUser, navigate]);

  const generateAvatars = (existingPhoto) => {
    const shuffled = [...AVATAR_POOL].sort(() => 0.5 - Math.random());
    let avatars = shuffled.slice(0, 6);
    if (existingPhoto && !avatars.includes(existingPhoto)) {
      avatars[0] = existingPhoto; // Ensure their current avatar is in the list
    }
    setRandomAvatars(avatars);
  };

  const generateRandomAvatars = () => {
    generateAvatars(selectedAvatar);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!displayName || !selectedAvatar) {
      setStatus({ type: "error", message: "Please enter your name and choose an avatar." });
      return;
    }

    setLoading(true);
    setStatus({ type: "info", message: "Saving your profile..." });
    
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing. Please login again.");


      const response = await axios.post(`${API_BASE_URL}/api/user/update-profile`, {
        displayName: displayName.trim(),
        photoUrl: selectedAvatar
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });



      setStatus({ type: "success", message: "Profile saved! Redirecting..." });
      
      // Refresh user context
      const updatedUser = await refreshUser();
      
      // Small delay to let the user see the success message
      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (err) {
      console.error("Full Error Object:", err);
      const errorMsg = err.response?.data?.message || err.response?.data || err.message || "Unknown error occurred";
      setStatus({ 
        type: "error", 
        message: `Failed to save profile: ${errorMsg}. Make sure your backend is running and updated.` 
      });
    } finally {
      setLoading(false);
    }
  };

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
            <User className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-black text-white mb-1 tracking-tighter">Create Profile</h2>
          <p className="text-text-secondary text-[13px] font-medium">Choose how you appear on ConvoX</p>
        </div>

        {status.message && (
          <div className={`mb-4 p-3 rounded-[14px] flex items-center gap-3 text-[12px] font-bold text-center animate-shake ${
            status.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
            status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-primary/10 text-primary border border-primary/20'
          }`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-[15px]">
          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] px-1">Display Name</label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={16} />
              <input
                type="text"
                required
                className="w-full pl-14 pr-6 py-[14px] rounded-[16px] bg-[#1F2937]/50 border border-white/5 focus:border-primary/50 focus:bg-[#1F2937] text-white focus:ring-0 text-[13px] font-medium transition-all outline-none placeholder:text-text-muted/50"
                placeholder="What's your name?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          {/* Avatar Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">Select Avatar</label>
              <button 
                type="button" 
                onClick={generateRandomAvatars}
                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:opacity-80 transition-opacity uppercase tracking-wider"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {randomAvatars.map((url, i) => (
                <div 
                  key={i}
                  onClick={() => setSelectedAvatar(url)}
                  className={`relative cursor-pointer group aspect-square rounded-[16px] overflow-hidden transition-all duration-300 ${
                    selectedAvatar === url 
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-[#111827] shadow-xl shadow-primary/20 scale-[0.95]" 
                      : "hover:scale-105 border border-white/5 hover:border-primary/30"
                  }`}
                >
                  <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover bg-[#1F2937]" />
                  {selectedAvatar === url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                        <Check size={14} strokeWidth={4} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !displayName || !selectedAvatar}
            className="w-full py-[16px] bg-gradient-to-r from-[#635BFF] to-[#7C3AED] text-white rounded-[16px] font-black text-[14px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30 mt-3 disabled:opacity-50 disabled:scale-100 uppercase tracking-wider"
          >
            {loading ? "Saving Profile..." : "Complete Setup"}
          </button>
        </form>

        <button 
          onClick={logout}
          className="w-full mt-6 text-center text-[13px] font-bold text-text-muted hover:text-text-secondary transition-colors"
        >
          Logout and exit
        </button>
      </div>
    </div>
  );
}

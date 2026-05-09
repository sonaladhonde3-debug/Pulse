import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PasswordResetForm from '@/components/ui/PasswordResetForm';

export default function Index() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);



  // Login & Signup State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempted with", email, password);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup attempted with", username, displayName, email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden bg-[#151517] font-sans">
      {/* Background glowing orbs reflecting the palette */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#f96b85] opacity-20 blur-[120px] mix-blend-screen pointer-events-none animate-blob" />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#57639f] opacity-20 blur-[120px] mix-blend-screen pointer-events-none animate-blob" 
        style={{ animationDelay: "2s" }} 
      />
      <div 
        className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-[#fadb5f] opacity-10 blur-[100px] mix-blend-screen pointer-events-none animate-blob" 
        style={{ animationDelay: "4s" }} 
      />
      
      {/* Include bg.jpg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat animate-float-bg origin-center"
          style={{ backgroundImage: "url('/bg.jpg')" }}
        ></div>
      </div>

      <div className="z-10 w-full max-w-[440px] relative group">
        {/* Animated Gradient Border Wrapper */}
        <div className="absolute -inset-[1.5px] rounded-[3rem] bg-gradient-to-br from-[#f96b85] via-[#fadb5f] to-[#57639f] opacity-50 blur-sm transition-all duration-700 group-hover:opacity-80 group-hover:blur-md"></div>
        <div className="absolute -inset-[1.5px] rounded-[3rem] bg-gradient-to-br from-[#f96b85] via-[#fadb5f] to-[#57639f] opacity-100 pointer-events-none"></div>

        {/* Dark Glassmorphism Card */}
        <div className="relative overflow-hidden rounded-[3rem] bg-[#1a1a1e]/95 p-10 shadow-2xl backdrop-blur-3xl">
          
          {isLogin ? (
            // --- LOGIN VIEW ---
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">


              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#f96b85] via-[#fadb5f] to-[#f96b85] drop-shadow-sm mb-2 pb-1">
                  Welcome Back
                </h1>
                <p className="text-sm font-medium text-white/50">
                  Ready to explore the universe?
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                
                <div className="space-y-4">
                  <div className="relative">
                    <Input 
                      id="login-email" 
                      type="email" 
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 rounded-2xl border border-white/5 bg-white/5 px-5 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-[#f96b85] focus-visible:ring-offset-0 focus-visible:border-[#f96b85] focus-visible:bg-white/10 shadow-inner transition-all text-base"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Input 
                      id="login-password" 
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 rounded-2xl border border-white/5 bg-white/5 px-5 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-[#fadb5f] focus-visible:ring-offset-0 focus-visible:border-[#fadb5f] focus-visible:bg-white/10 shadow-inner transition-all text-base"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between px-2 pt-2 pb-4">
                  <button type="button" className="text-sm font-medium text-white/40 hover:text-[#fadb5f] transition-colors">
                    Forgot details?
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-sm font-medium text-white/40 hover:text-[#f96b85] transition-colors"
                  >
                    Create account
                  </button>
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="group relative h-14 w-full overflow-hidden rounded-full border-0 bg-transparent text-base font-bold text-white shadow-[0_4px_14px_0_rgba(249,107,133,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(249,107,133,0.23)] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#f96b85] to-[#f49d36] opacity-90 transition-opacity group-hover:opacity-100" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Sign In <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                </div>
                
              </form>
            </div>
          ) : (
            // --- SIGNUP VIEW ---
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">


              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#57639f] via-[#c486c4] to-[#f96b85] drop-shadow-sm mb-2 pb-1">
                  Join Us
                </h1>
                <p className="text-sm font-medium text-white/50">
                  Begin your colorful journey.
                </p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-4">
                  <Input 
                    id="signup-username" 
                    type="text" 
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-14 rounded-2xl border border-white/5 bg-white/5 px-5 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-[#57639f] focus-visible:ring-offset-0 focus-visible:border-[#57639f] focus-visible:bg-white/10 shadow-inner transition-all text-base"
                    required
                  />
                  
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 rounded-2xl border border-white/5 bg-white/5 px-5 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-[#c486c4] focus-visible:ring-offset-0 focus-visible:border-[#c486c4] focus-visible:bg-white/10 shadow-inner transition-all text-base"
                    required
                  />
                  
                  <Input 
                    id="signup-password" 
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 rounded-2xl border border-white/5 bg-white/5 px-5 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-[#f96b85] focus-visible:ring-offset-0 focus-visible:border-[#f96b85] focus-visible:bg-white/10 shadow-inner transition-all text-base"
                    required
                  />
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="group relative h-14 w-full overflow-hidden rounded-full border-0 bg-transparent text-base font-bold text-white shadow-[0_4px_14px_0_rgba(87,99,159,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(87,99,159,0.23)] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#57639f] to-[#f96b85] opacity-90 transition-opacity group-hover:opacity-100" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Create account <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                </div>
                
                <div className="pt-4 text-center">
                  <span className="text-sm font-medium text-white/40">
                    Already have an account?{" "}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-sm font-semibold text-[#f96b85] hover:text-[#fadb5f] hover:underline transition-all"
                  >
                    Log in
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

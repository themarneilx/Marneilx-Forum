"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, User, ArrowRight, Loader2 } from "lucide-react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const router = useRouter();

  const onFinish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    try {
      let loginEmail = identifier;
      if (!identifier.includes("@")) {
        loginEmail = `${identifier.toLowerCase()}@private.marneilx.com`;
      }

      await signInWithEmailAndPassword(auth, loginEmail, password);
      router.push("/");
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        setError("Invalid username/email or password.");
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError(null);
    setResetMessage(null);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("Password reset email sent! Check your inbox.");
      setTimeout(() => {
        setIsForgotPasswordModalOpen(false);
        setResetMessage(null);
        setResetEmail("");
      }, 3000);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setError("No user found with that email address.");
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg shadow-slate-100 border border-slate-100 p-8">
        
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-xl shadow-lg shadow-slate-200 mb-4">
                M
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-2">Please enter your details to sign in.</p>
        </div>

        <form onSubmit={onFinish} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Username or Email</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                    name="identifier"
                    type="text" 
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                    placeholder="Enter your username or email"
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                    name="password"
                    type="password" 
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                    placeholder="Enter your password"
                />
            </div>
          </div>

          {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                  {error}
              </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition shadow-md shadow-slate-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>
        </form>

        <div className="flex items-center justify-between mt-6 text-sm">
            <button 
                onClick={() => { setError(null); setIsForgotPasswordModalOpen(true); }} 
                className="text-slate-500 hover:text-slate-900 transition font-medium"
            >
                Forgot password?
            </button>
            <span className="text-slate-400">
                New here? <Link href="/register" className="text-indigo-600 font-bold hover:underline">Create account</Link>
            </span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
             <h3 className="text-lg font-bold text-slate-900 mb-2">Reset Password</h3>
             <p className="text-slate-500 text-sm mb-4">
                Enter your email address and we'll send you a link to reset your password.
             </p>
             
             <form onSubmit={handleSendPasswordReset}>
                 <div className="mb-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input 
                            type="email" 
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                            placeholder="name@example.com"
                        />
                    </div>
                 </div>

                 {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl mb-4">
                        {error}
                    </div>
                 )}
                 
                 {resetMessage && (
                    <div className="p-3 bg-green-50 border border-green-100 text-green-600 text-sm rounded-xl mb-4">
                        {resetMessage}
                    </div>
                 )}

                 <div className="flex gap-3">
                     <button 
                        type="button"
                        onClick={() => setIsForgotPasswordModalOpen(false)}
                        className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition"
                     >
                        Cancel
                     </button>
                     <button 
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                     >
                        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                        Send Link
                     </button>
                 </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
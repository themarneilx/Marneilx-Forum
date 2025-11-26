"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, User, Loader2 } from "lucide-react";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onFinish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const finalEmail = email ? email : `${username.toLowerCase()}@private.marneilx.com`;

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        finalEmail,
        password
      );
      await updateProfile(userCredential.user, {
        displayName: username,
      });
      router.push("/");
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
         setError("Username or Email already taken.");
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
            <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
            <p className="text-slate-500 mt-2">Join the community today.</p>
        </div>

        <form onSubmit={onFinish} className="space-y-5">
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                    name="username"
                    type="text" 
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                    placeholder="Choose a username"
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-slate-400 font-normal">(Optional)</span></label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                    name="email"
                    type="email" 
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                    placeholder="name@example.com"
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
                    minLength={6}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                    placeholder="Create a password"
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
            Register
          </button>
        </form>

        <div className="flex items-center justify-center mt-6 text-sm">
            <span className="text-slate-400">
                Already have an account? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Log in</Link>
            </span>
        </div>
      </div>
    </div>
  );
}
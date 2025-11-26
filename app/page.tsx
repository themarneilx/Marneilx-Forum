"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { Post } from "@/types";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import PostCard from "@/components/PostCard";
import { 
  Search, 
  Bell, 
  LayoutGrid, 
  Bookmark, 
  Hash, 
  Image as ImageIcon, 
  BarChart2, 
  CalendarDays, 
  Type, 
  ShieldCheck, 
  HeartHandshake, 
  Lightbulb, 
  Share, 
  LogOut, 
  User as UserIcon,
  Loader2,
  X
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  
  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Fetch Online Users
  useEffect(() => {
    // Query users active recently
    const q = query(
      collection(db, "users"),
      orderBy("lastSeen", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for users active in the last 5 minutes
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const activeUsers = users.filter((u: any) => {
          return u.lastSeen?.toMillis() > fiveMinutesAgo;
      });
      
      setOnlineUsers(activeUsers);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.refresh();
  };

  const handleAuthAction = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      setImageFile(compressedFile);
      
      const previewUrl = URL.createObjectURL(compressedFile);
      setImagePreview(previewUrl);
    } catch (error) {
      console.error("Image compression failed:", error);
      alert("Failed to process image");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreatePost = async () => {
    if (!handleAuthAction()) return;

    if (!newPostContent.trim() && !imageFile) return;

    setSubmitting(true);
    try {
      const token = await user!.getIdToken();
      
      let imageUrl = "";

      if (imageFile) {
        const storageRef = ref(storage, `posts/${user!.uid}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          content: newPostContent,
          imageUrl: imageUrl || undefined
        }),
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts([newPost, ...posts]);
        setNewPostContent("");
        removeImage();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Post creation failed:", error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter out current user from online list to avoid duplication if they are shown at the top
  const otherOnlineUsers = onlineUsers.filter(u => u.id !== user?.uid);
  const visibleOnlineUsers = otherOnlineUsers.slice(0, 5); // Show top 5 others
  const remainingCount = Math.max(0, otherOnlineUsers.length - 5);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-3">
            {/* Logo & Search */}
            <div className="flex items-center gap-10 flex-1">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-slate-200">M</div>
                <span className="font-bold text-xl tracking-tight text-slate-900">Marneilx Forum</span>
              </Link>
              
              <div className="relative w-full max-w-sm hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input type="text" className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl bg-slate-100 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 sm:text-sm transition duration-200" placeholder="Search discussions..." />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {!authLoading && user ? (
                <>
                   <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                  </button>
                  
                  <div className="flex items-center gap-2 ml-1 cursor-pointer group relative h-full">
                    <img className="h-9 w-9 rounded-xl object-cover ring-2 ring-white shadow-sm" src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} alt="User avatar" />
                    <div className="hidden group-hover:block absolute right-0 top-full pt-2 z-50 min-w-[150px]">
                         <div className="bg-white shadow-lg rounded-xl p-2 border border-slate-100">
                            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                                {user.displayName || "User"}
                            </div>
                            <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                         </div>
                    </div>
                  </div>
                </>
              ) : (
                 <div className="flex gap-3">
                     <Link href="/login" className="text-slate-600 font-semibold hover:text-slate-900 transition text-sm py-2">Login</Link>
                     <Link href="/register" className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-md shadow-slate-200">Register</Link>
                 </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* LEFT SIDEBAR (Navigation) */}
          <div className="hidden md:block md:col-span-3 lg:col-span-2 space-y-8 sticky top-28 self-start">
            
            <div className="space-y-1">
              <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Menu</p>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-900 bg-white rounded-xl shadow-sm font-semibold border border-slate-100 transition">
                <LayoutGrid className="h-4 w-4 text-indigo-500" />
                Feed
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-500 rounded-xl hover:bg-white hover:text-slate-900 hover:shadow-sm transition font-medium">
                <Bookmark className="h-4 w-4" />
                Saved
              </a>
               <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-500 rounded-xl hover:bg-white hover:text-slate-900 hover:shadow-sm transition font-medium">
                <Hash className="h-4 w-4" />
                Tags
              </a>
            </div>

            <div className="space-y-1">
              <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Categories</p>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-xl hover:bg-white hover:text-indigo-600 transition group">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition"></span>
                General
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-xl hover:bg-white hover:text-indigo-600 transition group">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition"></span>
                Minecraft
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-xl hover:bg-white hover:text-indigo-600 transition group">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition"></span>
                Q&A
              </a>
            </div>
          </div>

          {/* CENTER COLUMN (Feed) */}
          <div className="md:col-span-9 lg:col-span-7 space-y-6">
            
            {/* Expanded Input Widget */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-8">
               <div className="flex gap-4">
                  <img 
                    className="h-10 w-10 rounded-xl object-cover bg-slate-100" 
                    src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || 'guest'}`} 
                    alt="Current user" 
                  />
                  <div className="w-full">
                      <input 
                        type="text" 
                        className="bg-slate-50 border-none text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-slate-200 block w-full p-3 transition placeholder:text-slate-400" 
                        placeholder={user ? "Share your thoughts or ask a question..." : "Login to share your thoughts..."}
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        onClick={() => !user && setIsAuthModalOpen(true)}
                      />
                      {imagePreview && (
                        <div className="mt-3 relative inline-block">
                            <img src={imagePreview} alt="Preview" className="h-32 rounded-lg border border-slate-100 object-cover" />
                            <button onClick={removeImage} className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-slate-400 hover:text-red-500 transition">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                      )}
                  </div>
               </div>
               
               <div className="flex justify-between items-center mt-3 pt-2 pl-[3.25rem]">
                  <div className="flex gap-1">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        onChange={handleImageSelect} 
                        className="hidden" 
                        id="image-upload"
                        disabled={!user}
                      />
                      <label htmlFor="image-upload">
                          <div className={cn("flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition text-xs font-bold cursor-pointer", !user && "opacity-50 cursor-not-allowed")}>
                              <ImageIcon className="h-4 w-4" />
                              <span className="hidden sm:inline">Media</span>
                          </div>
                      </label>
                      
                      <button className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs font-bold" title="Create Poll (Coming Soon)">
                          <BarChart2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Poll</span>
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition text-xs font-bold" title="Event (Coming Soon)">
                          <CalendarDays className="h-4 w-4" />
                          <span className="hidden sm:inline">Event</span>
                      </button>
                       <button className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition text-xs font-bold" title="Formatting">
                          <Type className="h-4 w-4" />
                      </button>
                  </div>
                  <button 
                    onClick={handleCreatePost}
                    disabled={submitting || (!newPostContent.trim() && !imageFile)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                      {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                      Post
                  </button>
               </div>
            </div>

            {/* Sort Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200 pb-1 mb-6 px-2">
              <button className="text-sm font-bold text-slate-900 border-b-2 border-slate-900 pb-3">Latest</button>
              <button className="text-sm font-medium text-slate-500 hover:text-slate-800 pb-3 transition">Older</button>
            </div>

            {/* Posts Feed */}
            {loadingPosts ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 p-10">
                    <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                         {/* Used Search icon as generic placeholder since MessageCircle was removed */}
                        <Search className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-2">No posts yet</h3>
                    <p className="text-slate-500 text-sm">Be the first to start the conversation!</p>
                </div>
            ) : (
                posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))
            )}

          </div>

          {/* RIGHT SIDEBAR (Widgets) */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            
            {/* Online Users Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900">Online Users</h3>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              
              <div className="space-y-4">
                {user && (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-2 -mx-2">
                    <div className="relative">
                      <img className="h-9 w-9 rounded-full object-cover ring-2 ring-white" src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} alt="Current user avatar"/>
                      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.displayName || user.email?.split('@')[0] || "You"}</p>
                      <p className="text-xs text-emerald-500 truncate">Online now</p>
                    </div>
                  </div>
                )}
                
                {/* Real Online Users List */}
                {visibleOnlineUsers.length > 0 ? (
                    visibleOnlineUsers.map((u) => (
                        <div key={u.id} className="flex items-center gap-3">
                            <div className="relative">
                                <img className="h-9 w-9 rounded-full bg-slate-100 ring-2 ring-white" src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${u.email || u.id}`} alt={u.displayName}/>
                                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{u.displayName || "Anonymous"}</p>
                                <p className="text-xs text-slate-500 truncate">Browsing...</p>
                            </div>
                        </div>
                    ))
                ) : (
                    !user && (
                        <p className="text-sm text-slate-400 text-center italic py-2">No one else is online right now.</p>
                    )
                )}
              </div>
              
              {remainingCount > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-50 text-center">
                    <p className="text-xs font-semibold text-slate-400">+ {remainingCount} others online</p>
                </div>
              )}
            </div>

            {/* Core Values Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900">
                <ShieldCheck className="h-5 w-5 text-indigo-500" />
                Core Values
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1 bg-indigo-50 p-2 rounded-lg h-fit">
                    <HeartHandshake className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Be Kind</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Treat everyone with respect. We are a community of learners.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 bg-amber-50 p-2 rounded-lg h-fit">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Stay Curious</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Ask questions freely. There are no bad questions here.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 bg-emerald-50 p-2 rounded-lg h-fit">
                    <Share className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Share Knowledge</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Help others grow by sharing your experiences.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-slate-400 px-2 text-center">
              <p>&copy; 2025 Marneilx.</p>
            </div>

          </div>
        </div>
      </div>

      {/* Auth Required Modal (Custom Implementation) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Authentication Required</h3>
              <p className="text-slate-500 mt-2">You need to be logged in to post or interact with the community.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Link href="/login" className="w-full">
                 <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition">
                   Login
                 </button>
              </Link>
              <Link href="/register" className="w-full">
                <button className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-3 px-4 rounded-xl transition">
                  Register
                </button>
              </Link>
            </div>
            
            <button 
              onClick={() => setIsAuthModalOpen(false)} 
              className="mt-4 text-sm text-slate-400 hover:text-slate-600 w-full text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

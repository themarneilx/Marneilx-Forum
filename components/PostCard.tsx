"use client";

import { useState, useEffect } from "react";
import { Post, Comment } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { 
  ThumbsUp,
  ThumbsDown,
  MessageCircle, 
  Bookmark, 
  Send,
  Loader2,
  Trash2
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post: initialPost }: PostCardProps) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Listen for real-time post updates (votes)
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "posts", initialPost.id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setPost({ id: docSnapshot.id, ...docSnapshot.data() } as Post);
      }
    });
    return () => unsubscribe();
  }, [initialPost.id]);

  // Listen for comments
  useEffect(() => {
    const q = query(
      collection(db, "posts", initialPost.id, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toMillis?.() || Date.now(),
      })) as Comment[];
      setComments(loadedComments);
    });

    return () => unsubscribe();
  }, [initialPost.id]);

  const handleVote = async (type: 'up' | 'down') => {
    if (!user) {
        alert("Please login to vote.");
        return;
    }

    const postRef = doc(db, "posts", post.id);
    const userId = user.uid;
    const hasUpvoted = post.upvotes?.includes(userId);
    const hasDownvoted = post.downvotes?.includes(userId);

    try {
        if (type === 'up') {
            if (hasUpvoted) {
                // Remove upvote
                await updateDoc(postRef, {
                    upvotes: arrayRemove(userId)
                });
            } else {
                // Add upvote, remove downvote if exists
                await updateDoc(postRef, {
                    upvotes: arrayUnion(userId),
                    downvotes: arrayRemove(userId)
                });
            }
        } else {
            if (hasDownvoted) {
                // Remove downvote
                await updateDoc(postRef, {
                    downvotes: arrayRemove(userId)
                });
            } else {
                // Add downvote, remove upvote if exists
                await updateDoc(postRef, {
                    downvotes: arrayUnion(userId),
                    upvotes: arrayRemove(userId)
                });
            }
        }
    } catch (error) {
        console.error("Vote failed:", error);
        alert("Failed to vote.");
    }
  };

  const handleCommentSubmit = async () => {
    if (!user) {
        alert("Please login to comment.");
        return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "posts", post.id, "comments"), {
        content: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || "User",
        authorAvatar: user.photoURL,
        createdAt: serverTimestamp(),
      });
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
        await deleteDoc(doc(db, "posts", post.id));
        // Post will automatically be removed from the list due to the parent's onSnapshot/fetch listener
        // or we might need to refresh the page if the parent is using simple fetch. 
        // But usually, it's better to just handle the delete success.
        // Since the parent in page.tsx uses fetchPosts() on mount and not a real-time listener for the *list* of posts (it does use a real-time listener for *online users*),
        // the post won't disappear instantly from the feed unless we trigger a refresh or the user refreshes.
        // However, for a quick implementation, we can reload or let the user know.
        // Actually, looking at page.tsx, it uses fetch(). So we should probably reload the window or use a callback.
        // For now, simply deleting it.
        window.location.reload(); 
    } catch (error) {
        console.error("Error deleting post:", error);
        alert("Failed to delete post.");
        setIsDeleting(false);
    }
  };

  const upvoteCount = post.upvotes?.length || 0;
  const downvoteCount = post.downvotes?.length || 0;
  const userHasUpvoted = user ? post.upvotes?.includes(user.uid) : false;
  const userHasDownvoted = user ? post.downvotes?.includes(user.uid) : false;
  const isOwner = user?.uid === post.authorId;

  return (
    <article className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition duration-300">
      {/* User Meta */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
            {post.authorName?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{post.authorName}</h3>
            <p className="text-xs text-slate-500">
              {new Date(post.createdAt).toLocaleDateString()} • {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
        </div>
        
        {isOwner && (
            <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                title="Delete Post"
            >
                {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            </button>
        )}
      </div>

      {/* Content */}
      <p className="text-slate-800 text-[15px] leading-relaxed mb-4 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Image */}
      {post.imageUrl && (
        <div className="rounded-xl overflow-hidden max-h-96 w-full bg-slate-50 mb-5 relative group border border-slate-100">
          <img src={post.imageUrl} className="w-full h-full object-contain" alt="Post content" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-2 border-t border-slate-50">
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
            <button 
                onClick={() => handleVote('up')}
                className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md transition", userHasUpvoted ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:bg-white/50 hover:text-emerald-600")}
            >
                <ThumbsUp className={cn("h-4 w-4", userHasUpvoted && "fill-current")} />
                <span className="text-xs font-bold">{upvoteCount}</span>
            </button>
            <div className="w-px h-4 bg-slate-200"></div>
            <button 
                onClick={() => handleVote('down')}
                className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md transition", userHasDownvoted ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:bg-white/50 hover:text-rose-600")}
            >
                <ThumbsDown className={cn("h-4 w-4", userHasDownvoted && "fill-current")} />
                {downvoteCount > 0 && <span className="text-xs font-bold">{downvoteCount}</span>}
            </button>
        </div>

        <button 
            onClick={() => setShowComments(!showComments)}
            className={cn("flex items-center gap-2 transition group", showComments ? "text-indigo-600" : "text-slate-500 hover:text-indigo-600")}
        >
          <MessageCircle className="h-5 w-5 group-hover:scale-110 transition" />
          <span className="text-sm font-medium">
             {comments.length === 0 
                ? "Comment" 
                : comments.length === 1 
                    ? "1 Comment" 
                    : `${comments.length} Comments`}
          </span>
        </button>
        <div className="flex-grow"></div>
        <button className="text-slate-400 hover:text-slate-900 transition">
          <Bookmark className="h-5 w-5" />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* Comments List */}
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {comments.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4 italic">No comments yet. Be the first!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <img 
                                src={comment.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.authorName}`} 
                                alt={comment.authorName}
                                className="h-8 w-8 rounded-full bg-slate-100 flex-shrink-0"
                            />
                            <div className="flex-1 bg-slate-50 rounded-xl rounded-tl-none p-3">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-sm font-bold text-slate-900">{comment.authorName}</span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Comment Input */}
            <div className="flex gap-3 items-start">
                <img 
                    src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email || 'guest'}`} 
                    className="h-8 w-8 rounded-full bg-slate-100 flex-shrink-0 mt-1"
                    alt="Your avatar"
                />
                <div className="flex-1 relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={user ? "Write a comment..." : "Login to comment..."}
                        disabled={!user || submitting}
                        rows={1}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 pr-12 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition resize-none overflow-hidden min-h-[42px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleCommentSubmit();
                            }
                            // Auto-resize logic could go here but let's keep it simple
                        }}
                    />
                    <button 
                        onClick={handleCommentSubmit}
                        disabled={!user || !newComment.trim() || submitting}
                        className="absolute right-2 top-1.5 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                </div>
            </div>
        </div>
      )}
    </article>
  );
}

import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { Post } from "@/types";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("posts")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const posts: Post[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];

    return NextResponse.json(posts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    const { content, imageUrl } = await request.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    let authorDisplayName = decodedToken.name;
    if (!authorDisplayName && decodedToken.email) {
      // If displayName is not set, and email is a placeholder, clean it.
      if (decodedToken.email.endsWith('@private.marneilx.com')) {
        authorDisplayName = decodedToken.email.split('@')[0];
      } else {
        // Otherwise, use the email as displayName if no name is available
        authorDisplayName = decodedToken.email;
      }
    }
    authorDisplayName = authorDisplayName || "Anonymous"; // Final fallback

    const newPost: Omit<Post, "id"> = {
      content,
      authorName: authorDisplayName,
      authorId: decodedToken.uid,
      createdAt: Date.now(),
      upvotes: [],
      downvotes: [],
      ...(imageUrl && { imageUrl }),
    };

    const docRef = await adminDb.collection("posts").add(newPost);

    return NextResponse.json({ id: docRef.id, ...newPost });
  } catch (error: any) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

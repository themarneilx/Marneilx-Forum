# Marneilx Forum

A modern, real-time community forum application built with Next.js and Firebase.

![Marneilx Forum Preview](https://placehold.co/600x400?text=Marneilx+Forum+Preview)

## 🚀 Features

- **Authentication**: Secure Login and Registration using Firebase Authentication.
- **Real-time Feed**: Browse posts and discussions.
- **Create Posts**: Share your thoughts with text and image uploads.
- **Interactions**:
  - **Voting**: Upvote and Downvote posts with real-time updates.
  - **Commenting**: Engage in discussions with a real-time comment system.
- **User Management**:
  - **Online Presence**: See who is currently online in real-time.
  - **Profile**: User avatars (with DiceBear fallback) and display names.
  - **Moderation**: Users can delete their own posts.
- **Responsive Design**: Beautiful UI built with Tailwind CSS, optimized for mobile and desktop.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend / DB**: [Firebase](https://firebase.google.com/) (Auth, Firestore, Storage)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher) installed.
- A Firebase project created at [console.firebase.google.com](https://console.firebase.google.com/).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd forum_project
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add your Firebase configuration keys:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    
    # For server-side admin operations (if used)
    FIREBASE_PROJECT_ID=your_project_id
    FIREBASE_CLIENT_EMAIL=your_service_account_email
    FIREBASE_PRIVATE_KEY="your_private_key"
    ```

4.  **Setup Firestore Security Rules:**
    Go to your Firebase Console -> Firestore Database -> Rules and publish the following rules to ensure the app functions correctly:

    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        
        // Posts: 
        // - Read: Public
        // - Create: Authenticated
        // - Update: Authenticated (for votes)
        // - Delete: Author only
        match /posts/{postId} {
          allow read: if true;
          allow create: if request.auth != null;
          allow update: if request.auth != null;
          allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;

          // Comments: Public read, Authenticated create
          match /comments/{commentId} {
            allow read: if true;
            allow create: if request.auth != null;
          }
        }
        
        // Users: Public read (for Online Users list), Owner write (for presence)
        match /users/{userId} {
          allow read: if true;
          allow write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

To deploy the application, you can use Vercel (recommended for Next.js) or any platform that supports Next.js.

```bash
npm run build
npm start
```

## 📄 License

This project is open source.
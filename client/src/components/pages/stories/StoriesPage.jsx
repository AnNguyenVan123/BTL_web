import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, LogIn } from 'lucide-react'; // Added LogIn icon
import StoryCreator from './StoryCreator';
import { db } from '../../../lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
// 1. Import the hook from your AuthContext file
import { useAuth } from '../../../context/AuthContext.jsx';

export default function StoriesPage() {
  // 2. Consume Auth Context
  const { user, loginWithGoogle } = useAuth();

  const [myStories, setMyStories] = useState([]);
  const [friendsStories, setFriendsStories] = useState([]);
  const [popularStories, setPopularStories] = useState([]);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [loadingStories, setLoadingStories] = useState(true);

  // Viewer State
  const [viewerState, setViewerState] = useState({ isOpen: false, playlist: [], index: 0 });
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef(null);

  // --- FETCH DATA ---
  useEffect(() => {
    const storiesRef = collection(db, 'stories');
    const q = query(storiesRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (user) {
        // If logged in: Separate "My Stories" from "Friends"
        setMyStories(allData.filter(s => s.uid === user.uid));
        setFriendsStories(allData.filter(s => s.uid !== user.uid && !s.isPopular));
        console.log("Logged in user:", user.uid);
        console.log(user.photoURL);
      } else {
        // If logged out: No "My Stories", everyone is in the "Friends/Public" list
        setMyStories([]);
        setFriendsStories(allData.filter(s => !s.isPopular));
      }
      
      setPopularStories(allData.filter(s => s.isPopular === true));
      setLoadingStories(false);
    });

    return () => unsubscribe();
  }, [user]); // Re-run fetch when user login state changes

  // --- ACTIONS ---
  const handleCreateStory = async () => {
    if (!user) {
      try {
        await loginWithGoogle();
      } catch (error) {
        console.error("Login failed", error);
      }
    } else {
      setIsCreatorOpen(true);
    }
  };

  // --- VIEWER HELPERS ---
  const currentStory = viewerState.isOpen ? viewerState.playlist[viewerState.index] : null;

  const openStoryViewer = (playlist, index = 0) => {
    setViewerState({ isOpen: true, playlist, index });
  };

  const closeViewer = () => {
    setViewerState({ ...viewerState, isOpen: false });
    setProgress(0);
  };

  const handleNext = () => {
    if (viewerState.index < viewerState.playlist.length - 1) {
      setViewerState(prev => ({ ...prev, index: prev.index + 1 }));
    } else {
      closeViewer();
    }
  };

  const handlePrev = () => {
    if (viewerState.index > 0) {
      setViewerState(prev => ({ ...prev, index: prev.index - 1 }));
    } else {
      setProgress(0);
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  };

  // --- PROGRESS TIMER ---
  useEffect(() => {
    if (!viewerState.isOpen || isPaused || !currentStory) return;
    const stepTime = 50;
    const duration = currentStory.duration || 5000;
    const stepValue = 100 / (duration / stepTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + stepValue;
      });
    }, stepTime);
    return () => clearInterval(timer);
  }, [viewerState, isPaused, currentStory]);

  if (loadingStories) return <div className="min-h-screen flex items-center justify-center">Loading Stories...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10">
      
      {/* AR CREATOR MODAL - Only render if user exists */}
      {isCreatorOpen && user && (
        <StoryCreator 
          onClose={() => setIsCreatorOpen(false)} 
          currentUser={user} // Pass the real user object
        />
      )}

      <div className="container mx-auto max-w-5xl px-4 pt-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Moments</h1>
          
          {/* Dynamic Header Button */}
          {user ? (
            <button 
               onClick={() => setIsCreatorOpen(true)}
               className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition"
            >
              <Plus size={18} /> New Story
            </button>
          ) : (
            <button 
               onClick={handleCreateStory}
               className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-gray-900 transition"
            >
              <LogIn size={18} /> Login
            </button>
          )}
        </header>

        {/* RAIL: ME & FRIENDS */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 px-1">Recent Updates</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            
            {/* My Story Bubble */}
            <div 
              className="flex flex-col items-center gap-2 cursor-pointer snap-start shrink-0" 
              onClick={() => {
                if (!user) handleCreateStory(); // Trigger login
                else if (myStories.length > 0) openStoryViewer(myStories, 0); // View own story
                else setIsCreatorOpen(true); // Create new
              }}
            >
              <div className="relative w-20 h-20">
                <div className={`w-full h-full rounded-full p-[3px] ${myStories.length > 0 ? 'bg-gradient-to-tr from-green-400 to-blue-500' : 'bg-gray-200 border-dashed border-2 border-gray-400'}`}>
                  {/* Fallback avatar if not logged in */}
                  <img 
                    src={user?.photoURL || "https://i.pravatar.cc/150"} 
                    className={`w-full h-full rounded-full border-2 border-white object-cover ${!user && 'opacity-50 grayscale'}`} 
                    alt="Me" 
                  />
                </div>
                {myStories.length === 0 && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 border-2 border-white">
                    <Plus size={16} strokeWidth={3} />
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-gray-600">Your Story</span>
            </div>

            {/* Friends List */}
            {friendsStories.map((story, index) => (
              <div key={story.id} className="flex flex-col items-center gap-2 cursor-pointer snap-start shrink-0 group" onClick={() => openStoryViewer(friendsStories, index)}>
                <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                    <img src={story.avatar} className="w-full h-full object-cover" alt={story.username} />
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600 truncate max-w-[80px]">{story.username}</span>
              </div>
            ))}
          </div>
        </section>

        {/* GRID: POPULAR */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 px-1">Trending</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularStories.map((story, index) => (
              <div key={story.id} onClick={() => openStoryViewer(popularStories, index)} className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-lg transition-all">
                {/* Show thumbnail or video based on type */}
                {story.type === 'image' ? (
                   <img src={story.media} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="story" />
                ) : (
                   <video src={story.media} className="w-full h-full object-cover" muted />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <img src={story.avatar} className="w-6 h-6 rounded-full border border-white" alt="avatar" />
                  <span className="text-white text-xs font-bold shadow-black drop-shadow-md">{story.username}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* VIEWER OVERLAY */}
      {viewerState.isOpen && currentStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/90 md:backdrop-blur-sm" onClick={closeViewer} />
          <div className="relative w-full h-full md:w-[400px] md:h-[800px] bg-black md:rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-8 md:pt-4 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex gap-1 mb-3">
                {viewerState.playlist.map((_, idx) => (
                  <div key={idx} className="h-[2px] flex-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: idx === viewerState.index ? `${progress}%` : idx < viewerState.index ? '100%' : '0%' }} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <img src={currentStory.avatar} className="w-8 h-8 rounded-full border border-white/50" alt="u" />
                  <span className="text-sm font-semibold">{currentStory.username}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); closeViewer(); }}>
                  <X size={24} className="opacity-80 hover:opacity-100" />
                </button>
              </div>
            </div>

            {/* Content Player */}
            {currentStory.type === 'image' ? (
               <img src={currentStory.media} className="w-full h-full object-contain bg-black" alt="story" />
            ) : (
               <video ref={videoRef} src={currentStory.media} className="w-full h-full object-cover" playsInline autoPlay muted />
            )}

            {/* Navigation Zones */}
            <div className="absolute inset-0 flex z-10">
              <div className="w-[30%] h-full" onClick={handlePrev} />
              <div className="w-[70%] h-full" onClick={handleNext} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
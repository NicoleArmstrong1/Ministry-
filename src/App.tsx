import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  Music, 
  Megaphone, 
  Mic, 
  Send, 
  Languages, 
  ExternalLink, 
  LogOut, 
  LogIn,
  Play,
  SkipForward,
  Church
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  auth, 
  db, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  signInWithPopup, 
  googleProvider, 
  signOut,
  doc,
  setDoc,
  handleFirestoreError,
  OperationType
} from './firebase';

// Ad Data
const ADS = [
  {
    id: 'pepsi',
    name: 'Pepsi',
    image: 'https://picsum.photos/seed/pepsi/800/450',
    title: 'Pepsi: Live For Now',
    description: 'Experience the refreshing taste of Pepsi.'
  },
  {
    id: 'emirates',
    name: 'Emirates',
    image: 'https://picsum.photos/seed/emirates/800/450',
    title: 'Emirates: Fly Better',
    description: 'World-class service to over 150 destinations.'
  },
  {
    id: 'etihad',
    name: 'Etihad',
    image: 'https://picsum.photos/seed/etihad/800/450',
    title: 'Etihad: Choose Well',
    description: 'Sustainable aviation for a better future.'
  },
  {
    id: 'adnoc',
    name: 'ADNOC',
    image: 'https://picsum.photos/seed/adnoc/800/450',
    title: 'ADNOC: Energy for Life',
    description: 'Powering the world with responsible energy.'
  }
];

export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'record' | 'music' | 'advert'>('record');
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [liveState, setLiveState] = useState<any>({ isLive: false, zoomLink: 'https://zoom.us/j/123456789', isRecording: false });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGoingLive, setIsGoingLive] = useState(false);
  const [view, setView] = useState<'landing' | 'room'>('landing');
  const [musicList, setMusicList] = useState<any[]>([]);
  const [customAds, setCustomAds] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth Listener
  useEffect(() => {
    return auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Check if admin
        if (u.email === 'Agnes2022kinyanjui@gmail.com') {
          setIsAdmin(true);
        }
        // Save user profile
        try {
          await setDoc(doc(db, 'users', u.uid), {
            uid: u.uid,
            displayName: u.displayName,
            email: u.email,
            role: u.email === 'Agnes2022kinyanjui@gmail.com' ? 'admin' : 'member'
          }, { merge: true });
        } catch (e) {
          console.error("Error saving user profile", e);
        }
      } else {
        setIsAdmin(false);
      }
    });
  }, []);

  // Comments Listener
  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('timestamp', 'asc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setComments(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'comments');
    });
    return unsubscribe;
  }, []);

  // Live State Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'liveState', 'global'), (doc) => {
      if (doc.exists()) {
        setLiveState(doc.data());
      }
    });
    return unsubscribe;
  }, []);

  // Music Listener
  useEffect(() => {
    const q = query(collection(db, 'music'), orderBy('title', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setMusicList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Custom Ads Listener
  useEffect(() => {
    const q = query(collection(db, 'adverts'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setCustomAds(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Auto-scroll comments
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setView('room');
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setView('landing');
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      await addDoc(collection(db, 'comments'), {
        text: newComment,
        authorName: user.displayName,
        authorUid: user.uid,
        timestamp: serverTimestamp(),
        language: i18n.language
      });
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    }
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'sw' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const triggerAd = (ad: any) => {
    const adData = ad.imageUrl ? { ...ad, image: ad.imageUrl } : ad;
    // For now, we just show it locally, but in a real app we'd sync this to all clients via firestore
    setLiveState((prev: any) => ({ ...prev, currentAd: adData }));
    setShowAd(true);
    setTimeout(() => setShowAd(false), 8000);
  };

  const toggleLive = async () => {
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'liveState', 'global'), {
        ...liveState,
        isLive: !liveState.isLive
      }, { merge: true });
    } catch (e) {
      console.error("Error toggling live state", e);
    }
  };

  const toggleRecording = async () => {
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'liveState', 'global'), {
        ...liveState,
        isRecording: !liveState.isRecording
      }, { merge: true });
    } catch (e) {
      console.error("Error toggling recording", e);
    }
  };

  const addMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const url = (form.elements.namedItem('url') as HTMLInputElement).value;
    if (!title || !url) return;
    try {
      await addDoc(collection(db, 'music'), { title, url, addedBy: user.uid });
      form.reset();
    } catch (e) {
      console.error("Error adding music", e);
    }
  };

  const addAdvert = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const imageUrl = (form.elements.namedItem('imageUrl') as HTMLInputElement).value;
    const title = (form.elements.namedItem('adTitle') as HTMLInputElement).value;
    const description = (form.elements.namedItem('description') as HTMLInputElement).value;
    if (!name || !imageUrl) return;
    try {
      await addDoc(collection(db, 'adverts'), { name, imageUrl, title, description, addedBy: user.uid });
      form.reset();
    } catch (e) {
      console.error("Error adding advert", e);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-slate-900 font-sans">
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white p-6 relative overflow-hidden"
          >
            {/* Churchly Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Large Subtle Cross */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]">
                <svg width="800" height="1200" viewBox="0 0 100 150" fill="currentColor">
                  <rect x="45" y="0" width="10" height="150" rx="2" />
                  <rect x="20" y="40" width="60" height="10" rx="2" />
                </svg>
              </div>
              
              {/* Soft Divine Glows */}
              <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[150px]" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 text-center max-w-3xl">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="mb-8 p-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                  <Church size={48} strokeWidth={1.5} />
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                  {t('ministry_name')}
                </h1>
                <p className="text-xl md:text-2xl text-amber-200/80 italic font-medium mb-12 max-w-2xl">
                  {t('empowerment')}
                </p>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col md:flex-row items-center justify-center gap-6"
              >
                <button 
                  onClick={async () => {
                    if (isAdmin && !liveState.isLive) {
                      await toggleLive();
                    }
                    setView('room');
                  }}
                  className="group relative bg-amber-500 text-slate-950 px-12 py-5 rounded-full font-black text-2xl shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:bg-amber-400 transition-all transform hover:scale-105 flex items-center gap-3"
                >
                  {isAdmin ? <Video size={32} /> : <Play size={32} fill="currentColor" />}
                  {isAdmin ? (liveState.isLive ? 'ENTER LIVE ROOM' : 'GO LIVE NOW') : (liveState.isLive ? 'JOIN LIVE ROOM' : 'ENTER ROOM')}
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-md animate-pulse shadow-lg">
                    {liveState.isLive ? 'LIVE NOW' : 'OFFLINE'}
                  </div>
                </button>

                {!user && (
                  <button 
                    onClick={handleLogin}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-5 rounded-full font-bold text-xl transition-all backdrop-blur-sm"
                  >
                    <LogIn size={24} />
                    ADMIN LOGIN
                  </button>
                )}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-16 text-slate-400 font-medium flex items-center justify-center gap-2"
              >
                <div className="w-8 h-[1px] bg-slate-800" />
                {t('church_till')}
                <div className="w-8 h-[1px] bg-slate-800" />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <header className="bg-[#0f172a] text-white py-6 px-4 shadow-2xl border-b border-white/5">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left cursor-pointer group" onClick={() => setView('landing')}>
                  <div className="flex items-center gap-3 mb-1">
                    <Church size={24} className="text-amber-500" />
                    <h1 className="text-4xl font-bold tracking-tight group-hover:text-amber-400 transition-colors">{t('ministry_name')}</h1>
                  </div>
                  <p className="text-slate-400 text-lg italic font-medium">
                    {t('empowerment')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <button 
                      onClick={toggleLive}
                      className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all shadow-lg ${
                        liveState.isLive 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      <Video size={20} />
                      {liveState.isLive ? 'Stop Live' : 'Go Live'}
                    </button>
                  )}
                  <button 
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 bg-indigo-800 hover:bg-indigo-700 px-4 py-2 rounded-full transition-colors"
                  >
                    <Languages size={20} />
                    <span className="uppercase font-bold">{i18n.language}</span>
                  </button>
                  {user ? (
                    <div className="flex items-center gap-3">
                      <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-indigo-400" referrerPolicy="no-referrer" />
                      <button onClick={handleLogout} className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors">
                        <LogOut size={20} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleLogin} className="flex items-center gap-2 bg-white text-indigo-900 px-6 py-2 rounded-full font-bold hover:bg-indigo-50 transition-colors">
                      <LogIn size={20} />
                      Login
                    </button>
                  )}
                </div>
              </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Live Stream & Controls */}
              <div className="lg:col-span-2 space-y-6">
                {/* Video Player Area */}
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl group">
                  {showAd ? (
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={liveState.currentAd?.id || 'default-ad'}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black"
                      >
                        <img 
                          src={liveState.currentAd?.image || ADS[currentAdIndex].image} 
                          alt={liveState.currentAd?.name || ADS[currentAdIndex].name} 
                          className="w-full h-full object-cover opacity-80"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-12 left-12 text-white">
                          <motion.div 
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-indigo-600 px-4 py-1 text-xs font-bold uppercase tracking-widest mb-2 inline-block"
                          >
                            Commercial
                          </motion.div>
                          <motion.h2 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-5xl font-black mb-2"
                          >
                            {liveState.currentAd?.title || ADS[currentAdIndex].title}
                          </motion.h2>
                          <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="text-xl text-indigo-100"
                          >
                            {liveState.currentAd?.description || ADS[currentAdIndex].description}
                          </motion.p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  ) : liveState.isLive ? (
                    <iframe
                      src={`https://meet.jit.si/LightbearerVMinistryLive#config.startWithAudioMuted=true&config.startWithVideoMuted=false&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","closedcaptions","desktop","fullscreen","fodeviceselection","hangup","profile","chat","recording","livestreaming","etherpad","sharedvideo","settings","raisehand","videoquality","filmstrip","invite","feedback","stats","shortcuts","tileview","videobackgroundblur","download","help","mute-everyone","e2ee"]`}
                      allow="camera; microphone; fullscreen; display-capture; autoplay"
                      className="w-full h-full border-none"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Video size={64} className="text-slate-700 mx-auto mb-4" />
                        <h3 className="text-white text-2xl font-bold mb-4">Ministry is currently offline</h3>
                        <p className="text-slate-400 mb-6">Join us every Sunday for our live service.</p>
                        <a 
                          href={liveState.zoomLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg"
                        >
                          <ExternalLink size={20} />
                          {t('join_zoom')}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Live Badge */}
                  {liveState.isLive && (
                    <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-md font-bold text-sm animate-pulse z-10">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      {t('live')}
                    </div>
                  )}
                </div>

                {/* Interactive Tabs */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="flex border-b">
                    {(['record', 'music', 'advert'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all ${
                          activeTab === tab 
                            ? 'bg-amber-50 text-amber-900 border-b-4 border-amber-600' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {tab === 'record' && <Mic size={20} />}
                        {tab === 'music' && <Music size={20} />}
                        {tab === 'advert' && <Megaphone size={20} />}
                        {t(`tabs.${tab}`)}
                      </button>
                    ))}
                  </div>
                  
                  <div className="p-6 min-h-[200px]">
                    {activeTab === 'record' && (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                          liveState.isRecording ? 'bg-red-600 text-white animate-pulse shadow-lg' : 'bg-red-100 text-red-600'
                        }`}>
                          <Mic size={40} />
                        </div>
                        <p className="text-slate-500 font-medium">
                          {liveState.isRecording ? 'Recording is currently active. Your session is being saved to the cloud.' : 'Recording is ready. Click to start capturing this session.'}
                        </p>
                        {isAdmin && (
                          <button 
                            onClick={toggleRecording}
                            className={`px-8 py-2 rounded-full font-bold transition-colors ${
                              liveState.isRecording ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {liveState.isRecording ? 'Stop Recording' : 'Start Recording'}
                          </button>
                        )}
                      </div>
                    )}

                    {activeTab === 'music' && (
                      <div className="space-y-6">
                        {isAdmin && (
                          <form onSubmit={addMusic} className="bg-slate-50 p-4 rounded-xl flex flex-col md:flex-row gap-3">
                            <input name="title" placeholder="Song Title" className="flex-1 p-2 rounded-lg border" required />
                            <input name="url" placeholder="Music URL (mp3/stream)" className="flex-1 p-2 rounded-lg border" required />
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">Add Music</button>
                          </form>
                        )}
                        
                        <div className="space-y-3">
                          {musicList.length === 0 && !isAdmin && <p className="text-center text-slate-400 py-8">No music tracks available yet.</p>}
                          {musicList.map((track) => (
                            <div key={track.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors group">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                  <Music size={24} />
                                </div>
                                <div>
                                  <h4 className="font-bold">{track.title}</h4>
                                  <p className="text-sm text-slate-500">{track.artist || 'Lightbearer V Ministry'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-indigo-100 rounded-full text-indigo-600 transition-colors">
                                  <Play size={24} fill="currentColor" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'advert' && (
                      <div className="space-y-6">
                        {isAdmin && (
                          <form onSubmit={addAdvert} className="bg-slate-50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input name="name" placeholder="Brand Name (e.g. Pepsi)" className="p-2 rounded-lg border" required />
                            <input name="imageUrl" placeholder="Image URL" className="p-2 rounded-lg border" required />
                            <input name="adTitle" placeholder="Ad Title" className="p-2 rounded-lg border" />
                            <textarea name="description" placeholder="Ad Description" className="p-2 rounded-lg border md:col-span-2" rows={2} />
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold md:col-span-2">Add Commercial</button>
                          </form>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Default Ads */}
                          {ADS.map((ad, idx) => (
                            <button
                              key={ad.id}
                              onClick={() => triggerAd(ad)}
                              className="group relative aspect-video rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1"
                            >
                              <img src={ad.image} alt={ad.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play size={32} className="text-white" fill="currentColor" />
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-2">
                                <p className="text-white text-xs font-bold truncate">{ad.name}</p>
                              </div>
                            </button>
                          ))}
                          {/* Custom Ads */}
                          {customAds.map((ad) => (
                            <button
                              key={ad.id}
                              onClick={() => triggerAd(ad)}
                              className="group relative aspect-video rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border-2 border-indigo-200"
                            >
                              <img src={ad.imageUrl} alt={ad.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play size={32} className="text-white" fill="currentColor" />
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-indigo-900/80 p-2">
                                <p className="text-white text-xs font-bold truncate">{ad.name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Church Info */}
                <div className="bg-[#0f172a] text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                      <Megaphone size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-amber-400">Support Our Mission</h3>
                      <p className="text-slate-400">{t('church_till')}</p>
                    </div>
                  </div>
                  <button className="bg-amber-500 text-slate-950 px-8 py-3 rounded-full font-black text-lg hover:bg-amber-400 transition-colors shadow-lg">
                    DONATE NOW
                  </button>
                </div>
              </div>

              {/* Right Column: Chat/Comments */}
              <div className="bg-white rounded-2xl shadow-xl flex flex-col h-[600px] lg:h-auto overflow-hidden border border-slate-200">
                <div className="bg-[#0f172a] text-white p-4 flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Send size={20} className="text-amber-500" />
                    {t('comment_section')}
                  </h3>
                  <span className="bg-amber-600 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                    Live
                  </span>
                </div>

                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
                >
                  {comments.map((comment) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={comment.id} 
                      className={`flex flex-col ${comment.authorUid === user?.uid ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                        {comment.authorName} • {comment.language?.toUpperCase()}
                      </span>
                      <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                        comment.authorUid === user?.uid 
                          ? 'bg-amber-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                      }`}>
                        <p className="text-xl font-bold leading-tight">
                          {comment.text}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-4 border-t bg-white">
                  {user ? (
                    <form onSubmit={sendComment} className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-slate-100 border-none rounded-full px-6 py-3 focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                      />
                      <button 
                        type="submit"
                        className="bg-amber-600 text-white p-3 rounded-full hover:bg-amber-700 transition-colors shadow-lg"
                      >
                        <Send size={24} />
                      </button>
                    </form>
                  ) : (
                    <button 
                      onClick={handleLogin}
                      className="w-full bg-slate-900 text-white py-3 rounded-full font-bold hover:bg-slate-800 transition-colors"
                    >
                      Login to Comment
                    </button>
                  )}
                </div>
              </div>
            </main>

            {/* Footer Commercial Ticker */}
            <footer className="bg-slate-900 text-white/40 py-4 overflow-hidden border-t border-white/5">
              <div className="flex whitespace-nowrap animate-marquee">
                {[...Array(10)].map((_, i) => (
                  <span key={i} className="mx-8 font-black tracking-widest text-sm uppercase">
                    Pepsi • Emirates • Etihad • ADNOC • Lightbearer V Ministry • Vision • Destiny • Transformation
                  </span>
                ))}
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

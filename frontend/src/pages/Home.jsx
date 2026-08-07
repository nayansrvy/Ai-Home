import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './Home.css';
import { Share, PinOff, Edit2, Edit3, Trash2, MoreVertical, Paperclip, Clock, ImageIcon, Lightbulb, Search, Globe, FolderOpen, MoreHorizontal, ChevronRight, ChevronDown, Check, ArrowLeft, Sparkles, Mic, AudioWaveform, Video, PenTool, HardDrive, Send, X, Camera, LayoutGrid, Plug, Feather, Code, BookOpen, Coffee, Shuffle, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
// Phase 4: Bottom drawers + premium toasts
import { Drawer } from 'vaul';
import { toast, Toaster } from 'sonner';
import AccountSwitcherModal from '../components/AccountSwitcherModal';



// --- ICONS (Named export so Login.jsx can reuse) ---
export const ModelIcon = ({ model, className = "w-6 h-6" }) => {
  const logoMap = {
    'chatgpt':    '/logos/chatgpt.png',
    'gemini':     '/logos/gemini.png',
    'claude':     '/logos/claude.png',
    'perplexity': '/logos/perplexity.png',
    'deepseek':   '/logos/deepseek.png',
    'grok':       '/logos/grok.png',
  };

  // Only apply invert filter to models with black logos
  const needsInvert = ['chatgpt', 'perplexity', 'grok'].includes(model);

  if (logoMap[model]) {
    return (
      <img 
        src={logoMap[model]} 
        alt={`${model} logo`} 
        className={`${className} object-contain ${needsInvert ? 'dynamic-invert' : ''}`} 
      />
    );
  }

  return <div className={`w-3 h-3 rounded-full bg-gray-500 ${className}`}></div>;
};

// --- HEADER TOKEN DISPLAY ---
const HeaderTokenDisplay = ({ credits = 0, onClick }) => (
    <div onClick={onClick} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer group select-none">
        <div className={`w-2.5 h-2.5 rounded-full ${credits > 0 ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse'}`}></div>
        <span className={`text-base font-mono font-extrabold ${credits > 50 ? 'text-[var(--text-primary)]' : 'text-red-500'} group-hover:text-blue-500 transition-colors`}>
            {credits} <span className="text-[11px] opacity-70 font-bold ml-0.5 tracking-wider">TKN</span>
        </span>
    </div>
);

// --- 🆕 PREMIUM ANIMATION VARIANTS (Emil Kowalski style) ---

// Phase 2: Stagger container — cards fan in with 0.08s delay between each
const cardContainerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

// Phase 2: Each AI card slides up 20px and fades in with spring
const cardItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 22 },
  },
};

// Legacy sidebar item variant (kept for other uses)
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
};

const SkeletonLoader = () => (
  <div className="flex flex-col gap-2 w-full mt-2 mb-2">
    <div className="flex items-center gap-2 mb-1">
      <div className="w-5 h-5 rounded-full bg-blue-500/20 animate-pulse"></div>
      <div className="h-3 w-20 bg-gray-500/20 rounded animate-pulse"></div>
    </div>
    <div className="h-3 bg-gray-500/20 rounded-full w-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
    <div className="h-3 bg-gray-500/20 rounded-full w-5/6 animate-pulse" style={{ animationDelay: '150ms' }}></div>
    <div className="h-3 bg-gray-500/20 rounded-full w-4/6 animate-pulse" style={{ animationDelay: '300ms' }}></div>
  </div>
);
// --- 🔚 ---


const Home = () => {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState(null);
    const [customAmount, setCustomAmount] = useState('');
    const [showQR, setShowQR] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('upi'); // 'bank', 'upi', 'card'
    const MY_UPI_ID = "7359225663@ybl";
  
  // --- 🆕 Yahan Add Kiya Gaya Hai ---
  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleHistoryMenu = (e, id) => {
      e.stopPropagation();
      setOpenMenuId(openMenuId === id ? null : id);
  };

  // Pehle modal kholega
const confirmDelete = (e, item) => {
    e.stopPropagation();
    setChatToDelete(item); // Chat ki info save karega
    setShowDeleteModal(true); // Modal dikhayega
    setOpenMenuId(null); // 3-dot menu band kar dega
};

// Phir modal ke 'Delete' button par ye call hoga
const finalDeleteAction = () => {
    if (!chatToDelete) return;

    const sessionIdToDelete = chatToDelete.id;

    // UI se hide karo
    const updatedHistory = history.filter(item => item.id !== sessionIdToDelete);
    setHistory(updatedHistory);

    // localStorage mein save karo (Persistence logic)
    const currentDeleted = JSON.parse(localStorage.getItem('deleted-chats') || '[]');
    const newDeletedList = [...currentDeleted, sessionIdToDelete];
    localStorage.setItem('deleted-chats', JSON.stringify(newDeletedList));
    setDeletedChatIds(newDeletedList);

    // Cleanup
    setShowDeleteModal(false);
    setChatToDelete(null);

    // Phase 4: Premium sonner toast
    toast.success('Chat deleted', {
        description: 'The conversation has been removed.',
        duration: 3000,
    });

    if (sessionId === sessionIdToDelete) {
        setChatData({});
        setSessionId(Date.now().toString());
    }
};

  useEffect(() => {
      const handleClickOutside = () => setOpenMenuId(null);
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
  }, []);
  // --- 🔚 ---

  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState(Date.now().toString());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); 
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'Dark');
  const [deletedChatIds, setDeletedChatIds] = useState(
    JSON.parse(localStorage.getItem('deleted-chats') || '[]')
  );
  const [renamedChats, setRenamedChats] = useState(
    JSON.parse(localStorage.getItem('renamed-chats') || '{}')
  );
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [chatToRename, setChatToRename] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [pinnedChatIds, setPinnedChatIds] = useState(
    JSON.parse(localStorage.getItem('pinned-chats') || '[]')
  );
  const [isRecentOpen, setIsRecentOpen] = useState(true);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [singleModelMode, setSingleModelMode] = useState(null);
  // --- ChatGPT Native UI States ---
  const [showChatGPTOptions, setShowChatGPTOptions] = useState(false);
  const [showChatGPTPlusMenu, setShowChatGPTPlusMenu] = useState(false);
  const [chatgptModel, setChatgptModel] = useState('chatgpt'); // 'chatgpt' | 'chatgpt-plus'
  // --- Gemini Native UI States ---
  const [showGeminiPlusMenu, setShowGeminiPlusMenu] = useState(false);
  const [showGeminiVersionMenu, setShowGeminiVersionMenu] = useState(false);
  const [geminiVersion, setGeminiVersion] = useState('3.1-pro'); // selected version
  // --- Claude Native UI States ---
  const [showClaudePlusMenu, setShowClaudePlusMenu] = useState(false);
  const [showClaudeOptions, setShowClaudeOptions] = useState(false);
  const [claudeModel, setClaudeModel] = useState('claude-3-5-sonnet'); // 'claude-3-5-sonnet' | 'claude-3-opus'
  // --- Perplexity Native UI States ---
  const [showPerplexitySearchMenu, setShowPerplexitySearchMenu] = useState(false);
  const [showPerplexityModelMenu, setShowPerplexityModelMenu] = useState(false);
  const [perplexityModel, setPerplexityModel] = useState('Sonar 2'); // selected perplexity model
  const [perplexitySearchMode, setPerplexitySearchMode] = useState('Search');
  // --- DeepSeek Native UI States ---
  const [isDeepThinkEnabled, setIsDeepThinkEnabled] = useState(false);
  const [isDeepSeekSearchEnabled, setIsDeepSeekSearchEnabled] = useState(false);
  const [showDeepSeekOptions, setShowDeepSeekOptions] = useState(false);
  // --- Grok Native UI States ---
  const [showGrokVersionMenu, setShowGrokVersionMenu] = useState(false);
  const [grokVersion, setGrokVersion] = useState('Fast'); // 'Fast' | 'Auto' | 'Expert' | 'Heavy'
  const [visibleModels, setVisibleModels] = useState({ chatgpt: true, gemini: true, claude: true, perplexity: true, deepseek: true, grok: true });
  const [isConclusionExpanded, setIsConclusionExpanded] = useState(false);
  const [credits, setCredits] = useState(0); 
  const [conclusionText, setConclusionText] = useState("Waiting for AI responses...");
  const [showCreditModal, setShowCreditModal] = useState(false);

  const [chatData, setChatData] = useState({});
  const [history, setHistory] = useState([]);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const scrollContainerRef = useRef(null);
  const msgBoxRef = useRef(null);
  const chatEndRefs = useRef({}); 
  const fileInputRef = useRef(null);

  // --- Phase 1: Input focus ring state ---
  const [isInputFocused, setIsInputFocused] = useState(false);

  // --- Phase 2: Track which AI card model is hovered ---
  const [hoveredCard, setHoveredCard] = useState(null);

  // --- Phase 2: Re-run card entrance animation when dashboard opens ---
  const [dashboardKey, setDashboardKey] = useState(0);

  // --- Phase 3: Active pill hover state for sidebar ---
  const [hoveredHistoryItem, setHoveredHistoryItem] = useState(null);

  const models = [
    { id: 'chatgpt', name: 'ChatGPT' }, { id: 'gemini', name: 'Gemini' },
    { id: 'claude', name: 'Claude' }, { id: 'perplexity', name: 'Perplexity' },
    { id: 'deepseek', name: 'DeepSeek' }, { id: 'grok', name: 'Grok' },
  ];

  const API_BASE = "http://127.0.0.1:5000";

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) { navigate('/login'); return; }
    axios.get(`${API_BASE}/api/user/${userId}`).then(res => setCredits(res.data.credits || 0)).catch(console.error);
    fetchHistoryList();
  }, [sessionId]);

  const handleNewChat = () => { setChatData({}); setSingleModelMode(null); setSessionId(Date.now().toString()); setSelectedImage(null); };

  const loadSession = async (sessId) => {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        const res = await axios.get(`${API_BASE}/api/session/${sessId}?userId=${userId}`);
        
        if (!res.data || res.data.length === 0) {
            setChatData({});
            return;
        }

        const organizedChats = {};
        res.data.forEach(msg => {
            const model = msg.modelUsed;
            if (model) {
                if (!organizedChats[model]) organizedChats[model] = [];
                organizedChats[model].push({ 
                    user: msg.userMessage, 
                    ai: msg.aiResponse, 
                    isImage: msg.aiResponse?.startsWith('http') 
                });
            }
        });

        setChatData(organizedChats);
        setSessionId(sessId);
        setSingleModelMode(null);
    } catch (err) { 
        console.error("❌ Frontend Load Error:", err); 
    }
  };

  const handleFileSelect = (e) => { const file = e.target.files[0]; if(file){ const r = new FileReader(); r.onloadend=()=>{setSelectedImage(r.result);setActiveMenu(null);}; r.readAsDataURL(file);}};
  const triggerFilePicker = () => fileInputRef.current && fileInputRef.current.click();

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Browser not supported"); return; }
    if (isListening) { if (recognitionRef.current) recognitionRef.current.stop(); setIsListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => { const t = e.results[0][0].transcript; setMessage(p => (p ? p + " " + t : t)); };
    recognitionRef.current = recognition;
    recognition.start();
  };

  // 1. Rename Modal Kholega
const openRenameModal = (e, item) => {
    e.stopPropagation();
    setChatToRename(item);
    setNewChatTitle(item.title); // Input mein current title dikhayega
    setShowRenameModal(true);
    setOpenMenuId(null);
};

const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setShowQR(true);
};

const getUPILink = () => {
    const amount = selectedAmount === 'custom' ? customAmount : selectedAmount;
    // Standard UPI Payment Link Format
    return `upi://pay?pa=${MY_UPI_ID}&pn=AIHome&am=${amount}&cu=INR`;
};

// 2. LocalStorage aur UI mein save karega
const finalRenameAction = () => {
    if (!chatToRename || !newChatTitle.trim()) return;
    
    const id = chatToRename.id;
    const newRenamed = { ...renamedChats, [id]: newChatTitle };
    
    // State update aur LocalStorage mein save (Reload persistence ke liye)
    setRenamedChats(newRenamed);
    localStorage.setItem('renamed-chats', JSON.stringify(newRenamed));
    
    setShowRenameModal(false);
    setChatToRename(null);

    // Phase 4: Premium sonner toast
    toast.success('Chat renamed', {
        description: `"${newChatTitle}" saved successfully.`,
        duration: 3000,
    });
};

const togglePinChat = (e, item) => {
    e.stopPropagation();
    const id = item.id;
    let newPinnedList;

    if (pinnedChatIds.includes(id)) {
        // Agar pehle se pin hai toh hata do (Unpin)
        newPinnedList = pinnedChatIds.filter(pId => pId !== id);
    } else {
        // Agar pin nahi hai toh list ke start mein add karo
        newPinnedList = [id, ...pinnedChatIds];
    }

    setPinnedChatIds(newPinnedList);
    localStorage.setItem('pinned-chats', JSON.stringify(newPinnedList));
    setOpenMenuId(null); // Menu band kar do
};

const calculateConclusion = async (chatData) => {
    const allAnswers = Object.values(chatData)
        .map(modelChats => modelChats[modelChats.length - 1]?.ai)
        .filter(answer => answer && answer !== "Thinking..." && answer !== "Waiting...");

    const lastQuery = Object.values(chatData)
        .map(modelChats => modelChats[modelChats.length - 1]?.user)
        .find(query => query);

    if (allAnswers.length < 2) {
        return "Aggregating data... Please wait for at least two AI responses to generate a conclusion.";
    }

    try {
        const res = await axios.post(`${API_BASE}/api/synthesize`, {
            allAnswers,
            originalQuery: lastQuery || "Not available"
        });
        return res.data.conclusion;
    } catch (error) {
        console.error("Synthesis Error:", error);
        return "### Synthesis Failed\n\nThe Master Synthesizer could not generate a conclusion at this time. Please try again later.";
    }
};

// 3. fetchHistoryList function ko update karein (taaki reload par renamed title dikhe)
const fetchHistoryList = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return; 
    try {
        const res = await axios.get(`${API_BASE}/api/history?userId=${userId}`);
        if (res.data && Array.isArray(res.data)) {
            const mappedData = res.data.map(item => {
                const id = item.id || item._id;
                // Check karo ki kya humne iska naam badla hua hai local storage mein?
                const savedTitle = renamedChats[id]; 
                return { id, title: savedTitle || item.title || "New Chat" };
            });
            
            const filteredData = mappedData.filter(item => !deletedChatIds.includes(item.id));
            setHistory(filteredData);
        }
    } catch (error) { console.error("History Error"); }
};

const handleShareChat = (e, item) => {
    e.stopPropagation();
    // Aapke frontend ka URL + session ID
    // Example: http://localhost:5173/share/1713123456
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/share/${item.id}`;
    
    setShareLink(link);
    setShowShareModal(true);
    setOpenMenuId(null);
};

const handlePaymentDone = async () => {
    const userId = localStorage.getItem('userId');
    const amount = selectedAmount === 'custom' ? customAmount : selectedAmount;

    if (!amount || amount <= 0) {
        setShowCreditModal(false);
        setShowQR(false);
        return;
    }

    setIsProcessing(true); // 👈 Processing shuru

    try {
        const res = await axios.post(`${API_BASE}/api/add-credits`, {
            userId,
            amount
        });

        if (res.data.success) {
            // 2 second tak "Processing..." dikhane ke liye delay
            setTimeout(() => {
                setCredits(res.data.newBalance); // Balance update
                setIsProcessing(false); // Processing khatam
                setShowCreditModal(false); // Modal band
                setShowQR(false);
                setCustomAmount('');
                setSelectedAmount(null);
            }, 2000); 
        }
    } catch (error) {
        console.error("Payment error", error);
        setIsProcessing(false);
        // Phase 4: Replace alert with sonner toast
        toast.error('Payment failed', {
            description: 'Server error. Please try again.',
            duration: 4000,
        });
    }
};

const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(shareLink);
        setIsCopying(true);
        setTimeout(() => setIsCopying(false), 2000);
        // Phase 4: Premium toast instead of silent state-only feedback
        toast.success('Link copied!', {
            description: 'Share link is in your clipboard.',
            duration: 2500,
        });
    } catch (err) {
        console.error("Failed to copy!", err);
        toast.error('Copy failed', { description: 'Could not access clipboard.' });
    }
};

const handleSendMessage = async () => {
    if (!message.trim() && !selectedImage) return;
    const userId = localStorage.getItem('userId');

    // 1 Word = 5 Tokens Logic
    const getTokensFromText = (text) => {
        if (!text) return 0;
        const words = text.trim().split(/\s+/).length;
        return words * 5; 
    };

    const userMsg = message;
    const currentPromptTokens = getTokensFromText(userMsg);

    // Token check before sending
    if (credits < currentPromptTokens) {
        setShowCreditModal(true);
        return;
    }

    const imgData = selectedImage;
    setMessage(''); 
    setSelectedImage(null);
    if(msgBoxRef.current) msgBoxRef.current.style.height = 'auto';

    const targets = singleModelMode ? [singleModelMode] : models.filter(m => visibleModels[m.id]).map(m => m.id);

    // Set UI to Thinking...
    targets.forEach(modelId => {
        setChatData(prev => ({ 
            ...prev, 
            [modelId]: [...(prev[modelId] || []), { user: userMsg, userImage: imgData, ai: "Thinking...", isImage: false }] 
        }));
    });

    try {
        const requests = targets.map(modelId => 
            axios.post(`${API_BASE}/api/chat`, { 
                message: userMsg, 
                image: imgData, 
                model: modelId, 
                sessionId, 
                userId,
                promptTokens: currentPromptTokens // 👈 Ye Backend se match hona chahiye
            }).then(res => ({ modelId, data: res.data }))
              .catch(err => ({ modelId, error: true }))
        );

        const results = await Promise.all(requests);

        results.forEach(result => {
            if (result.error) {
                setChatData(prev => {
                    const h = [...(prev[result.modelId] || [])];
                    h[h.length-1].ai = "❌ Error: System Busy.";
                    return { ...prev, [result.modelId]: h };
                });
                return;
            }

            const { modelId, data } = result;
            
            // Credits update (Sirf last model se credits update karein taaki sync rahe)
            if (data.remainingCredits !== undefined) {
                setCredits(data.remainingCredits);
            }

            setChatData(prev => {
                const h = [...(prev[modelId] || [])];
                h[h.length-1].ai = data.reply;
                h[h.length-1].isImage = data.isImage || false;
                return { ...prev, [modelId]: h };
            });
        });

        fetchHistoryList(); 

    } catch (error) {
        console.error("Parallel Chat Error:", error);
    }
};

  const handleInput = (e) => { setMessage(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; };
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const toggleMenu = (menuName, e) => { if(e) e.stopPropagation(); setActiveMenu(activeMenu === menuName ? null : menuName); };
  const handleLogout = () => { localStorage.removeItem('userId'); localStorage.removeItem('token'); navigate('/login'); };
  const toggleTheme = () => {
    const newTheme = theme === 'Dark' ? 'Light' : 'Dark';
    localStorage.removeItem('userPhotoURL'); // Clear photo URL on logout
    setTheme(newTheme);
    // localStorage mein save kar raha hai
    localStorage.setItem('app-theme', newTheme);
};
  const handleModelDoubleClick = (modelId) => setSingleModelMode(modelId);
  const handleBackToDashboard = () => { setSingleModelMode(null); setDashboardKey(k => k + 1); };

  useEffect(() => {
    const closeMenus = (e) => {
      setActiveMenu(null);
      setShowChatGPTOptions(false);
      setShowChatGPTPlusMenu(false);
      setShowGeminiPlusMenu(false);
      setShowGeminiVersionMenu(false);
      setShowClaudePlusMenu(false);
      setShowPerplexitySearchMenu(false);
      setShowPerplexityModelMenu(false);
      setShowGrokVersionMenu(false);
      setShowClaudeOptions(false);
      setShowDeepSeekOptions(false);
    };
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);
  useEffect(() => { Object.keys(chatEndRefs.current).forEach(modelId => { if (chatEndRefs.current[modelId]) chatEndRefs.current[modelId].scrollIntoView({ behavior: 'smooth' }); }); }, [chatData]);

  // --- 🧠 Asynchronous Conclusion Synthesis ---
  useEffect(() => {
    const hasResponses = Object.values(chatData).some(
      (chats) => chats.length > 0 && chats[chats.length - 1]?.ai && chats[chats.length - 1].ai !== "Thinking..."
    );

    if (hasResponses) {
      setConclusionText("Synthesizing Master Conclusion...");
      const fetchConclusion = async () => {
        const result = await calculateConclusion(chatData);
        setConclusionText(result);
      };
      fetchConclusion();
    } else {
      setConclusionText("Waiting for AI responses...");
    }
  }, [chatData]);

  useEffect(() => {
    const slider = scrollContainerRef.current;
    if(!slider || singleModelMode) return;
    let isDown = false; let startX, scrollLeft;
    const handleMouseDown = (e) => { isDown = true; slider.classList.add('active'); startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft; };
    const handleMouseLeave = () => { isDown = false; slider.classList.remove('active'); };
    const handleMouseUp = () => { isDown = false; slider.classList.remove('active'); };
    const handleMouseMove = (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - slider.offsetLeft; const walk = (x - startX) * 1.5; slider.scrollLeft = scrollLeft - walk; };
    slider.addEventListener('mousedown', handleMouseDown); slider.addEventListener('mouseleave', handleMouseLeave); slider.addEventListener('mouseup', handleMouseUp); slider.addEventListener('mousemove', handleMouseMove);
    return () => { if(slider) { slider.removeEventListener('mousedown', handleMouseDown); slider.removeEventListener('mouseleave', handleMouseLeave); slider.removeEventListener('mouseup', handleMouseUp); slider.removeEventListener('mousemove', handleMouseMove); }};
  }, [singleModelMode]);

  return (
    <div className={`theme-wrapper font-sans h-screen flex flex-col overflow-hidden ${theme === 'Light' ? 'light-mode' : ''}`}>
      {/* Phase 4: Sonner Toaster — premium stacked toasts */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: theme === 'Light' ? '#ffffff' : '#1e1f20',
            border: theme === 'Light' ? '1px solid #e5e7eb' : '1px solid #333',
            color: theme === 'Light' ? '#1f2937' : '#e3e3e3',
            borderRadius: '16px',
            fontSize: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          },
        }}
        richColors
        expand
      />
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*" />

      {/* ================================================================
          Phase 4: DELETE — vaul Bottom Drawer (replaces centered modal)
          ================================================================ */}
      <Drawer.Root open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[990] bg-black/60 backdrop-blur-sm" />
          <Drawer.Content
            className={`fixed bottom-0 left-0 right-0 z-[1000] flex flex-col rounded-t-[28px] outline-none ${
              theme === 'Light' ? 'bg-[#f0f4f9]' : 'bg-[#1e1f20]'
            }`}
          >
            {/* Drag handle */}
            <div className="mx-auto mt-3 mb-2 w-10 h-1 rounded-full bg-gray-500/30" />
            <div className="px-6 pb-10 pt-4 max-w-lg mx-auto w-full">
              {/* Destructive icon badge */}
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <Drawer.Title className={`text-2xl font-semibold mb-2 ${
                theme === 'Light' ? 'text-gray-900' : 'text-white'
              }`}>
                Delete chat?
              </Drawer.Title>
              <Drawer.Description className={`text-sm leading-relaxed mb-8 ${
                theme === 'Light' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                This will permanently remove this conversation from your AIHome activity.{' '}
                <Link to="/privacy-help" target="_blank" className="text-blue-500 hover:underline">Learn more</Link>
              </Drawer.Description>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`flex-1 py-3.5 rounded-2xl font-medium text-sm transition-all ${
                    theme === 'Light'
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-[#2d2e2f] text-gray-300 hover:bg-[#3d3e3f]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={finalDeleteAction}
                  className="flex-1 py-3.5 rounded-2xl font-medium text-sm bg-red-600 hover:bg-red-700 text-white transition-all active:scale-[0.97]"
                >
                  Delete
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

        {/* --- LINE 330 ke aas paas yahan se replace karein --- */}
        {showCreditModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
                <div className={`w-full ${!showQR ? 'max-w-lg' : 'max-w-4xl'} rounded-[32px] overflow-hidden shadow-2xl transition-all ${theme === 'Light' ? 'bg-[#f0f4f9]' : 'bg-[#1e1f20] border border-gray-800'}`}>
                    
                    {/* Header Area */}
                    {!showQR && (
                        <div className="p-8 pb-4 flex justify-between items-start">
                            <div>
                                <h2 className={`text-3xl font-bold ${theme === 'Light' ? 'text-gray-800' : 'text-white'}`}>Token Station</h2>
                                <p className="text-blue-500 font-medium mt-1 tracking-tight">Current Balance: {credits} TKN</p>
                            </div>
                            <button onClick={() => {setShowCreditModal(false); setShowQR(false);}} className="p-2 hover:bg-gray-500/10 rounded-full transition text-gray-500">✕</button>
                        </div>
                    )}

                    <div className={!showQR ? "p-8 pt-0" : ""}>
                        {!showQR ? (
                            <>
                                <p className={`mb-6 text-sm ${theme === 'Light' ? 'text-gray-500' : 'text-gray-400'}`}>Select a plan to recharge. Rate: ₹1 = 3000 Tokens.</p>
                                
                                {/* Price Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {[1, 9, 99, 999].map((amt) => (
                                        <button 
                                            key={amt}
                                            onClick={() => handleAmountSelect(amt)}
                                            className={`p-6 rounded-2xl border-2 transition-all group flex flex-col items-center gap-1 ${theme === 'Light' ? 'border-gray-200 hover:border-blue-500 bg-white' : 'border-gray-800 hover:border-blue-500 bg-[#151618]'}`}
                                        >
                                            <span className={`text-3xl font-black ${theme === 'Light' ? 'text-gray-800' : 'text-white'}`}>₹{amt}</span>
                                            {/* 🆕 Token Count Calculation */}
                                            <span className="text-[11px] text-blue-500 font-bold uppercase tracking-wider">
                                                {(amt * 3000).toLocaleString()} Tokens
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Amount Input */}
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        placeholder="Enter amount"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        className={`w-full p-5 rounded-2xl border-2 outline-none transition-all pr-24 ${theme === 'Light' ? 'bg-white border-gray-200 focus:border-blue-500 text-gray-800' : 'bg-[#151618] border-gray-800 focus:border-blue-500 text-white'}`}
                                    />
                                    {customAmount > 0 && (
                                        <span className="absolute left-5 -bottom-6 text-[10px] text-blue-500 font-bold uppercase">
                                            You will get {(customAmount * 3000).toLocaleString()} Tokens
                                        </span>
                                    )}
                                    <button 
                                        disabled={!customAmount}
                                        onClick={() => handleAmountSelect('custom')}
                                        className="absolute right-2.5 top-2.5 bottom-2.5 px-6 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        Pay
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col w-full bg-white text-gray-800 animate-fade-in rounded-b-[32px] overflow-hidden">
                                {/* Black Header */}
                                <div className="bg-black text-white p-4 px-6 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-xl flex items-center justify-center">
                                        <Sparkles className="text-white" size={20}/>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">Make Payment to</span>
                                        <span className="text-lg font-bold">AIHome</span>
                                    </div>
                                </div>

                                {/* Sub-header info */}
                                <div className="bg-gray-50 border-b border-gray-200 p-4 px-6 flex justify-between items-center text-sm">
                                    <div className="text-gray-600">
                                        Date: <span className="font-bold text-gray-800">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg">INR {selectedAmount === 'custom' ? customAmount : selectedAmount}.00</div>
                                        <div className="text-xs text-gray-500">Secure 1-Click Checkout</div>
                                    </div>
                                </div>

                                {/* Main Gateway Layout */}
                                <div className="flex flex-col md:flex-row min-h-[400px]">
                                    {/* Left Sidebar */}
                                    <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 flex flex-col pt-2">
                                        <button 
                                            onClick={() => setPaymentMethod('bank')}
                                            className={`flex items-center gap-3 p-4 text-sm font-semibold transition-colors ${paymentMethod === 'bank' ? 'bg-white border-l-4 border-black text-black' : 'text-gray-600 hover:bg-gray-100 border-l-4 border-transparent'}`}
                                        >
                                            <div className="w-5 text-center">🏦</div> Bank Account
                                        </button>
                                        <button 
                                            onClick={() => setPaymentMethod('upi')}
                                            className={`flex items-center gap-3 p-4 text-sm font-semibold transition-colors ${paymentMethod === 'upi' ? 'bg-white border-l-4 border-black text-black' : 'text-gray-600 hover:bg-gray-100 border-l-4 border-transparent'}`}
                                        >
                                            <div className="w-5 text-center">⋈</div> UPI
                                        </button>
                                        <button 
                                            onClick={() => setPaymentMethod('card')}
                                            className={`flex items-center gap-3 p-4 text-sm font-semibold transition-colors ${paymentMethod === 'card' ? 'bg-white border-l-4 border-black text-black' : 'text-gray-600 hover:bg-gray-100 border-l-4 border-transparent'}`}
                                        >
                                            <div className="w-5 text-center">💳</div> Credit / Debit Card
                                        </button>
                                    </div>

                                    {/* Right Content Area */}
                                    <div className="flex-1 p-6 md:p-8 bg-white relative">
                                        
                                        {/* BANK ACCOUNT VIEW */}
                                        {paymentMethod === 'bank' && (
                                            <div className="animate-fade-in space-y-6">
                                                <div>
                                                    <label className="text-sm text-gray-500 mb-2 block">Account Type</label>
                                                    <div className="flex gap-6">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input type="radio" name="accType" defaultChecked className="w-4 h-4 accent-black" />
                                                            <span className="text-sm font-medium">Savings</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input type="radio" name="accType" className="w-4 h-4 accent-black" />
                                                            <span className="text-sm font-medium">Current</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-sm text-gray-500 mb-2 block">Select Bank</label>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                                        {['SBI', 'Bank of Baroda', 'ICICI', 'HDFC'].map((bank, i) => (
                                                            <div key={i} className={`border rounded-lg p-2 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors ${i === 0 ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                                                <span className="font-bold text-xs">{bank}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <select className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-black text-sm">
                                                        <option>State Bank of India</option>
                                                        <option>HDFC Bank</option>
                                                        <option>ICICI Bank</option>
                                                        <option>Axis Bank</option>
                                                    </select>
                                                </div>
                                                <button onClick={handlePaymentDone} disabled={isProcessing} className="w-full bg-[#2d2e2f] hover:bg-black text-white font-bold py-4 rounded-lg mt-4 transition-colors">
                                                    {isProcessing ? 'Processing...' : `Pay INR ${selectedAmount === 'custom' ? customAmount : selectedAmount}.00`}
                                                </button>
                                            </div>
                                        )}

                                        {/* UPI VIEW */}
                                        {paymentMethod === 'upi' && (
                                            <div className="animate-fade-in space-y-4">
                                                <div className="border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors group">
                                                    <div className="w-32 h-32 bg-white p-2 border border-gray-200 rounded-xl mb-4 group-hover:shadow-lg transition-shadow">
                                                        <QRCodeSVG level="H" size="100%" value={getUPILink()}/>
                                                    </div>
                                                    <span className="font-semibold text-gray-700">Scan QR Code</span>
                                                    <span className="text-xs text-gray-400 mt-1">Use any UPI App</span>
                                                </div>
                                                
                                                <div className="relative flex items-center justify-center py-2">
                                                    <div className="border-t border-gray-200 w-full"></div>
                                                    <span className="bg-white px-4 text-xs text-gray-400 absolute">OR</span>
                                                </div>

                                                <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-blue-500 transition-colors">
                                                    <span className="text-xl">▶</span>
                                                    <span className="font-semibold text-gray-700">Enter UPI ID</span>
                                                </div>
                                                
                                                {/* Dummy process button for UI completion */}
                                                <button onClick={handlePaymentDone} disabled={isProcessing} className="w-full bg-[#2d2e2f] hover:bg-black text-white font-bold py-4 rounded-lg mt-4 transition-colors">
                                                    {isProcessing ? 'Verifying...' : 'Verify & Pay'}
                                                </button>
                                            </div>
                                        )}

                                        {/* CARD VIEW */}
                                        {paymentMethod === 'card' && (
                                            <div className="animate-fade-in space-y-4">
                                                <input type="text" placeholder="Credit / Debit Card Number" className="w-full p-4 border border-gray-300 rounded-lg outline-none focus:border-black text-sm" />
                                                <div className="flex gap-4">
                                                    <input type="text" placeholder="Expires On (MM/YY)" className="w-2/3 p-4 border border-gray-300 rounded-lg outline-none focus:border-black text-sm" />
                                                    <input type="password" placeholder="CVV" className="w-1/3 p-4 border border-gray-300 rounded-lg outline-none focus:border-black text-sm" />
                                                </div>
                                                <input type="text" placeholder="Card Holder Name" className="w-full p-4 border border-gray-300 rounded-lg outline-none focus:border-black text-sm" />
                                                
                                                <label className="flex items-start gap-3 mt-4 cursor-pointer">
                                                    <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 accent-black" />
                                                    <span className="text-xs text-gray-500 leading-relaxed">
                                                        I authorize AIHome to debit the amount mentioned above from my card. I agree to tokenise my card details as per regulatory guidelines.
                                                    </span>
                                                </label>

                                                <button onClick={handlePaymentDone} disabled={isProcessing} className="w-full bg-[#2d2e2f] hover:bg-black text-white font-bold py-4 rounded-lg mt-4 transition-colors">
                                                    {isProcessing ? 'Processing...' : `Pay INR ${selectedAmount === 'custom' ? customAmount : selectedAmount}.00`}
                                                </button>
                                                
                                                <div className="flex justify-end gap-2 mt-4 opacity-50">
                                                    <span className="text-xs font-bold font-serif italic">VISA</span>
                                                    <span className="text-xs font-bold text-red-500">mastercard</span>
                                                    <span className="text-xs font-bold text-blue-800 italic">RuPay</span>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                                
                                {/* Cancel Button Overlay */}
                                <button onClick={() => {setShowQR(false); setShowCreditModal(false);}} className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-50">
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer Area */}
                    {!showQR && (
                        <div className={`p-4 text-center text-[9px] uppercase tracking-[0.3em] font-bold ${theme === 'Light' ? 'bg-gray-100 text-gray-400' : 'bg-black/20 text-gray-600'}`}>
                            1Rs = 3000 Tokens | Secure Payment
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* ================================================================
            Phase 4: RENAME — vaul Bottom Drawer (replaces centered modal)
            ================================================================ */}
        <Drawer.Root open={showRenameModal} onOpenChange={setShowRenameModal}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-[990] bg-black/60 backdrop-blur-sm" />
            <Drawer.Content
              className={`fixed bottom-0 left-0 right-0 z-[1000] flex flex-col rounded-t-[28px] outline-none ${
                theme === 'Light' ? 'bg-[#f0f4f9]' : 'bg-[#1e1f20]'
              }`}
            >
              <div className="mx-auto mt-3 mb-2 w-10 h-1 rounded-full bg-gray-500/30" />
              <div className="px-6 pb-10 pt-4 max-w-lg mx-auto w-full">
                {/* Icon badge */}
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-5">
                  <Edit2 size={20} className="text-blue-400" />
                </div>
                <Drawer.Title className={`text-2xl font-semibold mb-6 ${
                  theme === 'Light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Rename this chat
                </Drawer.Title>
                <input
                  type="text"
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && finalRenameAction()}
                  autoFocus
                  placeholder="Chat name..."
                  className={`w-full p-4 rounded-2xl border-2 outline-none transition-all mb-6 text-base ${
                    theme === 'Light'
                      ? 'bg-white border-blue-400 text-gray-800 placeholder-gray-400'
                      : 'bg-[#151618] border-blue-500/60 text-white placeholder-gray-600'
                  }`}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRenameModal(false)}
                    className={`flex-1 py-3.5 rounded-2xl font-medium text-sm transition-all ${
                      theme === 'Light'
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-[#2d2e2f] text-gray-300 hover:bg-[#3d3e3f]'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={finalRenameAction}
                    disabled={!newChatTitle.trim()}
                    className="flex-1 py-3.5 rounded-2xl font-medium text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                  >
                    Save
                  </button>
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

                {showShareModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className={`w-[90%] max-w-lg p-6 rounded-[28px] shadow-2xl ${theme === 'Light' ? 'bg-[#f0f4f9]' : 'bg-[#1e1f20]'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className={`text-2xl font-medium ${theme === 'Light' ? 'text-gray-800' : 'text-white'}`}>
                            Shareable public link
                        </h2>
                        <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-gray-500/10 rounded-full transition">
                            <span className="text-2xl">✕</span>
                        </button>
                    </div>

                    <div className={`flex items-center gap-3 p-4 rounded-3xl mb-6 ${theme === 'Light' ? 'bg-white border border-gray-200' : 'bg-[#151618] border border-[#333]'}`}>
                        <input 
                            type="text" 
                            readOnly 
                            value={shareLink}
                            className="flex-1 bg-transparent outline-none text-sm text-blue-500 truncate"
                        />
                        <button 
                            onClick={copyToClipboard}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95 flex-shrink-0"
                        >
                            <Share size={16} />
                            {isCopying ? 'Copied!' : 'Copy link'}
                        </button>
                    </div>

                    <div className="flex gap-3 items-start opacity-70">
                        <span className="text-lg">ⓘ</span>
                        <p className="text-xs leading-relaxed">
                            Public links can be reshared. Share responsibly, delete anytime. If sharing with third-parties, their policies apply.
                        </p>
                    </div>
                </div>
            </div>
        )}

      <div className="flex flex-1 h-full">
        {/* Phase 3: motion.aside with layout + spring — fluid sidebar collapse */}
        <motion.aside
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ width: isSidebarCollapsed ? 72 : 288 }}
          className={`flex flex-col h-full z-30 flex-shrink-0 border-r overflow-hidden ${
            theme === 'Light' ? 'bg-white border-gray-200' : 'bg-[#1e1f20] border-gray-700'
          }`}
        >
            <div className="flex items-center justify-between px-4 py-4">
                <button onClick={toggleSidebar} className={`p-2 rounded-full transition ${theme === 'Light' ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>☰</button>
                {!isSidebarCollapsed && <h1 className="text-xl font-semibold tracking-wide bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mr-auto ml-2">AIHome</h1>}
            </div>
            
            <div className="px-3 mb-2">
                <button onClick={handleNewChat} className={`flex items-center gap-3 py-3 px-4 rounded-full transition-colors w-full ${isSidebarCollapsed ? 'justify-center' : ''} ${theme === 'Light' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'}`}>
                <span className="text-xl">＋</span>
                {!isSidebarCollapsed && <span className="text-sm font-medium">New chat</span>}
                </button>
            </div>
            
            {/* Phase 3: Sidebar history list with layoutId sliding pill */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 py-2 space-y-0.5">
                {!isSidebarCollapsed && (
                  <div 
                    onClick={() => setIsRecentOpen(prev => !prev)}
                    className={`group flex items-center justify-between text-xs font-medium px-3 py-2 mt-2 uppercase tracking-wider cursor-pointer rounded-lg transition-colors select-none ${
                      theme === 'Light' ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-400 opacity-80 hover:bg-white/5'
                    }`}
                  >
                    <span>Recent</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center">
                      {isRecentOpen ? (
                        <ChevronDown size={14} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={14} className="text-gray-400" />
                      )}
                    </span>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {isRecentOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden space-y-0.5"
                    >
                      {[...history]
                        .sort((a, b) => {
                          const aPinned = pinnedChatIds.includes(a.id);
                          const bPinned = pinnedChatIds.includes(b.id);
                          if (aPinned && !bPinned) return -1;
                          if (!aPinned && bPinned) return 1;
                          return 0;
                        })
                        .map((item) => (
                          <div
                            key={item.id}
                            className="group relative flex items-center justify-between w-full py-2.5 px-3 rounded-full cursor-pointer"
                            onClick={() => loadSession(item.id)}
                            onMouseEnter={() => setHoveredHistoryItem(item.id)}
                            onMouseLeave={() => setHoveredHistoryItem(null)}
                          >
                            {/* Phase 3: Sliding background pill via layoutId */}
                            <AnimatePresence>
                              {(sessionId === item.id || hoveredHistoryItem === item.id) && (
                                <motion.div
                                  key={sessionId === item.id ? 'active' : 'hover'}
                                  layoutId={sessionId === item.id ? 'active-chat-pill' : `hover-pill-${item.id}`}
                                  className={`absolute inset-0 rounded-full ${
                                    sessionId === item.id
                                      ? (theme === 'Light' ? 'bg-gray-200' : 'bg-[#2d2e2f]')
                                      : (theme === 'Light' ? 'bg-gray-100' : 'bg-white/5')
                                  }`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                              )}
                            </AnimatePresence>

                            <div className="relative flex items-center gap-3 truncate z-10">
                              <span className={`text-base flex-shrink-0 ${
                                theme === 'Light' ? 'text-gray-500' : 'opacity-60'
                              }`}>
                                {pinnedChatIds.includes(item.id) ? '📌' : '💬'}
                              </span>
                              {!isSidebarCollapsed && (
                                <span className={`text-sm truncate ${
                                  theme === 'Light' ? 'text-gray-800' : 'text-gray-200 opacity-80'
                                }`}>
                                  {item.title}
                                </span>
                              )}
                            </div>

                            {!isSidebarCollapsed && (
                              <button
                                onClick={(e) => toggleHistoryMenu(e, item.id)}
                                className={`relative z-10 opacity-0 group-hover:opacity-100 p-1 rounded-full transition-all flex-shrink-0 ${
                                  theme === 'Light' ? 'hover:bg-gray-300 text-gray-700' : 'hover:bg-[#3d3e3f] text-gray-400'
                                }`}
                              >
                                <MoreVertical size={16} />
                              </button>
                            )}

                            {/* Context menu popup */}
                            {openMenuId === item.id && (
                              <div
                                className={`absolute left-10 top-8 w-52 border rounded-xl shadow-2xl z-[999] py-2 animate-in fade-in zoom-in duration-150 ${
                                  theme === 'Light' ? 'bg-white border-gray-200 text-gray-800' : 'bg-[#1e1f20] border-[#333] text-gray-200'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => handleShareChat(e, item)}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                    theme === 'Light' ? 'hover:bg-gray-100' : 'hover:bg-[#2d2e2f]'
                                  }`}
                                >
                                  <Share size={16} className="opacity-70" /> Share conversation
                                </button>
                                <button
                                  onClick={(e) => togglePinChat(e, item)}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                    theme === 'Light' ? 'hover:bg-gray-100' : 'hover:bg-[#2d2e2f]'
                                  }`}
                                >
                                  <PinOff size={16} className={`opacity-70 ${pinnedChatIds.includes(item.id) ? 'text-blue-500' : ''}`} />
                                  {pinnedChatIds.includes(item.id) ? 'Unpin' : 'Pin'}
                                </button>
                                <button
                                  onClick={(e) => openRenameModal(e, item)}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                    theme === 'Light' ? 'hover:bg-gray-100' : 'hover:bg-[#2d2e2f]'
                                  }`}
                                >
                                  <Edit2 size={16} className="opacity-70" /> Rename
                                </button>
                                <div className={`h-[1px] my-1 ${theme === 'Light' ? 'bg-gray-200' : 'bg-[#333]'}`} />
                                <button
                                  onClick={(e) => confirmDelete(e, item)}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 transition-colors ${
                                    theme === 'Light' ? 'hover:bg-gray-100' : 'hover:bg-[#2d2e2f]'
                                  }`}
                                >
                                  <Trash2 size={16} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            {/* Sidebar Bottom Part */}
            <div className="p-3 mt-auto space-y-1 relative">
                <button 
                  onClick={() => setShowCreditModal(true)} 
                  className={`flex items-center gap-3 py-2 px-3 w-full rounded-full transition opacity-80 hover:opacity-100 ${
                    theme === 'Light' ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/5'
                  }`}
                >
                  <img 
                    src="/logos/credit-token.webp" 
                    alt="Credit Plan" 
                    className="w-5 h-5 object-contain shrink-0" 
                  />
                  {!isSidebarCollapsed && <span className="text-sm font-medium">Credit Plan</span>}
                </button>

                {/* AI Models Button */}
                <button 
                  onClick={(e) => toggleMenu('options', e)} 
                  className={`flex items-center gap-3 py-2 px-3 w-full rounded-full transition opacity-80 hover:opacity-100 ${
                    theme === 'Light' ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/5'
                  }`}
                >
                  <img 
                    src="/logos/ai-models.png" 
                    alt="AI Models" 
                    className="w-5 h-5 object-contain shrink-0" 
                  />
                  {!isSidebarCollapsed && <span className="text-sm">AI Models</span>}
                </button>
                <div className="relative">
                  <AccountSwitcherModal
                    isOpen={isAccountModalOpen}
                    onClose={() => setIsAccountModalOpen(false)}
                    positionClass="fixed bottom-14 left-4 z-[9999]"
                    currentUser={{
                      name: localStorage.getItem('userName') || 'Sarvaiya Nayan',
                      email: localStorage.getItem('userEmail') || 'sarvaiyanayan0@gmail.com',
                      avatar: localStorage.getItem('userPhotoURL') || ''
                    }}
                    secondaryAccounts={[
                      {
                        id: 'acc-2',
                        name: 'nd sarvaiya',
                        email: 'ndsarvaiyaa@gmail.com',
                        avatar: '',
                        badgeText: 'nd',
                        badgeBg: 'bg-orange-600'
                      }
                    ]}
                    onSwitchAccount={(account) => {
                      setIsAccountModalOpen(false);
                      toast.success(`Switched account to ${account.email}`);
                    }}
                    onManageAccount={() => {
                      toast.info('Redirecting to Google Account Settings...');
                    }}
                    onAddAccount={() => {
                      toast.info('Add account clicked');
                    }}
                    onSignOut={() => {
                      handleLogout();
                    }}
                  />
                  <button 
                    onClick={() => setIsAccountModalOpen(v => !v)} 
                    className={`flex items-center gap-3 p-2 rounded-full w-full text-left transition ${theme === 'Light' ? 'hover:bg-gray-100' : 'hover:bg-white/5'}`}
                    title="Click to switch account"
                  >
                    {localStorage.getItem('userPhotoURL') ? (
                        <img src={localStorage.getItem('userPhotoURL')} alt="User Profile" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                    ) : (
                        <div className="w-8 h-8 bg-gradient-to-tr from-orange-600 to-amber-600 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs text-white shadow-md">
                            {localStorage.getItem('userEmail') ? localStorage.getItem('userEmail').charAt(0).toUpperCase() : 'S'}
                        </div>
                    )}
                    {!isSidebarCollapsed && <span className={`text-sm font-medium opacity-90 ${theme === 'Light' ? 'text-gray-800' : 'text-white'}`}>User</span>}
                  </button>
                </div>
            </div>
        </motion.aside>

        {activeMenu === 'options' && (<div className="fixed left-20 bottom-20 w-80 glass-panel rounded-2xl p-5 z-50 animate-pop-up flex flex-col gap-4" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between pb-2 border-b border-gray-600"><h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">Manage Models</h2></div><div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">{models.map(model => (<div key={model.id} className="flex items-center justify-between group"><div className="flex items-center gap-3"><ModelIcon model={model.id} className="w-5 h-5" /><span className="text-sm font-medium">{model.name}</span></div><label className="switch"><input type="checkbox" checked={visibleModels[model.id]} onChange={() => setVisibleModels({...visibleModels, [model.id]: !visibleModels[model.id]})} /><span className="slider"></span></label></div>))}</div></div>)}

        <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[var(--bg-color)]">
            {/* ================================================================
                MODEL-SPECIFIC NATIVE HEADERS
                ================================================================ */}
            {singleModelMode === 'chatgpt' ? (
              <div className="chatgpt-topbar">
                <div className="chatgpt-topbar-left">
                  <button onClick={handleBackToDashboard} className="chatgpt-back-btn" title="Back to dashboard">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="chatgpt-model-dropdown-wrapper" onClick={(e) => { e.stopPropagation(); setShowChatGPTOptions(v => !v); }}>
                    <ModelIcon model="chatgpt" className="w-5 h-5 mr-1" />
                    <span className="chatgpt-model-label text-[var(--text-primary)]">ChatGPT</span>
                    <ChevronDown size={16} className={`chatgpt-chevron ${showChatGPTOptions ? 'open' : ''}`} />
                    {showChatGPTOptions && (
                      <div className="chatgpt-model-dropdown animate-pop-up" onClick={e => e.stopPropagation()}>
                        <button className={`chatgpt-model-option ${chatgptModel === 'chatgpt-plus' ? 'selected' : ''}`} onClick={() => { setChatgptModel('chatgpt-plus'); setShowChatGPTOptions(false); }}>
                          <div className="chatgpt-option-icon"><Sparkles size={16} /></div>
                          <div className="chatgpt-option-text"><span className="chatgpt-option-name">ChatGPT Plus</span><span className="chatgpt-option-desc">Our smartest model &amp; more</span></div>
                          <span className="chatgpt-upgrade-badge">Upgrade</span>
                        </button>
                        <button className={`chatgpt-model-option ${chatgptModel === 'chatgpt' ? 'selected' : ''}`} onClick={() => { setChatgptModel('chatgpt'); setShowChatGPTOptions(false); }}>
                          <div className="chatgpt-option-icon"><ModelIcon model="chatgpt" className="w-4 h-4" /></div>
                          <div className="chatgpt-option-text"><span className="chatgpt-option-name">ChatGPT</span><span className="chatgpt-option-desc">Great for everyday tasks</span></div>
                          {chatgptModel === 'chatgpt' && <Check size={16} className="chatgpt-check" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="chatgpt-topbar-right">
                  <HeaderTokenDisplay credits={credits} onClick={() => setShowCreditModal(true)} />
                </div>
              </div>
            ) : singleModelMode === 'gemini' ? (
              /* ---- GEMINI NATIVE TOP BAR ---- */
              <div className="gemini-topbar">
                <div className="gemini-topbar-left">
                  <button onClick={handleBackToDashboard} className="gemini-back-btn" title="Back">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="gemini-model-dropdown-wrapper" onClick={(e) => { e.stopPropagation(); setShowGeminiVersionMenu(v => !v); }}>
                    <ModelIcon model="gemini" className="w-5 h-5 mr-1" />
                    <span className="gemini-model-label text-[var(--text-primary)]">Gemini</span>
                    <ChevronDown size={16} className={`gemini-chevron ${showGeminiVersionMenu ? 'open' : ''}`} />
                    {showGeminiVersionMenu && (
                      <div className="gemini-version-menu animate-pop-up" onClick={e => e.stopPropagation()}>
                        <button className={`gemini-version-option ${geminiVersion === '3.1-flash-lite' ? 'active' : ''}`} onClick={() => { setGeminiVersion('3.1-flash-lite'); setShowGeminiVersionMenu(false); }}>
                          <div className="gemini-version-left"><Zap size={15} className="gemini-version-icon" /><div className="gemini-version-text"><span className="gemini-version-name">3.1 Flash-Lite</span><span className="gemini-version-desc">Fastest answers</span></div></div>
                          <div className="gemini-version-right"><span className="gemini-version-badge">New</span>{geminiVersion === '3.1-flash-lite' && <Check size={14} className="gemini-check" />}</div>
                        </button>
                        <button className={`gemini-version-option ${geminiVersion === '3.5-flash' ? 'active' : ''}`} onClick={() => { setGeminiVersion('3.5-flash'); setShowGeminiVersionMenu(false); }}>
                          <div className="gemini-version-left"><Sparkles size={15} className="gemini-version-icon" /><div className="gemini-version-text"><span className="gemini-version-name">3.5 Flash</span><span className="gemini-version-desc">All-around help</span></div></div>
                          <div className="gemini-version-right"><span className="gemini-version-badge">New</span>{geminiVersion === '3.5-flash' && <Check size={14} className="gemini-check" />}</div>
                        </button>
                        <button className={`gemini-version-option ${geminiVersion === '3.1-pro' ? 'active' : ''}`} onClick={() => { setGeminiVersion('3.1-pro'); setShowGeminiVersionMenu(false); }}>
                          <div className="gemini-version-left"><Search size={15} className="gemini-version-icon" /><div className="gemini-version-text"><span className="gemini-version-name">3.1 Pro</span><span className="gemini-version-desc">Advanced math and code</span></div></div>
                          <div className="gemini-version-right">{geminiVersion === '3.1-pro' && <Check size={14} className="gemini-check" />}</div>
                        </button>
                        <div className="gemini-version-footer"><div className="gemini-version-footer-row"><Lightbulb size={13} className="opacity-50" /><span>Thinking level</span><ChevronRight size={13} className="ml-auto opacity-40" /><span className="gemini-version-footer-val">Standard</span></div></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="gemini-topbar-right">
                  <HeaderTokenDisplay credits={credits} onClick={() => setShowCreditModal(true)} />
                </div>
              </div>
            ) : singleModelMode === 'claude' ? (
              /* ---- CLAUDE NATIVE TOP BAR ---- */
              <div className="claude-topbar">
                <div className="claude-topbar-left">
                  <button onClick={handleBackToDashboard} className="claude-back-btn" title="Back">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="claude-model-dropdown-wrapper" onClick={(e) => { e.stopPropagation(); setShowClaudeOptions(v => !v); }}>
                    <ModelIcon model="claude" className="w-5 h-5 mr-1" />
                    <span className="claude-model-label text-[var(--text-primary)]">Claude</span>
                    <ChevronDown size={16} className={`claude-chevron ${showClaudeOptions ? 'open' : ''}`} />
                    {showClaudeOptions && (
                      <div className="claude-model-dropdown animate-pop-up" onClick={e => e.stopPropagation()}>
                        <button className={`claude-model-option ${claudeModel === 'claude-3-5-sonnet' ? 'selected' : ''}`} onClick={() => { setClaudeModel('claude-3-5-sonnet'); setShowClaudeOptions(false); }}>
                          <div className="claude-option-icon"><ModelIcon model="claude" className="w-4 h-4" /></div>
                          <div className="claude-option-text"><span className="claude-option-name">Claude 3.5 Sonnet</span><span className="claude-option-desc">Ideal for coding & reasoning</span></div>
                          {claudeModel === 'claude-3-5-sonnet' && <Check size={16} className="claude-check" />}
                        </button>
                        <button className="claude-model-option locked" disabled>
                          <div className="claude-option-icon"><Sparkles size={16} /></div>
                          <div className="claude-option-text"><span className="claude-option-name">Claude 3 Opus</span><span className="claude-option-desc">Powerful model for complex tasks</span></div>
                          <span className="claude-upgrade-badge">🔒 Locked</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="claude-topbar-right">
                  <HeaderTokenDisplay credits={credits} onClick={() => setShowCreditModal(true)} />
                </div>
              </div>
            ) : singleModelMode === 'perplexity' ? (
              /* ---- PERPLEXITY NATIVE TOP BAR ---- */
              <div className="perplexity-topbar">
                <div className="perplexity-topbar-left">
                  <button onClick={handleBackToDashboard} className="perplexity-back-btn" title="Back">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="perplexity-model-dropdown-wrapper" onClick={(e) => { e.stopPropagation(); setShowPerplexityModelMenu(v => !v); }}>
                    <ModelIcon model="perplexity" className="w-5 h-5 mr-1" />
                    <span className="perplexity-model-label text-[var(--text-primary)]">Perplexity</span>
                    <ChevronDown size={16} className={`perplexity-chevron ${showPerplexityModelMenu ? 'open' : ''}`} />
                    {showPerplexityModelMenu && (
                      <div className="perplexity-model-dropdown animate-pop-up" onClick={e => e.stopPropagation()}>
                        <div className="perplexity-model-header">
                          Access the top AI models <span className="perplexity-model-arrow">→</span>
                        </div>
                        {[
                          { name:'Sonar 2',       badge:null,  badgeType:null },
                          { name:'GPT-5.4',       badge:null,  badgeType:null },
                          { name:'GPT-5.5',       badge:'Max', badgeType:'max' },
                          { name:'Gemini 3.1 Pro',badge:null,  badgeType:null },
                          { name:'Claude Sonnet 4.6', badge:null, badgeType:null },
                          { name:'Claude Opus 4.8',   badge:'Max', badgeType:'max' },
                          { name:'Kimi K2.6',     badge:'New', badgeType:'new' },
                        ].map(m => (
                          <button key={m.name} className="perplexity-model-item" onClick={() => { setPerplexityModel(m.name); setShowPerplexityModelMenu(false); }}>
                            <span className="perplexity-model-name">{m.name}</span>
                            {m.badge && (
                              <span className={`perplexity-model-badge ${m.badgeType === 'new' ? 'badge-new' : 'badge-max'}`}>{m.badge}</span>
                            )}
                            <span className="perplexity-model-lock ml-auto">🔒</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="perplexity-topbar-right">
                  <HeaderTokenDisplay credits={credits} onClick={() => setShowCreditModal(true)} />
                </div>
              </div>
            ) : singleModelMode === 'deepseek' ? (
              /* ---- DEEPSEEK NATIVE TOP BAR ---- */
              <div className="deepseek-topbar">
                <div className="deepseek-topbar-left">
                  <button onClick={handleBackToDashboard} className="deepseek-back-btn" title="Back">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="deepseek-model-dropdown-wrapper" onClick={(e) => { e.stopPropagation(); setShowDeepSeekOptions(v => !v); }}>
                    <ModelIcon model="deepseek" className="w-5 h-5 mr-1" />
                    <span className="deepseek-model-label text-[var(--text-primary)]">DeepSeek</span>
                    <ChevronDown size={16} className={`deepseek-chevron ${showDeepSeekOptions ? 'open' : ''}`} />
                    {showDeepSeekOptions && (
                      <div className="deepseek-model-dropdown animate-pop-up" onClick={e => e.stopPropagation()}>
                        <button className={`deepseek-model-option ${!isDeepThinkEnabled ? 'selected' : ''}`} onClick={() => { setIsDeepThinkEnabled(false); setShowDeepSeekOptions(false); }}>
                          <div className="deepseek-option-icon"><ModelIcon model="deepseek" className="w-4 h-4" /></div>
                          <div className="deepseek-option-text"><span className="deepseek-option-name">DeepSeek-V3</span><span className="deepseek-option-desc">Standard high-speed model</span></div>
                          {!isDeepThinkEnabled && <Check size={16} className="deepseek-check" />}
                        </button>
                        <button className={`deepseek-model-option ${isDeepThinkEnabled ? 'selected' : ''}`} onClick={() => { setIsDeepThinkEnabled(true); setShowDeepSeekOptions(false); }}>
                          <div className="deepseek-option-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="1"/>
                              <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/>
                              <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/>
                            </svg>
                          </div>
                          <div className="deepseek-option-text"><span className="deepseek-option-name">DeepSeek-R1</span><span className="deepseek-option-desc">Deep thinking reasoning model</span></div>
                          {isDeepThinkEnabled && <Check size={16} className="deepseek-check" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="deepseek-topbar-right">
                  <HeaderTokenDisplay credits={credits} onClick={() => setShowCreditModal(true)} />
                </div>
              </div>
            ) : singleModelMode === 'grok' ? (
              /* ---- GROK NATIVE TOP BAR ---- */
              <div className="grok-topbar">
                <div className="grok-topbar-left">
                  <button onClick={handleBackToDashboard} className="grok-back-btn" title="Back">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="grok-model-dropdown-wrapper" onClick={(e) => { e.stopPropagation(); setShowGrokVersionMenu(v => !v); }}>
                    <ModelIcon model="grok" className="w-5 h-5 mr-1" />
                    <span className="grok-model-label text-[var(--text-primary)]">Grok</span>
                    <ChevronDown size={16} className={`grok-chevron ${showGrokVersionMenu ? 'open' : ''}`} />
                    {showGrokVersionMenu && (
                      <div className="grok-version-dropdown animate-pop-up" onClick={e => e.stopPropagation()}>
                        <button className={`grok-vd-item ${grokVersion === 'Fast' ? 'active' : ''}`} onClick={() => { grokVersion !== 'Fast' && setGrokVersion('Fast'); setShowGrokVersionMenu(false); }}>
                          <div className="grok-vd-icon-wrap"><Check size={14} /></div>
                          <div className="grok-vd-text"><div className="grok-vd-title">Fast</div><div className="grok-vd-sub">Powered by Grok 4.3</div></div>
                        </button>
                        <button className={`grok-vd-item ${grokVersion === 'Auto' ? 'active' : ''}`} onClick={() => { grokVersion !== 'Auto' && setGrokVersion('Auto'); setShowGrokVersionMenu(false); }}>
                          <div className="grok-vd-icon-wrap"><Rocket size={14} /></div>
                          <div className="grok-vd-text"><div className="grok-vd-title">Auto</div><div className="grok-vd-sub">Chooses Fast or Expert</div></div>
                        </button>
                        <button className={`grok-vd-item ${grokVersion === 'Expert' ? 'active' : ''}`} onClick={() => { grokVersion !== 'Expert' && setGrokVersion('Expert'); setShowGrokVersionMenu(false); }}>
                          <div className="grok-vd-icon-wrap"><Lightbulb size={14} /></div>
                          <div className="grok-vd-text"><div className="grok-vd-title">Expert</div><div className="grok-vd-sub">Powered by Grok 4.3</div></div>
                        </button>
                        <button className={`grok-vd-item ${grokVersion === 'Heavy' ? 'active' : ''}`} onClick={() => { grokVersion !== 'Heavy' && setGrokVersion('Heavy'); setShowGrokVersionMenu(false); }}>
                          <div className="grok-vd-icon-wrap"><LayoutGrid size={14} /></div>
                          <div className="grok-vd-text"><div className="grok-vd-title">Heavy</div><div className="grok-vd-sub">Team of Experts</div></div>
                        </button>
                        <div className="grok-vd-footer">
                          <div className="grok-vd-footer-left">
                            <div className="grok-supergrok-logo">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-purple-400">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.5" y1="19.5" x2="19.5" y2="4.5" />
                              </svg>
                              <span>SuperGrok</span>
                            </div>
                            <div className="grok-supergrok-sub">Unlock extended capabilities</div>
                          </div>
                          <button className="grok-signin-btn">Sign in</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grok-topbar-right">
                  <HeaderTokenDisplay credits={credits} onClick={() => setShowCreditModal(true)} />
                </div>
              </div>
            ) : (
              <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-[var(--bg-color)]/95 backdrop-blur z-20">
                {singleModelMode ? (
                    <div className="flex items-center gap-4 w-full justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={handleBackToDashboard} className="hover-effect p-2 rounded-full text-gray-400 hover:text-white transition"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg></button>
                            <div className="flex items-center gap-2"><ModelIcon model={singleModelMode} className="w-8 h-8" /><span className="font-semibold text-lg text-[var(--text-primary)]">{models.find(m => m.id === singleModelMode)?.name}</span></div>
                        </div>
                        <HeaderTokenDisplay credits={credits} onClick={() => setShowCreditModal(true)} />
                    </div>
                ) : (
                    <div className="flex w-full justify-end">
                        <HeaderTokenDisplay credits={credits} onClick={() => setShowCreditModal(true)} />
                    </div>
                )}
              </div>
            )}

            <div className="flex-1 w-full overflow-hidden flex flex-col" style={(singleModelMode === 'chatgpt' || singleModelMode === 'gemini' || singleModelMode === 'claude' || singleModelMode === 'perplexity' || singleModelMode === 'deepseek' || singleModelMode === 'grok') ? { padding: 0 } : { padding: '1rem 1.5rem 1.5rem' }}>
                {singleModelMode === 'chatgpt' ? (
                    /* ================================================================
                       CHATGPT NATIVE LAYOUT
                       ================================================================ */
                    <div className="chatgpt-native-layout bg-[var(--bg-color)] text-[var(--text-primary)]">
                      {/* Chat messages area */}
                      <div className="chatgpt-messages-area custom-scrollbar">
                        {(!chatData['chatgpt'] || chatData['chatgpt'].length === 0) && (
                          <div className="chatgpt-greeting-wrapper">
                            <h2 className="chatgpt-greeting">What's on your mind today?</h2>
                          </div>
                        )}
                        {chatData['chatgpt']?.map((chat, idx) => (
                          <div key={idx} className="chatgpt-message-pair animate-fade-in">
                            {/* User bubble */}
                            <div className="chatgpt-user-row">
                              {chat.userImage && <img src={chat.userImage} alt="Upload" className="w-48 rounded-xl mb-2 border border-gray-700" />}
                              <div className="chatgpt-user-bubble">{chat.user}</div>
                            </div>
                            {/* AI response */}
                            <div className="chatgpt-ai-row">
                              <div className="chatgpt-ai-avatar"><ModelIcon model="chatgpt" className="w-5 h-5" /></div>
                              <div className="text-sm leading-relaxed w-full markdown-body text-[var(--text-primary)]">
                                {chat.isImage ? (
                                  <div className="mt-2">
                                    <img src={chat.ai} alt="AI" className="rounded-xl shadow-lg max-w-full h-auto" style={{ maxHeight: '300px' }} />
                                    <a href={chat.ai} target="_blank" rel="noreferrer" className="text-xs text-blue-400 mt-1 inline-block hover:underline">View Full</a>
                                  </div>
                                ) : <ReactMarkdown>{chat.ai}</ReactMarkdown>}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={el => chatEndRefs.current['chatgpt'] = el} />
                      </div>

                      {/* ---- CHATGPT NATIVE INPUT ZONE ---- */}
                      <div className="chatgpt-input-zone max-w-3xl w-full mx-auto px-4 pb-6">
                        {/* Image preview */}
                        {selectedImage && (
                          <div className="absolute bottom-full left-0 mb-3 bg-[#2d2e2f] p-2 rounded-xl border border-[#444746] shadow-lg flex items-center gap-3 animate-fade-in">
                            <img src={selectedImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400">Image selected</span>
                              <button onClick={() => setSelectedImage(null)} className="text-red-400 text-xs hover:underline mt-1">Remove</button>
                            </div>
                          </div>
                        )}

                        {/* ChatGPT Plus popup menu */}
                        {showChatGPTPlusMenu && (
                          <div className="chatgpt-plus-menu animate-pop-up" onClick={e => e.stopPropagation()}>
                            <button onClick={triggerFilePicker} className="chatgpt-plus-item">
                              <Paperclip size={16} className="chatgpt-plus-icon" />
                              <span>Add photos &amp; files</span>
                            </button>
                            <button className="chatgpt-plus-item">
                              <Clock size={16} className="chatgpt-plus-icon" />
                              <span>Recent files</span>
                              <ChevronRight size={14} className="ml-auto opacity-50" />
                            </button>
                            <div className="chatgpt-plus-divider" />
                            <button className="chatgpt-plus-item">
                              <ImageIcon size={16} className="chatgpt-plus-icon" />
                              <span>Create image</span>
                            </button>
                            <button className="chatgpt-plus-item">
                              <Lightbulb size={16} className="chatgpt-plus-icon" />
                              <span>Thinking</span>
                            </button>
                            <button className="chatgpt-plus-item">
                              <Search size={16} className="chatgpt-plus-icon" />
                              <span>Deep research</span>
                            </button>
                            <button className="chatgpt-plus-item">
                              <Globe size={16} className="chatgpt-plus-icon" />
                              <span>Web search</span>
                            </button>
                            <button className="chatgpt-plus-item">
                              <MoreHorizontal size={16} className="chatgpt-plus-icon" />
                              <span>More</span>
                              <ChevronRight size={14} className="ml-auto opacity-50" />
                            </button>
                            <button className="chatgpt-plus-item">
                              <FolderOpen size={16} className="chatgpt-plus-icon" />
                              <span>Projects</span>
                              <ChevronRight size={14} className="ml-auto opacity-50" />
                            </button>
                          </div>
                        )}

                        {/* The pill input bar */}
                        <div className={`chatgpt-pill-bar w-full ${isInputFocused ? 'focused' : ''}`}>
                          <button
                            id="chatgpt-plus-btn"
                            onClick={(e) => { e.stopPropagation(); setShowChatGPTPlusMenu(v => !v); }}
                            className="chatgpt-pill-plus"
                            title="Attach"
                          >
                            <span style={{ fontSize: '20px', lineHeight: 1 }}>+</span>
                          </button>
                          <motion.textarea
                            layout
                            ref={msgBoxRef}
                            value={message}
                            onChange={handleInput}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder="Ask anything"
                            disabled={credits <= 0}
                            className="chatgpt-pill-textarea"
                            rows={1}
                            transition={{ layout: { type: 'spring', stiffness: 400, damping: 30 } }}
                          />
                          <div className="chatgpt-pill-actions">
                            {/* Mic */}
                            <button onClick={handleVoiceInput} className={`chatgpt-pill-icon-btn ${isListening ? 'listening' : ''}`} title="Voice">
                              <Mic size={18} />
                            </button>
                            {/* Send / Waveform */}
                            <motion.button
                              onClick={handleSendMessage}
                              disabled={credits <= 0}
                              whileTap={{ scale: 0.88 }}
                              className="chatgpt-pill-send"
                              title="Send"
                            >
                              <AudioWaveform size={18} />
                            </motion.button>
                          </div>
                        </div>

                      </div>
                    </div>
                ) : singleModelMode === 'gemini' ? (
                    /* ================================================================
                       GEMINI NATIVE LAYOUT
                       ================================================================ */
                    <div className="gemini-native-layout bg-[var(--bg-color)] text-[var(--text-primary)]">
                      {/* Aura glow background */}
                      <div className="gemini-aura" />

                      {/* Messages scroll area */}
                      <div className="gemini-messages-area custom-scrollbar">
                        {(!chatData['gemini'] || chatData['gemini'].length === 0) && (
                          <div className="gemini-greeting-wrapper">
                            <div className="gemini-greeting-shimmer">
                              <span className="gemini-greeting-hello">Hello,</span>
                              <span className="gemini-greeting-name">Sarvaiya.</span>
                            </div>
                            <p className="gemini-greeting-sub">How can I help you today?</p>
                          </div>
                        )}
                        {chatData['gemini']?.map((chat, idx) => (
                          <div key={idx} className="gemini-message-pair animate-fade-in">
                            <div className="gemini-user-row">
                              {chat.userImage && <img src={chat.userImage} alt="Upload" className="w-48 rounded-xl mb-2 border border-blue-900/40" />}
                              <div className="gemini-user-bubble">{chat.user}</div>
                            </div>
                            <div className="gemini-ai-row">
                              <div className="gemini-ai-avatar"><ModelIcon model="gemini" className="w-5 h-5" /></div>
                              <div className="text-sm leading-relaxed w-full markdown-body text-[var(--text-primary)]">
                                {chat.isImage ? (
                                  <div className="mt-2">
                                    <img src={chat.ai} alt="AI" className="rounded-xl shadow-lg max-w-full h-auto" style={{ maxHeight: '300px' }} />
                                    <a href={chat.ai} target="_blank" rel="noreferrer" className="text-xs text-blue-400 mt-1 inline-block hover:underline">View Full</a>
                                  </div>
                                ) : <ReactMarkdown>{chat.ai}</ReactMarkdown>}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={el => chatEndRefs.current['gemini'] = el} />
                      </div>

                      {/* ---- GEMINI INPUT ZONE ---- */}
                      <div className="gemini-input-zone max-w-3xl w-full mx-auto px-4 pb-6">
                        {/* Image preview */}
                        {selectedImage && (
                          <div className="absolute bottom-full left-0 mb-3 bg-[#1e2a3a] p-2 rounded-xl border border-blue-900/40 shadow-lg flex items-center gap-3 animate-fade-in">
                            <img src={selectedImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                            <div className="flex flex-col">
                              <span className="text-xs text-blue-300">Image selected</span>
                              <button onClick={() => setSelectedImage(null)} className="text-red-400 text-xs hover:underline mt-1">Remove</button>
                            </div>
                          </div>
                        )}

                        {/* Plus attachment popup */}
                        {showGeminiPlusMenu && (
                          <div className="plus-action-menu animate-pop-up" style={{ left: '24px' }} onClick={e => e.stopPropagation()}>
                            <button onClick={(e) => { e.stopPropagation(); triggerFilePicker(); setShowGeminiPlusMenu(false); }} className="plus-action-menu-item">
                              <span className="plus-action-menu-icon"><Paperclip size={16} /></span>
                              <span>Upload files</span>
                            </button>
                            <button className="plus-action-menu-item" onClick={() => { toast.info("Google Drive integrated (Mocked)"); }}>
                              <span className="plus-action-menu-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12.51 14.51L17.5 5.86h-10l-4.99 8.65zM10.15 14.51L5.15 5.86 2.65 10.2l5 8.65zM12.51 14.51l2.5-4.32 6.34.02-2.5 4.3z" />
                                </svg>
                              </span>
                              <span>Add from Drive</span>
                            </button>
                            <button className="plus-action-menu-item" onClick={() => { toast.info("More uploads menu (Mocked)"); }}>
                              <span className="plus-action-menu-icon"><MoreHorizontal size={16} /></span>
                              <span>More uploads</span>
                              <span className="plus-action-menu-arrow"><ChevronRight size={14} /></span>
                            </button>
                            
                            <div className="plus-action-menu-divider" />
                            
                            <button className="plus-action-menu-item" onClick={() => { toast.info("Image Creation Tool opened (Mocked)"); }}>
                              <span className="plus-action-menu-icon"><ImageIcon size={16} /></span>
                              <span>Create image</span>
                            </button>
                            <button className="plus-action-menu-item" onClick={() => { toast.info("Video Creation Tool opened (Mocked)"); }}>
                              <span className="plus-action-menu-icon"><Video size={16} /></span>
                              <span>Create video</span>
                            </button>
                            <button className="plus-action-menu-item" onClick={() => { toast.info("Music Creation Tool opened (Mocked)"); }}>
                              <span className="plus-action-menu-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M9 18V5l12-2v13" />
                                  <circle cx="6" cy="18" r="3" />
                                  <circle cx="18" cy="16" r="3" />
                                </svg>
                              </span>
                              <span>Create music</span>
                            </button>
                            <button className="plus-action-menu-item" onClick={() => { toast.info("More tools menu (Mocked)"); }}>
                              <span className="plus-action-menu-icon"><MoreHorizontal size={16} /></span>
                              <span>More tools</span>
                              <span className="plus-action-menu-arrow"><ChevronRight size={14} /></span>
                            </button>
                          </div>
                        )}

                        {/* The pill input bar */}
                        <div className={`gemini-pill-bar w-full ${isInputFocused ? 'focused' : ''}`}>
                          {/* + / X toggle */}
                          <button
                            id="gemini-plus-btn"
                            onClick={(e) => { e.stopPropagation(); setShowGeminiPlusMenu(v => !v); }}
                            className={`gemini-pill-plus ${showGeminiPlusMenu ? 'open' : ''}`}
                            title="Attach"
                          >
                            {showGeminiPlusMenu ? <X size={18} /> : <span style={{ fontSize: '22px', lineHeight: 1, fontWeight: 300 }}>+</span>}
                          </button>

                          <motion.textarea
                            layout
                            ref={msgBoxRef}
                            value={message}
                            onChange={handleInput}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder="Ask Gemini"
                            disabled={credits <= 0}
                            className="gemini-pill-textarea"
                            rows={1}
                            transition={{ layout: { type: 'spring', stiffness: 400, damping: 30 } }}
                          />

                          <div className="gemini-pill-actions">
                            {/* Mic */}
                            <button onClick={handleVoiceInput} className={`gemini-pill-icon-btn ${isListening ? 'listening' : ''}`} title="Voice">
                              <Mic size={18} />
                            </button>
                            {/* Send */}
                            <motion.button
                              onClick={handleSendMessage}
                              disabled={credits <= 0}
                              whileTap={{ scale: 0.88 }}
                              className="gemini-pill-send"
                              title="Send"
                            >
                              <Send size={16} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                ) : singleModelMode === 'claude' ? (
                    /* ================================================================
                       CLAUDE NATIVE LAYOUT
                       ================================================================ */
                    <div className="claude-native-layout bg-[var(--bg-color)] text-[var(--text-primary)]">
                      {/* Messages scroll area */}
                      <div className="claude-messages-area custom-scrollbar">
                        {(!chatData['claude'] || chatData['claude'].length === 0) && (
                          <div className="claude-greeting-wrapper">
                            <div className="claude-star-icon">
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                                <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill="url(#claudeGrad)" />
                                <path d="M19 14L19.9 16.9L22.8 17.8L19.9 18.7L19 21.6L18.1 18.7L15.2 17.8L18.1 16.9L19 14Z" fill="url(#claudeGrad2)" opacity="0.7"/>
                                <defs>
                                  <linearGradient id="claudeGrad" x1="4" y1="2" x2="20" y2="18" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#e8956d"/>
                                    <stop offset="1" stopColor="#d4734a"/>
                                  </linearGradient>
                                  <linearGradient id="claudeGrad2" x1="15" y1="14" x2="23" y2="22" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#e8956d"/>
                                    <stop offset="1" stopColor="#c96840"/>
                                  </linearGradient>
                                </defs>
                              </svg>
                            </div>
                            <h2 className="claude-greeting">Hey there, Nayan</h2>
                          </div>
                        )}
                        {chatData['claude']?.map((chat, idx) => (
                          <div key={idx} className="claude-message-pair animate-fade-in">
                            <div className="claude-user-row">
                              {chat.userImage && <img src={chat.userImage} alt="Upload" className="w-48 rounded-xl mb-2" />}
                              <div className="claude-user-bubble">{chat.user}</div>
                            </div>
                            <div className="claude-ai-row">
                              <div className="claude-ai-avatar"><ModelIcon model="claude" className="w-4 h-4" /></div>
                              <div className="text-sm leading-relaxed w-full markdown-body text-[var(--text-primary)]">
                                {chat.isImage ? (
                                  <div className="mt-2">
                                    <img src={chat.ai} alt="AI" className="rounded-xl shadow-lg max-w-full h-auto" style={{ maxHeight: '300px' }} />
                                    <a href={chat.ai} target="_blank" rel="noreferrer" className="text-xs text-orange-400 mt-1 inline-block hover:underline">View Full</a>
                                  </div>
                                ) : <ReactMarkdown>{chat.ai}</ReactMarkdown>}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={el => chatEndRefs.current['claude'] = el} />
                      </div>

                      {/* ---- CLAUDE INPUT ZONE ---- */}
                      <div className="claude-input-zone max-w-3xl w-full mx-auto px-4 pb-6">
                        {/* Image preview */}
                        {selectedImage && (
                          <div className="absolute bottom-full left-0 mb-3 bg-[#3a2e27] p-2 rounded-xl border border-orange-900/30 shadow-lg flex items-center gap-3 animate-fade-in">
                            <img src={selectedImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                            <div className="flex flex-col">
                              <span className="text-xs text-orange-300">Image selected</span>
                              <button onClick={() => setSelectedImage(null)} className="text-red-400 text-xs hover:underline mt-1">Remove</button>
                            </div>
                          </div>
                        )}

                        {/* Plus attachment popup */}
                        {showClaudePlusMenu && (
                          <div className="claude-plus-menu animate-pop-up" onClick={e => e.stopPropagation()}>
                            <button onClick={triggerFilePicker} className="claude-plus-item">
                              <Paperclip size={16} className="claude-plus-icon" />
                              <span>Add files or photos</span>
                            </button>
                            <button className="claude-plus-item">
                              <Camera size={16} className="claude-plus-icon" />
                              <span>Take a screenshot</span>
                            </button>
                            <button className="claude-plus-item claude-plus-item--arrow">
                              <FolderOpen size={16} className="claude-plus-icon" />
                              <span>Add to project</span>
                              <ChevronRight size={13} className="ml-auto opacity-40" />
                            </button>
                            <button className="claude-plus-item claude-plus-item--arrow">
                              <LayoutGrid size={16} className="claude-plus-icon" />
                              <span>Skills</span>
                              <ChevronRight size={13} className="ml-auto opacity-40" />
                            </button>
                            <button className="claude-plus-item claude-plus-item--arrow">
                              <Plug size={16} className="claude-plus-icon" />
                              <span>Add connectors</span>
                              <ChevronRight size={13} className="ml-auto opacity-40" />
                            </button>
                            <button className="claude-plus-item">
                              <Sparkles size={16} className="claude-plus-icon" />
                              <span>Add plugins...</span>
                            </button>
                            <div className="claude-plus-divider" />
                            <button className="claude-plus-item">
                              <Globe size={16} className="claude-plus-icon" />
                              <span>Web search</span>
                              <Check size={14} className="ml-auto text-blue-400" />
                            </button>
                            <button className="claude-plus-item claude-plus-item--arrow">
                              <Feather size={16} className="claude-plus-icon" />
                              <span>Use style</span>
                              <ChevronRight size={13} className="ml-auto opacity-40" />
                            </button>
                          </div>
                        )}

                        {/* The pill input bar */}
                        <div className={`claude-pill-bar w-full ${isInputFocused ? 'focused' : ''}`}>
                          {/* [+] Attachment Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowClaudePlusMenu(v => !v); }}
                            className={`claude-pill-plus ${showClaudePlusMenu ? 'open' : ''}`}
                            title="Attach"
                          >
                            {showClaudePlusMenu ? <X size={18} /> : <span style={{ fontSize: '22px', lineHeight: 1, fontWeight: 300 }}>+</span>}
                          </button>

                          <motion.textarea
                            layout
                            ref={msgBoxRef}
                            value={message}
                            onChange={handleInput}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder="How can I help you today?"
                            disabled={credits <= 0}
                            className="claude-pill-textarea"
                            rows={1}
                            transition={{ layout: { type: 'spring', stiffness: 400, damping: 30 } }}
                          />

                          <div className="claude-pill-actions">
                            <span className="claude-version-label select-none cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowClaudeOptions(v => !v); }}>
                              {claudeModel === 'claude-3-5-sonnet' ? 'Sonnet' : 'Opus'} <span className="claude-version-badge">Low</span>
                              <ChevronDown size={12} className="inline-block ml-0.5 opacity-60" />
                            </span>
                            {/* Mic */}
                            <button onClick={handleVoiceInput} className={`claude-pill-icon-btn ${isListening ? 'listening' : ''}`} title="Voice">
                              <Mic size={18} />
                            </button>
                            {/* Send */}
                            <motion.button
                              onClick={handleSendMessage}
                              disabled={credits <= 0}
                              whileTap={{ scale: 0.88 }}
                              className="claude-pill-send"
                              title="Send"
                            >
                              <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                            </motion.button>
                          </div>
                        </div>

                      </div>
                    </div>
                ) : singleModelMode === 'perplexity' ? (
                    /* ================================================================
                       PERPLEXITY NATIVE LAYOUT
                       ================================================================ */
                    <div className="perplexity-native-layout bg-[var(--bg-color)] text-[var(--text-primary)]">

                      {/* ---- MESSAGES / GREETING AREA ---- */}
                      <div className="perplexity-messages-area custom-scrollbar">
                        {(!chatData['perplexity'] || chatData['perplexity'].length === 0) && (
                          <div className="flex-1 flex flex-col items-center justify-center min-h-[220px] p-8">
                            <h2 className="text-3xl font-semibold text-[var(--text-primary)] text-center tracking-tight">
                              Where knowledge begins
                            </h2>
                          </div>
                        )}
                        {chatData['perplexity']?.map((chat, idx) => (
                          <div key={idx} className="perplexity-message-pair animate-fade-in">
                            <div className="perplexity-user-row">
                              {chat.userImage && <img src={chat.userImage} alt="Upload" className="w-48 rounded-xl mb-2 border border-[#20b2aa]/30" />}
                              <div className="perplexity-user-bubble">{chat.user}</div>
                            </div>
                            <div className="perplexity-ai-row">
                              <div className="perplexity-ai-avatar"><ModelIcon model="perplexity" className="w-4 h-4" /></div>
                              <div className="text-sm leading-relaxed w-full markdown-body text-[var(--text-primary)]">
                                {chat.isImage ? (
                                  <div className="mt-2">
                                    <img src={chat.ai} alt="AI" className="rounded-xl shadow-lg max-w-full h-auto" style={{maxHeight:'300px'}} />
                                    <a href={chat.ai} target="_blank" rel="noreferrer" className="text-xs text-[#20b2aa] mt-1 inline-block hover:underline">View Full</a>
                                  </div>
                                ) : <ReactMarkdown>{chat.ai}</ReactMarkdown>}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={el => chatEndRefs.current['perplexity'] = el} />
                      </div>

                      {/* ---- PERPLEXITY NATIVE INPUT ZONE ---- */}
                      <div className="perplexity-input-zone max-w-3xl w-full mx-auto px-4 pb-6">
                        {/* Image preview */}
                        {selectedImage && (
                          <div className="absolute bottom-full left-0 mb-3 bg-[#1c1c1c] p-2 rounded-xl border border-[var(--border-color)] shadow-lg flex items-center gap-3 animate-fade-in">
                            <img src={selectedImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                            <div className="flex flex-col">
                              <span className="text-xs text-teal-400">Image selected</span>
                              <button onClick={() => setSelectedImage(null)} className="text-red-400 text-xs hover:underline mt-1">Remove</button>
                            </div>
                          </div>
                        )}

                        <div className={`perplexity-input-shell w-full ${isInputFocused ? 'focused' : ''}`}>
                          {/* [+] Attachment Button */}
                          <button
                            className="perplexity-pill-plus"
                            onClick={e => { e.stopPropagation(); triggerFilePicker(); }}
                            title="Attach"
                          >
                            <span style={{fontSize:'22px',lineHeight:1,fontWeight:300}}>+</span>
                          </button>

                          {/* [Textarea] */}
                          <motion.textarea
                            layout
                            ref={msgBoxRef}
                            value={message}
                            onChange={handleInput}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder="Ask anything..."
                            disabled={credits <= 0}
                            className="perplexity-textarea"
                            rows={1}
                            transition={{ layout: { type: 'spring', stiffness: 400, damping: 30 } }}
                          />

                          {/* Inline options */}
                          <div className="perplexity-pill-actions">
                            {/* Mic */}
                            <button onClick={handleVoiceInput} className={`perplexity-pill-icon-btn ${isListening ? 'listening' : ''}`} title="Voice">
                              <Mic size={16} />
                            </button>

                            {/* Send */}
                            <motion.button
                              onClick={handleSendMessage}
                              disabled={credits <= 0}
                              whileTap={{ scale: 0.88 }}
                              className="perplexity-pill-send"
                              title="Send"
                            >
                              <AudioWaveform size={16} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                ) : singleModelMode === 'deepseek' ? (
                    /* ================================================================
                       DEEPSEEK NATIVE LAYOUT
                       ================================================================ */
                    <div className="deepseek-native-layout bg-[var(--bg-color)] text-[var(--text-primary)]">

                      {/* ---- MESSAGES SCROLL AREA ---- */}
                      <div className="deepseek-messages-area custom-scrollbar">
                        {(!chatData['deepseek'] || chatData['deepseek'].length === 0) ? (
                          /* ---- GREETING (shown when no chat) ---- */
                          <div className="deepseek-greeting-wrapper">
                            <div className="deepseek-greeting-row">
                              <ModelIcon model="deepseek" className="w-10 h-10 deepseek-greeting-logo" />
                              <h1 className="deepseek-greeting-text">How can I help you?</h1>
                            </div>
                          </div>
                        ) : (
                          /* ---- CHAT MESSAGES ---- */
                          <>
                            {chatData['deepseek']?.map((chat, idx) => (
                              <div key={idx} className="deepseek-message-pair animate-fade-in">
                                <div className="deepseek-user-row">
                                  {chat.userImage && <img src={chat.userImage} alt="Upload" className="w-48 rounded-xl mb-2 border border-[#4a9eff]/20" />}
                                  <div className="deepseek-user-bubble">{chat.user}</div>
                                </div>
                                <div className="deepseek-ai-row">
                                  <div className="deepseek-ai-avatar"><ModelIcon model="deepseek" className="w-4 h-4" /></div>
                                  <div className="text-sm leading-relaxed w-full markdown-body text-[var(--text-primary)]">
                                    {chat.isImage ? (
                                      <div className="mt-2">
                                        <img src={chat.ai} alt="AI" className="rounded-xl shadow-lg max-w-full h-auto" style={{maxHeight:'300px'}} />
                                        <a href={chat.ai} target="_blank" rel="noreferrer" className="text-xs text-[#4a9eff] mt-1 inline-block hover:underline">View Full</a>
                                      </div>
                                    ) : <ReactMarkdown>{chat.ai}</ReactMarkdown>}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div ref={el => chatEndRefs.current['deepseek'] = el} />
                          </>
                        )}
                      </div>

                      {/* ---- INPUT ZONE ---- */}
                      <div className="deepseek-input-zone max-w-3xl w-full mx-auto px-4 pb-6">
                        {/* Image preview strip */}
                        {selectedImage && (
                          <div className="deepseek-img-preview">
                            <img src={selectedImage} alt="Preview" className="w-14 h-14 rounded-lg object-cover" />
                            <div className="flex flex-col">
                              <span className="text-xs text-[#4a9eff]">Image selected</span>
                              <button onClick={() => setSelectedImage(null)} className="text-red-400 text-xs hover:underline mt-1">Remove</button>
                            </div>
                          </div>
                        )}

                        {/* The input card */}
                        <div className={`deepseek-pill-bar w-full ${isInputFocused ? 'focused' : ''}`}>
                          {/* [+] Attachment Button */}
                          <button
                            className="deepseek-pill-plus"
                            onClick={e => { e.stopPropagation(); triggerFilePicker(); }}
                            title="Attach file"
                          >
                            <span style={{ fontSize: '22px', lineHeight: 1, fontWeight: 300 }}>+</span>
                          </button>

                          {/* [Textarea] */}
                          <motion.textarea
                            layout
                            ref={msgBoxRef}
                            value={message}
                            onChange={handleInput}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder="Message DeepSeek"
                            disabled={credits <= 0}
                            className="deepseek-pill-textarea"
                            rows={1}
                            transition={{ layout: { type: 'spring', stiffness: 400, damping: 30 } }}
                          />

                          {/* [Inline Model-specific options] */}
                          <div className="deepseek-pill-actions">
                            <button
                              className={`deepseek-toggle-btn ${isDeepThinkEnabled ? 'active' : ''}`}
                              onClick={() => setIsDeepThinkEnabled(v => !v)}
                            >
                              {/* Atom/network icon */}
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"/>
                                <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/>
                                <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/>
                              </svg>
                              <span>DeepThink</span>
                            </button>
                            <button
                              className={`deepseek-toggle-btn ${isDeepSeekSearchEnabled ? 'active' : ''}`}
                              onClick={() => setIsDeepSeekSearchEnabled(v => !v)}
                            >
                              <Globe size={13} />
                              <span>Search</span>
                            </button>

                            {/* [Mic Icon] */}
                            <button onClick={handleVoiceInput} className={`deepseek-pill-icon-btn ${isListening ? 'listening' : ''}`} title="Voice">
                              <Mic size={18} />
                            </button>

                            {/* [Send Button] */}
                            <motion.button
                              onClick={handleSendMessage}
                              disabled={credits <= 0}
                              whileTap={{ scale: 0.88 }}
                              className="deepseek-pill-send"
                              title="Send"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(-90 12 12)"/>
                              </svg>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                ) : singleModelMode === 'grok' ? (
                    /* ================================================================
                       GROK NATIVE LAYOUT
                       ================================================================ */
                    <div className="grok-native-layout bg-[var(--bg-color)] text-[var(--text-primary)]">

                      {/* ---- MESSAGES SCROLL AREA ---- */}
                      <div className="grok-messages-area custom-scrollbar">
                        {(!chatData['grok'] || chatData['grok'].length === 0) ? (
                          /* ---- GREETING (shown when no chat) ---- */
                          <div className="grok-greeting-wrapper">
                            <div className="grok-greeting-center">
                              <div className="grok-logo-wrapper">
                                <svg className="grok-diagonal-logo large" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="4.5" y1="19.5" x2="19.5" y2="4.5" />
                                </svg>
                                <h1 className="grok-greeting-text">Grok</h1>
                              </div>
                            </div>
                            
                            <div className="grok-disclaimer">
                              By messaging Grok, you agree to our <strong>Terms</strong> and <strong>Privacy Policy</strong>.
                            </div>
                          </div>
                        ) : (
                          /* ---- CHAT MESSAGES ---- */
                          <div className="grok-chat-container">
                            {chatData['grok']?.map((chat, idx) => (
                              <div key={idx} className="grok-message-pair animate-fade-in">
                                <div className="grok-user-row">
                                  {chat.userImage && <img src={chat.userImage} alt="Upload" className="w-48 rounded-xl mb-2 border border-gray-800" />}
                                  <div className="grok-user-bubble">{chat.user}</div>
                                </div>
                                <div className="grok-ai-row">
                                  <div className="grok-ai-avatar">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <circle cx="12" cy="12" r="10" />
                                      <line x1="4.5" y1="19.5" x2="19.5" y2="4.5" />
                                    </svg>
                                  </div>
                                  <div className="text-sm leading-relaxed w-full markdown-body text-[var(--text-primary)]">
                                    {chat.isImage ? (
                                      <div className="mt-2">
                                        <img src={chat.ai} alt="AI" className="rounded-xl shadow-lg max-w-full h-auto" style={{maxHeight:'300px'}} />
                                        <a href={chat.ai} target="_blank" rel="noreferrer" className="text-xs text-blue-400 mt-1 inline-block hover:underline">View Full</a>
                                      </div>
                                    ) : <ReactMarkdown>{chat.ai}</ReactMarkdown>}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div ref={el => chatEndRefs.current['grok'] = el} />
                          </div>
                        )}
                      </div>

                      {/* ---- INPUT ZONE ---- */}
                      <div className="grok-input-zone max-w-3xl w-full mx-auto px-4 pb-6">
                        {selectedImage && (
                          <div className="grok-img-preview">
                            <img src={selectedImage} alt="Preview" className="w-14 h-14 rounded-lg object-cover" />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400">Image selected</span>
                              <button onClick={() => setSelectedImage(null)} className="text-red-400 text-xs hover:underline mt-1">Remove</button>
                            </div>
                          </div>
                        )}

                        <div className={`grok-pill-bar w-full ${isInputFocused ? 'focused' : ''}`}>
                          {/* [+] Attachment Button */}
                          <button
                            className="grok-pill-plus"
                            onClick={e => { e.stopPropagation(); triggerFilePicker(); }}
                            title="Add files"
                          >
                            <span style={{ fontSize: '22px', lineHeight: 1, fontWeight: '300' }}>+</span>
                          </button>
                          
                          {/* [Textarea] */}
                          <motion.textarea
                            layout
                            ref={msgBoxRef}
                            value={message}
                            onChange={handleInput}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder="What do you want to know?"
                            disabled={credits <= 0}
                            className="grok-pill-textarea"
                            rows={1}
                            transition={{ layout: { type: 'spring', stiffness: 400, damping: 30 } }}
                          />

                          {/* [Inline Model-specific options] */}
                          <div className="grok-pill-actions">
                            {/* [Mic Icon] */}
                            <button onClick={handleVoiceInput} className={`grok-pill-icon-btn ${isListening ? 'listening' : ''}`} title="Voice input">
                              <Mic size={18} />
                            </button>

                            {/* [Send Button] */}
                            <motion.button
                              onClick={handleSendMessage}
                              disabled={credits <= 0}
                              whileTap={{ scale: 0.88 }}
                              className="grok-pill-send"
                              title="Send"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <line x1="6" y1="5" x2="6" y2="19" />
                                <line x1="12" y1="9" x2="12" y2="15" />
                                <line x1="18" y1="3" x2="18" y2="21" />
                              </svg>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                ) : singleModelMode ? (
                    <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col" style={{height: '100%'}}>
                        <div className="ai-content-area custom-scrollbar p-4 space-y-6 overflow-y-auto">
                             {!chatData[singleModelMode] && (<div className="h-full flex flex-col items-center justify-center opacity-50"><div className="mb-4"><ModelIcon model={singleModelMode} className="w-16 h-16" /></div><p className="text-[var(--text-primary)]">Start chatting with {models.find(m => m.id === singleModelMode)?.name}</p></div>)}
                                {chatData[singleModelMode]?.map((chat, idx) => (
                                <div key={idx} className="animate-fade-in">
                                    <div className="flex justify-end mb-4 flex-col items-end">
                                    {chat.userImage && <img src={chat.userImage} alt="Upload" className="w-48 rounded-lg mb-2 border border-gray-200 dark:border-gray-700" />}
                                    <div className={`px-5 py-3 rounded-3xl rounded-tr-sm max-w-[80%] text-sm shadow-sm transition-all ${
                                        theme === 'Light' 
                                        ? 'bg-gray-100 text-gray-800 border border-gray-200' 
                                        : 'bg-[#2d2e2f] text-white'
                                    }`}>
                                        {chat.user}
                                    </div>
                                    </div>
                                    <div className="flex justify-start mb-6 gap-3">
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${
                                        theme === 'Light' ? 'border-gray-200 bg-gray-50' : 'border-gray-700 bg-[var(--surface-color)]'
                                    }`}>
                                        <ModelIcon model={singleModelMode} className="w-5 h-5" />
                                    </div>
                                    <div className="text-sm leading-relaxed pt-1 opacity-90 w-full markdown-body text-[var(--text-primary)]">
                                        {chat.isImage ? (
                                        <div className="mt-2">
                                            <img src={chat.ai} alt="AI" className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg max-w-full h-auto" style={{ maxHeight: '300px' }} />
                                            <a href={chat.ai} target="_blank" rel="noreferrer" className="text-xs text-blue-400 mt-1 inline-block hover:underline">View Full</a>
                                        </div>
                                        ) : <ReactMarkdown>{chat.ai}</ReactMarkdown>}
                                    </div>
                                    </div>
                                </div>
                                ))}
                             <div ref={el => chatEndRefs.current[singleModelMode] = el} />
                        </div>
                    </div>
                ) : (
                    <div id="aiScrollContainer" ref={scrollContainerRef} className="flex-1 overflow-x-auto overflow-y-hidden select-none pb-4">
                        <motion.div
                            key={dashboardKey}
                            variants={cardContainerVariants}
                            initial="hidden"
                            animate="show"
                            className="flex space-x-5 min-w-max h-full items-start pt-2 px-2"
                        >
                            {models.map(model => (
                                visibleModels[model.id] && (
                                    <motion.div
                                        key={model.id}
                                        variants={cardItemVariants}
                                        onDoubleClick={() => handleModelDoubleClick(model.id)}
                                        onHoverStart={() => setHoveredCard(model.id)}
                                        onHoverEnd={() => setHoveredCard(null)}
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        className={`ai-box w-[350px] rounded-2xl shadow-lg flex flex-col p-1 ${
                                            hoveredCard === model.id ? 'ai-box-hovered' : ''
                                        }`}
                                    >
                                        <div className="dashboard-card-header">
                                            <ModelIcon model={model.id} className="w-10 h-10 dashboard-card-logo" />
                                            <h3 className="dashboard-card-title">{model.name}</h3>
                                        </div>
                                        <div className="flex-1 m-1 rounded-xl p-3 overflow-y-auto text-sm leading-relaxed custom-scrollbar opacity-90">
                                            {!chatData[model.id] && <p className="opacity-40 mt-10 text-center text-xs uppercase tracking-widest text-[var(--text-primary)]">{model.name} Ready</p>}
                                            {chatData[model.id]?.map((chat, idx) => (
                                                <div key={idx} className="mt-4">
                                                    <p className="text-xs font-bold opacity-50 mb-1">You</p>
                                                    {chat.userImage && <p className="text-xs text-gray-500 mb-1">[Image Uploaded]</p>}
                                                    <p className="mb-3 text-[var(--text-primary)]">{chat.user}</p>
                                                    <p className="flex items-center gap-1 text-xs font-bold text-blue-400 mb-1">{model.name}</p>
                                                    <div className="markdown-body opacity-80 text-[var(--text-primary)]">{chat.isImage ? <span className="text-blue-400">[AI Image]</span> : <ReactMarkdown>{chat.ai}</ReactMarkdown>}</div>
                                                </div>
                                            ))}
                                            <div ref={el => chatEndRefs.current[model.id] = el} />
                                        </div>
                                    </motion.div>
                                )
                            ))}
                            <motion.div
                                variants={cardItemVariants}
                                onDoubleClick={() => setIsConclusionExpanded(true)}
                                onHoverStart={() => setHoveredCard('conclusion')}
                                onHoverEnd={() => setHoveredCard(null)}
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className={`ai-box w-[350px] border-2 border-purple-500/30 flex flex-col p-1 bg-gradient-to-b from-purple-500/5 to-transparent cursor-pointer group ${
                                    hoveredCard === 'conclusion' ? 'ai-box-hovered' : ''
                                }`}
                                style={{ borderColor: hoveredCard === 'conclusion' ? 'rgba(168,85,247,0.5)' : undefined }}
                            >
                                <div className="px-4 py-3 border-b border-purple-500/20 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-tighter">Conclusion</h3>
                                        <div className="flex items-center -space-x-1.5">
                                            {models.map(m => (
                                                <ModelIcon key={m.id} model={m.id} className="w-7 h-7 border-2 border-[var(--surface-color)] rounded-full" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 m-1 rounded-xl p-3 overflow-y-auto text-sm leading-relaxed custom-scrollbar bg-white/5">
                                    {Object.keys(chatData).length > 0 ? (
                                        <div className="markdown-body opacity-90 text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: conclusionText.replace(/\n/g, '<br />') }} />
                                    ) : (
                                        <p className="opacity-40 mt-10 text-center text-xs uppercase tracking-widest text-[var(--text-primary)]">
                                            Waiting for AI responses...
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* ============================================================
                STANDARD INPUT BAR — only shown when NOT in chatgpt mode
                ============================================================ */}
            {singleModelMode !== 'chatgpt' && singleModelMode !== 'gemini' && singleModelMode !== 'claude' && singleModelMode !== 'perplexity' && singleModelMode !== 'deepseek' && singleModelMode !== 'grok' && (
              <div className="w-full flex justify-center pb-10 px-4">
                <div className="relative w-full max-w-4xl z-40">
                    {selectedImage && (
                        <div className="absolute bottom-full left-0 mb-3 bg-[#1e1f20] p-2 rounded-xl border border-[#444746] shadow-lg flex items-center gap-3 animate-fade-in">
                            <img src={selectedImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Image selected</span>
                                <button onClick={() => setSelectedImage(null)} className="text-red-400 text-xs hover:underline mt-1">Remove</button>
                            </div>
                        </div>
                    )}
                    {activeMenu === 'plus' && (
                          <div className="plus-action-menu animate-pop-up" onClick={e => e.stopPropagation()}>
                            <button onClick={(e) => { e.stopPropagation(); triggerFilePicker(); toggleMenu('plus', e); }} className="plus-action-menu-item">
                              <span className="plus-action-menu-icon"><Paperclip size={16} /></span>
                              <span>Upload files</span>
                            </button>
                            <button className="plus-action-menu-item" onClick={() => { toast.info("Google Drive integrated (Mocked)"); }}>
                              <span className="plus-action-menu-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12.51 14.51L17.5 5.86h-10l-4.99 8.65zM10.15 14.51L5.15 5.86 2.65 10.2l5 8.65zM12.51 14.51l2.5-4.32 6.34.02-2.5 4.3z" />
                                </svg>
                              </span>
                              <span>Add from Drive</span>
                            </button>
                            <button className="plus-action-menu-item" onClick={() => { toast.info("More uploads menu (Mocked)"); }}>
                              <span className="plus-action-menu-icon"><MoreHorizontal size={16} /></span>
                              <span>More uploads</span>
                              <span className="plus-action-menu-arrow"><ChevronRight size={14} /></span>
                            </button>
                            
                            <div className="plus-action-menu-divider" />
                            
                            <button className="plus-action-menu-item" onClick={() => { toast.info("Image Creation Tool opened (Mocked)"); }}>
                              <span className="plus-action-menu-icon"><ImageIcon size={16} /></span>
                              <span>Create image</span>
                            </button>
                            <button className="plus-action-menu-item" onClick={() => { toast.info("Video Creation Tool opened (Mocked)"); }}>
                              <span className="plus-action-menu-icon"><Video size={16} /></span>
                              <span>Create video</span>
                            </button>
                            <button className="plus-action-menu-item" onClick={() => { toast.info("Music Creation Tool opened (Mocked)"); }}>
                              <span className="plus-action-menu-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M9 18V5l12-2v13" />
                                  <circle cx="6" cy="18" r="3" />
                                  <circle cx="18" cy="16" r="3" />
                                </svg>
                              </span>
                              <span>Create music</span>
                            </button>
                            <button className="plus-action-menu-item" onClick={() => { toast.info("More tools menu (Mocked)"); }}>
                              <span className="plus-action-menu-icon"><MoreHorizontal size={16} /></span>
                              <span>More tools</span>
                              <span className="plus-action-menu-arrow"><ChevronRight size={14} /></span>
                            </button>
                          </div>
                    )}
                    <div className={`typing-container rounded-[28px] px-4 py-2 flex items-center gap-3 min-h-[52px] ${isInputFocused ? 'is-focused' : ''}`}>
                        <button
                            onClick={(e) => toggleMenu('plus', e)}
                            className={`w-9 h-9 rounded-full hover-effect text-2xl font-light flex items-center justify-center transition-transform text-[var(--text-primary)] ${activeMenu === 'plus' ? 'rotate-45' : ''}`}
                        >
                            ＋
                        </button>
                        <motion.textarea
                            layout
                            ref={msgBoxRef}
                            value={message}
                            onChange={handleInput}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder={
                                credits > 0
                                    ? (singleModelMode ? `Message ${models.find(m => m.id === singleModelMode)?.name}...` : 'Ask AIHome anything...')
                                    : '⚠️ Recharge Credits to Chat'
                            }
                            disabled={credits <= 0}
                            className="flex-1 bg-transparent placeholder-opacity-50 text-base focus:outline-none resize-none max-h-40 py-1.5 leading-relaxed text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                            rows={1}
                            transition={{ layout: { type: 'spring', stiffness: 400, damping: 30 } }}
                        />
                        <div className="flex items-center gap-1">
                            <div className="voice-orb-wrapper" onClick={handleVoiceInput} style={{ cursor: 'pointer' }}>
                                <div className={`voice-orb-blob ${isListening ? 'is-listening' : ''}`} />
                                <div className={`voice-orb-core ${isListening ? 'is-listening' : ''}`}>
                                    <motion.div
                                        animate={isListening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                                        transition={isListening ? { repeat: Infinity, duration: 1.0, ease: 'easeInOut' } : {}}
                                        className={isListening ? 'text-white' : 'text-gray-400 hover:text-white transition-colors'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                                            <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 5.226v2.524h1.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5h1.5v-2.524A6.751 6.751 0 0 1 5.25 12.75v-1.5a.75.75 0 0 1 .75-.75Z" />
                                        </svg>
                                    </motion.div>
                                </div>
                            </div>
                            <motion.button
                                onClick={handleSendMessage}
                                disabled={credits <= 0}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.88 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                className="send-btn"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                </svg>
                            </motion.button>
                        </div>
                    </div>
                </div>
              </div>
            )}
            {/* --- 🆕 FULL SCREEN CONCLUSION VIEW --- */}
            {isConclusionExpanded && (
                <div className="absolute inset-0 z-[100] flex flex-col bg-[var(--bg-color)] animate-fade-in">
                    <div className="h-16 flex items-center justify-between px-6 border-b border-purple-500/20 bg-purple-500/5 backdrop-blur">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsConclusionExpanded(false)} className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                            </button>
                            <div className="flex items-center gap-2">
                                <Edit3 className="text-purple-500" size={24} />
                                <span className="font-bold text-lg text-purple-400 uppercase tracking-widest">Master Conclusion</span>
                            </div>
                        </div>
                        <button onClick={() => setIsConclusionExpanded(false)} className="text-sm font-medium text-purple-500 hover:text-purple-400">Exit View</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 md:p-20">
                        <div className="max-w-4xl mx-auto bg-purple-500/5 border border-purple-500/20 p-10 rounded-[40px] shadow-2xl">
                            <div className="markdown-body text-lg leading-loose text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: conclusionText.replace(/\n/g, '<br />') }} />
                        </div>
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};
export default Home;
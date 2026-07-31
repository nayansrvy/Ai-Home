import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import { auth, googleProvider } from "../firebase-config";
import { signInWithPopup } from "firebase/auth";
import { ModelIcon } from './Home';

const Login = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const particlesRef = useRef(null);

  // Custom states for scrolling, snap section visual changes, and spotlight glow
  const containerRef = useRef(null);
  const [activeSection, setActiveSection] = useState(0);
  const [visibleSections, setVisibleSections] = useState({
    0: true,
    1: false,
    2: false,
    3: false
  });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Mouse Glow Spotlight Coordinate Tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Intersection Observer for active section highlighting and entrance animation triggers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sections = container.querySelectorAll('.snap-section');
    const observerOptions = {
      root: container,
      rootMargin: '0px',
      threshold: 0.4, // Trigger when 40% of section enters viewport
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Array.from(sections).indexOf(entry.target);
          if (index !== -1) {
            setActiveSection(index);
            setVisibleSections((prev) => ({ ...prev, [index]: true }));
          }
        }
      });
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const scrollToSection = (index) => {
    if (containerRef.current) {
      const sections = containerRef.current.querySelectorAll('.snap-section');
      if (sections[index]) {
        sections[index].scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Particles Logic
  useEffect(() => {
    const particleContainer = particlesRef.current;
    if (particleContainer) {
      particleContainer.innerHTML = ''; 
      for (let i = 0; i < 40; i++) {
        const span = document.createElement('span');
        span.classList.add('particle');
        const size = Math.random() * 2 + 1;
        span.style.width = `${size}px`;
        span.style.height = `${size}px`;
        span.style.left = `${Math.random() * 100}vw`;
        const duration = Math.random() * 15 + 10;
        span.style.animationDuration = `${duration}s`;
        span.style.animationDelay = `${Math.random() * 5}s`;
        particleContainer.appendChild(span);
      }
    }
  }, []);

  const openModal = () => {
      setIsModalOpen(true);
      setError('');
  };

  const closeModal = () => setIsModalOpen(false);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await axios.post("http://127.0.0.1:5000/api/auth-verify", { idToken });
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("userEmail", res.data.user.email);
      navigate('/');
    } catch (error) {
      console.error(error);
      setError("Google Login Failed. Please try again.");
    }
  };

  return (
    <div ref={containerRef} className="login-page-body font-sans">
      
      {/* 3D Spotlight / Mouse Glow Overlay (Hardware-accelerated fixed placement) */}
      <div 
        className="spotlight-glow hidden md:block"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 212, 170, 0.05), rgba(76, 141, 246, 0.03), transparent 80%)`
        }}
      />

      {/* PARTICLES BACKGROUND (Fixed across all sections) */}
      <div id="particles" ref={particlesRef} className="fixed inset-0 pointer-events-none z-0"></div>

      {/* Sticky Pill-shaped Navigation Header */}
      <header className="fixed top-0 left-0 right-0 w-full flex justify-between items-center p-6 z-40 backdrop-blur-md bg-black/10 transition-all duration-300">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection(0)}>
          <div className="text-lg font-semibold text-gray-200 tracking-tight">AIHome</div>
          <span className="text-xs px-2 py-0.5 rounded-md bg-[#2d2e2f] text-blue-300 border border-[#444746] accent-badge">MultiAI</span>
        </div>
        
        {/* Navigation center pill links */}
        <div className="hidden md:flex items-center gap-6 px-6 py-2 rounded-full bg-[#1e1f20]/80 border border-[#444746]/80 backdrop-blur-md text-sm shadow-lg shadow-black/30">
          <button 
            onClick={() => scrollToSection(0)} 
            className={`hover:text-white transition-all duration-300 ${activeSection === 0 ? 'text-white font-semibold' : 'text-gray-400'}`}
          >
            Home
          </button>
          <button 
            onClick={() => scrollToSection(1)} 
            className={`hover:text-white transition-all duration-300 ${activeSection === 1 ? 'text-[#00d4aa] font-semibold' : 'text-gray-400'}`}
          >
            Intro
          </button>
          <button 
            onClick={() => scrollToSection(2)} 
            className={`hover:text-white transition-all duration-300 ${activeSection === 2 ? 'text-[#00d4aa] font-semibold' : 'text-gray-400'}`}
          >
            Tokens
          </button>
          <button 
            onClick={() => scrollToSection(3)} 
            className={`hover:text-white transition-all duration-300 ${activeSection === 3 ? 'text-[#00d4aa] font-semibold' : 'text-gray-400'}`}
          >
            About
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={openModal} className="px-5 py-2 rounded-full bg-gradient-to-r from-[#00d4aa] to-[#0088ff] text-black text-sm font-semibold shadow-md shadow-teal-500/10 hover:shadow-teal-500/20 hover:scale-105 transition-all duration-300">
            Get Started
          </button>
        </div>
      </header>

      {/* Sidebar Navigation Indicator Dots */}
      <div className="scroll-dots">
        {[0, 1, 2, 3].map((index) => (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            className={`scroll-dot ${activeSection === index ? 'active' : ''}`}
            title={`Go to Section ${index + 1}`}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>

      {/* POPUP (Fixed view centers modally) */}
      {isModalOpen && (
        <div id="loginModal" className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-[#1e1f20] rounded-[28px] w-full max-w-[400px] p-8 md:p-10 relative shadow-2xl flex flex-col items-center border border-[#333]" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute right-6 top-6 text-gray-400 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h2 className="text-[28px] font-semibold text-[#e3e3e3] text-center mb-10 leading-tight">
                Log in to AIHome
            </h2>

            <div className="w-full space-y-4 mb-6">
                <button onClick={handleGoogleLogin} className="social-btn w-full flex items-center justify-center py-3 bg-[#2d2e2f] hover:bg-[#3d3e3f] rounded-xl border border-[#444746] transition text-white">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-3" alt="Google" />
                    Continue with Google
                </button>
                {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
            </div>
            
            <p className="text-[11px] text-gray-500 text-center mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      )}

      {/* =========================================
         SECTION 1: HERO - 3D Orbit system (Starts snapped)
         ========================================= */}
      <section className="snap-section snap-start w-full h-screen relative flex flex-col justify-between pt-24 pb-16 overflow-hidden hero-section">
        {/* 3D BACKGROUND */}
        <div className="scene z-0">
          <div className="ring-system">
            {/* 6 cards at perfect 60-degree mathematical intervals */}
            <div className="orbit-item" style={{ transform: 'rotateY(0deg) translateZ(320px)' }}>
              <div className="ai-card gpt">
                <ModelIcon model="chatgpt" className="w-8 h-8 mb-1.5" />
                <span>ChatGPT</span>
              </div>
            </div>
            <div className="orbit-item" style={{ transform: 'rotateY(60deg) translateZ(320px)' }}>
              <div className="ai-card gemini">
                <ModelIcon model="gemini" className="w-8 h-8 mb-1.5" />
                <span>Gemini</span>
              </div>
            </div>
            <div className="orbit-item" style={{ transform: 'rotateY(120deg) translateZ(320px)' }}>
              <div className="ai-card claude">
                <ModelIcon model="claude" className="w-8 h-8 mb-1.5" />
                <span>Claude</span>
              </div>
            </div>
            <div className="orbit-item" style={{ transform: 'rotateY(180deg) translateZ(320px)' }}>
              <div className="ai-card perplexity">
                <ModelIcon model="perplexity" className="w-8 h-8 mb-1.5" />
                <span>Perplexity</span>
              </div>
            </div>
            <div className="orbit-item" style={{ transform: 'rotateY(240deg) translateZ(320px)' }}>
              <div className="ai-card deepseek">
                <ModelIcon model="deepseek" className="w-8 h-8 mb-1.5" />
                <span>DeepSeek</span>
              </div>
            </div>
            <div className="orbit-item" style={{ transform: 'rotateY(300deg) translateZ(320px)' }}>
              <div className="ai-card grok">
                <ModelIcon model="grok" className="w-8 h-8 mb-1.5" />
                <span>Grok</span>
              </div>
            </div>
          </div>
          <div className="core flex flex-col gap-1">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 tracking-tight">AIHome</h1>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest">Intelligence</span>
          </div>
        </div>

        <main className="flex-1 z-10 flex flex-col items-center justify-end pb-16 pointer-events-none">
          <p className="text-gray-500 text-xs tracking-wide animate-pulse uppercase">Select an Intelligence to begin</p>
        </main>
      </section>

      {/* =========================================
         SECTION 2: INTRODUCTION
         ========================================= */}
      <section className="snap-section bg-dot-grid">
        <div className={`max-w-6xl w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center section-animate ${visibleSections[1] ? 'is-visible' : ''}`}>
          
          {/* Left Column Content */}
          <div className="flex flex-col items-start gap-6">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider accent-badge border border-[#444746]/50">
              {/* DUMMY BADGE TEXT - Replace this tagline later */}
              Built by AIHome Developers
            </span>
            <h2 className="text-4xl md:text-6xl font-extrabold leading-tight text-[#e3e3e3] tracking-tight">
              {/* DUMMY HEADLINE - Replace this title later */}
              One Platform. <br />
              <span className="text-gradient">Every AI.</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
              {/* DUMMY DESCRIPTION - Replace this block later */}
              AIHome connects you to top language models in a unified workplace. 
              Switch intelligences, compare answers, and run pipelines seamlessly.
            </p>
            <button 
              onClick={openModal}
              className="action-btn flex items-center justify-center gap-2 max-w-[200px] shadow-lg transition-transform hover:scale-105 duration-200"
              style={{ marginTop: '8px' }}
            >
              {/* DUMMY CTA BUTTON - Replace this link/action later */}
              Get Started Now <span className="font-sans">→</span>
            </button>
            <span className="text-gray-600 text-xs mt-[-10px] pl-2 select-none">
              {/* DUMMY MICROTEXT - Replace this subtext later */}
              Experience something smarter
            </span>
          </div>

          {/* Right Column mockup (Match .ai-card style with rounded corners and glowing border) */}
          <div className="w-full flex justify-center">
            <div className="mockup-window max-w-md md:max-w-full">
              <div className="mockup-header">
                <div className="mockup-dot bg-[#ea4335]" />
                <div className="mockup-dot bg-[#fbbc05]" />
                <div className="mockup-dot bg-[#34a853]" />
                <div className="text-[10px] text-gray-500 ml-4 font-mono select-none">ai-home-platform-v1.0.sh</div>
              </div>
              <div className="p-6 font-mono text-xs text-gray-400 space-y-3 bg-[#1e1f20]">
                {/* Visual Representation of Dashboard Code Mockup */}
                <p className="text-[#00d4aa] font-semibold">// Initializing AI Orchestration Engine...</p>
                <div className="flex items-center gap-2 text-gray-500">
                  <span>$</span>
                  <span>ai-home --agent gpt-4o-mini</span>
                </div>
                <div className="pl-4 border-l border-zinc-800 space-y-1">
                  <p>✔ Authenticated secure API tunnel</p>
                  <p>✔ Active Context Size: <span className="text-[#0088ff]">128k tokens</span></p>
                  <p>✔ Routing queries dynamically...</p>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-[#00d4aa]">● System Status: Operational</span>
                  <span className="text-gray-500">Latency: 14ms</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================
         SECTION 3: TOKEN-BASED SYSTEM
         ========================================= */}
      <section className="snap-section bg-dot-grid border-t border-[#444746]/10">
        <div className={`max-w-6xl w-full mx-auto px-6 flex flex-col items-center justify-center gap-10 section-animate ${visibleSections[2] ? 'is-visible' : ''}`}>
          
          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#e3e3e3] tracking-tight">
              {/* DUMMY TITLE - Replace this later */}
              Simple, Transparent Token System
            </h2>
            <p className="text-gray-400 text-sm md:text-base">
              {/* DUMMY SUBHEADING - Replace this later */}
              Fuel your workspace with credits. No monthly subscriptions, no hidden fees. 
              Only pay for the computational resources your prompts consume.
            </p>
          </div>

          {/* Grid Cards (3 feature cards styled like .ai-card) */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CARD 1 */}
            <div className="token-card">
              <div className="token-icon-wrap">
                {/* SVG Coin Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><line x1="3" y1="3" x2="21" y2="21"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              </div>
              <h3 className="text-base font-semibold text-[#e3e3e3] mb-2">
                {/* DUMMY FEATURE TITLE 1 - Replace this later */}
                Pay As You Use
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                {/* DUMMY FEATURE DESC 1 - Replace this later */}
                Tokens are deducted in real-time as models respond. Stop running jobs to save credits.
              </p>
            </div>

            {/* CARD 2 */}
            <div className="token-card">
              <div className="token-icon-wrap" style={{ color: '#0088ff', background: 'rgba(0, 136, 255, 0.1)', borderColor: 'rgba(0, 136, 255, 0.2)' }}>
                {/* SVG Shield Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="text-base font-semibold text-[#e3e3e3] mb-2">
                {/* DUMMY FEATURE TITLE 2 - Replace this later */}
                No Hidden Fees
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                {/* DUMMY FEATURE DESC 2 - Replace this later */}
                Standard unit prices apply. Review usage logs directly in your profile dashboard.
              </p>
            </div>

            {/* CARD 3 */}
            <div className="token-card">
              <div className="token-icon-wrap" style={{ color: '#e3e3e3', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                {/* SVG Sliders Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="18" y1="16" x2="22" y2="16"/></svg>
              </div>
              <h3 className="text-base font-semibold text-[#e3e3e3] mb-2">
                {/* DUMMY FEATURE TITLE 3 - Replace this later */}
                Flexible Plans
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                {/* DUMMY FEATURE DESC 3 - Replace this later */}
                Purchase custom bundles as your demands grow. Credits remain valid for one full calendar year.
              </p>
            </div>
          </div>

          {/* Progress Bar Widget and Benefits list */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#1e1f20]/50 p-6 md:p-8 rounded-[24px] border border-[#444746]/50">
            
            {/* Visual Token Counter Mockup */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold text-[#e3e3e3]">
                <span className="text-[#00d4aa]">TOKEN ALLOCATION</span>
                <span>Active Plan: Pro Developer</span>
              </div>
              <div className="token-progress-bar">
                <div className="token-progress-fill" style={{ width: '75%' }}></div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
                <span>750,000 / 1,000,000 units</span>
                {/* DUMMY COUNT - Replace this count later */}
                <span className="text-white font-semibold">3,000,000 tokens included</span>
              </div>
            </div>

            {/* Checkmark Bullets List */}
            <ul className="space-y-3 pl-0 md:pl-6 text-sm text-gray-400">
              <li className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#00d4aa] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                {/* DUMMY BENEFIT 1 - Replace later */}
                <span>Auto-refill alerts when tokens fall below 10%</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#00d4aa] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                {/* DUMMY BENEFIT 2 - Replace later */}
                <span>Detailed per-prompt token audit logs available</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#00d4aa] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                {/* DUMMY BENEFIT 3 - Replace later */}
                <span>Transfer balance easily to team members</span>
              </li>
            </ul>

          </div>

        </div>
      </section>

      {/* =========================================
         SECTION 4: PERSONAL INTRODUCTION (About Me)
         ========================================= */}
      <section className="snap-section bg-dot-grid border-t border-[#444746]/10">
        <div className={`max-w-6xl w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 items-center section-animate ${visibleSections[3] ? 'is-visible' : ''}`}>
          
          {/* Left Column Profile Pic with Blue-Purple-Red Gradient border */}
          <div className="flex justify-center md:col-span-1">
            <div className="profile-ring">
              {/* DUMMY IMAGE PATH - Change the source of avatar below later */}
              <img 
                src="/avatar_placeholder.png" 
                alt="Developer Profile" 
                className="w-44 h-44 rounded-full object-cover border-4 border-[#131314] bg-[#1e1f20]"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://www.svgrepo.com/show/335455/profile-default.svg';
                }}
              />
            </div>
          </div>

          {/* Right Columns Bio Details (Colspan 2) */}
          <div className="flex flex-col items-start gap-6 md:col-span-2">
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#e3e3e3] tracking-tight">
              {/* DUMMY NAME - Replace with your name later */}
              Hi, I'm <span className="text-gradient">John Doe</span>
            </h2>
            
            <p className="text-gray-400 text-base leading-relaxed">
              {/* DUMMY BIO - Replace with your bio details later */}
              I'm an AI engineer and developer focused on crafting unified intelligence workspaces. 
              My goal is to simplify cognitive access, making complex neural API queries as straightforward as possible.
            </p>

            {/* Stats Badges (Matching .text-xs px-2 py-0.5 rounded-md bg-[#2d2e2f] style in header) */}
            <div className="flex flex-wrap gap-3">
              <span className="text-xs px-3 py-1.5 rounded-md bg-[#2d2e2f] text-blue-300 border border-[#444746] font-semibold">
                {/* DUMMY STAT 1 - Replace later */}
                5+ Years Experience
              </span>
              <span className="text-xs px-3 py-1.5 rounded-md bg-[#2d2e2f] text-blue-300 border border-[#444746] font-semibold">
                {/* DUMMY STAT 2 - Replace later */}
                24+ Projects Built
              </span>
              <span className="text-xs px-3 py-1.5 rounded-md bg-[#2d2e2f] text-blue-300 border border-[#444746] font-semibold">
                {/* DUMMY STAT 3 - Replace later */}
                99% Happy Clients
              </span>
            </div>

            {/* Social Icons Links */}
            <div className="flex items-center gap-4 mt-2">
              {/* GitHub */}
              <a href="#github" className="social-link-btn" title="GitHub" onClick={(e) => e.preventDefault()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              </a>
              {/* LinkedIn */}
              <a href="#linkedin" className="social-link-btn" title="LinkedIn" onClick={(e) => e.preventDefault()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              {/* Twitter */}
              <a href="#twitter" className="social-link-btn" title="Twitter" onClick={(e) => e.preventDefault()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
              </a>
              {/* Email */}
              <a href="#email" className="social-link-btn" title="Email" onClick={(e) => e.preventDefault()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </a>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Login;
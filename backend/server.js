require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const admin = require('firebase-admin');

// --- 🔥 FIREBASE SETUP ---
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // Firestore Database instance
// --- 🔥 ---

const app = express();
const PORT = 5000;
const JWT_SECRET = "mysecretkey123";

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: '50mb' }));

// ==========================================
// 🔐 AUTH ROUTES
// ==========================================

// Email/Password Signup
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usersRef = db.collection('users');
        
        const snapshot = await usersRef.where('email', '==', email).get();
        if (!snapshot.empty) return res.status(400).json({ error: "User exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await usersRef.add({
            email,
            password: hashedPassword,
            credits: 150000,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: "User created", id: newUser.id });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: "Signup Failed" }); 
    }
});

// Email/Password Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const snapshot = await db.collection('users').where('email', '==', email).get();

        if (snapshot.empty) return res.status(400).json({ error: "Invalid credentials" });

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        if (!(await bcrypt.compare(password, userData.password))) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: userDoc.id }, JWT_SECRET);
        res.json({ token, user: { id: userDoc.id, email: userData.email, credits: userData.credits || 0 } });
    } catch (e) { res.status(500).json({ error: "Login Failed" }); }
});

// Google Login / Auth Verify
app.post('/api/auth-verify', async (req, res) => {
    const { idToken } = req.body;
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const email = decodedToken.email;

        let userRef = db.collection('users').doc(uid);
        let userDoc = await userRef.get();

        if (!userDoc.exists) {
            await userRef.set({
                email: email,
                credits: 150000,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            userDoc = await userRef.get();
        }

        const token = jwt.sign({ id: uid }, JWT_SECRET);
        res.json({ 
            token, 
            user: { id: uid, email: email, credits: userDoc.data().credits || 150000 } 
        });

    } catch (error) {
        console.error("Auth Error:", error);
        res.status(401).json({ error: "Unauthorized access" });
    }
});

// Backend (Node/Express)
app.get('/api/share/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
        // Yeh poore Firestore mein is sessionId ko dhoondega (Bina userId ke)
        const snapshot = await db.collectionGroup('chats')
            .where('sessionId', '==', sessionId)
            .get();

        if (snapshot.empty) return res.status(404).json([]);

        let chats = [];
        snapshot.forEach(doc => chats.push(doc.data()));
        
        // Timestamp ke basis par sort karein
        chats.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
        
        res.json(chats);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// Get User Credits
app.get('/api/user/:userId', async (req, res) => {
    try {
        const doc = await db.collection('users').doc(req.params.userId).get();
        if (!doc.exists) return res.status(404).json({ error: "User Not Found" });
        res.json({ credits: doc.data().credits });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

// ==========================================
// 📜 CHAT HISTORY ROUTES
// ==========================================

// Get History List (Recent Sessions)
app.get('/api/history', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.json([]);
    
    try {
        const snapshot = await db.collection('users')
            .doc(userId)
            .collection('chats')
            .get();

        const sessions = [];
        const seenSessions = new Set();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.sessionId && !seenSessions.has(data.sessionId)) {
                seenSessions.add(data.sessionId);
                sessions.push({ 
                    id: data.sessionId, 
                    title: data.userMessage ? data.userMessage.substring(0, 30) : "New Chat", 
                    timestamp: data.timestamp ? data.timestamp.toMillis() : 0 
                });
            }
        });

        // Manual Sort: Latest chat top par
        sessions.sort((a, b) => b.timestamp - a.timestamp);
        res.json(sessions.slice(0, 15));
    } catch (e) { 
        console.error("History fetch error:", e);
        res.json([]); 
    }
});

// Get Specific Session Chats
app.get('/api/session/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const { userId } = req.query; 

    if (!userId || !sessionId) {
        return res.status(400).json({ error: "userId and sessionId are required" });
    }

    try {
        const snapshot = await db.collection('users')
            .doc(userId)
            .collection('chats')
            .where('sessionId', '==', sessionId)
            .get();
        
        let chats = [];
        snapshot.forEach(doc => {
            chats.push({ id: doc.id, ...doc.data() });
        });

        // Manual Sort: Taaki order sahi rahe bina Firebase Index ke
        chats.sort((a, b) => {
            const timeA = a.timestamp?.toMillis() || 0;
            const timeB = b.timestamp?.toMillis() || 0;
            return timeA - timeB;
        });

        res.json(chats);
    } catch (e) { 
        console.error("🔥 Session Load Error:", e.message);
        res.status(500).json([]); 
    }
});

// ==========================================
// 🤖 AI MODEL CONFIG & API HELPERS
// ==========================================

const getPrimaryConfig = (uiModel) => {
    switch (uiModel) {
        case 'chatgpt': return { provider: 'google', model: 'gemini-2.0-flash', key: process.env.GOOGLE_KEY_CHATGPT };
        case 'gemini': return { provider: 'google', model: 'gemini-2.0-flash', key: process.env.GOOGLE_KEY_GEMINI };
        case 'claude': return { provider: 'openrouter', model: 'qwen/qwen-2.5-coder-32b-instruct:free', key: process.env.OPENROUTER_KEY_CLAUDE };
        case 'copilot': return { provider: 'openrouter', model: 'kwaipilot/kat-coder-pro:free', key: process.env.OPENROUTER_KEY_COPILOT };
        case 'perplexity': return { provider: 'openrouter', model: 'amazon/nova-2-lite-v1:free', key: process.env.OPENROUTER_KEY_PERPLEXITY };
        case 'deepseek': return { provider: 'openrouter', model: 'tngtech/tng-r1t-chimera:free', key: process.env.OPENROUTER_KEY_DEEPSEEK };
        case 'grok': return { provider: 'groq', model: 'llama-3.2-11b-vision-preview', key: process.env.GROQ_API_KEY };
        default: return { provider: 'groq', model: 'llama-3.3-70b-versatile', key: process.env.GROQ_API_KEY };
    }
};

const getSystemPrompt = (uiModel) => {
    switch (uiModel) {
        case 'grok': return "You are Grok, an AI inspired by the Hitchhiker's Guide to the Galaxy.";
        case 'chatgpt': return "You are ChatGPT. Your tone is professional and friendly.";
        case 'gemini': return "You are Gemini, a helpful AI by Google.";
        default: return "You are a helpful AI assistant.";
    }
};

const getBackupGroqKey = () => {
    const keys = [process.env.GROQ_BACKUP_1, process.env.GROQ_BACKUP_2].filter(k => k);
    return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : process.env.GROQ_API_KEY;
};

async function callGoogle(model, message, key, systemPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const response = await axios.post(url, { contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] }] });
    return response.data.candidates[0].content.parts[0].text;
}

async function callOpenRouter(model, message, key, systemPrompt) {
    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", { model, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }] }, { headers: { "Authorization": `Bearer ${key}` } });
    return response.data.choices[0].message.content;
}

async function callGroq(model, message, key, systemPrompt) {
    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", { model, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }] }, { headers: { "Authorization": `Bearer ${key}` } });
    return response.data.choices[0].message.content;
}

// ==========================================
// 🚀 MAIN CHAT & IMAGE ROUTES
// ==========================================

app.post('/api/chat', async (req, res) => {
    const { message, model, userId, sessionId, promptTokens } = req.body;

    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) return res.status(404).json({ reply: "User not found" });
        const userData = userDoc.data();

        // 1. Credit Check
        if (userData.credits < (promptTokens || 5)) {
            return res.status(402).json({ reply: "❌ Insufficient Tokens!" });
        }

        let reply = "";
        const config = getPrimaryConfig(model);
        const systemPrompt = getSystemPrompt(model);

        // 2. ⚡ ASLI AI CALL (Ye part aapke code mein missing tha)
        try {
            if (config.provider === 'google') {
                reply = await callGoogle(config.model, message, config.key, systemPrompt);
            } else if (config.provider === 'openrouter') {
                reply = await callOpenRouter(config.model, message, config.key, systemPrompt);
            } else if (config.provider === 'groq') {
                reply = await callGroq(config.model, message, config.key, systemPrompt);
            }
        } catch (error) {
            console.error(`${model} failed, using backup...`);
            const backupKey = getBackupGroqKey();
            reply = await callGroq("llama-3.3-70b-versatile", `[Backup Mode] ${message}`, backupKey, systemPrompt);
        }

        // 3. 🆕 Token Calculation (5 per word)
        const outputWords = reply.trim().split(/\s+/).filter(word => word.length > 0).length;
        const replyTokens = outputWords * 5;
        const totalUsed = (promptTokens || 0) + replyTokens;

        const newCredits = Math.max(0, userData.credits - totalUsed);
        await userRef.update({ credits: newCredits });

        // 4. Save to History
        await db.collection('users').doc(userId).collection('chats').add({
            sessionId,
            userMessage: message,
            aiResponse: reply,
            modelUsed: model,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // 5. Send Response
        res.json({ reply, remainingCredits: newCredits });

    } catch (finalError) {
        console.error("Token Logic Error:", finalError);
        res.status(500).json({ reply: "System Busy. Please try again." });
    }
});

// ==========================================
// 🧠 MASTER SYNTHESIZER ROUTE
// ==========================================

app.post('/api/synthesize', async (req, res) => {
    const { allAnswers, originalQuery } = req.body;

    if (!allAnswers || allAnswers.length < 2) {
        return res.status(400).json({ conclusion: "Need at least two model answers to synthesize." });
    }

    // Construct a detailed prompt for the synthesizer model
    const synthesisPrompt = `
        As the Master Synthesizer for AIHome, your objective is to review responses from 6 different AI models (ChatGPT, Gemini, DeepSeek, Perplexity, Claude, and Grok) regarding a user's prompt and generate a single, highly accurate, and comprehensive "Master Conclusion."

        ### USER'S ORIGINAL PROMPT:
        "${originalQuery}"

        ### AI RESPONSES TO SYNTHESIZE:
        ${allAnswers.map((ans, i) => `--- Model ${i + 1} Response ---\n${ans}\n`).join('\n')}

        ### INSTRUCTIONS:
        1.  **Unified Answer**: Provide a clear, direct, and well-structured final answer. Do not just summarize; give the ultimate response that combines the strengths of all models.
        2.  **Fact-Checking & Consensus**: Identify points where models agree. If models conflict, prioritize facts from search-enabled or strong reasoning models.
        3.  **Structure & Clarity**: Use bold headings, bullet points, and clean markdown formatting. If code is involved, provide the most optimized, bug-free unified version.
        4.  **Tone & Style**: Be concise, direct, authoritative, and helpful. Avoid meta-commentary like "Model 1 said this..." unless explicitly contrasting unique insights.
    `;

    try {
        const conclusion = await callGroq("llama-3.3-70b-versatile", synthesisPrompt, process.env.GROQ_API_KEY, "You are the Master Synthesizer for AIHome.");
        res.json({ conclusion });
    } catch (error) {
        res.status(500).json({ conclusion: "Error: The Master Synthesizer is currently unavailable." });
    }
});

// Dummy Payment Success Route
app.post('/api/add-credits', async (req, res) => {
    const { userId, amount } = req.body;
    try {
        const tokenAmount = parseInt(amount) * 3000; // ₹1 = 3000 Tokens logic
        const userRef = db.collection('users').doc(userId);
        
        await userRef.update({
            credits: admin.firestore.FieldValue.increment(tokenAmount)
        });

        const updatedDoc = await userRef.get();
        res.json({ 
            success: true, 
            newBalance: updatedDoc.data().credits,
            addedTokens: tokenAmount 
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to add credits" });
    }
});

app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;
    res.json({ reply: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Math.random()}&nologo=true`, isImage: true });
});

app.listen(PORT, () => console.log(`🚀 Firebase Server running on port ${PORT}`));
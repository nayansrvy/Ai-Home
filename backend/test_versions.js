require('dotenv').config();
const axios = require('axios');

// 👇 API Key .env se uthayega
const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
    console.error("❌ ERROR: .env file me OPENROUTER_API_KEY nahi mili!");
    process.exit(1);
}

// 🔥 AAPKI FINAL LIST (Corrected IDs ke sath)
const modelsToTest = [
    { 
        name: "1. Grok [Groq Llama]", 
        id: "groq/llama-3.3-70b-versatile:free" 
    },
    { 
        name: "2. Copilot [KwaiPilot]", 
        id: "kwaipilot/kat-coder-pro:free" 
    },
    { 
        name: "3. Perplexity [Amazon Nova]", 
        id: "amazon/nova-2-lite-v1:free" 
    },
    { 
        name: "4. Claude [Qwen Coder]", 
        id: "qwen/qwen-2.5-coder-32b-instruct:free" // Note: Qwen3 abhi free list me unstable hai, 2.5 best hai
    },
    { 
        name: "5. Gemini [Nvidia Nemotron]", 
        id: "nvidia/llama-3.1-nemotron-70b-instruct:free" // Note: Nano version aksar offline rehta hai, 70B best hai
    },
    { 
        name: "6. DeepSeek [TNG Chimera]", 
        id: "tngtech/tng-r1t-chimera:free" // Note: 'ngtech' typo tha, sahi 'tngtech' hai
    }
];

async function testAllModels() {
    console.log("\n🚀 STARTING MODEL VERSION TEST...\n");

    for (const model of modelsToTest) {
        process.stdout.write(`Testing ${model.name}... `);
        
        try {
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: model.id,
                    messages: [{ role: "user", content: "Hi" }]
                },
                {
                    headers: {
                        "Authorization": `Bearer ${API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:5000"
                    }
                }
            );

            if (response.status === 200) {
                console.log("✅ WORKING!");
                // console.log(`   └─ ID: ${model.id}`); // ID dekhna ho to uncomment karein
            } else {
                console.log("⚠️ RESPONSE ERROR");
            }

        } catch (error) {
            if (error.response) {
                if (error.response.status === 404) {
                    console.log("❌ NOT FOUND (Wrong ID or Offline)");
                } else if (error.response.status === 429) {
                    console.log("⏳ RATE LIMIT (Busy)");
                } else {
                    console.log(`❌ ERROR: ${error.response.status}`);
                }
            } else {
                console.log("❌ NETWORK ERROR");
            }
        }
    }
    console.log("\n🏁 TESTING FINISHED!");
}

testAllModels();
require('dotenv').config();
const axios = require('axios');

async function getAvailableModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.log("❌ Error: API Key missing in .env file");
        return;
    }

    console.log("🔍 Google se models ki list mang raha hu...");

    try {
        // Direct REST API Call to see what is allowed
        const response = await axios.get(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        console.log("\n✅ SUCCESS! Aapke liye ye Models available hain:\n");
        
        const models = response.data.models;
        const chatModels = models.filter(m => m.supportedGenerationMethods.includes("generateContent"));

        chatModels.forEach(model => {
            // "models/gemini-pro" -> "gemini-pro"
            console.log(`👉 ${model.name.replace('models/', '')}`);
        });

        console.log("\n(Upar wali list mein se koi ek naam server.js mein dalna hoga)");

    } catch (error) {
        console.error("❌ Error:", error.response ? error.response.data : error.message);
    }
}

getAvailableModels();
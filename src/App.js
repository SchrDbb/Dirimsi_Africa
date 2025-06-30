/* global __api_key__ */ // This line tells ESLint that __api_key__ is a known global variable in some environments

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Volume2, VolumeX, Loader, Info, Lightbulb, ScrollText, Utensils, Handshake } from 'lucide-react';
import * as Tone from 'tone'; 

// --- SVG Background Pattern (Improved Color and Opacity for Deeper Feel) ---
const SvgBackground = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100" className="fixed inset-0 w-full h-full object-cover -z-10">
        <defs>
            <pattern id="mudcloth" patternUnits="userSpaceOnUse" width="100" height="100">
                {/* Deeper base brown for the mudcloth background */}
                <rect width="100" height="100" fill="#2C1605" /> 
                {/* Lighter, warmer tone for the patterns */}
                <g fill="#EADDCD" stroke="#EADDCD" strokeWidth="1">
                    {/* Re-arranged and simplified patterns for a more coherent look */}
                    <path d="M0 0 H100 V10 L0 10Z M0 20 H100 V30 L0 30Z M0 40 H100 V50 L0 50Z M0 60 H100 V70 L0 70Z M0 80 H100 V90 L0 90Z" />
                    <path d="M10 0 V100 M30 0 V100 M50 0 V100 M70 0 V100 M90 0 V100" />
                    <circle cx="20" cy="15" r="3" />
                    <circle cx="40" cy="35" r="3" />
                    <circle cx="60" cy="55" r="3" />
                    <circle cx="80" cy="75" r="3" />
                    <circle cx="0" cy="95" r="3" />
                    <path d="M5 5 Q10 0 15 5 T25 5 T35 5 T45 5 T55 5 T65 5 T75 5 T85 5 T95 5" fill="none" strokeWidth="1" />
                    <path d="M5 95 Q10 100 15 95 T25 95 T35 95 T45 95 T55 95 T65 95 T75 95 T85 95 T95 95" fill="none" strokeWidth="1" />
                </g>
            </pattern>
        </defs>
        {/* Slightly increased opacity for a more noticeable, yet still subtle, pattern */}
        <rect width="100%" height="100%" fill="url(#mudcloth)" opacity="0.2" />
    </svg>
);

// --- Main Application Component ---
export default function App() {
    // --- STATE MANAGEMENT ---
    const [messages, setMessages] = useState([]); // Stores the entire conversation history
    const [input, setInput] = useState(''); // Stores the user's current input
    const [isLoading, setIsLoading] = useState(false); // Tracks if the AI is currently generating a response
    const [isMusicPlaying, setIsMusicPlaying] = useState(false); // Manages the background music state (playing/paused)
    const [showAuthorInfo, setShowAuthorInfo] = useState(false); // Controls the visibility of the author information
    const musicRef = useRef(null); // A reference to the Tone.js synth and loop to control them
    const chatEndRef = useRef(null); // A reference to the chat container for auto-scrolling

    // --- HOOKS ---

    // Effect to initialize the application and music
    useEffect(() => {
        // Set the initial welcome message from the AI
        setMessages([
            {
                role: 'model',
                content: "Greetings! I am DirimSi AI. I am here to share the vast and beautiful tapestry of African cultures. Ask me about history, art, music, spirituality, or any other African traditional concept you wish to explore. You can also get a ✨ Cultural Insight, ✨ Proverb's Wisdom, ✨ African Dish Recipe, or ✨ African Name Origin by clicking the buttons below!"
            }
        ]);

        // Initialize the background music using Tone.js for a meditative African feel
        const synth = new Tone.PluckSynth({
            attackNoise: 0.8,
            dampening: 4000, // Slightly longer decay for a more meditative feel
            resonance: 0.7,
            octaves: 2 // Adds more depth
        }).toDestination();
        synth.volume.value = -25; // Even lower volume for true background ambiance

        // Add a subtle reverb for spaciousness and meditation feel
        const reverb = new Tone.Reverb({
            decay: 3, // Long decay for spaciousness
            preDelay: 0.05,
            wet: 0.3 // Mix amount of reverb
        }).toDestination();

        // Connect synth to reverb
        synth.connect(reverb);

        // Using a more structured pentatonic melody for a meditative flow
        // Notes are based on a F# minor pentatonic scale, common in some African music styles
        const notes = ["F#3", "A3", "B3", "C#4", "E4", "F#4", "E4", "C#4", "B3", "A3"];

        const pattern = new Tone.Pattern((time, note) => {
            synth.triggerAttackRelease(note, "2n", time, Math.random() * 0.5 + 0.5); // Vary velocity for human feel
        }, notes, "upDown"); // 'upDown' creates a flowing, predictable melody
            
        pattern.interval = "1.5n"; // Slower interval for a contemplative, unhurried pace
        pattern.humanize = true; // Adds natural timing variation

        // Store synth, pattern, and transport in a ref to access them later
        musicRef.current = { synth, pattern, transport: Tone.Transport };

        // Clean up Tone.js on component unmount
        return () => {
            if (musicRef.current) {
                musicRef.current.pattern.dispose();
                musicRef.current.synth.dispose();
                reverb.dispose();
                // Tone.Transport.stop() and Tone.context.close() are generally not needed
                // in a single-page app unless explicitly managing global audio context.
            }
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // Effect to auto-scroll to the latest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- CORE FUNCTIONS ---

    /**
     * Toggles the background music on and off.
     * Handles starting the audio context on the first user interaction.
     */
    const toggleMusic = async () => {
        // Tone.js requires an explicit start from user interaction
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        if (isMusicPlaying) {
            musicRef.current.transport.pause();
            setIsMusicPlaying(false);
        } else {
            musicRef.current.transport.start();
            musicRef.current.pattern.start(0);
            setIsMusicPlaying(true);
        }
    };
    
    /**
     * Fetches a response from the Gemini AI model.
     * @param {Array} chatHistory - The current conversation history.
     * @param {string} userPrompt - The specific prompt for the LLM.
     * @returns {string} The AI's response text.
     */
    const fetchGeminiResponse = async (chatHistory, userPrompt) => {
        // --- EXTENSIVELY IMPROVED SYSTEM PROMPT FOR AFRICAN CULTURE QUESTIONS ---
        const system_prompt = `
You are DirimSi AI, an expert and dedicated guide to the vast and diverse cultures of the African continent. Your mission is to provide comprehensive, accurate, and respectful information on all aspects of African cultures.

When responding, ensure you:
- **Cover a wide range of topics:** This includes, but is not limited to, history (ancient, colonial, post-colonial), languages (major language families, specific languages, greetings), traditional customs and rituals, clothing and attire (styles, significance, regional variations), diverse food and culinary traditions, spiritual beliefs and indigenous religions, music (instruments, genres, traditional songs), dance forms, visual arts (sculpture, painting, pottery), oral traditions (storytelling, proverbs), social structures, political systems, economic practices, and the impact of diaspora.
- **Emphasize diversity:** Always highlight the incredible variations across different regions, ethnic groups, and nations within Africa. Avoid generalizations and specify origins where possible (e.g., "In the Yoruba culture of Nigeria..." or "Among the Maasai people of East Africa...").
- **Provide depth and detail:** Aim for informative and insightful answers that goes beyond surface-level descriptions.
- **Maintain a celebratory and respectful tone:** Showcase the richness, resilience, and beauty of African heritage.
- **Handle sensitive topics with care:** If a question touches upon complex or sensitive historical or social issues, provide balanced context and factual information without bias.
- **Stay in character:** You are not a generic AI. You are DirimSi AI, the specialist in African cultures.
- **If you don't know:** If a specific piece of information is beyond your current knowledge base, politely state that you do not have sufficient information on that particular detail, but offer to share related general knowledge if appropriate, or suggest what kind of information would be helpful.
- **Creator Information:** If asked about your creator, respond with: "I was built by DirimSi group From Cameroon which is overseeded by SchrDbb. My reference ai conceptor is Gemini ai."
- **Encourage further exploration:** Conclude responses in a way that invites more questions.
`;
        
        // Prepare contents for the API call, ensuring system prompt is correctly structured
        const contents = [
            { role: "user", parts: [{ text: system_prompt }] },
            { role: "model", parts: [{ text: "I understand. I am DirimSi AI, ready to share the wisdom of Africa." }] },
            // Add the specific user prompt for the feature
            { role: "user", parts: [{ text: userPrompt }] },
            ...chatHistory.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user', // Ensure roles are 'user' or 'model'
                parts: [{ text: msg.content }]
            }))
        ];

        const payload = { contents };
        
        // Corrected API key handling to prioritize Canvas global, then React environment variable
        // This addresses the 'no-undef' error by conditionally accessing __api_key__
        let apiKey = '';
        if (typeof __api_key__ !== 'undefined' && __api_key__ !== null && __api_key__ !== '') {
            apiKey = __api_key__; // Use Canvas provided key if available and not empty
        } else if (typeof process !== 'undefined' && process.env.REACT_APP_GEMINI_API_KEY) {
            apiKey = process.env.REACT_APP_GEMINI_API_KEY; // Otherwise, use create-react-app env var
        }
        // If neither is found, apiKey remains an empty string, leading to the 403.
        // This is the desired behavior for a missing key.

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                // Log detailed error from API if available
                const errorData = await response.json();
                console.error("API response error:", errorData);
                throw new Error(`API request failed with status ${response.status}: ${errorData.error.message || 'Unknown error'}`);
            }

            const result = await response.json();
            
            // Check for candidates and content parts
            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                console.error("Unexpected API response structure or no content:", result);
                return "I apologize, but I received an unusual response or no content. Could you please try rephrasing your question?";
            }
        } catch (error) {
            console.error("Error fetching Gemini response:", error);
            // More user-friendly error message
            return "My apologies, I'm having trouble connecting to my knowledge source or processing your request right now. Please check your connection or try again in a moment. (Error: " + error.message + ")";
        }
    };

    /**
     * Handles the submission of a new message from the user.
     */
    const handleSendMessage = async () => {
        if (input.trim() === '' || isLoading) return; // Prevent sending empty messages or while loading

        const newUserMessage = { role: 'user', content: input };
        // Optimistically update messages with user's input
        const updatedMessages = [...messages, newUserMessage];
        
        setMessages(updatedMessages);
        setInput(''); // Clear input field
        setIsLoading(true); // Show loading indicator

        // Fetch AI response with the user's input as the prompt
        const aiResponse = await fetchGeminiResponse(updatedMessages, input);

        // Update messages with AI's response
        setMessages(prevMessages => [...prevMessages, { role: 'model', content: aiResponse }]);
        setIsLoading(false); // Hide loading indicator
    };

    /**
     * Handles key presses in the input field, specifically for 'Enter'.
     * @param {object} e - The keyboard event.
     */
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage(); // Trigger send message on Enter key press
        }
    };

    /**
     * Handles fetching a cultural insight using Gemini API.
     */
    const handleCulturalInsight = async () => {
        if (isLoading) return;

        const userMessage = { role: 'user', content: "Give me a fascinating and unique cultural insight or fact about any African tradition or history." };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setIsLoading(true);

        const aiResponse = await fetchGeminiResponse(updatedMessages, "Provide a random, interesting cultural insight or historical fact about Africa. Keep it concise and engaging.");
        
        setMessages(prevMessages => [...prevMessages, { role: 'model', content: aiResponse }]);
        setIsLoading(false);
    };

    /**
     * Handles fetching an African proverb and its explanation using Gemini API.
     */
    const handleProverbWisdom = async () => {
        if (isLoading) return;

        const userMessage = { role: 'user', content: "Tell me an African proverb and explain its meaning." };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setIsLoading(true);

        const aiResponse = await fetchGeminiResponse(updatedMessages, "Generate a well-known African proverb and then provide a clear explanation of its meaning and cultural context.");
        
        setMessages(prevMessages => [...prevMessages, { role: 'model', content: aiResponse }]);
        setIsLoading(false);
    };

    /**
     * Handles fetching an African dish recipe using Gemini API.
     */
    const handleAfricanDishRecipe = async () => {
        if (isLoading) return;

        const userMessage = { role: 'user', content: "Suggest a traditional African dish recipe (e.g., Jollof Rice, Egusi Soup, injera) and provide a simplified list of main ingredients and very brief preparation steps. Focus on common, accessible dishes." };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setIsLoading(true);

        const aiResponse = await fetchGeminiResponse(updatedMessages, "Suggest a traditional African dish recipe and provide a simplified list of main ingredients and very brief preparation steps.");
        
        setMessages(prevMessages => [...prevMessages, { role: 'model', content: aiResponse }]);
        setIsLoading(false);
    };

    /**
     * Handles fetching an African name meaning/origin using Gemini API.
     */
    const handleAfricanNameMeaning = async () => {
        if (isLoading) return;

        const userMessage = { role: 'user', content: "Provide an interesting African name (could be male, female, or gender-neutral) and explain its meaning and cultural origin. Make it concise." };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setIsLoading(true);

        const aiResponse = await fetchGeminiResponse(updatedMessages, "Provide an interesting African name (could be male, female, or gender-neutral) and explain its meaning and cultural origin. Make it concise.");
        
        setMessages(prevMessages => [...prevMessages, { role: 'model', content: aiResponse }]);
        setIsLoading(false);
    };
    
    // --- RENDER ---
    return (
        // Main container with updated background color for a warmer, African feel
        <div className="bg-[#FFF8E7] font-sans w-full h-screen flex flex-col antialiased relative overflow-hidden">
            <SvgBackground /> {/* The African mudcloth pattern */}

            {/* --- Header --- */}
            <header className="bg-[#4a2507]/90 backdrop-blur-sm text-white p-4 flex justify-between items-center shadow-lg z-10 rounded-b-xl relative"> {/* Added 'relative' for positioning child absolute elements */}
                <h1 className="text-3xl font-bold tracking-wider text-[#EADDCD] drop-shadow-md">DirimSi AI</h1>
                <div className="flex items-center gap-4"> {/* Container for music and info buttons */}
                    {/* Music Toggle Button */}
                    <button 
                        onClick={toggleMusic} 
                        className="p-2 rounded-full bg-[#C05621]/80 hover:bg-[#A0441C]/80 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-[#EADDCD]"
                        aria-label={isMusicPlaying ? "Pause music" : "Play music"}
                    >
                        {isMusicPlaying ? <Volume2 size={24} className="text-[#EADDCD]" /> : <VolumeX size={24} className="text-[#EADDCD]" />}
                    </button>

                    {/* Contact Info Button - Moved to Header */}
                    <button
                        onClick={() => setShowAuthorInfo(!showAuthorInfo)}
                        className="w-10 h-10 rounded-full bg-[#C05621] text-white flex items-center justify-center shadow-md hover:bg-[#A0441C] transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#C05621]/50"
                        aria-expanded={showAuthorInfo}
                        aria-label="Toggle architect contact information"
                    >
                        <Info size={20} /> {/* Slightly reduced icon size to fit 10x10 button */}
                    </button>

                    {/* Author Info Popup - Positioned relative to the header */}
                    {showAuthorInfo && (
                        <div className="absolute top-full right-4 mt-2 p-4 bg-[#4a2507]/90 text-[#EADDCD] rounded-lg shadow-xl max-w-xs transition-all duration-300 ease-in-out transform origin-top-right animate-fade-in-up border border-[#351B05] z-30">
                            <h3 className="font-semibold text-lg mb-2 border-b border-[#EADDCD]/30 pb-1">SchrDbb's Contact Info:</h3>
                            <p className="mb-1">WhatsApp: <a href="https://wa.me/237652659429" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#C05621] transition-colors">(+237)652659429</a></p>
                            <p className="mb-1">Email: <a href="mailto:sciencevideomakers@gmail.com" className="underline hover:text-[#C05621] transition-colors">sciencevideomakers@gmail.com</a></p>
                            <p>Telegram: <a href="https://t.me/SchrDbb" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#C05621] transition-colors">@SchrDbb</a></p>
                        </div>
                    )}
                </div>
            </header>

            {/* --- Chat Area --- */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full z-0 custom-scrollbar pt-8 pb-20"> {/* Adjusted padding for more chat space */}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {/* AI Avatar */}
                        {msg.role === 'model' && (
                            <div className="w-10 h-10 rounded-full bg-[#C05621] flex items-center justify-center flex-shrink-0 shadow-md border-2 border-[#A0441C]">
                                <Bot size={24} className="text-white" />
                            </div>
                        )}
                        
                        {/* Message Bubble */}
                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-lg transition-all duration-300 ease-in-out font-medium text-lg 
                            ${msg.role === 'user' 
                                ? 'bg-white/95 text-stone-800 rounded-br-none border border-gray-100' 
                                : 'bg-[#4a2507]/95 text-[#EADDCD] rounded-bl-none border border-[#351B05]'
                            }`} style={{ whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                        </div>
                        
                        {/* User Avatar */}
                        {msg.role === 'user' && (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 shadow-md border-2 border-gray-400">
                                <User size={24} className="text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}
                
                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex items-start gap-4 justify-start">
                        <div className="w-10 h-10 rounded-full bg-[#C05621] flex items-center justify-center flex-shrink-0 shadow-md border-2 border-[#A0441C]">
                            <Loader size={24} className="text-white animate-spin" />
                        </div>
                        <div className="max-w-[80%] p-4 rounded-2xl shadow-lg bg-[#4a2507]/95 text-[#EADDCD] rounded-bl-none font-medium text-lg">
                            DirimSi is thinking...
                        </div>
                    </div>
                )}
                
                {/* Dummy div to ensure auto-scroll works */}
                <div ref={chatEndRef} />
            </main>

            {/* --- Input Area --- */}
            <footer className="p-4 bg-transparent z-10 absolute bottom-0 left-0 right-0"> {/* Stick to bottom */}
                {/* New Feature Buttons - Optimized for space */}
                <div className="flex justify-center gap-2 mb-4 flex-wrap max-w-3xl mx-auto px-2"> {/* Reduced gap, added horizontal padding */}
                    <button
                        onClick={handleCulturalInsight}
                        disabled={isLoading}
                        className="flex-1 min-w-0 sm:min-w-[auto] text-sm px-3 py-2 bg-[#C05621] text-white rounded-full shadow-md hover:bg-[#A0441C] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#C05621]"
                        aria-label="Get a cultural insight"
                    >
                        <span className="hidden sm:inline">Cultural Insight </span> <Lightbulb size={16} className="inline sm:ml-1" /> 
                    </button>
                    <button
                        onClick={handleProverbWisdom}
                        disabled={isLoading}
                        className="flex-1 min-w-0 sm:min-w-[auto] text-sm px-3 py-2 bg-[#C05621] text-white rounded-full shadow-md hover:bg-[#A0441C] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#C05621]"
                        aria-label="Get a proverb's wisdom"
                    >
                        <span className="hidden sm:inline">Proverb's Wisdom </span> <ScrollText size={16} className="inline sm:ml-1" /> 
                    </button>
                    <button
                        onClick={handleAfricanDishRecipe}
                        disabled={isLoading}
                        className="flex-1 min-w-0 sm:min-w-[auto] text-sm px-3 py-2 bg-[#C05621] text-white rounded-full shadow-md hover:bg-[#A0441C] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#C05621]"
                        aria-label="Get an African dish recipe"
                    >
                        <span className="hidden sm:inline">African Dish </span> <Utensils size={16} className="inline sm:ml-1" /> 
                    </button>
                    <button
                        onClick={handleAfricanNameMeaning}
                        disabled={isLoading}
                        className="flex-1 min-w-0 sm:min-w-[auto] text-sm px-3 py-2 bg-[#C05621] text-white rounded-full shadow-md hover:bg-[#A0441C] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#C05621]"
                        aria-label="Get an African name origin"
                    >
                        <span className="hidden sm:inline">African Name </span> <Handshake size={16} className="inline sm:ml-1" /> 
                    </button>
                </div>

                <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-full shadow-xl flex items-center p-2 border border-gray-200">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about a tradition, a food, a language..."
                        className="flex-1 bg-transparent px-4 py-2 text-stone-800 focus:outline-none text-lg"
                        disabled={isLoading}
                        aria-label="Chat input"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        className="p-3 rounded-full bg-[#C05621] text-white hover:bg-[#A0441C] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-[#C05621]"
                        aria-label="Send message"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </footer>

            {/* Custom scrollbar styles for main chat area & animations */}
            <style>{` 
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #C05621;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #A0441C;
                }
                /* Animation for author info popup */
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
                @keyframes pulse-ring {
                    0% {
                        transform: scale(0.3);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }
                .focus\\:ring-4 {
                    position: relative;
                }
                .focus\\:ring-4:focus:before {
                    content: '';
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: inherit;
                    background: currentColor; /* Uses the button's text color */
                    animation: pulse-ring 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
                    z-index: -1;
                    opacity: 0;
                }
            `}</style>
        </div>
    );
}

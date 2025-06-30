import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Volume2, VolumeX, Loader, Info, Lightbulb, ScrollText, Utensils, Handshake } from 'lucide-react';
import * as Tone from 'tone'; // Corrected import statement: changed '=>' to 'as'

// --- SVG Background Component with Multiple African Patterns ---
const SvgBackground = () => {
    // Define African-inspired color palette
    const colors = {
        base: ['#2C1605', '#4A2507', '#6B3C12', '#8A4F1E', '#A0522D'], // Earthy browns and sienna
        accent: ['#EADDCD', '#FFD700', '#C05621', '#8B0000', '#228B22'], // Warm beige, gold, terracotta, deep red, forest green
    };

    // Define multiple African-inspired patterns (inspired by mudcloth, adinkra, and tribal motifs)
    const patterns = [
        // Pattern 1: Mudcloth-inspired
        `
            <rect width="100" height="100" fill="${colors.base[0]}" />
            <g fill="${colors.accent[0]}" stroke="${colors.accent[0]}" stroke-width="1.5">
                <path d="M0 0 H100 V10 L0 10Z M0 20 H100 V30 L0 30Z M0 40 H100 V50 L0 50Z M0 60 H100 V70 L0 70Z M0 80 H100 V90 L0 90Z" />
                <path d="M10 0 V100 M30 0 V100 M50 0 V100 M70 0 V100 M90 0 V100" />
                <circle cx="20" cy="15" r="4" />
                <circle cx="40" cy="35" r="4" />
                <circle cx="60" cy="55" r="4" />
                <circle cx="80" cy="75" r="4" />
                <path d="M5 5 Q10 0 15 5 T25 5 T35 5 T45 5 T55 5 T65 5 T75 5 T85 5 T95 5" fill="none" stroke-width="1.5" />
            </g>
        `,
        // Pattern 2: Adinkra-inspired (Sankofa symbol influence)
        `
            <rect width="100" height="100" fill="${colors.base[1]}" />
            <g fill="${colors.accent[1]}" stroke="${colors.accent[1]}" stroke-width="1.5">
                <path d="M50 50 C60 30 80 30 90 50 C80 70 60 70 50 50 C40 70 20 70 10 50 C20 30 40 30 50 50" fill="none" />
                <circle cx="50" cy="50" r="10" />
                <path d="M30 50 H70 M50 30 V70" />
                <rect x="40" y="40" width="20" height="20" rx="2" fill="none" />
            </g>
        `,
        // Pattern 3: Kente cloth-inspired
        `
            <rect width="100" height="100" fill="${colors.base[2]}" />
            <g fill="none" stroke="${colors.accent[2]}" stroke-width="2">
                <path d="M0 0 H100 V20 H0 Z M0 40 H100 V60 H0 Z M0 80 H100 V100 H0 Z" />
                <path d="M20 0 V100 M40 0 V100 M60 0 V100 M80 0 V100" stroke="${colors.accent[3]}" />
                <circle cx="30" cy="30" r="5" fill="${colors.accent[4]}" />
                <circle cx="70" cy="70" r="5" fill="${colors.accent[4]}" />
            </g>
        `,
        // Pattern 4: Tribal geometric pattern
        `
            <rect width="100" height="100" fill="${colors.base[3]}" />
            <g fill="${colors.accent[3]}" stroke="${colors.accent[3]}" stroke-width="1">
                <path d="M0 0 L50 50 L100 0 L100 100 L50 50 L0 100 Z" fill="none" />
                <path d="M25 25 L75 75 M75 25 L25 75" fill="none" />
                <circle cx="50" cy="50" r="8" fill="${colors.accent[0]}" />
            </g>
        `,
        // Pattern 5: Vibrant zigzag pattern
        `
            <rect width="100" height="100" fill="${colors.base[4]}" />
            <g fill="none" stroke="${colors.accent[4]}" stroke-width="2">
                <path d="M0 10 L25 30 L50 10 L75 30 L100 10" />
                <path d="M0 50 L25 70 L50 50 L75 70 L100 50" />
                <path d="M0 90 L25 110 L50 90 L75 110 L100 90" />
                <circle cx="25" cy="20" r="3" fill="${colors.accent[1]}" />
                <circle cx="75" cy="60" r="3" fill="${colors.accent[1]}" />
            </g>
        `,
    ];

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100" className="fixed inset-0 w-full h-full object-cover -z-10">
            <defs>
                {patterns.map((pattern, index) => (
                    <pattern key={index} id={`pattern-${index}`} patternUnits="userSpaceOnUse" width="100" height="100">
                        <div dangerouslySetInnerHTML={{ __html: pattern }} /> {/* Render SVG content */}
                    </pattern>
                ))}
            </defs>
            {/* Cycle through patterns with CSS animation */}
            <rect width="100%" height="100%" className="pattern-cycle" opacity="0.25" />
            <style>{`
                .pattern-cycle {
                    animation: cyclePatterns 600s linear infinite;
                }
                @keyframes cyclePatterns {
                    0% { fill: url(#pattern-0); }
                    20% { fill: url(#pattern-1); }
                    40% { fill: url(#pattern-2); }
                    60% { fill: url(#pattern-3); }
                    80% { fill: url(#pattern-4); }
                    100% { fill: url(#pattern-0); }
                }
            `}</style>
        </svg>
    );
};

// --- Main Application Component ---
export default function App() {
    // --- STATE MANAGEMENT ---
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [showAuthorInfo, setShowAuthorInfo] = useState(false);
    const musicRef = useRef(null);
    const chatEndRef = useRef(null);

    // --- HOOKS ---
    useEffect(() => {
        setMessages([
            {
                role: 'model',
                content: "Greetings! I am DirimSi AI. I am here to share the vast and beautiful tapestry of African cultures. Ask me about history, art, music, spirituality, or any other African traditional concept you wish to explore. You can also get a ✨ Cultural Insight, ✨ Proverb's Wisdom, ✨ African Dish Recipe, or ✨ African Name Origin by clicking the buttons below!"
            }
        ]);

        // Initialize background music with an African-inspired melody
        const synth = new Tone.PluckSynth({
            attackNoise: 0.8,
            dampening: 4000,
            resonance: 0.7,
            octaves: 2
        }).toDestination();
        synth.volume.value = -25;

        const reverb = new Tone.Reverb({
            decay: 3,
            preDelay: 0.05,
            wet: 0.3
        }).toDestination();
        synth.connect(reverb);

        const notes = ["F#3", "A3", "B3", "C#4", "E4", "F#4", "E4", "C#4", "B3", "A3"];
        const pattern = new Tone.Pattern((time, note) => {
            synth.triggerAttackRelease(note, "2n", time, Math.random() * 0.5 + 0.5);
        }, notes, "upDown");
        pattern.interval = "1.5n";
        pattern.humanize = true;

        musicRef.current = { synth, pattern, transport: Tone.Transport };

        return () => {
            if (musicRef.current) {
                musicRef.current.pattern.dispose();
                musicRef.current.synth.dispose();
                reverb.dispose();
            }
        };
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- CORE FUNCTIONS ---
    const toggleMusic = async () => {
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

    const fetchGeminiResponse = async (chatHistory, userPrompt) => {
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
        const contents = [
            { role: "user", parts: [{ text: system_prompt }] },
            { role: "model", parts: [{ text: "I understand. I am DirimSi AI, ready to share the wisdom of Africa." }] },
            { role: "user", parts: [{ text: userPrompt }] },
            ...chatHistory.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }))
        ];

        const payload = { contents };
        // The apiKey for fetch calls is automatically provided by the Canvas environment when set to an empty string.
        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API request failed with status ${response.status}: ${errorData.error.message || 'Unknown error'}`);
            }
            const result = await response.json();
            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                return "I apologize, but I received an unusual response or no content. Could you please try rephrasing your question?";
            }
        } catch (error) {
            return "My apologies, I'm having trouble connecting to my knowledge source or processing your request right now. Please check your connection or try again in a moment. (Error: " + error.message + ")";
        }
    };

    const handleSendMessage = async () => {
        if (input.trim() === '' || isLoading) return; // Prevent sending empty messages or during loading
        const newUserMessage = { role: 'user', content: input };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages); // Optimistically update UI with user's message
        setInput(''); // Clear input field
        setIsLoading(true); // Show loading indicator

        // Fetch response from Gemini API
        const aiResponse = await fetchGeminiResponse(updatedMessages, input);
        setMessages(prevMessages => [...prevMessages, { role: 'model', content: aiResponse }]); // Add AI's response
        setIsLoading(false); // Hide loading indicator
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage(); // Send message on Enter key press
        }
    };

    // --- Quick Action Functions ---
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
        <div className="bg-[#FFF8E7] font-sans w-full h-screen flex flex-col antialiased relative overflow-hidden">
            <SvgBackground />
            <header className="bg-[#4a2507]/90 backdrop-blur-sm text-white p-4 flex justify-between items-center shadow-lg z-10 rounded-b-xl relative">
                <h1 className="text-3xl font-bold tracking-wider text-[#EADDCD] drop-shadow-md font-serif">DirimSi AI</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleMusic}
                        className="p-2 rounded-full bg-[#C05621]/80 hover:bg-[#A0441C]/80 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-[#EADDCD]"
                        aria-label={isMusicPlaying ? "Pause music" : "Play music"}
                    >
                        {isMusicPlaying ? <Volume2 size={24} className="text-[#EADDCD]" /> : <VolumeX size={24} className="text-[#EADDCD]" />}
                    </button>
                    <button
                        onClick={() => setShowAuthorInfo(!showAuthorInfo)}
                        className="w-10 h-10 rounded-full bg-[#C05621] text-white flex items-center justify-center shadow-md hover:bg-[#A0441C] transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#C05621]/50"
                        aria-expanded={showAuthorInfo}
                        aria-label="Toggle architect contact information"
                    >
                        <Info size={20} />
                    </button>
                    {showAuthorInfo && (
                        <div className="absolute top-full right-4 mt-2 p-4 bg-[#4a2507]/90 text-[#EADDCD] rounded-lg shadow-xl max-w-xs transition-all duration-300 ease-in-out transform origin-top-right animate-fade-in-up border border-[#351B05] z-30">
                            <h3 className="font-semibold text-lg mb-2 border-b border-[#EADDCD]/30 pb-1 font-serif">SchrDbb's Contact Info:</h3>
                            <p className="mb-1">WhatsApp: <a href="https://wa.me/237652659429" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#C05621] transition-colors">+237652659429</a></p>
                            <p className="mb-1">Email: <a href="mailto:sciencevideomakers@gmail.com" className="underline hover:text-[#C05621] transition-colors">sciencevideomakers@gmail.com</a></p>
                            <p>Telegram: <a href="https://t.me/SchrDbb" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#C05621] transition-colors">@SchrDbb</a></p>
                        </div>
                    )}
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full z-0 custom-scrollbar pt-8 pb-20">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <div className="w-10 h-10 rounded-full bg-[#C05621] flex items-center justify-center flex-shrink-0 shadow-md border-2 border-[#A0441C]">
                                <Bot size={24} className="text-white" />
                            </div>
                        )}
                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-lg transition-all duration-300 ease-in-out font-medium text-lg font-serif
                            ${msg.role === 'user'
                                ? 'bg-white/95 text-stone-800 rounded-br-none border border-gray-100'
                                : 'bg-[#4a2507]/95 text-[#EADDCD] rounded-bl-none border border-[#351B05]'
                            }`} style={{ whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 shadow-md border-2 border-gray-400">
                                <User size={24} className="text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-4 justify-start">
                        <div className="w-10 h-10 rounded-full bg-[#C05621] flex items-center justify-center flex-shrink-0 shadow-md border-2 border-[#A0441C]">
                            <Loader size={24} className="text-white animate-spin" />
                        </div>
                        <div className="max-w-[80%] p-4 rounded-2xl shadow-lg bg-[#4a2507]/95 text-[#EADDCD] rounded-bl-none font-medium text-lg font-serif">
                            DirimSi is thinking...
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </main>
            <footer className="p-4 bg-transparent z-10 absolute bottom-0 left-0 right-0">
                <div className="flex justify-center gap-2 mb-4 flex-wrap max-w-3xl mx-auto px-2">
                    <button
                        onClick={handleCulturalInsight}
                        disabled={isLoading}
                        className="flex-1 min-w-0 sm:min-w-[auto] text-sm px-3 py-2 bg-[#C05621] text-white rounded-full shadow-md hover:bg-[#A0441C] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#C05621] font-serif"
                        aria-label="Get a cultural insight"
                    >
                        <span className="hidden sm:inline">Cultural Insight </span> <Lightbulb size={16} className="inline sm:ml-1" />
                    </button>
                    <button
                        onClick={handleProverbWisdom}
                        disabled={isLoading}
                        className="flex-1 min-w-0 sm:min-w-[auto] text-sm px-3 py-2 bg-[#C05621] text-white rounded-full shadow-md hover:bg-[#A0441C] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#C05621] font-serif"
                        aria-label="Get a proverb's wisdom"
                    >
                        <span className="hidden sm:inline">Proverb's Wisdom </span> <ScrollText size={16} className="inline sm:ml-1" />
                    </button>
                    <button
                        onClick={handleAfricanDishRecipe}
                        disabled={isLoading}
                        className="flex-1 min-w-0 sm:min-w-[auto] text-sm px-3 py-2 bg-[#C05621] text-white rounded-full shadow-md hover:bg-[#A0441C] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#C05621] font-serif"
                        aria-label="Get an African dish recipe"
                    >
                        <span className="hidden sm:inline">African Dish </span> <Utensils size={16} className="inline sm:ml-1" />
                    </button>
                    <button
                        onClick={handleAfricanNameMeaning}
                        disabled={isLoading}
                        className="flex-1 min-w-0 sm:min-w-[auto] text-sm px-3 py-2 bg-[#C05621] text-white rounded-full shadow-md hover:bg-[#A0441C] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#C05621] font-serif"
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
                        className="flex-1 bg-transparent px-4 py-2 text-stone-800 focus:outline-none text-lg font-serif"
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
            <style>{`
                /* Custom Scrollbar for Chat Area */
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

                /* Fade-in-up animation for info box */
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

                /* Pulse ring animation for focus states (like the info button) */
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
                /* Create the pseudo-element for the pulse effect */
                .focus\\:ring-4:focus:before {
                    content: '';
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: inherit; /* Inherit border-radius from the button */
                    background: currentColor; /* Use the button's current color */
                    animation: pulse-ring 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
                    z-index: -1; /* Place behind the button */
                    opacity: 0; /* Initially hidden, visible during animation */
                }
            `}</style>
        </div>
    );
}

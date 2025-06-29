import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Volume2, VolumeX, Loader, Info } from 'lucide-react'; // Added Info icon
import * as Tone from 'tone';

// --- SVG Background Pattern ---
// Using an inline SVG for a subtle, authentic background pattern.
// This is based on a traditional Bogolanfini (mudcloth) design.
const SvgBackground = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" className="fixed inset-0 w-full h-full object-cover -z-10">
        <defs>
            <pattern id="mudcloth" patternUnits="userSpaceOnUse" width="100" height="100">
                {/* Changed base color to be slightly lighter for better subtle effect */}
                <rect width="100" height="100" fill="#351B05" /> 
                <g fill="#F8EAD3">
                    {/* Original patterns, slightly adjusted positions for visual flow if needed, but keeping the core design */}
                    <path d="M10 10h5v5h-5z M25 10h5v5h-5z M40 10h5v5h-5z M55 10h5v5h-5z M70 10h5v5h-5z M85 10h5v5h-5z" />
                    <path d="M10 25h5v5h-5z M25 25h5v5h-5z M40 25h5v5h-5z M55 25h5v5h-5z M70 25h5v5h-5z M85 25h5v5h-5z" />
                    <path d="M5 28L95 28 M5 32L95 32" stroke="#F8EAD3" strokeWidth="1" />
                    <path d="M10 40h5v5h-5z M25 40h5v5h-5z M40 40h5v5h-5z M55 40h5v5h-5z M70 40h5v5h-5z M85 40h5v5h-5z" />
                    <path d="M10 55h5v5h-5z M25 55h5v5h-5z M40 55h5v5h-5z M55 55h5v5h-5z M70 55h5v5h-5z M85 55h5v5h-5z" />
                    <path d="M5 58L95 58 M5 62L95 62" stroke="#F8EAD3" strokeWidth="1" />
                    <path d="M10 70h5v5h-5z M25 70h5v5h-5z M40 70h5v5h-5z M55 70h5v5h-5z M70 70h5v5h-5z M85 70h5v5h-5z" />
                    <path d="M10 85h5v5h-5z M25 85h5v5h-5z M40 85h5v5h-5z M55 85h5v5h-5z M70 85h5v5h-5z M85 85h5v5h-5z" />
                </g>
            </pattern>
        </defs>
        {/* Increased opacity for a slightly more visible pattern, but still subtle */}
        <rect width="100%" height="100%" fill="url(#mudcloth)" opacity="0.15" />
    </svg>
);


// --- Main Application Component ---
export default function App() {
    // --- STATE MANAGEMENT ---
    // Stores the entire conversation history
    const [messages, setMessages] = useState([]);
    // Stores the user's current input
    const [input, setInput] = useState('');
    // Tracks if the AI is currently generating a response
    const [isLoading, setIsLoading] = useState(false);
    // Manages the background music state (playing/paused)
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    // Controls the visibility of the author information
    const [showAuthorInfo, setShowAuthorInfo] = useState(false);
    // A reference to the Tone.js synth and loop to control them
    const musicRef = useRef(null);
    // A reference to the chat container for auto-scrolling
    const chatEndRef = useRef(null);

    // --- HOOKS ---

    // Effect to initialize the application and music
    useEffect(() => {
        // Set the initial welcome message from the AI
        setMessages([
            {
                role: 'model',
                content: "Greetings! I am DirimSi AI. I am here to share the vast and beautiful tapestry of African cultures. Ask me about history, art, music, spirituality, food, or any other tradition you wish to explore."
            }
        ]);

        // Initialize the background music using Tone.js
        // This creates a soft, mbira-like synthesized melody using a pentatonic scale.
        const synth = new Tone.PluckSynth({
            attackNoise: 0.8, // Slightly more percussive attack for an mbira feel
            dampening: 3000,  // Slightly shorter decay
            resonance: 0.6,
        }).toDestination();
        // Lower the volume significantly to be truly ambient
        synth.volume.value = -20; 

        // Using a C major pentatonic scale for a more African musical feel
        const notes = ["C4", "D4", "E4", "G4", "A4", "C5", "A4", "G4", "E4", "D4"]; 

        const pattern = new Tone.Pattern((time, note) => {
            synth.triggerAttackRelease(note, "8n", time); // Trigger notes for an 8th note duration
        }, notes, "randomWalk"); // 'randomWalk' keeps the melody unpredictable and interesting
            
        pattern.interval = "1n"; // Slower interval for a more contemplative, background feel
        pattern.humanize = true; // Adds a bit of human-like timing variation for naturalness

        // Store synth and pattern in a ref to access them later
        musicRef.current = { synth, pattern, transport: Tone.Transport };

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
            // Pause the music transport
            musicRef.current.transport.pause();
            setIsMusicPlaying(false);
        } else {
            // Start the music transport and pattern
            musicRef.current.transport.start();
            musicRef.current.pattern.start(0);
            setIsMusicPlaying(true);
        }
    };
    
    /**
     * Fetches a response from the Gemini AI model.
     * @param {Array} chatHistory - The current conversation history.
     * @returns {string} The AI's response text.
     */
    const fetchGeminiResponse = async (chatHistory) => {
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
            // The AI's initial response to the system prompt (can be omitted or simplified if desired)
            { role: "model", parts: [{ text: "I understand. I am DirimSi AI, ready to share the wisdom of Africa." }] },
            // Map the actual conversation history
            ...chatHistory.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user', // Ensure roles are 'user' or 'model'
                parts: [{ text: msg.content }]
            }))
        ];

        const payload = { contents };
        
        // --- IMPORTANT: API KEY FOR LOCAL RUNNING ---
        // If you are running this app locally, you MUST replace this empty string
        // with your actual Google Gemini API key obtained from Google AI Studio.
        // If running in the Google Canvas environment, leave it as an empty string;
        // the key will be automatically provided by the environment.
        // For Netlify deployment, this will be replaced by the environment variable.
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY; // <--- MODIFIED TO USE ENVIRONMENT VARIABLE

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

        // Fetch AI response
        const aiResponse = await fetchGeminiResponse(updatedMessages);

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
    
    // --- RENDER ---
    return (
        // Main container with updated background color for a warmer feel
        <div className="bg-[#FDF9ED] font-sans w-full h-screen flex flex-col antialiased relative overflow-hidden">
            <SvgBackground /> {/* The African mudcloth pattern */}

            {/* --- Header --- */}
            <header className="bg-[#422006]/80 backdrop-blur-sm text-white p-4 flex justify-between items-center shadow-lg z-10">
                <h1 className="text-2xl font-bold tracking-wider text-[#F8EAD3]">DirimSi AI</h1>
                {/* Music Toggle Button */}
                <button 
                    onClick={toggleMusic} 
                    className="p-2 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F8EAD3]"
                    aria-label={isMusicPlaying ? "Pause music" : "Play music"}
                >
                    {isMusicPlaying ? <Volume2 size={24} className="text-[#F8EAD3]" /> : <VolumeX size={24} className="text-[#F8EAD3]" />}
                </button>
            </header>

            {/* --- Chat Area --- */}
            {/* Adjusted padding and increased max-width for chat messages */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full z-0 custom-scrollbar">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {/* AI Avatar */}
                        {msg.role === 'model' && (
                            <div className="w-10 h-10 rounded-full bg-[#C05621] flex items-center justify-center flex-shrink-0 shadow-md">
                                <Bot size={24} className="text-white" />
                            </div>
                        )}
                        
                        {/* Message Bubble */}
                        <div className={`max-w-[75%] p-4 rounded-2xl shadow-md transition-all duration-300 ease-in-out ${ // Max-width increased for better readability
                            msg.role === 'user' 
                                ? 'bg-white/90 text-stone-800 rounded-br-none' // Slightly more opaque white for user
                                : 'bg-[#4a2507]/90 text-[#F8EAD3] rounded-bl-none' // Slightly more opaque dark brown for AI
                        }`} style={{ whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                        </div>
                        
                        {/* User Avatar */}
                        {msg.role === 'user' && (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 shadow-md">
                                <User size={24} className="text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}
                
                {/* Loading Indicator */}
                {isLoading && (
                    <div className="flex items-start gap-4 justify-start">
                        <div className="w-10 h-10 rounded-full bg-[#C05621] flex items-center justify-center flex-shrink-0 shadow-md">
                            <Loader size={24} className="text-white animate-spin" />
                        </div>
                        <div className="max-w-[75%] p-4 rounded-2xl shadow-md bg-[#4a2507]/90 text-[#F8EAD3] rounded-bl-none">
                            DirimSi is thinking...
                        </div>
                    </div>
                )}
                
                {/* Dummy div to ensure auto-scroll works */}
                <div ref={chatEndRef} />
            </main>

            {/* --- Input Area --- */}
            <footer className="p-4 bg-transparent z-10">
                <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center p-2 border border-gray-200">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about a tradition, a food, a language..."
                        className="flex-1 bg-transparent px-4 py-2 text-stone-800 focus:outline-none"
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

            {/* --- Footer with Copyright and Author Info --- */}
            <footer className="p-4 bg-[#422006]/80 backdrop-blur-sm text-white text-center text-sm md:text-base shadow-inner z-10">
                <p className="mb-2 text-[#F8EAD3]">
                    Copyright DirimSi, powered by Gemini, Conceptualized by SchrDbb.
                </p>
                <button
                    onClick={() => setShowAuthorInfo(!showAuthorInfo)}
                    className="flex items-center justify-center mx-auto px-4 py-2 bg-[#C05621] text-white rounded-full hover:bg-[#A0441C] transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-[#C05621]"
                    aria-expanded={showAuthorInfo}
                >
                    <Info size={16} className="mr-2" />
                    Click here to have more info on the architect of myself "DirimSi ai"
                </button>
                {showAuthorInfo && (
                    <div className="mt-4 p-4 bg-white/10 rounded-lg max-w-sm mx-auto shadow-inner text-[#F8EAD3] transition-all duration-300 ease-in-out transform origin-top animate-fade-in-down">
                        <h3 className="font-semibold text-lg mb-2">SchrDbb's Contact Info:</h3>
                        <p>WhatsApp: <a href="https://wa.me/237652659429" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#C05621] transition-colors">(+237)652659429</a></p>
                        <p>Email: <a href="mailto:sciencevideomakers@gmail.com" className="underline hover:text-[#C05621] transition-colors">sciencevideomakers@gmail.com</a></p>
                        <p>Telegram: <a href="https://t.me/SchrDbb" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#C05621] transition-colors">@SchrDbb</a></p>
                    </div>
                )}
            </footer>

            {/* Custom scrollbar styles for main chat area */}
            <style>{` 
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent; /* Changed to transparent for cleaner look */
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #C05621; /* Match the accent color */
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #A0441C; /* Darker on hover */
                }
                /* Animation for author info */
                @keyframes fade-in-down {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}

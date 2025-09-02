import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Volume2, VolumeX, Loader, Info, Lightbulb, ScrollText, Utensils, Handshake, Image as ImageIcon } from 'lucide-react';
import * as Tone from 'tone';

// --- Custom Debounce Function ---
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// --- SVG Background Pattern ---
const SvgBackground = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100" className="fixed inset-0 w-full h-full object-cover -z-10">
        <defs>
            <pattern id="mudcloth" patternUnits="userSpaceOnUse" width="100" height="100">
                <rect width="100" height="100" fill="#2C1605" />
                <g fill="#EADDCD" stroke="#EADDCD" strokeWidth="1">
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
        <rect width="100%" height="100%" fill="url(#mudcloth)" opacity="0.2" />
    </svg>
);

// --- Main Application Component ---
export default function App() {
    // --- STATE MANAGEMENT ---
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    TEXTRUNNER: const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [showAuthorInfo, setShowAuthorInfo] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const musicRef = useRef(null);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- HOOKS ---
    useEffect(() => {
        const initialAiMessage = {
            role: 'model',
            content: "Greetings! I am DirimSi AI, your guide to African cultures & traditions, and medical & health science. You can ask me anything or upload an image for explanation! I'll also check in weekly and offer daily discussions. What can I assist you with today?"
        };

        let proactiveMessages = [initialAiMessage];

        // Limit proactive messages in development to reduce API calls
        if (process.env.NODE_ENV === 'production') {
            const lastWeeklyGreetingTimestamp = localStorage.getItem('lastWeeklyGreetingTimestamp');
            const lastDailyDiscussionOfferDate = localStorage.getItem('lastDailyDiscussionOfferDate');
            const now = new Date();
            const oneWeek = 7 * 24 * 60 * 60 * 1000;

            if (!lastWeeklyGreetingTimestamp || (now.getTime() - new Date(parseInt(lastWeeklyGreetingTimestamp)).getTime()) > oneWeek) {
                proactiveMessages.push({
                    role: 'model',
                    content: "As your DirimSi AI, I care about your experience. How have you been feeling this week? I am here to facilitate your learning and exploration across African cultures and medical sciences."
                });
                localStorage.setItem('lastWeeklyGreetingTimestamp', now.getTime().toString());
                localStorage.removeItem('lastDailyDiscussionOfferDate');
            }

            const todayDate = now.toDateString();
            if (!lastDailyDiscussionOfferDate || lastDailyDiscussionOfferDate !== todayDate) {
                proactiveMessages.push({
                    role: 'model',
                    content: "Would you like a new daily discussion today on a fascinating aspect of African culture or an intriguing health and medical science concept? Just let me know your preference!"
                });
                localStorage.setItem('lastDailyDiscussionOfferDate', todayDate);
            }
        }

        setMessages(proactiveMessages);

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

    const fetchGeminiResponse = async (chatHistory, userPrompt, imageData = null, retries = 3, delay = 1000) => {
        const system_prompt = `
You are DirimSi AI, a highly knowledgeable and dedicated expert with two distinct and equally important areas of expertise:

1. **African traditions, history, and culture:** You are a specialist in the vast and diverse tapestry of the African continent. This includes history, languages, customs, clothing, food, spiritual beliefs, music, dance, and arts. You emphasize diversity across regions and nations, providing in-depth and respectful information.

2. **Profound medical and health science concepts:** You possess a deep understanding of human anatomy, physiology, common diseases, treatments, pharmaceutical sciences, and modern medical research. Your knowledge is based on established scientific principles and evidence.

Your mission is to provide comprehensive, accurate, and respectful information on both of these topics. You can also analyze images provided by the user and give detailed explanations or answer questions related to the image content.

When responding, ensure you:
- **Identify the topic:** Analyze the user's question (and any accompanying image) to determine whether it falls under African cultures or medical science, or if it's an image analysis request.
- **Provide focused answers:** Give a detailed answer that is relevant to the identified domain or image content.
- **Maintain separate expertise:** Do not mix the two knowledge bases unless the user's question explicitly asks you to compare or contrast them.
- **Image Analysis:** If an image is provided, focus your response on explaining the image content in detail or answering specific questions about it.
- **Handle creator information:** If asked about your creator, respond with: "I was built by DirimSi group from Cameroon which is overseen by SchrDbb. My reference AI conceptor is Gemini AI."
- **Handle sensitive medical advice with care:** If asked for personal medical advice, you must state that you are an AI and cannot provide medical advice, and that they should consult a qualified healthcare professional.
- **Encourage further exploration:** Conclude responses in a way that invites more questions.

If a specific piece of information is beyond your current Sony knowledge, politely state that you do not have sufficient information on that particular detail.
`;

        const contents = [
            { role: "user", parts: [{ text: system_prompt }] },
            { role: "model", parts: [{ text: "I understand. I am DirimSi AI, ready to share the wisdom of Africa." }] },
        ];

        chatHistory.forEach(msg => {
            contents.push({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        });

        let userParts = [{ text: userPrompt }];
        if (imageData) {
            userParts.push({
                inlineData: {
                    mimeType: imageData.mimeType,
                    data: imageData.data
                }
            });
        }
        contents.push({ role: "user", parts: userParts });

        const payload = { contents };
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';

        if (!apiKey) {
            console.error('REACT_APP_GEMINI_API_KEY is not set.');
            return "Error: API key is missing. Please contact the site administrator.";
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API response error:", errorData.error?.message || JSON.stringify(errorData));

                if (response.status === 429 && retries > 0) {
                    const retryAfter = response.headers.get('Retry-After') || delay;
                    console.warn(`Rate limit hit, retrying after ${retryAfter}ms...`);
                    await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000 || delay));
                    return fetchGeminiResponse(chatHistory, userPrompt, imageData, retries - 1, delay * 2);
                } else if (response.status === 429) {
                    return "I've hit a temporary limit on requests. Please wait a few minutes and try again, or contact support at sciencevideomakers@gmail.com.";
                } else if (response.status === 403) {
                    return "I'm sorry, it seems there's an issue with my connection to the knowledge base. Please try again later or contact support.";
                }
                throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                console.error("Unexpected API response structure or no content:", result);
                return "I apologize, but I received an unusual response or no content. Could you please try rephrasing your question?";
            }
        } catch (error) {
            console.error("Error fetching Gemini response:", error);
            return "My apologies, I'm having trouble processing your request right now. Please try again in a moment.";
        }
    };

    const handleSendMessage = debounce(async () => {
        if (input.trim() === '' || isLoading) return;

        const newUserMessage = { role: 'user', content: input };
        const updatedMessages = [...messages, newUserMessage];

        setMessages(updatedMessages);
        setInput('');
        setSelectedImage(null);
        setImagePreviewUrl(null);
        setIsLoading(true);

        const aiResponse = await fetchGeminiResponse(updatedMessages, input);

        setMessages(prevMessages => [...prevMessages, { role: 'model', content: aiResponse }]);
        setIsLoading(false);
    }, 1000);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            if (selectedImage) {
                handleImageAnalysis();
            } else {
                handleSendMessage();
            }
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result.split(',')[1];
                setSelectedImage({
                    mimeType: file.type,
                    data: base64Data
                });
                setImagePreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setSelectedImage(null);
            setImagePreviewUrl(null);
        }
    };

    const handleImageAnalysis = debounce(async () => {
        if (!selectedImage || isLoading) return;

        const userMessageContent = selectedImage.mimeType.startsWith('image/') ? 'Image uploaded for analysis.' : input;
        const newUserMessage = { role: 'user', content: userMessageContent };
        const updatedMessages = [...messages, newUserMessage];

        const analysisPrompt = "Explain this image in detail.";

        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);
        setSelectedImage(null);
        setImagePreviewUrl(null);

        const aiResponse = await fetchGeminiResponse(updatedMessages, analysisPrompt, selectedImage);

        setMessages(prevMessages => [...prevMessages, { role: 'model', content: aiResponse }]);
        setIsLoading(false);
    }, 1000);

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleCulturalInsight = debounce(async () => {
        if (isLoading) return;

        const userMessage = { role: 'user', content: "Give me a fascinating and unique cultural insight or fact about any African tradition or history." };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setIsLoading(true);

        const aiResponse = await fetchGeminiResponse(updatedMessages, "Provide a random, interesting cultural insight or historical fact about Africa. Keep it concise and engaging.");

        setMessages(prevMessages => [...prevMessages, { role: 'model', content: aiResponse }]);
        setIsLoading(false);
    }, 1000);

    const handleProverbWisdom = debounce(async () => {
        if (isLoading) return;

        const userMessage = { role: 'user', content: "Tell me an African proverb and explain its meaning." };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setIsLoading(true);

        const aiResponse = await fetchGeminiResponse(updatedMessages, "Generate a well-known African proverb and then provide a clear explanation of its meaning and cultural context.");

        setMessages(prevMessages => [...prevMessages, { role: 'model', content: aiResponse }]);
        setIsLoading(false);
    }, 1000);

    const handleAfricanDishRecipe = debounce(async () => {
        if (isLoading) return;

        const userMessage = { role: 'user', content: "Suggest a traditional African dish recipe (e.g., Jollof Rice, Egusi Soup, injera) and provide a simplified list of main ingredients and very brief preparation steps. Focus on common, accessible dishes." };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setIsLoading(true);

        const aiResponse = await fetchGeminiResponse(updatedMessages, "Suggest a traditional African dish recipe and provide a simplified list of main ingredients and very brief preparation steps.");

        setMessages(prevMessages => [...prevMessages, { role: 'model', content: aiResponse }]);
        setIsLoading(false);
    }, 1000);

    const handleAfricanNameMeaning = debounce(async () => {
        if (isLoading) return;

        const userMessage = { role: 'user', content: "Provide an interesting African name (could be male, female, or gender-neutral) and explain its meaning and cultural origin. Make it concise." };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setIsLoading(true);

        const aiResponse = await fetchGeminiResponse(updatedMessages, "Provide an interesting African name (could be male, female, or gender-neutral) and explain its meaning and cultural origin. Make it concise.");

        setMessages(prevMessages => [...prevMessages, { role: 'model', content: aiResponse }]);
        setIsLoading(false);
    }, 1000);

    // --- RENDER ---
    return (
        <div className="bg-[#FFF8E7] font-sans w-full h-screen flex flex-col antialiased relative overflow-hidden">
            <SvgBackground />

            <header className="bg-[#4a2507]/90 backdrop-blur-sm text-white p-4 flex justify-between items-center shadow-lg z-10 rounded-b-xl relative">
                <h1 className="text-3xl font-bold tracking-wider text-[#EADDCD] drop-shadow-md">DirimSi AI</h1>
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
                            <h3 className="font-semibold text-lg mb-2 border-b border-[#EADDCD]/30 pb-1">SchrDbb's Contact Info:</h3>
                            <p className="mb-1">WhatsApp: <a href="https://wa.me/237652659429" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#C05621] transition-colors">(+237)652659429</a></p>
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
                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-lg transition-all duration-300 ease-in-out font-medium text-lg 
                            ${msg.role === 'user' 
                                ? 'bg-white/95 text-stone-800 rounded-br-none border border-gray-100' 
                                : 'bg-[#4a2507]/95 text-[#EADDCD] rounded-bl-none border border-[#351B05]'
                            }`} style={{ whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                            {msg.imageUrl && (
                                <img src={msg.imageUrl} alt="Uploaded" className="mt-2 max-w-full h-auto rounded-lg shadow-md" />
                            )}
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
                        <div className="max-w-[80%] p-4 rounded-2xl shadow-lg bg-[#4a2507]/95 text-[#EADDCD] rounded-bl-none font-medium text-lg">
                            DirimSi is thinking...
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </main>

            <footer className="p-4 bg-transparent z-10 absolute bottom-0 left-0 right-0">
                {imagePreviewUrl && (
                    <div className="max-w-3xl mx-auto mb-4 p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl flex items-center justify-between border border-gray-200">
                        <img src={imagePreviewUrl} alt="Preview" className="max-h-24 rounded-md object-cover mr-4" />
                        <span className="text-stone-700 text-sm truncate">{fileInputRef.current?.files[0]?.name}</span>
                        <button
                            onClick={() => { setSelectedImage(null); setImagePreviewUrl(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="ml-4 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                            aria-label="Remove image"
                        >
                            <VolumeX size={16} />
                        </button>
                    </div>
                )}

                <div className="flex justify-center gap-2 mb-4 flex-wrap max-w-3xl mx-auto px-2">
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
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImageChange}
                        disabled={isLoading}
                        aria-label="Upload image"
                    />
                    <button
                        onClick={triggerFileInput}
                        disabled={isLoading}
                        className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300 mr-2"
                        aria-label="Upload an image"
                    >
                        <ImageIcon size={20} />
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={selectedImage ? "Image selected. Add a text prompt or press Enter to analyze." : "Ask about a tradition, a food, a language..."}
                        className="flex-1 bg-transparent px-4 py-2 text-stone-800 focus:outline-none text-lg"
                        disabled={isLoading}
                        aria-label="Chat input"
                    />
                    <button
                        onClick={selectedImage ? handleImageAnalysis : handleSendMessage}
                        disabled={isLoading || (!input.trim() && !selectedImage)}
                        className="p-3 rounded-full bg-[#C05621] text-white hover:bg-[#A0441C] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-[#C05621]"
                        aria-label="Send message"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </footer>

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
                    background: currentColor;
                    animation: pulse-ring 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
                    z-index: -1;
                    opacity: 0;
                }
            `}</style>
        </div>
    );
}
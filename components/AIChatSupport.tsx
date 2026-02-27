import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, AlertCircle } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

// Initialize Gemini safely
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

try {
    if (apiKey) {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "Eres un conserje y experto en el reglamento del edificio ResiApp. Ayudas a los vecinos respondiendo preguntas sobre reservas de amenidades (BBQ, piscina), horarios, convivencia, y normas del edificio. Eres amable, conciso y respondes en español. Si no sabes algo, sugieres contactar a la administración."
        });
    }
} catch (e) {
    console.warn("Gemini initialization failed:", e);
}

const AIChatSupport: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: '¡Hola vecino! Soy el asistente virtual del edificio. ¿En qué puedo ayudarte hoy?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const posthog = usePostHog();

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const toggleChat = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);

        // Tracking with PostHog
        if (nextState) {
            try {
                posthog?.capture('ai_chat_opened');
            } catch (e) {
                console.warn('PostHog capture failed', e);
            }
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue.trim()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);
        setError(null);

        // Resilient check: No API key or Model failed to initialize
        if (!model) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Lo siento, el servicio de inteligencia artificial no está configurado en este momento (Falta API Key). Contacta al administrador.'
            }]);
            setIsLoading(false);
            return;
        }

        try {
            // Build conversation history for Gemini (excluding the system prompt / welcome message)
            const chatHistory = messages.slice(1).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));

            const chat = model.startChat({
                history: chatHistory,
            });

            const result = await chat.sendMessage(userMsg.content);
            const responseText = result.response.text();

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText
            }]);
        } catch (err) {
            console.error('Gemini API Error:', err);
            // Graceful degradation
            setError('Tuvimos un problema conectando con el asistente. Intenta de nuevo más tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={toggleChat}
                className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white rounded-full shadow-medium flex items-center justify-center transition-all z-50 group border-2 border-primary-500"
                aria-label="Soporte Inteligente"
            >
                {isOpen ? (
                    <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                ) : (
                    <MessageCircle size={28} className="group-hover:-translate-y-1 transition-transform" />
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-4 md:right-8 w-[calc(100vw-2rem)] md:w-96 bg-white rounded-[16px] shadow-medium border border-slate-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300" style={{ height: '500px', maxHeight: '70vh' }}>

                    {/* Header */}
                    <div className="bg-primary-600 text-white p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Bot size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">ResiBot Soporte</h3>
                            <p className="text-xs text-primary-100">Reglamento y Dudas (IA)</p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm overflow-hidden ${msg.role === 'user'
                                    ? 'bg-primary-700 text-white rounded-tr-sm'
                                    : 'bg-white border border-slate-200 text-slate-900 rounded-tl-sm'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="space-y-2 leading-relaxed [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:mb-2 [&>li]:mb-1 last:[&>p]:mb-0 [&_strong]:font-semibold [&_strong]:text-slate-900">
                                            <ReactMarkdown>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-red-700 text-sm mt-2 bg-red-50 p-3 rounded-lg border border-red-200">
                                <AlertCircle size={16} className="shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-slate-100">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Pregunta sobre reservas, reglas..."
                                disabled={isLoading}
                                className="flex-1 bg-white text-slate-900 placeholder:text-slate-500 border border-slate-300 rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 disabled:bg-slate-50 disabled:text-slate-400 transition-colors shadow-sm"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isLoading}
                                className="absolute right-1.5 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                                aria-label="Enviar mensaje"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>

                </div>
            )}
        </>
    );
};

export default AIChatSupport;

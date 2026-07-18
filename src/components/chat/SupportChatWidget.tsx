'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, ArrowRight, Loader2, Phone, User, CheckCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface Message {
    id: number;
    sender: 'USER' | 'ADMIN';
    text: string;
    createdAt: string;
    admin?: { name: string | null } | null;
}

interface Room {
    id: number;
    phone: string;
    name: string;
    status: 'OPEN' | 'CLOSED';
}

type ChatState = 'closed' | 'intro' | 'chat';

const STORAGE_KEY = 'ice_support_room';

function formatTime(dateString: string) {
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: faIR });
    } catch {
        return '';
    }
}

function saveRoom(room: Room) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(room));
    } catch { }
}

function loadRoom(): Room | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export default function SupportChatWidget() {
    const { user, isLoading } = useAuth();
    const [chatState, setChatState] = useState<ChatState>('closed');
    const [room, setRoom] = useState<Room | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [isStarting, setIsStarting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastMessageCount = useRef(0);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Restore session from storage
    useEffect(() => {
        if (isLoading) return;
        const saved = loadRoom();
        if (saved) {
            setRoom(saved);
        }
    }, [isLoading]);

    // Poll for new messages when chat is open
    const fetchMessages = useCallback(async (currentRoom: Room) => {
        try {
            const res = await fetch(
                `/api/support/chat/messages?roomId=${currentRoom.id}&phone=${encodeURIComponent(currentRoom.phone)}`
            );
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                if (lastMessageCount.current > 0 && data.messages.length > lastMessageCount.current) {
                    const newest = data.messages[data.messages.length - 1];
                    if (newest.sender === 'ADMIN') {
                        setHasNewMessage(true);
                    }
                }
                lastMessageCount.current = data.messages.length;
            }
        } catch { }
    }, []);

    useEffect(() => {
        if (chatState === 'chat' && room) {
            fetchMessages(room);
            pollIntervalRef.current = setInterval(() => fetchMessages(room), 12000);
        } else {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [chatState, room, fetchMessages]);

    const handleOpen = () => {
        setHasNewMessage(false);
        if (room) {
            setChatState('chat');
        } else if (user) {
            startChat();
        } else {
            setChatState('intro');
        }
    };

    const startChat = async (name?: string, phone?: string) => {
        setIsStarting(true);
        setError('');
        try {
            const body = user ? {} : { name, phone };
            const res = await fetch('/api/support/chat/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'خطا در شروع گفتگو');
                return;
            }
            setRoom(data.room);
            saveRoom(data.room);
            setChatState('chat');
        } catch {
            setError('خطا در اتصال به سرور');
        } finally {
            setIsStarting(false);
        }
    };

    const handleGuestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName.trim() || !guestPhone.trim()) return;
        startChat(guestName.trim(), guestPhone.trim());
    };

    const handleSend = async () => {
        if (!inputText.trim() || !room || isSending) return;
        const text = inputText.trim();
        setInputText('');
        setIsSending(true);

        // Optimistic update
        const tempMsg: Message = {
            id: Date.now(),
            sender: 'USER',
            text,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempMsg]);

        try {
            const res = await fetch('/api/support/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: room.id, phone: room.phone, text }),
            });
            if (!res.ok) {
                setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
            } else {
                await fetchMessages(room);
            }
        } catch {
            setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        setChatState('closed');
    };

    const endChat = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setRoom(null);
        setMessages([]);
        setChatState('closed');
    };

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {chatState === 'closed' && (
                    <motion.button
                        id="support-chat-btn"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        onClick={handleOpen}
                        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center cursor-pointer bg-gradient-to-br from-ocean to-sky-breeze"
                    >
                        <MessageCircle className="w-7 h-7 text-white" />
                        {hasNewMessage && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
                            />
                        )}
                        {/* Pulse ring */}
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-full"
                            style={{ background: 'radial-gradient(circle, rgba(94,201,243,0.4) 0%, transparent 70%)' }}
                        />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {chatState !== 'closed' && (
                    <>
                        {/* Mobile Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 z-50 md:hidden"
                            onClick={handleClose}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className={`
                                fixed z-50 bg-white shadow-2xl flex flex-col
                                /* Mobile: full screen */
                                inset-0 rounded-none
                                /* Desktop: floating card */
                                md:inset-auto md:bottom-24 md:right-6 md:w-96 md:h-[560px] md:rounded-2xl
                            `}
                            dir="rtl"
                        >
                            {/* Header */}
                            <div
                                className="flex items-center gap-3 p-4 text-white flex-shrink-0 md:rounded-t-2xl bg-gradient-to-br from-midnight to-ocean"
                            >
                                {/* Mobile: Back button | Desktop: Chat icon */}
                                <button
                                    onClick={handleClose}
                                    className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <div className="w-9 h-9 hidden md:flex bg-white/20 rounded-full items-center justify-center">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm">پشتیبانی آیس سنتر</h3>
                                    <p className="text-xs text-white/70">
                                        {chatState === 'chat' && room?.status === 'OPEN'
                                            ? '● آنلاین - در حال پاسخگویی'
                                            : chatState === 'chat'
                                                ? 'گفتگو بسته شده'
                                                : 'گفتگو با کارشناس'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="hidden md:flex w-8 h-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Intro Form */}
                            {chatState === 'intro' && (
                                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 bg-gradient-to-br from-midnight to-ocean">
                                            <MessageCircle className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-lg">شروع گفتگو</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            لطفاً اطلاعات خود را وارد کنید تا کارشناس ما به شما کمک کند.
                                        </p>
                                    </div>

                                    <form onSubmit={handleGuestSubmit} className="w-full space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-600 block mb-1">نام شما</label>
                                            <div className="relative">
                                                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    id="guest-name"
                                                    type="text"
                                                    value={guestName}
                                                    onChange={(e) => setGuestName(e.target.value)}
                                                    placeholder="مثلاً احمد رضایی"
                                                    className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-black"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-600 block mb-1">شماره موبایل</label>
                                            <div className="relative">
                                                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    id="guest-phone"
                                                    type="tel"
                                                    value={guestPhone}
                                                    onChange={(e) => setGuestPhone(e.target.value)}
                                                    placeholder="09xxxxxxxxx"
                                                    dir="ltr"
                                                    className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-black"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        {error && (
                                            <p className="text-xs text-red-500 text-center">{error}</p>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isStarting}
                                            className="w-full py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all bg-gradient-to-br from-royal to-ocean"
                                        >
                                            {isStarting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <MessageCircle className="w-4 h-4" />
                                                    شروع گفتگو
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Chat Messages */}
                            {chatState === 'chat' && (
                                <>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                                        {/* Welcome message */}
                                        <div className="text-center">
                                            <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm">
                                                گفتگوی پشتیبانی آغاز شد
                                            </span>
                                        </div>

                                        {messages.length === 0 && (
                                            <div className="text-center py-8">
                                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <MessageCircle className="w-6 h-6 text-blue-400" />
                                                </div>
                                                <p className="text-sm text-gray-500">سوال یا مشکل خود را بنویسید.</p>
                                                <p className="text-xs text-gray-400 mt-1">کارشناسان ما آماده پاسخ هستند.</p>
                                            </div>
                                        )}

                                        {messages.map((msg) => (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${msg.sender === 'USER' ? 'justify-start' : 'justify-end'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.sender === 'USER'
                                                        ? 'bg-white text-gray-800 rounded-tr-sm'
                                                        : 'text-white rounded-tl-sm bg-gradient-to-br from-royal to-ocean'
                                                        }`}
                                                >
                                                    {msg.sender === 'ADMIN' && msg.admin?.name && (
                                                        <p className="text-xs text-white/70 mb-1 font-medium">{msg.admin.name}</p>
                                                    )}
                                                    <p className="leading-relaxed">{msg.text}</p>
                                                    <p className={`text-[10px] mt-1 ${msg.sender === 'USER' ? 'text-gray-400' : 'text-white/60'} text-left`}>
                                                        {formatTime(msg.createdAt)}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input area - floats above bottom nav on mobile */}
                                    {room?.status === 'OPEN' ? (
                                        <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0 mb-16 md:mb-0">
                                            <div className="flex gap-2 items-end">
                                                <textarea
                                                    id="chat-input"
                                                    value={inputText}
                                                    onChange={(e) => setInputText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSend();
                                                        }
                                                    }}
                                                    placeholder="پیام خود را بنویسید..."
                                                    rows={1}
                                                    className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none max-h-32 text-black"
                                                    style={{ minHeight: '42px' }}
                                                />
                                                <button
                                                    onClick={handleSend}
                                                    disabled={!inputText.trim() || isSending}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all bg-gradient-to-br from-royal to-ocean"
                                                >
                                                    {isSending
                                                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                                                        : <Send className="w-4 h-4 text-white" />
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center flex-shrink-0 mb-16 md:mb-0">
                                            <CheckCheck className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                                            <p className="text-xs text-gray-500">این گفتگو توسط پشتیبان بسته شده است.</p>
                                            <button
                                                onClick={endChat}
                                                className="mt-2 text-xs text-blue-500 hover:underline"
                                            >
                                                شروع گفتگوی جدید
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

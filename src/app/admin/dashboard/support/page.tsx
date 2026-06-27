'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    MessageSquare, Phone, User, Send, Loader2,
    CheckCheck, X, RefreshCw, Circle, ChevronLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Room {
    id: number;
    phone: string;
    name: string;
    status: 'OPEN' | 'CLOSED';
    createdAt: string;
    updatedAt: string;
    _count: { messages: number };
    messages: { text: string; sender: 'USER' | 'ADMIN'; createdAt: string }[];
}

interface Message {
    id: number;
    sender: 'USER' | 'ADMIN';
    text: string;
    createdAt: string;
    admin?: { name: string | null; phone: string } | null;
}

interface RoomDetail {
    id: number;
    phone: string;
    name: string;
    status: 'OPEN' | 'CLOSED';
    createdAt: string;
    userId: number | null;
    user: { id: number; firstName: string | null; lastName: string | null } | null;
}

function formatTime(dateString: string) {
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: faIR });
    } catch {
        return '';
    }
}

export default function AdminSupportPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [roomDetail, setRoomDetail] = useState<RoomDetail | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [replyText, setReplyText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CLOSED' | 'ALL'>('OPEN');
    const [showMobileChat, setShowMobileChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchRooms = useCallback(async () => {
        try {
            const url = statusFilter === 'ALL'
                ? '/api/admin/support/rooms'
                : `/api/admin/support/rooms?status=${statusFilter}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setRooms(data.rooms || []);
            }
        } catch (err) {
            console.error('Failed to fetch rooms:', err);
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    const fetchMessages = useCallback(async (roomId: number) => {
        try {
            const res = await fetch(`/api/admin/support/rooms/${roomId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                setRoomDetail(data.room);
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    useEffect(() => {
        if (selectedRoomId) {
            fetchMessages(selectedRoomId);
            pollIntervalRef.current = setInterval(() => {
                fetchMessages(selectedRoomId);
                fetchRooms();
            }, 12000);
        } else {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [selectedRoomId, fetchMessages, fetchRooms]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectRoom = (roomId: number) => {
        setSelectedRoomId(roomId);
        setShowMobileChat(true);
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedRoomId || isSending) return;
        const text = replyText.trim();
        setReplyText('');
        setIsSending(true);
        try {
            const res = await fetch(`/api/admin/support/rooms/${selectedRoomId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error('reply failed');
            await fetchMessages(selectedRoomId);
            await fetchRooms();
        } catch (err) {
            console.error('Failed to send reply:', err);
            // Restore the typed text so it isn't lost, and tell the admin
            setReplyText(text);
            toast.error('ارسال پاسخ ناموفق بود. دوباره تلاش کنید.');
        } finally {
            setIsSending(false);
        }
    };

    const handleToggleStatus = async (roomId: number, currentStatus: 'OPEN' | 'CLOSED') => {
        const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
        try {
            const res = await fetch(`/api/admin/support/rooms/${roomId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('status toggle failed');
            await fetchRooms();
            if (selectedRoomId === roomId) {
                await fetchMessages(roomId);
            }
            toast.success(newStatus === 'CLOSED' ? 'گفتگو بسته شد' : 'گفتگو باز شد');
        } catch (err) {
            console.error('Failed to toggle status:', err);
            toast.error('تغییر وضعیت ناموفق بود.');
        }
    };

    const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-4" dir="rtl">
            {/* Rooms List Panel */}
            <div className={`
                flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden
                w-full lg:w-96 flex-shrink-0
                ${showMobileChat ? 'hidden lg:flex' : 'flex'}
            `}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                            پشتیبانی آنلاین
                        </h1>
                        <button
                            onClick={fetchRooms}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {(['OPEN', 'CLOSED', 'ALL'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setSelectedRoomId(null); setShowMobileChat(false); }}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {s === 'OPEN' ? 'باز' : s === 'CLOSED' ? 'بسته' : 'همه'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Rooms */}
                <div className="flex-1 overflow-y-auto scrollbar-sleek">
                    {isLoading && (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                    )}
                    {!isLoading && rooms.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
                            <p className="text-sm text-gray-500">هیچ گفتگویی یافت نشد</p>
                        </div>
                    )}
                    {rooms.map((room) => {
                        const lastMsg = room.messages[0];
                        const isSelected = selectedRoomId === room.id;
                        return (
                            <button
                                key={room.id}
                                onClick={() => handleSelectRoom(room.id)}
                                className={`w-full text-right p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold ${room.status === 'OPEN' ? 'bg-gradient-to-br from-blue-500 to-sky-400' : 'bg-gray-300'}`}>
                                        {room.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-gray-800 text-sm truncate">{room.name}</span>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                {formatTime(room.updatedAt)}
                                            </span>
                                        </div>
                                        <p dir="ltr" className="text-xs text-gray-500">{room.phone}</p>
                                        {lastMsg && (
                                            <p className="text-xs text-gray-400 mt-1 truncate">
                                                {lastMsg.sender === 'ADMIN' ? '✓ ' : ''}{lastMsg.text}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <Circle
                                            className={`w-2.5 h-2.5 fill-current ${room.status === 'OPEN' ? 'text-green-500' : 'text-gray-300'}`}
                                        />
                                        <span className="text-[10px] text-gray-400">{room._count.messages}</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chat Panel */}
            <div className={`
                flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden
                ${showMobileChat ? 'flex' : 'hidden lg:flex'}
            `}>
                {!selectedRoomId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-10 h-10 text-blue-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-2">یک گفتگو انتخاب کنید</h3>
                        <p className="text-sm text-gray-400">برای مشاهده پیام‌ها و پاسخ، یک گفتگو را از لیست سمت راست انتخاب کنید.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-shrink-0">
                            <button
                                onClick={() => { setShowMobileChat(false); setSelectedRoomId(null); }}
                                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-500 rotate-180" />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {(selectedRoom?.name || '?').charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800">{selectedRoom?.name || roomDetail?.name}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1" dir="ltr">
                                    <Phone className="w-3 h-3" />
                                    {selectedRoom?.phone || roomDetail?.phone}
                                    {roomDetail?.user && (
                                        <span className="text-blue-500 mr-2 flex items-center gap-1" dir="rtl">
                                            <User className="w-3 h-3" />
                                            کاربر ثبت‌نام شده
                                        </span>
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => handleToggleStatus(selectedRoomId, roomDetail?.status || 'OPEN')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${roomDetail?.status === 'OPEN'
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                                    }`}
                            >
                                {roomDetail?.status === 'OPEN'
                                    ? <><X className="w-3.5 h-3.5" /> بستن</>
                                    : <><Circle className="w-3.5 h-3.5 fill-current" /> بازکردن</>
                                }
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto scrollbar-sleek p-4 bg-gray-50 space-y-3">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.sender === 'USER' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.sender === 'USER'
                                            ? 'bg-white text-gray-800 rounded-tr-sm'
                                            : 'text-white rounded-tl-sm'
                                            }`}
                                        style={msg.sender === 'ADMIN' ? { background: 'linear-gradient(135deg, #081F37, #2E79BA)' } : {}}
                                    >
                                        {msg.sender === 'ADMIN' && (
                                            <p className="text-[10px] text-white/70 mb-1 font-medium">
                                                {msg.admin?.name || 'پشتیبان'}
                                            </p>
                                        )}
                                        {msg.sender === 'USER' && (
                                            <p className="text-[10px] text-gray-400 mb-1 font-medium">
                                                {selectedRoom?.name || 'مشتری'}
                                            </p>
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

                        {/* Reply Input */}
                        {roomDetail?.status === 'OPEN' ? (
                            <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
                                <div className="flex gap-2 items-end">
                                    <textarea
                                        id="admin-reply-input"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendReply();
                                            }
                                        }}
                                        placeholder="پاسخ خود را بنویسید..."
                                        rows={1}
                                        className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none max-h-32 text-black"
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        disabled={!replyText.trim() || isSending}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
                                        style={{ background: 'linear-gradient(135deg, #081F37, #2E79BA)' }}
                                    >
                                        {isSending
                                            ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                                            : <Send className="w-4 h-4 text-white" />
                                        }
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center flex-shrink-0">
                                <CheckCheck className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                                <p className="text-sm text-gray-500">این گفتگو بسته شده است</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

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

export default function SupportClient() {
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load rooms
    const fetchRooms = useCallback(async () => {
        try {
            const url = statusFilter === 'ALL'
                ? '/api/admin/support/rooms'
                : `/api/admin/support/rooms?status=${statusFilter}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setRooms(data.rooms);
            }
        } catch {
            console.error('Failed to fetch rooms');
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [fetchRooms]);

    // Load messages when a room is selected
    const fetchMessages = useCallback(async (roomId: number) => {
        try {
            const res = await fetch(`/api/admin/support/rooms/${roomId}/messages`);
            const data = await res.json();
            if (data.success) {
                setMessages(data.messages);
                setRoomDetail(data.room);
            }
        } catch {
            console.error('Failed to fetch messages');
        }
    }, []);

    useEffect(() => {
        if (selectedRoomId) {
            fetchMessages(selectedRoomId);
            const interval = setInterval(() => fetchMessages(selectedRoomId), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedRoomId, fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Send reply
    const handleSendReply = async () => {
        if (!selectedRoomId || !replyText.trim() || isSending) return;

        setIsSending(true);
        const text = replyText.trim();
        setReplyText('');

        try {
            const res = await fetch(`/api/admin/support/rooms/${selectedRoomId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            const data = await res.json();
            if (data.success) {
                setMessages((prev) => [...prev, data.message]);
                fetchRooms();
            } else {
                toast.error(data.error || 'خطا در ارسال پاسخ');
                setReplyText(text);
            }
        } catch {
            toast.error('خطای ارتباط با سرور');
            setReplyText(text);
        } finally {
            setIsSending(false);
        }
    };

    // Toggle room status
    const handleToggleStatus = async (roomId: number, currentStatus: 'OPEN' | 'CLOSED') => {
        const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
        try {
            const res = await fetch(`/api/admin/support/rooms/${roomId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(newStatus === 'CLOSED' ? 'گفتگو بسته شد' : 'گفتگو باز شد');
                fetchRooms();
                if (selectedRoomId === roomId) {
                    setRoomDetail((prev) => prev ? { ...prev, status: newStatus } : null);
                }
            }
        } catch {
            toast.error('خطا در تغییر وضعیت');
        }
    };

    const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

    return (
        <div className="h-[calc(100vh-5rem)] flex gap-4 p-4" dir="rtl">
            {/* Rooms List */}
            <div className={`w-full md:w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            <h1 className="font-bold text-gray-900">پشتیبانی آنلاین</h1>
                        </div>
                        <button
                            onClick={fetchRooms}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                            title="بروزرسانی"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl text-xs font-medium">
                        {(['OPEN', 'CLOSED', 'ALL'] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={`flex-1 py-1.5 rounded-lg transition-all ${
                                    statusFilter === filter
                                        ? 'bg-white text-gray-900 shadow-xs font-bold'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {filter === 'OPEN' ? 'باز' : filter === 'CLOSED' ? 'بسته' : 'همه'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Rooms Scroll List */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="text-center py-12 px-4 text-gray-400">
                            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">هیچ گفتگویی یافت نشد</p>
                        </div>
                    ) : (
                        rooms.map((room) => {
                            const lastMsg = room.messages[0];
                            const isSelected = room.id === selectedRoomId;
                            return (
                                <motion.button
                                    key={room.id}
                                    onClick={() => {
                                        setSelectedRoomId(room.id);
                                        setShowMobileChat(true);
                                    }}
                                    className={`w-full p-3.5 text-right transition-colors hover:bg-gray-50 flex gap-3 items-start ${
                                        isSelected ? 'bg-blue-50/70 border-r-2 border-blue-600' : ''
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
                                        {room.name[0] || '?'}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <span className="font-semibold text-sm text-gray-900 truncate">
                                                {room.name}
                                            </span>
                                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                                                {formatTime(room.updatedAt)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                            <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                            <span className="truncate">{room.phone}</span>
                                        </div>

                                        {lastMsg && (
                                            <p className="text-xs text-gray-500 truncate">
                                                {lastMsg.sender === 'ADMIN' && (
                                                    <span className="text-blue-600 font-medium">شما: </span>
                                                )}
                                                {lastMsg.text}
                                            </p>
                                        )}
                                    </div>

                                    {/* Status Dot */}
                                    <Circle
                                        className={`w-2 h-2 flex-shrink-0 mt-1 fill-current ${
                                            room.status === 'OPEN' ? 'text-emerald-500' : 'text-gray-300'
                                        }`}
                                    />
                                </motion.button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                {!selectedRoomId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                            <MessageSquare className="w-8 h-8 opacity-40 text-gray-500" />
                        </div>
                        <p className="font-medium text-gray-600 text-sm">یک گفتگو را انتخاب کنید</p>
                        <p className="text-xs text-gray-400 mt-1">پیام‌های کاربر و تاریخچه مکالمه در اینجا نمایش داده می‌شود</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
                            <div className="flex items-center gap-3">
                                {/* Mobile Back Button */}
                                <button
                                    onClick={() => setShowMobileChat(false)}
                                    className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                                >
                                    <ChevronLeft className="w-5 h-5 rotate-180" />
                                </button>

                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                                    {selectedRoom?.name[0] || '?'}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-bold text-gray-900 text-sm">{selectedRoom?.name}</h2>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                            roomDetail?.status === 'OPEN'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {roomDetail?.status === 'OPEN' ? 'باز' : 'بسته'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {selectedRoom?.phone}
                                        </span>
                                        {roomDetail?.user && (
                                            <span className="flex items-center gap-1 text-blue-600">
                                                <User className="w-3 h-3" />
                                                کاربر عضو سایت
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => selectedRoom && handleToggleStatus(selectedRoom.id, roomDetail?.status || 'OPEN')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                        roomDetail?.status === 'OPEN'
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    }`}
                                >
                                    {roomDetail?.status === 'OPEN' ? (
                                        <>
                                            <X className="w-3.5 h-3.5" />
                                            بستن گفتگو
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            بازگشایی مجدد
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                            {messages.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-xs">
                                    هنوز پیامی ارسال نشده است
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isAdmin = msg.sender === 'ADMIN';
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div
                                                className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-xs ${
                                                    isAdmin
                                                        ? 'bg-blue-600 text-white rounded-tr-sm'
                                                        : 'bg-white text-gray-900 border border-gray-100 rounded-tl-sm'
                                                }`}
                                            >
                                                {isAdmin && msg.admin?.name && (
                                                    <p className="text-[10px] text-blue-200 mb-1 font-medium">
                                                        {msg.admin.name}
                                                    </p>
                                                )}
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                                <p className={`text-[10px] mt-1 text-left ${isAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {formatTime(msg.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Box */}
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

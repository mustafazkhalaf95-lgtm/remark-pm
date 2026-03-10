'use client';
/* ══════════════════════════════════════════════════════════
   useChat — Chat rooms & messages from DB via API
   Replaces chatStore singleton.
   ══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiUrl } from './useFetch';

export interface ChatRoomData {
    id: string;
    name: string;
    nameAr: string;
    type: string; // company, department, client, direct, project
    departmentId: string | null;
    clientId: string | null;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
    members: {
        id: string;
        userId: string;
        user: {
            id: string;
            email: string;
            profile?: { fullName: string; fullNameAr: string; avatar: string };
        };
    }[];
    messages: ChatMessageData[];
    _count?: { messages: number };
}

export interface ChatMessageData {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    type: string; // text, system, ai_suggestion, card_reference
    mentions: string; // JSON array
    replyToId: string | null;
    entityType: string;
    entityId: string;
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
    sender: {
        id: string;
        email: string;
        profile?: { fullName: string; fullNameAr: string; avatar: string };
    };
    replyTo?: ChatMessageData | null;
}

export function useChatRooms() {
    const [rooms, setRooms] = useState<ChatRoomData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRooms = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(apiUrl('/api/chat/rooms'));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setRooms(json.items || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRooms(); }, [fetchRooms]);

    return { rooms, loading, error, refetch: fetchRooms };
}

export function useChatMessages(roomId: string | null) {
    const [messages, setMessages] = useState<ChatMessageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const fetchMessages = useCallback(async () => {
        if (!roomId) { setMessages([]); setLoading(false); return; }
        try {
            const res = await fetch(apiUrl(`/api/chat/rooms/${roomId}/messages?take=100`));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setMessages(json.items || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useEffect(() => {
        fetchMessages();
        // Poll every 5 seconds for new messages
        pollRef.current = setInterval(fetchMessages, 5000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [fetchMessages]);

    const sendMessage = useCallback(async (content: string, senderId: string, type: string = 'text') => {
        if (!roomId) return null;
        try {
            const res = await fetch(apiUrl(`/api/chat/rooms/${roomId}/messages`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, senderId, type }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const msg = await res.json();
            // Optimistically add to messages
            setMessages(prev => [...prev, msg]);
            return msg;
        } catch (e: any) {
            setError(e.message);
            return null;
        }
    }, [roomId]);

    return { messages, loading, error, refetch: fetchMessages, sendMessage };
}

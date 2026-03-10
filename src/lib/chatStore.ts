'use strict';
/* Remark — Chat Store — Company/Department/Client Rooms + Mentions + AI Actions */
import { TEAM, type TeamMember, type Department, getMember, getActiveUserId } from './teamStore';

// ─── Room Types ───
export type RoomType = 'company' | 'department' | 'client' | 'direct';

export interface ChatRoom {
    roomId: string;
    type: RoomType;
    name: string;
    nameEn: string;
    icon: string;
    color: string;
    department?: Department;
    clientId?: string;
    members: string[]; // member IDs
    aiEnabled: boolean;
}

export interface CardRef {
    cardType: 'creative_request' | 'production_job' | 'publishing_post' | 'marketing_task';
    cardId: string;
    title: string;
    clientName: string;
    status: string;
    assignee: string;
    dueDate: string;
}

export interface ChatMessage {
    messageId: string;
    roomId: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    text: string;
    mentions: string[]; // member IDs mentioned with @
    cardRefs: CardRef[];
    type: 'human' | 'ai' | 'system';
    timestamp: string;
    aiAction?: AIAction;
}

export interface AIAction {
    actionId: string;
    description: string;
    descriptionEn: string;
    targetType: 'card' | 'assignment' | 'status' | 'date' | 'approval';
    targetId: string;
    proposedChange: string;
    status: 'proposed' | 'approved' | 'rejected' | 'executed';
    proposedBy: string;
    respondedBy?: string;
    respondedAt?: string;
}

export interface Notification {
    id: string;
    recipientId: string;
    type: 'mention' | 'assignment' | 'approval' | 'ai_action' | 'system';
    text: string;
    textEn: string;
    roomId?: string;
    messageId?: string;
    cardRef?: CardRef;
    read: boolean;
    timestamp: string;
}

const CHAT_STORAGE_KEY = 'remark_pm_chat_store';

// ─── Default rooms ───
function buildDefaultRooms(): ChatRoom[] {
    const all = TEAM.map(m => m.id);
    return [
        { roomId: 'room_company', type: 'company', name: 'محادثة الشركة', nameEn: 'Company Chat', icon: '🏢', color: '#6366f1', members: all, aiEnabled: true },
        { roomId: 'room_marketing', type: 'department', name: 'محادثة التسويق', nameEn: 'Marketing Chat', icon: '📊', color: '#06b6d4', department: 'marketing', members: all.filter(id => { const m = getMember(id); return m && (m.department === 'marketing' || m.roles.includes('ceo') || m.roles.includes('operations_manager') || m.roles.includes('account_manager')); }), aiEnabled: true },
        { roomId: 'room_creative', type: 'department', name: 'محادثة الإبداعي', nameEn: 'Creative Chat', icon: '🎨', color: '#8b5cf6', department: 'creative', members: all.filter(id => { const m = getMember(id); return m && (m.department === 'creative' || m.roles.includes('ceo') || m.roles.includes('operations_manager') || m.roles.includes('account_manager')); }), aiEnabled: true },
        { roomId: 'room_production', type: 'department', name: 'محادثة الإنتاج', nameEn: 'Production Chat', icon: '🎬', color: '#ec4899', department: 'production', members: all.filter(id => { const m = getMember(id); return m && (m.department === 'production' || m.roles.includes('ceo') || m.roles.includes('operations_manager')); }), aiEnabled: true },
        { roomId: 'room_publishing', type: 'department', name: 'محادثة النشر', nameEn: 'Publishing Chat', icon: '📢', color: '#f97316', department: 'publishing', members: all.filter(id => { const m = getMember(id); return m && (m.department === 'publishing' || m.roles.includes('ceo') || m.roles.includes('operations_manager') || m.roles.includes('publishing_manager')); }), aiEnabled: true },
    ];
}

// ═══ STORE ═══
class ChatStore {
    rooms: ChatRoom[] = [];
    messages: ChatMessage[] = [];
    notifications: Notification[] = [];
    aiActions: AIAction[] = [];
    private _v = 0;
    private _subs = new Set<() => void>();

    constructor() { if (!this._load()) { this.rooms = buildDefaultRooms(); this._save(); } }

    subscribe(fn: () => void) { this._subs.add(fn); return () => this._subs.delete(fn); }
    getVersion() { return this._v; }
    private emit() { this._v++; this._save(); this._subs.forEach(f => f()); }

    private _save() {
        if (typeof window === 'undefined') return;
        try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ rooms: this.rooms, messages: this.messages, notifications: this.notifications, aiActions: this.aiActions })); } catch { }
    }
    private _load(): boolean {
        if (typeof window === 'undefined') return false;
        try {
            const raw = localStorage.getItem(CHAT_STORAGE_KEY);
            if (!raw) return false;
            const d = JSON.parse(raw);
            this.rooms = d.rooms || []; this.messages = d.messages || [];
            this.notifications = d.notifications || []; this.aiActions = d.aiActions || [];
            // Ensure default rooms exist
            const defaults = buildDefaultRooms();
            for (const dr of defaults) { if (!this.rooms.find(r => r.roomId === dr.roomId)) this.rooms.push(dr); }
            return true;
        } catch { return false; }
    }

    // ─── Rooms ───
    getRoom(id: string) { return this.rooms.find(r => r.roomId === id); }
    getRoomsForMember(memberId: string) { return this.rooms.filter(r => r.members.includes(memberId) || r.type === 'company'); }
    getClientRoom(clientId: string) {
        let room = this.rooms.find(r => r.type === 'client' && r.clientId === clientId);
        if (!room) { room = { roomId: `room_client_${clientId}`, type: 'client', name: `محادثة العميل`, nameEn: 'Client Chat', icon: '👤', color: '#3b82f6', clientId, members: [], aiEnabled: true }; this.rooms.push(room); this._save(); }
        return room;
    }

    // ─── Messages ───
    getRoomMessages(roomId: string) { return this.messages.filter(m => m.roomId === roomId); }

    sendMessage(roomId: string, text: string, senderId?: string): ChatMessage {
        const sender = getMember(senderId || getActiveUserId());
        const mentions = this._extractMentions(text);
        const msg: ChatMessage = {
            messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            roomId, senderId: sender?.id || 'system', senderName: sender?.name || 'النظام',
            senderAvatar: sender?.avatar || '🔔', text, mentions, cardRefs: [],
            type: 'human', timestamp: new Date().toISOString(),
        };
        this.messages.push(msg);
        // Create notifications for mentions
        for (const mid of mentions) {
            this.notifications.push({
                id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
                recipientId: mid, type: 'mention',
                text: `${sender?.name || ''} ذكرك في ${this.getRoom(roomId)?.name || ''}`,
                textEn: `${sender?.nameEn || ''} mentioned you in ${this.getRoom(roomId)?.nameEn || ''}`,
                roomId, messageId: msg.messageId, read: false,
                timestamp: new Date().toISOString(),
            });
        }
        this.emit(); return msg;
    }

    sendSystemMessage(roomId: string, text: string, textEn?: string) {
        const msg: ChatMessage = {
            messageId: `msg_sys_${Date.now()}`, roomId,
            senderId: 'system', senderName: 'النظام', senderAvatar: '🔔',
            text, mentions: [], cardRefs: [], type: 'system',
            timestamp: new Date().toISOString(),
        };
        this.messages.push(msg); this.emit(); return msg;
    }

    sendAIMessage(roomId: string, text: string, action?: Omit<AIAction, 'actionId' | 'status'>) {
        const aiAction: AIAction | undefined = action ? {
            ...action, actionId: `ai_act_${Date.now()}`, status: 'proposed',
        } : undefined;
        if (aiAction) this.aiActions.push(aiAction);
        const msg: ChatMessage = {
            messageId: `msg_ai_${Date.now()}`, roomId,
            senderId: 'ai', senderName: 'مساعد Remark', senderAvatar: '🤖',
            text, mentions: [], cardRefs: [], type: 'ai',
            timestamp: new Date().toISOString(), aiAction,
        };
        this.messages.push(msg); this.emit(); return msg;
    }

    // ─── Card References ───
    addCardRefToMessage(messageId: string, ref: CardRef) {
        const msg = this.messages.find(m => m.messageId === messageId);
        if (msg) { msg.cardRefs.push(ref); this.emit(); }
    }

    // ─── AI Actions ───
    approveAIAction(actionId: string, responderId: string) {
        const action = this.aiActions.find(a => a.actionId === actionId);
        if (action) { action.status = 'approved'; action.respondedBy = responderId; action.respondedAt = new Date().toISOString(); this.emit(); }
        return action;
    }
    rejectAIAction(actionId: string, responderId: string) {
        const action = this.aiActions.find(a => a.actionId === actionId);
        if (action) { action.status = 'rejected'; action.respondedBy = responderId; action.respondedAt = new Date().toISOString(); this.emit(); }
        return action;
    }
    executeAIAction(actionId: string) {
        const action = this.aiActions.find(a => a.actionId === actionId);
        if (action && action.status === 'approved') { action.status = 'executed'; this.emit(); }
        return action;
    }
    getPendingAIActions() { return this.aiActions.filter(a => a.status === 'proposed'); }

    // ─── Notifications ───
    getNotifications(memberId: string) { return this.notifications.filter(n => n.recipientId === memberId); }
    getUnreadCount(memberId: string) { return this.notifications.filter(n => n.recipientId === memberId && !n.read).length; }
    markRead(notifId: string) { const n = this.notifications.find(x => x.id === notifId); if (n) { n.read = true; this.emit(); } }
    markAllRead(memberId: string) { this.notifications.filter(n => n.recipientId === memberId && !n.read).forEach(n => n.read = true); this.emit(); }

    notify(recipientId: string, type: Notification['type'], text: string, textEn: string, extra?: Partial<Notification>) {
        this.notifications.push({
            id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
            recipientId, type, text, textEn, read: false,
            timestamp: new Date().toISOString(), ...extra,
        });
        this.emit();
    }

    // ─── Mention extraction ───
    private _extractMentions(text: string): string[] {
        const ids: string[] = [];
        for (const m of TEAM) {
            if (text.includes(`@${m.name}`) || text.includes(`@${m.nameEn}`) || text.includes(`@${m.id}`)) {
                ids.push(m.id);
            }
        }
        return ids;
    }
}

let _cs: ChatStore | null = null;
export function getChatStore(): ChatStore { if (!_cs) _cs = new ChatStore(); return _cs; }

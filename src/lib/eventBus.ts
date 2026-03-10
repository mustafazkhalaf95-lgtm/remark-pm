/* ══════════════════════════════════════════════════════════
   Remark PM — Event Bus
   Simple in-process event emitter for cross-board sync.
   Replaces fragile localStorage-based synchronization.
   ══════════════════════════════════════════════════════════ */

export type EventType =
    | 'marketing:created'
    | 'marketing:status_changed'
    | 'marketing:assigned'
    | 'creative:created'
    | 'creative:status_changed'
    | 'creative:assigned'
    | 'creative:approved'
    | 'creative:rejected'
    | 'production:created'
    | 'production:status_changed'
    | 'production:assigned'
    | 'production:completed'
    | 'publishing:created'
    | 'publishing:scheduled'
    | 'publishing:published'
    | 'approval:requested'
    | 'approval:decided';

export interface AppEvent {
    type: EventType;
    entityId: string;
    entityType: 'marketing' | 'creative' | 'production' | 'publishing' | 'approval';
    payload: Record<string, any>;
    timestamp: Date;
    userId?: string;
}

type EventListener = (event: AppEvent) => void | Promise<void>;

class EventBus {
    private listeners = new Map<EventType, EventListener[]>();

    /**
     * Subscribe to an event type. Returns unsubscribe function.
     */
    on(type: EventType, callback: EventListener): () => void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(callback);

        return () => {
            const list = this.listeners.get(type);
            if (list) {
                const idx = list.indexOf(callback);
                if (idx >= 0) list.splice(idx, 1);
            }
        };
    }

    /**
     * Emit an event to all listeners. Errors are logged but don't propagate.
     * Supports both (AppEvent) and (type, payload) signatures.
     */
    async emit(eventOrType: AppEvent | string, payload?: Record<string, any>): Promise<void> {
        let event: AppEvent;
        if (typeof eventOrType === 'string') {
            const [entityType] = eventOrType.split(':') as [AppEvent['entityType']];
            event = {
                type: eventOrType as EventType,
                entityId: (payload as any)?.task?.id || (payload as any)?.request?.id || (payload as any)?.job?.id || (payload as any)?.item?.id || '',
                entityType,
                payload: payload || {},
                timestamp: new Date(),
                userId: (payload as any)?.userId,
            };
        } else {
            event = eventOrType;
        }
        const callbacks = this.listeners.get(event.type) || [];
        for (const cb of callbacks) {
            try {
                await cb(event);
            } catch (error) {
                console.error(`[EventBus] Error in listener for ${event.type}:`, error);
            }
        }
    }

    /**
     * Remove all listeners (useful for testing)
     */
    clear(): void {
        this.listeners.clear();
    }
}

// Singleton
export const eventBus = new EventBus();

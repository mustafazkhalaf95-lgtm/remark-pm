/* ══════════════════════════════════════════════════════════
   Remark PM — Hook barrel file
   Re-exports everything from hooks/ directory.
   ══════════════════════════════════════════════════════════ */

'use client';

// Core
export { useFetch, apiMutate } from './hooks/useFetch';

// Data hooks
export { useClients } from './hooks/useClients';
export type { ClientData } from './hooks/useClients';

export { useMarketingTasks } from './hooks/useMarketingTasks';
export type { MarketingTaskData } from './hooks/useMarketingTasks';

export { useCreativeRequests } from './hooks/useCreativeRequests';
export type { CreativeRequestData } from './hooks/useCreativeRequests';

export { useProductionJobs } from './hooks/useProductionJobs';
export type { ProductionJobData } from './hooks/useProductionJobs';

export { usePublishingItems } from './hooks/usePublishingItems';
export type { PublishingItemData } from './hooks/usePublishingItems';

export { useCampaigns } from './hooks/useCampaigns';
export type { CampaignData } from './hooks/useCampaigns';

export { useUsers, useUser } from './hooks/useUsers';
export type { UserData } from './hooks/useUsers';

// Session / Auth
export { useCurrentUser, useHasPermission, useHasRole } from './hooks/useSession';
export type { SessionUser } from './hooks/useSession';

// Chat
export { useChatRooms, useChatMessages } from './hooks/useChat';
export type { ChatRoomData, ChatMessageData } from './hooks/useChat';

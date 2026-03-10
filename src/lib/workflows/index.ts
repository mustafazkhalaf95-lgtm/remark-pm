/* ══════════════════════════════════════════════════════════
   Remark PM — Workflow Registry
   Import this file once to register all workflow listeners.
   ══════════════════════════════════════════════════════════ */

// Import all workflow files to register their event listeners
import './marketingToCreative';
import './creativeToProduction';
import './productionToPublishing';

export { onMarketingTaskCreated, onMarketingStatusChanged } from './marketingToCreative';
export { onCreativeApproved, onProductionCompleted } from './creativeToProduction';
export { onProductionComplete, onItemPublished } from './productionToPublishing';

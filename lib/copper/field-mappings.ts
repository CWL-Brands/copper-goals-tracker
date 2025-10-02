/**
 * Central Copper CRM Field Mappings
 * 
 * This file contains all field name mappings and option IDs for Copper CRM.
 * Update this file when Copper field names or IDs change.
 */

// ============================================================================
// OPPORTUNITY FIELDS
// ============================================================================

export const OPPORTUNITY_FIELDS = {
  // Value/Amount fields (Copper uses different names)
  value: ['monetary_value', 'value', 'monetary_amount'] as const,
  
  // Stage fields
  stageId: ['pipeline_stage_id', 'stage_id', 'stage.id'] as const,
  stageName: ['stage_name', 'stage.name'] as const,
  
  // Owner/Assignee fields
  ownerId: ['assignee_id', 'owner_id', 'user_id'] as const,
  
  // Date fields
  closeDate: ['close_date'] as const,
  dateModified: ['date_modified'] as const,
  dateCreated: ['date_created'] as const,
} as const;

// ============================================================================
// ACTIVITY FIELDS
// ============================================================================

export const ACTIVITY_FIELDS = {
  // Date fields
  activityDate: ['activity_date', 'date'] as const,
  dateModified: ['date_modified'] as const,
  
  // User fields
  userId: ['user_id', 'owner_id'] as const,
} as const;

// ============================================================================
// CUSTOM FIELD IDs (from Copper metadata)
// ============================================================================

export const CUSTOM_FIELD_IDS = {
  // Sale Type field
  SALE_TYPE: 710692,
  
  // Sale Type option IDs
  SALE_TYPE_OPTIONS: {
    WHOLESALE: 2098790,
    DISTRIBUTION: 2098791,
    DIRECT_TO_CONSUMER: 2098792,
  },
  
  // ============================================================================
  // ACCOUNT (COMPANY) FIELDS
  // ============================================================================
  
  ACCOUNT_NUMBER: 698260,
  ACCOUNT_ORDER_ID: 698467,
  TOTAL_ORDERS: 698403,
  TOTAL_SPENT: 698404,
  FIRST_ORDER_DATE: 698405,
  LAST_ORDER_DATE: 698406,
  AVERAGE_ORDER_VALUE: 698407,
  
  // New Fishbowl Account fields
  ACTIVE_CUSTOMER: 712751,
  CREDIT_LIMIT: 712752,
  CUSTOMER_SINCE: 712753,
  LAST_MODIFIED_DATE: 712754,
  PRIMARY_CONTACT_NAME: 712755, // Connect field
  
  // ShipStation Account aggregates
  LIFETIME_SHIPMENTS_COMPANY: 706521,
  LIFETIME_SHIPPING_SPEND_COMPANY: 706522,
  LAST_SHIPPED_DATE: 706523,
  
  // ============================================================================
  // PIPELINE RECORD (OPPORTUNITY) FIELDS
  // ============================================================================
  
  // Order identification
  SO_NUMBER: 698395,
  DATE_ISSUED: 698396,
  ORDER_STATUS: 698397,
  
  // Financial fields
  ORDER_TOTAL: 698441,
  SUBTOTAL: 698438,
  TAX_AMOUNT: 698439,
  TAX_INCLUDED: 712757,
  COST: 712758,
  DISCOUNT_AMOUNT: 698440,
  SHIPPING_AMOUNT: 698427,
  PROCESSING_FEES: 698428,
  
  // Dates
  DATE_COMPLETED: 712759,
  DATE_CREATED: 712760,
  LAST_MODIFIED: 712761,
  SHIP_DATE: 698436,
  DELIVERY_DATE: 706517,
  
  // People
  SALESMAN: 712762,
  SALESMAN_ID: 712763,
  
  // Order details
  CUSTOMER_PO: 712764,
  LOCATION: 712765,
  QB_CLASS: 712766,
  
  // Shipping details
  SHIP_TO_NAME: 712767,
  SHIP_TO_ADDRESS: 712768,
  SHIP_TO_CITY: 712769,
  SHIP_TO_ZIP: 712770,
  RESIDENTIAL_DELIVERY: 712771,
  SHIPPING_METHOD: 698435,
  TRACKING_NUMBER: 706515,
  
  // ShipStation fields
  SHIPSTATION_ORDER_NUM: 706512,
  CARRIER: 706513,
  SERVICE: 706514,
  SHIPPING_STATUS: 706518,
  
  // Payment
  PAYMENT_TERMS: 698434,
  PAYMENT_STATUS: 698399,
  FOB_POINT: 712772,
  
  // Sync tracking
  FISHBOWL_STATUS: 698443,
  LAST_SYNC_DATE: 698444,
  SYNC_STATUS: 698445,
  
  // Notes
  ORDER_NOTES: 698401,
  SPECIAL_INSTRUCTIONS: 698432,
} as const;

// ============================================================================
// ACTIVITY TYPE IDs (from Copper metadata)
// ============================================================================

export const ACTIVITY_TYPE_IDS = {
  // User activities
  EMAIL: { id: 2279550, category: 'user' as const },
  PHONE_CALL: { id: 2160510, category: 'user' as const },
  MEETING: { id: 2160511, category: 'user' as const },
  SMS: { id: 2160513, category: 'user' as const },
  NOTE: { id: 0, category: 'user' as const },
  TODO: { id: 2160512, category: 'user' as const },
  
  // System activities
  SYSTEM_EMAIL: { id: 6, category: 'system' as const },
} as const;

// ============================================================================
// PIPELINE & STAGE CONFIGURATION
// ============================================================================

export const PIPELINE_CONFIG = {
  SALES_PIPELINE_ID: 1084986,
  
  // Stage IDs (from pipeline metadata)
  STAGES: {
    OPPORTUNITY: 4896301,
    PAYMENT_RECEIVED: 4896303,
    FACT_FINDING: 5034781,
    CONTACT_STAGE: 5034782,
    CLOSING_STAGE: 5034783,
  },
  
  // Closed/Won stages (by name)
  CLOSED_WON_STAGES: ['Payment Received'],
  
  // Stage mapping for lead progression metrics
  STAGE_MAPPING: {
    'Fact Finding': 'lead_progression_a',
    'Contact Stage': 'lead_progression_b',
    'Closing Stage': 'lead_progression_c',
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get value from opportunity using multiple possible field names
 */
export function getOpportunityValue(opp: any): number {
  for (const field of OPPORTUNITY_FIELDS.value) {
    const value = getNestedValue(opp, field);
    if (value != null) return Number(value);
  }
  return 0;
}

/**
 * Get stage ID from opportunity using multiple possible field names
 */
export function getOpportunityStageId(opp: any): string | undefined {
  for (const field of OPPORTUNITY_FIELDS.stageId) {
    const value = getNestedValue(opp, field);
    if (value != null) return String(value);
  }
  return undefined;
}

/**
 * Get owner/assignee ID from opportunity using multiple possible field names
 */
export function getOpportunityOwnerId(opp: any): number | undefined {
  for (const field of OPPORTUNITY_FIELDS.ownerId) {
    const value = getNestedValue(opp, field);
    if (value != null) return Number(value);
  }
  return undefined;
}

/**
 * Get Sale Type from opportunity custom fields
 */
export function getSaleType(opp: any): 'wholesale' | 'distribution' | 'direct-to-consumer' | null {
  const customFields = opp?.custom_fields || [];
  const saleTypeField = customFields.find(
    (f: any) => f.custom_field_definition_id === CUSTOM_FIELD_IDS.SALE_TYPE
  );
  
  if (!saleTypeField?.value) return null;
  
  const value = String(saleTypeField.value);
  const { WHOLESALE, DISTRIBUTION, DIRECT_TO_CONSUMER } = CUSTOM_FIELD_IDS.SALE_TYPE_OPTIONS;
  
  // Check option ID or name
  if (value === String(WHOLESALE) || value.toLowerCase().includes('wholesale')) {
    return 'wholesale';
  }
  if (value === String(DISTRIBUTION) || value.toLowerCase().includes('distribution')) {
    return 'distribution';
  }
  if (value === String(DIRECT_TO_CONSUMER) || value.toLowerCase().includes('direct')) {
    return 'direct-to-consumer';
  }
  
  return null;
}

/**
 * Helper to get nested object values (e.g., 'stage.name')
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Complete Firestore Schema
 * 
 * This file defines ALL Firestore collections and their TypeScript interfaces.
 * Extends existing schema (users, goals, metrics, settings) with new data warehouse collections.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// EXISTING COLLECTIONS (from types/index.ts)
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'sales' | 'manager' | 'admin';
  copperId?: string;
  photoUrl?: string;
  passwordChanged?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  type: GoalType;
  period: GoalPeriod;
  target: number;
  current: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type GoalType = 
  | 'phone_call_quantity'
  | 'talk_time_minutes'
  | 'email_quantity'
  | 'lead_progression_a'
  | 'lead_progression_b'
  | 'lead_progression_c'
  | 'new_sales_wholesale'
  | 'new_sales_distribution';

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface Metric {
  id: string;
  userId: string;
  type: GoalType;
  value: number;
  date: Date;
  source: 'manual' | 'copper' | 'justcall' | 'fishbowl' | 'shipstation';
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface UserSettings {
  userId: string;
  copperUserEmail?: string;
  lastSyncAt?: string;
  notifications?: {
    dailyReminder: boolean;
    goalAchieved: boolean;
    weeklyReport: boolean;
  };
  defaultView?: 'dashboard' | 'goals' | 'team';
  timezone?: string;
}

// ============================================================================
// NEW DATA WAREHOUSE COLLECTIONS
// ============================================================================

// ----------------------------------------------------------------------------
// FISHBOWL CUSTOMERS
// Collection: 'fishbowl_customers'
// Document ID: Fishbowl customer ID (string)
// ----------------------------------------------------------------------------

export interface FishbowlCustomer {
  // Primary key
  id: string;                          // Fishbowl customer ID
  
  // Basic info
  accountId: string;                   // Fishbowl account ID
  name: string;
  activeFlag: boolean;
  
  // Contact info
  email?: string;
  phone?: string;
  customerContact?: string;
  
  // Billing address
  billToAddress?: string;
  billToCity?: string;
  billToStateID?: string;
  billToZip?: string;
  
  // Financial
  creditLimit?: number;
  
  // Dates
  dateCreated?: Date;
  dateLastModified?: Date;
  
  // Carrier/shipping
  carrierServiceId?: string;
  
  // Custom fields (parsed from Fishbowl JSON)
  customFields?: Record<string, any>;
  
  // Copper sync tracking
  copperCompanyId?: number;            // Link to Copper Account
  lastSyncedToCopperAt?: Date;
  syncStatus?: 'pending' | 'synced' | 'error';
  syncError?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  source: 'fishbowl';
}

// ----------------------------------------------------------------------------
// FISHBOWL SALES ORDERS
// Collection: 'fishbowl_sales_orders'
// Document ID: SO Number (string)
// ----------------------------------------------------------------------------

export interface FishbowlSalesOrder {
  // Primary key
  id: string;                          // SO Number (e.g., "SO-12345")
  num: string;                         // SO Number (same as id)
  
  // Customer link
  customerId: string;                  // Link to fishbowl_customers
  
  // Order info
  status: string;
  priorityId?: string;
  
  // Financial
  totalPrice: number;
  subtotal: number;
  totalTax: number;
  totalIncludesTax: boolean;
  cost?: number;
  
  // Dates
  dateIssued?: Date;
  dateCompleted?: Date;
  dateCreated?: Date;
  dateLastModified?: Date;
  dateFirstShip?: Date;
  dateCatStart?: Date;
  dateCatEnd?: Date;
  
  // People
  salesman?: string;
  salesmanId?: string;
  createdByUserId?: string;
  username?: string;
  
  // Customer info
  customerPO?: string;
  customerContact?: string;
  
  // Location/QB
  locationGroupId?: string;
  qbClassId?: string;
  
  // Shipping
  shipToName?: string;
  shipToAddress?: string;
  shipToCity?: string;
  shipToStateID?: string;
  shipToZip?: string;
  shipToResidential?: boolean;
  carrierServiceId?: string;
  
  // Payment
  paymentTermsId?: string;
  fobPointId?: string;
  
  // Tax
  taxRate?: number;
  taxRateName?: string;
  toBeEmailed?: boolean;
  toBePrinted?: boolean;
  
  // Notes
  note?: string;
  
  // Status
  statusId?: number;
  satusId?: number; // Typo in Fishbowl data
  
  // Custom fields (parsed from Fishbowl JSON)
  customFields?: Record<string, any>;
  
  // Copper sync tracking
  copperOpportunityId?: number;        // Link to Copper Pipeline Record
  lastSyncedToCopperAt?: Date;
  syncStatus?: 'pending' | 'synced' | 'error';
  syncError?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  source: 'fishbowl';
}

// ----------------------------------------------------------------------------
// SHIPSTATION SHIPMENTS
// Collection: 'shipstation_shipments'
// Document ID: ShipStation shipment ID (string)
// ----------------------------------------------------------------------------

export interface ShipStationShipment {
  // Primary key
  id: string;                          // ShipStation shipment ID
  
  // Order link
  orderId: string;                     // ShipStation order ID
  orderNumber?: string;                // Customer order number
  
  // Tracking
  trackingNumber?: string;
  carrier?: string;
  service?: string;
  
  // Dates
  shipDate?: Date;
  deliveryDate?: Date;
  
  // Status
  shippingStatus: 'awaiting_payment' | 'awaiting_shipment' | 'shipped' | 'delivered' | 'on_hold' | 'cancelled';
  
  // Costs
  shippingCost?: number;
  
  // Customer link (if we can match to Fishbowl)
  customerId?: string;                 // Link to fishbowl_customers
  
  // Copper sync tracking
  copperOpportunityId?: number;        // Link to Copper Pipeline Record
  copperCompanyId?: number;            // Link to Copper Account
  lastSyncedToCopperAt?: Date;
  syncStatus?: 'pending' | 'synced' | 'error';
  syncError?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  source: 'shipstation';
}

// ----------------------------------------------------------------------------
// PRODUCTS (from Fishbowl)
// Collection: 'products'
// Document ID: Product SKU (string)
// ----------------------------------------------------------------------------

export interface Product {
  // Primary key
  id: string;                          // SKU
  sku: string;                         // Same as id
  
  // Basic info
  name: string;
  description?: string;
  category?: string;
  
  // Pricing
  price?: number;
  cost?: number;
  
  // Inventory
  quantityOnHand?: number;
  quantityAvailable?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  source: 'fishbowl';
}

// ----------------------------------------------------------------------------
// SYNC LOG
// Collection: 'sync_log'
// Document ID: Auto-generated
// ----------------------------------------------------------------------------

export interface SyncLog {
  id: string;
  
  // Sync info
  syncType: 'fishbowl_to_firestore' | 'firestore_to_copper' | 'shipstation_to_firestore';
  status: 'started' | 'completed' | 'failed';
  
  // Stats
  recordsProcessed?: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  recordsFailed?: number;
  
  // Error tracking
  errors?: Array<{
    recordId: string;
    error: string;
  }>;
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  
  // Metadata
  triggeredBy?: string; // User ID or 'system'
  metadata?: Record<string, any>;
}

// ============================================================================
// FIRESTORE COLLECTIONS MAP
// ============================================================================

export const FIRESTORE_COLLECTIONS = {
  // Existing collections
  users: 'users',
  goals: 'goals',
  metrics: 'metrics',
  settings: 'settings',
  
  // New data warehouse collections
  fishbowlCustomers: 'fishbowl_customers',
  fishbowlSalesOrders: 'fishbowl_sales_orders',
  shipstationShipments: 'shipstation_shipments',
  products: 'products',
  syncLog: 'sync_log',
} as const;

// ============================================================================
// HELPER TYPES
// ============================================================================

export type SyncStatus = 'pending' | 'synced' | 'error';
export type DataSource = 'fishbowl' | 'shipstation' | 'copper' | 'justcall' | 'manual';

// ============================================================================
// AGGREGATED VIEWS (Computed from collections)
// ============================================================================

/**
 * Customer 360 View
 * Aggregates data from multiple sources for a complete customer view
 */
export interface Customer360 {
  // From fishbowl_customers
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  
  // Aggregated from fishbowl_sales_orders
  totalOrders: number;
  totalSpent: number;
  firstOrderDate?: Date;
  lastOrderDate?: Date;
  averageOrderValue: number;
  
  // Aggregated from shipstation_shipments
  totalShipments: number;
  totalShippingCost: number;
  lastShippedDate?: Date;
  
  // Copper link
  copperCompanyId?: number;
  
  // Computed
  lifetimeValue: number;
  customerSince?: Date;
  daysSinceLastOrder?: number;
}

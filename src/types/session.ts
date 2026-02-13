/**
 * Session Type Definitions
 *
 * Type aliases and interfaces for working with RTC sessions.
 * These types are derived from the database schema and provide
 * type-safe access to session data.
 */

import { Database } from '@/integrations/supabase/types.gen';

// ==================
// ENUM TYPE ALIASES
// ==================

/**
 * Session type: chat, audio, or video
 */
export type SessionType = Database['public']['Enums']['session_type'];

/**
 * Session status: pending, active, completed, cancelled
 */
export type SessionStatus = Database['public']['Enums']['session_status'];

/**
 * Billing status: pending, processing, completed, failed, refunded
 */
export type BillingStatus = Database['public']['Enums']['billing_status'];

/**
 * Connection quality: excellent, good, poor, lost
 */
export type ConnectionQuality = Database['public']['Enums']['connection_quality'];

// ==================
// DATABASE TYPES
// ==================

/**
 * Session row from database
 */
export type Session = Database['public']['Tables']['sessions']['Row'];

/**
 * Session insert type (for creating new sessions)
 */
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];

/**
 * Session update type (for updating existing sessions)
 */
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

// ==================
// SESSION METADATA
// ==================

/**
 * Interface for session_metadata JSONB field
 * Stores connection statistics, quality events, and custom data
 */
export interface SessionMetadata {
  // Connection statistics
  avgLatency?: number; // Average latency in ms
  packetLoss?: number; // Packet loss percentage (0-100)
  jitter?: number; // Jitter in ms

  // Quality change events
  qualityChanges?: Array<{
    timestamp: string;
    quality: ConnectionQuality;
    reason?: string; // Optional reason for quality change
  }>;

  // Disconnection events
  disconnections?: Array<{
    timestamp: string;
    duration: number; // Duration in seconds
    reason?: string; // Optional reason for disconnection
  }>;

  // User actions during session
  mutedAt?: string[]; // Timestamps when user muted
  unmutedAt?: string[]; // Timestamps when user unmuted

  // Device information
  device?: {
    browser?: string;
    os?: string;
    audioCodec?: string;
    videoCodec?: string;
  };

  // Custom data (flexible)
  [key: string]: any;
}

// ==================
// FRONTEND STATE
// ==================

/**
 * Active session state for frontend components
 * Used during an ongoing session to track real-time state
 */
export interface ActiveSession {
  sessionId: string;
  advisorId: string;
  advisorName: string;
  type: SessionType;
  startTime: Date;
  elapsedSeconds: number;
  ratePerMinute: number;
  freeMinutes: number;
  creditsUsed: number;
  billingStatus: BillingStatus;
  connectionQuality: ConnectionQuality;
}

/**
 * Session summary for displaying in history/lists
 * Calculated from database session record
 */
export interface SessionSummary {
  id: string;
  advisorName: string;
  type: SessionType;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
  durationMinutes: number;
  costTotal: number;
  billingStatus: BillingStatus;
}

// ==================
// RPC FUNCTION TYPES
// ==================

/**
 * Arguments for start_rtc_session RPC function
 */
export interface StartSessionArgs {
  p_client_id: string;
  p_advisor_id: string;
  p_type: SessionType;
  p_rate_per_minute: number;
  p_free_minutes?: number;
}

/**
 * Arguments for end_rtc_session RPC function
 */
export interface EndSessionArgs {
  p_session_id: string;
  p_billable_minutes: number;
  p_connection_quality?: ConnectionQuality;
}

/**
 * Arguments for update_billing_status RPC function
 */
export interface UpdateBillingStatusArgs {
  p_session_id: string;
  p_billing_status: BillingStatus;
}

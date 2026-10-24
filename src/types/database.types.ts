export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'citizen' | 'municipal_official' | 'sanitation_worker';

export type ComplaintCategory =
  | 'garbage_dump'
  | 'overflowing_bin'
  | 'dead_animal'
  | 'sewage_overflow'
  | 'construction_debris'
  | 'open_defecation'
  | 'drainage_blockage'
  | 'hazardous_waste'
  | 'other';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolution_submitted'
  | 'resolved'
  | 'rejected'
  | 'reopened'
  | 'cancelled';

export type AssignmentStatus =
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'reassigned'
  | 'cancelled';

export type EventStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

export type ParticipantStatus = 'registered' | 'attended' | 'cancelled';

export type Database = {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: AppRole;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: AppRole;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone_number: string | null;
          ward_number: number | null;
          locality: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone_number?: string | null;
          ward_number?: number | null;
          locality?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone_number?: string | null;
          ward_number?: number | null;
          locality?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          complaint_id: string;
          reporter_id: string | null;
          is_anonymous: boolean;
          category: ComplaintCategory;
          priority: ComplaintPriority;
          status: ComplaintStatus;
          description: string;
          latitude: number;
          longitude: number;
          address_locality: string;
          landmark: string | null;
          ward_number: number;
          rejection_reason: string | null;
          metadata: Json;
          submitted_at: string;
          resolved_at: string | null;
          reopened_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          complaint_id?: string;
          reporter_id?: string | null;
          is_anonymous?: boolean;
          category: ComplaintCategory;
          priority?: ComplaintPriority;
          status?: ComplaintStatus;
          description: string;
          latitude: number;
          longitude: number;
          address_locality: string;
          landmark?: string | null;
          ward_number: number;
          rejection_reason?: string | null;
          metadata?: Json;
          submitted_at?: string;
          resolved_at?: string | null;
          reopened_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          complaint_id?: string;
          reporter_id?: string | null;
          is_anonymous?: boolean;
          category?: ComplaintCategory;
          priority?: ComplaintPriority;
          status?: ComplaintStatus;
          description?: string;
          latitude?: number;
          longitude?: number;
          address_locality?: string;
          landmark?: string | null;
          ward_number?: number;
          rejection_reason?: string | null;
          metadata?: Json;
          submitted_at?: string;
          resolved_at?: string | null;
          reopened_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      report_media: {
        Row: {
          id: string;
          report_id: string;
          storage_path: string;
          file_size_bytes: number;
          mime_type: string;
          media_type: string;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          storage_path: string;
          file_size_bytes: number;
          mime_type: string;
          media_type?: string;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          storage_path?: string;
          file_size_bytes?: number;
          mime_type?: string;
          media_type?: string;
          uploaded_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      assignments: {
        Row: {
          id: string;
          report_id: string;
          worker_id: string;
          assigned_by: string;
          status: AssignmentStatus;
          assigned_at: string;
          started_at: string | null;
          completed_at: string | null;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          worker_id: string;
          assigned_by: string;
          status?: AssignmentStatus;
          assigned_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          worker_id?: string;
          assigned_by?: string;
          status?: AssignmentStatus;
          assigned_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      report_status_history: {
        Row: {
          id: string;
          report_id: string;
          previous_status: ComplaintStatus | null;
          new_status: ComplaintStatus;
          actor_id: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          previous_status?: ComplaintStatus | null;
          new_status: ComplaintStatus;
          actor_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          previous_status?: ComplaintStatus | null;
          new_status?: ComplaintStatus;
          actor_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      resolution_evidence: {
        Row: {
          id: string;
          report_id: string;
          assignment_id: string | null;
          worker_id: string;
          storage_path: string;
          file_size_bytes: number;
          mime_type: string;
          notes: string;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          assignment_id?: string | null;
          worker_id: string;
          storage_path: string;
          file_size_bytes: number;
          mime_type: string;
          notes: string;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          assignment_id?: string | null;
          worker_id?: string;
          storage_path?: string;
          file_size_bytes?: number;
          mime_type?: string;
          notes?: string;
          submitted_at?: string;
        };
        Relationships: [];
      };
      report_feedback: {
        Row: {
          id: string;
          report_id: string;
          citizen_id: string;
          rating: number;
          comments: string | null;
          is_satisfied: boolean;
          needs_reopening: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          citizen_id: string;
          rating: number;
          comments?: string | null;
          is_satisfied?: boolean;
          needs_reopening?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          citizen_id?: string;
          rating?: number;
          comments?: string | null;
          is_satisfied?: boolean;
          needs_reopening?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      cleanup_events: {
        Row: {
          id: string;
          title: string;
          description: string;
          location_name: string;
          latitude: number;
          longitude: number;
          ward_number: number;
          scheduled_start: string;
          scheduled_end: string;
          organizer_id: string;
          status: EventStatus;
          max_volunteers: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          location_name: string;
          latitude: number;
          longitude: number;
          ward_number: number;
          scheduled_start: string;
          scheduled_end: string;
          organizer_id: string;
          status?: EventStatus;
          max_volunteers?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          location_name?: string;
          latitude?: number;
          longitude?: number;
          ward_number?: number;
          scheduled_start?: string;
          scheduled_end?: string;
          organizer_id?: string;
          status?: EventStatus;
          max_volunteers?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_participants: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: ParticipantStatus;
          registered_at: string;
          attended_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: ParticipantStatus;
          registered_at?: string;
          attended_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: ParticipantStatus;
          registered_at?: string;
          attended_at?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      vw_overdue_reports: {
        Row: {
          id: string;
          complaint_id: string;
          category: ComplaintCategory;
          priority: ComplaintPriority;
          status: ComplaintStatus;
          ward_number: number;
          address_locality: string;
          submitted_at: string;
          sla_target_interval: unknown;
          age_interval: unknown;
          is_overdue: boolean;
        };
        Relationships: [];
      };
    };
    Functions: {
      transition_report_status: {
        Args: {
          p_report_id: string;
          p_new_status: ComplaintStatus;
          p_note?: string;
          p_rejection_reason?: string;
        };
        Returns: Database['public']['Tables']['reports']['Row'];
      };
      assign_report: {
        Args: {
          p_report_id: string;
          p_worker_id: string;
          p_notes?: string;
        };
        Returns: Database['public']['Tables']['assignments']['Row'];
      };
      track_complaint: {
        Args: {
          p_complaint_id: string;
        };
        Returns: {
          complaint_id: string;
          category: ComplaintCategory;
          status: ComplaintStatus;
          priority: ComplaintPriority;
          ward_number: number;
          address_locality: string;
          submitted_at: string;
          resolved_at: string | null;
          reopened_at: string | null;
        }[];
      };
    };
    Enums: {
      app_role: AppRole;
      complaint_category: ComplaintCategory;
      complaint_priority: ComplaintPriority;
      complaint_status: ComplaintStatus;
      assignment_status: AssignmentStatus;
      event_status: EventStatus;
      participant_status: ParticipantStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

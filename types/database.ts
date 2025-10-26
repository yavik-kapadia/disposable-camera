export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          access_code: string
          creator_name: string | null
          is_active: boolean
          expires_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          access_code: string
          creator_name?: string | null
          is_active?: boolean
          expires_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          access_code?: string
          creator_name?: string | null
          is_active?: boolean
          expires_at?: string | null
        }
      }
      images: {
        Row: {
          id: string
          created_at: string
          event_id: string
          file_path: string
          file_name: string
          uploaded_by: string | null
          caption: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          event_id: string
          file_path: string
          file_name: string
          uploaded_by?: string | null
          caption?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          event_id?: string
          file_path?: string
          file_name?: string
          uploaded_by?: string | null
          caption?: string | null
          metadata?: Json | null
        }
      }
    }
  }
}

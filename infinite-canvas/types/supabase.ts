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
      boards: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      images: {
        Row: {
          id: string
          board_id: string
          src: string
          x: number
          y: number
          prompt: string
          type: string
          version: number
          base_prompt: string | null
          prompt_history: Json[]
          group_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          src: string
          x: number
          y: number
          prompt: string
          type: string
          version: number
          base_prompt?: string | null
          prompt_history?: Json[]
          group_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          src?: string
          x?: number
          y?: number
          prompt?: string
          type?: string
          version?: number
          base_prompt?: string | null
          prompt_history?: Json[]
          group_id?: string | null
          created_at?: string
        }
      }
      texts: {
        Row: {
          id: string
          board_id: string
          content: string
          x: number
          y: number
          font_size: string | null
          group_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          content: string
          x: number
          y: number
          font_size?: string | null
          group_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          content?: string
          x?: number
          y?: number
          font_size?: string | null
          group_id?: string | null
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          board_id: string
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          created_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}


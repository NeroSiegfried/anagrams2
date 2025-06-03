export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      games: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          is_active: boolean
          is_multiplayer: boolean
          base_word: string | null
          letters: string
          duration_seconds: number
          max_players: number
          game_code: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          is_multiplayer?: boolean
          base_word?: string | null
          letters: string
          duration_seconds?: number
          max_players?: number
          game_code?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          is_multiplayer?: boolean
          base_word?: string | null
          letters?: string
          duration_seconds?: number
          max_players?: number
          game_code?: string | null
        }
      }
      game_participants: {
        Row: {
          id: string
          game_id: string
          user_id: string | null
          username: string
          joined_at: string
          left_at: string | null
          is_guest: boolean
        }
        Insert: {
          id?: string
          game_id: string
          user_id?: string | null
          username: string
          joined_at?: string
          left_at?: string | null
          is_guest?: boolean
        }
        Update: {
          id?: string
          game_id?: string
          user_id?: string | null
          username?: string
          joined_at?: string
          left_at?: string | null
          is_guest?: boolean
        }
      }
      scores: {
        Row: {
          id: string
          game_id: string
          user_id: string | null
          username: string
          score: number
          words_found: number
          words_list: string[]
          completed_at: string
          is_guest: boolean
        }
        Insert: {
          id?: string
          game_id: string
          user_id?: string | null
          username: string
          score: number
          words_found: number
          words_list: string[]
          completed_at?: string
          is_guest?: boolean
        }
        Update: {
          id?: string
          game_id?: string
          user_id?: string | null
          username?: string
          score?: number
          words_found?: number
          words_list?: string[]
          completed_at?: string
          is_guest?: boolean
        }
      }
      leaderboards: {
        Row: {
          id: string
          user_id: string
          username: string
          best_score: number
          total_games: number
          total_words_found: number
          average_score: number
          last_played: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          best_score: number
          total_games?: number
          total_words_found?: number
          average_score?: number
          last_played?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          best_score?: number
          total_games?: number
          total_words_found?: number
          average_score?: number
          last_played?: string
          created_at?: string
        }
      }
      words: {
        Row: {
          id: string
          word: string
          length: number
          is_common: boolean
          definition: string | null
          canonical_form: string | null
          created_at: string
        }
        Insert: {
          id?: string
          word: string
          length: number
          is_common?: boolean
          definition?: string | null
          canonical_form?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          word?: string
          length?: number
          is_common?: boolean
          definition?: string | null
          canonical_form?: string | null
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

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our database tables
export type Tables = {
  users: {
    Row: {
      id: string;
      email: string;
      name: string;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Tables['users']['Insert']>;
  };
  exercises: {
    Row: {
      id: string;
      name: string;
      description: string | null;
      category: string;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['exercises']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Tables['exercises']['Insert']>;
  };
  workouts: {
    Row: {
      id: string;
      user_id: string;
      name: string;
      date: string;
      notes: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['workouts']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Tables['workouts']['Insert']>;
  };
  sets: {
    Row: {
      id: string;
      workout_id: string;
      exercise_id: string;
      weight: number;
      reps: number;
      set_number: number;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['sets']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Tables['sets']['Insert']>;
  };
  meals: {
    Row: {
      id: string;
      user_id: string;
      date: string;
      name: string;
      notes: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['meals']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Tables['meals']['Insert']>;
  };
  nutrition_entries: {
    Row: {
      id: string;
      meal_id: string;
      food: string;
      weight: number;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['nutrition_entries']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Tables['nutrition_entries']['Insert']>;
  };
  workout_exercises: {
    Row: {
      id: string;
      workout_id: string;
      exercise_id: string;
      sets: number | null;
      reps: number | null;
      weight: number | null;
      duration: number | null;
      distance: number | null;
      notes: string | null;
      completed: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['workout_exercises']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Tables['workout_exercises']['Insert']>;
  };
}; 
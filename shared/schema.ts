import { z } from 'zod';

// Users schema
export const insertUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

// Exercises schema
export const insertExerciseSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  category: z.string().min(1),
});

// Workouts schema
export const insertWorkoutSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(1),
  date: z.string().datetime(),
  notes: z.string().nullable(),
});

// Sets schema
export const insertSetSchema = z.object({
  workout_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  weight: z.number().positive(),
  reps: z.number().positive(),
  set_number: z.number().positive(),
});

// Meals schema
export const insertMealSchema = z.object({
  user_id: z.string().uuid(),
  date: z.string().datetime(),
  name: z.string().min(1),
  notes: z.string().nullable(),
});

// Nutrition Entries schema
export const insertNutritionEntrySchema = z.object({
  meal_id: z.string().uuid(),
  food: z.string().min(1),
  weight: z.number().positive(),
  calories: z.number().positive(),
  protein: z.number().positive(),
  carbs: z.number().positive(),
  fats: z.number().positive(),
});

// Workout Exercises schema
export const insertWorkoutExerciseSchema = z.object({
  workout_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  sets: z.number().positive().nullable(),
  reps: z.number().positive().nullable(),
  weight: z.number().positive().nullable(),
  duration: z.number().positive().nullable(),
  distance: z.number().positive().nullable(),
  notes: z.string().nullable(),
  completed: z.boolean().default(false),
});

// Types based on the schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type InsertSet = z.infer<typeof insertSetSchema>;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type InsertNutritionEntry = z.infer<typeof insertNutritionEntrySchema>;
export type InsertWorkoutExercise = z.infer<typeof insertWorkoutExerciseSchema>; 
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tables } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { ExerciseForm } from "@/components/workout/ExerciseForm";
import { ExerciseList } from "@/components/workout/ExerciseList";
import { SetEntry } from "@/components/workout/SetEntry";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { insertWorkoutSchema, insertSetSchema } from "@shared/schema";
import { ZodError } from "zod";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Exercise = Tables["exercises"]["Row"];
type Workout = Tables["workouts"]["Row"];
type Set = Tables["sets"]["Row"];

type WorkoutWithSets = Workout & {
  sets: (Set & { exercise: Exercise })[];
};

type ActiveExercise = {
  exercise: Exercise;
  sets: Array<{ id?: string; weight: number; reps: number; set_number: number }>;
};

export default function LogWorkout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [existingWorkoutId, setExistingWorkoutId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Check authentication status
  const { data: session, isLoading: loadingAuth } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!loadingAuth && !session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to log your workouts.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [session, loadingAuth, navigate]);

  // Fetch workouts with their sets and exercises (filtered by user)
  const { data: workouts, isLoading: loadingWorkouts } = useQuery({
    queryKey: ["/api/workouts", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("No authenticated user");

      const { data: workoutsData, error: workoutsError } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", session.user.id)
        .order("date", { ascending: false });

      if (workoutsError) throw workoutsError;

      const workoutsWithSets = await Promise.all(
        workoutsData.map(async (workout) => {
          const { data: setsData, error: setsError } = await supabase
            .from("sets")
            .select("*, exercise:exercises(*)")
            .eq("workout_id", workout.id);

          if (setsError) throw setsError;

          return {
            ...workout,
            sets: setsData,
          };
        })
      );

      return workoutsWithSets as WorkoutWithSets[];
    },
    enabled: !!session?.user?.id,
  });

  // Fetch available exercises
  const { data: exercises, isLoading: loadingExercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Delete workout mutation
  const deleteWorkoutMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("id", workoutId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Success",
        description: "Workout deleted successfully",
      });
    },
  });

  // Create exercise mutation
  const createExerciseMutation = useMutation({
    mutationFn: async (data: { name: string; description: string | null; category: string }) => {
      const { data: exercise, error } = await supabase
        .from("exercises")
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return exercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast({
        title: "Success",
        description: "Exercise created successfully"
      });
    }
  });

  const loadWorkout = (workout: WorkoutWithSets) => {
    setExistingWorkoutId(workout.id);
    setNotes(workout.notes || "");
    
    const exerciseMap = new Map<string, ActiveExercise>();
    
    workout.sets.forEach(set => {
      const existing = exerciseMap.get(set.exercise.id);
      if (existing) {
        existing.sets.push({
          id: set.id,
          weight: set.weight,
          reps: set.reps,
          set_number: set.set_number
        });
      } else {
        exerciseMap.set(set.exercise.id, {
          exercise: set.exercise,
          sets: [{
            id: set.id,
            weight: set.weight,
            reps: set.reps,
            set_number: set.set_number
          }]
        });
      }
    });
    
    setActiveExercises(Array.from(exerciseMap.values()));
  };

  // Create/Update workout mutation
  const createWorkoutMutation = useMutation({
    mutationFn: async () => {
      try {
        // Delete existing sets if updating
        if (existingWorkoutId) {
          const { error: deleteError } = await supabase
            .from("sets")
            .delete()
            .eq("workout_id", existingWorkoutId);
          
          if (deleteError) throw deleteError;
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error("No authenticated user");

        // Create or update workout
        const workoutData: Tables["workouts"]["Insert"] = {
          name: `Workout ${format(selectedDate, 'PPP')}`,
          notes: notes || null,
          date: selectedDate.toISOString(),
          user_id: user.id,
        };

        // Validate workout data
        const validatedWorkoutData = insertWorkoutSchema.parse(workoutData);

        let workoutId = existingWorkoutId;

        if (existingWorkoutId) {
          const { error: updateError } = await supabase
            .from("workouts")
            .update(validatedWorkoutData)
            .eq("id", existingWorkoutId)
            .eq("user_id", user.id); // Ensure user can only update their own workouts
          
          if (updateError) throw updateError;
        } else {
          const { data: workout, error: createError } = await supabase
            .from("workouts")
            .insert(validatedWorkoutData)
            .select()
            .single();
          
          if (createError) throw createError;
          if (!workout) throw new Error("Failed to create workout");
          workoutId = workout.id;
        }

        // Create new sets
        if (!workoutId) throw new Error("No workout ID available");

        // Filter out sets with zero weight or reps
        const validSets = activeExercises.flatMap((active) =>
          active.sets
            .filter(set => set.weight > 0 && set.reps > 0)
            .map((set, idx) => ({
              workout_id: workoutId,
              exercise_id: active.exercise.id,
              weight: set.weight,
              reps: set.reps,
              set_number: idx + 1,
            }))
        );

        if (validSets.length === 0) {
          throw new Error("Please add at least one set with valid weight and reps");
        }

        // Validate each set
        const validatedSets = validSets.map(set => insertSetSchema.parse(set));

        const { error: setsError } = await supabase
          .from("sets")
          .insert(validatedSets);
        
        if (setsError) throw setsError;
      } catch (error) {
        if (error instanceof ZodError) {
          throw new Error("Invalid data format. Please check your input.");
        }
        if (error instanceof Error && 'code' in error) {
          // Handle Supabase errors
          const code = (error as { code: string }).code;
          switch (code) {
            case '23503':
              throw new Error("Referenced record does not exist.");
            case '23505':
              throw new Error("A record with this data already exists.");
            default:
              throw new Error(`Database error: ${error.message}`);
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Success",
        description: "Workout logged successfully",
      });
      resetForm();
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setExistingWorkoutId(null);
    setNotes("");
    setActiveExercises([]);
  };

  const handleAddExercise = (exercise: Exercise) => {
    if (!activeExercises.some((e) => e.exercise.id === exercise.id)) {
      setActiveExercises([...activeExercises, { exercise, sets: [] }]);
    }
  };

  const handleAddSet = (exerciseId: string, weight: number, reps: number) => {
    setActiveExercises((prev) =>
      prev.map((active) => {
        if (active.exercise.id === exerciseId) {
          const newSetNumber = active.sets.length + 1;
          return {
            ...active,
            sets: [
              ...active.sets,
              { weight, reps, set_number: newSetNumber },
            ],
          };
        }
        return active;
      })
    );
  };

  const handleRemoveSet = (exerciseId: string, setIndex: number) => {
    setActiveExercises(
      activeExercises.map((active) =>
        active.exercise.id === exerciseId
          ? {
              ...active,
              sets: active.sets.filter((_, idx) => idx !== setIndex).map((set, idx) => ({
                ...set,
                set_number: idx + 1
              })),
            }
          : active,
      ),
    );
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setActiveExercises(
      activeExercises.filter((active) => active.exercise.id !== exerciseId),
    );
  };

  const addDefaultExercises = async () => {
    const defaultExercises = [
      // Upper Body
      { name: "Bench Press", description: "Barbell chest press on a flat bench", category: "upper_body" },
      { name: "Overhead Press", description: "Standing barbell press for shoulders", category: "upper_body" },
      { name: "Pull-ups", description: "Bodyweight back and bicep exercise", category: "upper_body" },
      { name: "Dumbbell Rows", description: "Single-arm back exercise with dumbbells", category: "upper_body" },
      // Lower Body
      { name: "Squats", description: "Barbell squat for legs and core", category: "lower_body" },
      { name: "Deadlifts", description: "Compound exercise for posterior chain", category: "lower_body" },
      { name: "Lunges", description: "Walking or stationary lunges for legs", category: "lower_body" },
      { name: "Calf Raises", description: "Standing calf raises for lower legs", category: "lower_body" },
      // Cardio
      { name: "Running", description: "Outdoor or treadmill running", category: "cardio" },
      { name: "Cycling", description: "Stationary bike or outdoor cycling", category: "cardio" },
      { name: "Jump Rope", description: "High-intensity cardio workout", category: "cardio" },
      { name: "Rowing", description: "Full-body cardio on rowing machine", category: "cardio" }
    ];

    for (const exercise of defaultExercises) {
      const { error } = await supabase
        .from("exercises")
        .insert(exercise)
        .select()
        .single();
      
      if (error && error.code !== "23505") { // Ignore unique constraint violations
        console.error("Error adding default exercise:", error);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["exercises"] });
  };

  // Call addDefaultExercises when the component mounts if there are no exercises
  useEffect(() => {
    if (exercises && exercises.length === 0) {
      addDefaultExercises();
    }
  }, [exercises]);

  if (loadingAuth || loadingWorkouts || loadingExercises) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Log Workout</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              New Exercise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Exercise</DialogTitle>
            </DialogHeader>
            <ExerciseForm onSubmit={(data) => createExerciseMutation.mutate(data)} isSubmitting={createExerciseMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Workout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(selectedDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Textarea
                placeholder="Workout notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />

              {activeExercises.map((active) => (
                <Card key={active.exercise.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {active.exercise.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExercise(active.exercise.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <SetEntry
                      sets={active.sets}
                      onAddSet={(weight, reps) =>
                        handleAddSet(active.exercise.id, weight, reps)
                      }
                      onRemoveSet={(index) =>
                        handleRemoveSet(active.exercise.id, index)
                      }
                    />
                  </CardContent>
                </Card>
              ))}

              <Button
                className="w-full"
                onClick={() => createWorkoutMutation.mutate()}
                disabled={createWorkoutMutation.isPending}
              >
                {createWorkoutMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {existingWorkoutId ? "Update Workout" : "Save Workout"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingExercises ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : exercises ? (
                <ExerciseList 
                  exercises={exercises} 
                  onSelectExercise={(exercise) => handleAddExercise(exercise)}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Previous Workouts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingWorkouts ? (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                workouts?.map((workout) => (
                  <div key={workout.id} className="flex gap-2">
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => loadWorkout(workout)}
                    >
                      <span>{format(parseISO(workout.date), 'PPP')}</span>
                      <span>{workout.sets.length} sets</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this workout?')) {
                          deleteWorkoutMutation.mutate(workout.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

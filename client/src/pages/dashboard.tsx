import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Tables } from "@/lib/supabase";
import { WorkoutSummary } from "@/components/workout/WorkoutSummary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, PlusCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

type Exercise = Tables["exercises"]["Row"];
type Workout = Tables["workouts"]["Row"];
type Set = Tables["sets"]["Row"];

type WorkoutWithSets = Workout & {
  sets: (Set & { exercise: Exercise })[];
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

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
        description: "Please sign in to view your workouts.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [session, loadingAuth, navigate]);

  const { data: workouts, isLoading } = useQuery<WorkoutWithSets[]>({
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

  if (loadingAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const safeWorkouts = workouts || [];

  // Group workouts by date
  const workoutsByDate = safeWorkouts.reduce((acc, workout) => {
    const dateKey = format(new Date(workout.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = workout;
    } else {
      // Combine sets from workouts on the same day
      acc[dateKey] = {
        ...acc[dateKey],
        sets: [...acc[dateKey].sets, ...workout.sets],
        notes: acc[dateKey].notes 
          ? `${acc[dateKey].notes}\n${workout.notes || ''}`
          : workout.notes
      };
    }
    return acc;
  }, {} as Record<string, WorkoutWithSets>);

  // Get the most recent workouts (one per day)
  const recentWorkouts = Object.values(workoutsByDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Calculate statistics
  const totalWorkouts = Object.keys(workoutsByDate).length;
  const totalSets = safeWorkouts.reduce((acc, workout) => 
    acc + workout.sets.length, 0);
  const averageSetsPerWorkout = totalWorkouts ? Math.round(totalSets / totalWorkouts) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/log">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Workout
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Days Trained</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkouts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sets</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sets/Day</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSetsPerWorkout}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Recent Workouts</h2>
        {recentWorkouts.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <p>No workouts logged yet.</p>
                <Link href="/log">
                  <Button variant="link">Start logging your first workout</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recentWorkouts.map((workout) => (
              <WorkoutSummary key={workout.id} workout={workout} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
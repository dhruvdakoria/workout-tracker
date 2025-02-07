import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Tables } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Exercise = Tables["exercises"]["Row"];
type Workout = Tables["workouts"]["Row"];
type Set = Tables["sets"]["Row"];

type WorkoutWithSets = Workout & {
  sets: (Set & { exercise: Exercise })[];
};

export default function Progress() {
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
        description: "Please sign in to view your progress.",
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

  // Calculate monthly workout frequency
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const workoutFrequency = daysInMonth.map((date) => ({
    date: format(date, "MMM d"),
    workouts: workouts?.filter((w) =>
      format(new Date(w.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"),
    ).length || 0,
  }));

  // Calculate total volume per exercise
  const exerciseVolume = workouts?.reduce((acc, workout) => {
    workout.sets.forEach((set) => {
      const existing = acc.find((e) => e.name === set.exercise.name);
      const volume = set.weight * set.reps;
      
      if (existing) {
        existing.volume += volume;
      } else {
        acc.push({
          name: set.exercise.name,
          volume,
          category: set.exercise.category,
        });
      }
    });
    return acc;
  }, [] as Array<{ name: string; volume: number; category: string }>) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Progress</h1>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Workout Frequency</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workoutFrequency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval={6}
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="workouts" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Volume by Exercise</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={exerciseVolume}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="volume"
                fill="hsl(var(--primary))"
                name="Total Volume (Weight × Reps)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

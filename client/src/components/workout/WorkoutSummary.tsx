import { Tables } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

type Exercise = Tables["exercises"]["Row"];
type Workout = Tables["workouts"]["Row"];
type Set = Tables["sets"]["Row"];

type WorkoutWithSets = Workout & {
  sets: (Set & { exercise: Exercise })[];
};

type WorkoutSummaryProps = {
  workout: WorkoutWithSets;
};

export function WorkoutSummary({ workout }: WorkoutSummaryProps) {
  const exercises = workout.sets.reduce((acc: Array<{
    id: string;
    name: string;
    sets: Array<{ weight: number; reps: number; setNumber: number; }>;
  }>, set) => {
    const existing = acc.find(e => e.id === set.exercise.id);
    if (!existing) {
      acc.push({
        id: set.exercise.id,
        name: set.exercise.name,
        sets: [{
          weight: set.weight,
          reps: set.reps,
          setNumber: set.set_number
        }]
      });
    } else {
      existing.sets.push({
        weight: set.weight,
        reps: set.reps,
        setNumber: set.set_number
      });
    }
    return acc;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Workout on {format(new Date(workout.date), "PPP")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {exercises.map(exercise => (
          <div key={exercise.id} className="mb-4">
            <h3 className="text-lg font-medium mb-2">{exercise.name}</h3>
            <div className="space-y-2">
              {exercise.sets.map((set, idx) => (
                <div key={idx} className="flex gap-4 text-sm">
                  <span>Set {set.setNumber}</span>
                  <span>{set.weight} lbs</span>
                  <span>{set.reps} reps</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {workout.notes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">{workout.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

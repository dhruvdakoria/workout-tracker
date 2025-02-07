import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tables } from "@/lib/supabase";

type Exercise = Tables["exercises"]["Row"];

const categoryEmojis = {
  upper_body: "💪",
  lower_body: "🦵",
  cardio: "🏃‍♂️",
};

const getCategoryDisplay = (category: string) => {
  const emoji = categoryEmojis[category as keyof typeof categoryEmojis] || "🏋️‍♂️";
  const displayName = category.split("_").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
  return `${emoji} ${displayName}`;
};

interface ExerciseListProps {
  exercises: Exercise[];
  onSelectExercise: (exercise: Exercise) => void;
}

export function ExerciseList({ exercises, onSelectExercise }: ExerciseListProps) {
  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        {exercises.map((exercise) => (
          <Button
            key={exercise.id}
            variant="outline"
            className="w-full justify-between h-auto py-3"
            onClick={() => onSelectExercise(exercise)}
          >
            <span className="flex items-center gap-2">
              <span className="font-medium">{exercise.name}</span>
              <span className="text-muted-foreground text-sm">
                {getCategoryDisplay(exercise.category)}
              </span>
            </span>
            <Plus className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </div>
  );
} 
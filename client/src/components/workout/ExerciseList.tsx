import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tables } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Exercise = Tables["exercises"]["Row"];

const categoryEmojis = {
  upper_body: "💪",
  lower_body: "🦵",
  cardio: "🏃‍♂️",
};

const categoryOrder = ["upper_body", "lower_body", "cardio"];

const getCategoryDisplay = (category: string) => {
  const emoji = categoryEmojis[category as keyof typeof categoryEmojis] || "🏋️‍♂️";
  const displayName = category.split("_").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
  return { emoji, displayName };
};

interface ExerciseListProps {
  exercises: Exercise[];
  onSelectExercise: (exercise: Exercise) => void;
}

export function ExerciseList({ exercises, onSelectExercise }: ExerciseListProps) {
  // Group exercises by category
  const exercisesByCategory = exercises.reduce((acc, exercise) => {
    const category = exercise.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  return (
    <div className="space-y-6">
      {categoryOrder.map((category) => {
        const categoryExercises = exercisesByCategory[category];
        if (!categoryExercises?.length) return null;
        
        const { emoji, displayName } = getCategoryDisplay(category);
        
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <span className="text-xl">{emoji}</span>
              <h3 className="font-semibold text-lg">{displayName}</h3>
            </div>
            <div className="grid gap-2">
              {categoryExercises.map((exercise) => (
                <Button
                  key={exercise.id}
                  variant="outline"
                  className={cn(
                    "w-full justify-between h-auto py-3 px-4 hover:bg-accent/50 transition-colors",
                    "group relative overflow-hidden"
                  )}
                  onClick={() => onSelectExercise(exercise)}
                >
                  <div className="flex items-center gap-2 z-10 relative">
                    <span className="font-medium">{exercise.name}</span>
                    {exercise.description && (
                      <span className="text-xs text-muted-foreground hidden group-hover:inline-block">
                        {exercise.description}
                      </span>
                    )}
                  </div>
                  <Plus className="h-4 w-4 z-10 relative shrink-0" />
                </Button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
} 
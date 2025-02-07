import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

type Set = {
  id?: string;
  weight: number;
  reps: number;
  set_number: number;
};

export type SetEntryProps = {
  sets: Set[];
  onAddSet: (weight: number, reps: number) => void;
  onRemoveSet: (index: number) => void;
};

export function SetEntry({ sets, onAddSet, onRemoveSet }: SetEntryProps) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    
    if (!isNaN(weightNum) && !isNaN(repsNum)) {
      onAddSet(weightNum, repsNum);
      // Keep the weight the same but clear reps for easy multiple set entry
      setReps("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Sets */}
      {sets.map((set, index) => (
        <div
          key={set.id || index}
          className="flex items-center justify-between p-2 rounded-md bg-muted/30"
        >
          <div className="flex gap-4">
            <span className="text-sm text-muted-foreground">Set {set.set_number}</span>
            <span>{set.weight} lbs × {set.reps} reps</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveSet(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* New Set Form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block text-muted-foreground">
            Weight (lbs)
          </label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            min="0"
            step="0.5"
            placeholder={sets[sets.length - 1]?.weight?.toString() || "0"}
            required
            className="bg-background/50 border-muted"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block text-muted-foreground">
            Reps
          </label>
          <Input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            min="1"
            placeholder={sets[sets.length - 1]?.reps?.toString() || "0"}
            required
            className="bg-background/50 border-muted"
          />
        </div>
        <Button type="submit" size="icon" variant="secondary" className="mb-0.5">
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

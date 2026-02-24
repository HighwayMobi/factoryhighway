import { Check, Circle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Task {
  id: number;
  text: string;
  done: boolean;
  tag: string;
}

const initialTasks: Task[] = [
  { id: 1, text: "Review quarterly goals", done: false, tag: "Planning" },
  { id: 2, text: "Update portfolio website", done: true, tag: "Creative" },
  { id: 3, text: "Read chapter 5 of design book", done: false, tag: "Learning" },
  { id: 4, text: "Respond to pending emails", done: false, tag: "Admin" },
  { id: 5, text: "Prepare weekly review notes", done: false, tag: "Planning" },
];

const tagColors: Record<string, string> = {
  Planning: "bg-primary/10 text-primary",
  Creative: "bg-accent/10 text-accent",
  Learning: "bg-secondary text-secondary-foreground",
  Admin: "bg-muted text-muted-foreground",
};

const TaskList = () => {
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display text-lg text-card-foreground">Today's Tasks</h3>
      <div className="mt-4 space-y-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
          >
            <div
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                task.done
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {task.done && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
            <span
              className={cn(
                "flex-1 text-sm",
                task.done && "text-muted-foreground line-through"
              )}
            >
              {task.text}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", tagColors[task.tag])}>
              {task.tag}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TaskList;

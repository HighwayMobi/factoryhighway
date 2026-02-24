import { cn } from "@/lib/utils";

interface ActivityItem {
  id: number;
  action: string;
  time: string;
  category: string;
}

const activities: ActivityItem[] = [
  { id: 1, action: "Completed morning meditation", time: "8:00 AM", category: "Wellness" },
  { id: 2, action: "Finished reading 20 pages", time: "9:30 AM", category: "Learning" },
  { id: 3, action: "Submitted project proposal", time: "11:15 AM", category: "Work" },
  { id: 4, action: "30-minute workout session", time: "1:00 PM", category: "Fitness" },
  { id: 5, action: "Journal entry written", time: "9:00 PM", category: "Personal" },
];

const ActivityFeed = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display text-lg text-card-foreground">Recent Activity</h3>
      <div className="mt-4 space-y-4">
        {activities.map((item, idx) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="relative flex flex-col items-center">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              {idx < activities.length - 1 && (
                <div className="mt-1 h-8 w-px bg-border" />
              )}
            </div>
            <div className="flex-1 -mt-1">
              <p className="text-sm text-card-foreground">{item.action}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{item.time}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{item.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;

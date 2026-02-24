import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import TaskList from "@/components/TaskList";
import ActivityFeed from "@/components/ActivityFeed";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const Index = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 px-8 py-8 lg:px-12">
        <header className="mb-8">
          <h1 className="font-display text-3xl text-foreground">{getGreeting()}</h1>
          <p className="mt-1 text-muted-foreground">Here's what's happening today.</p>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Tasks Done" value="12" subtitle="of 18 this week" accent />
          <StatCard title="Streak" value="7 days" subtitle="Keep it going!" />
          <StatCard title="Focus Time" value="4.5h" subtitle="Today's total" />
          <StatCard title="Notes" value="23" subtitle="3 added this week" />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TaskList />
          <ActivityFeed />
        </section>
      </main>
    </div>
  );
};

export default Index;

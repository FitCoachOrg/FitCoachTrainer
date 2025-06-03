import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as Icons from "@/lib/icons";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import TrainingCalendar from "@/components/training/TrainingCalendar";

interface ClientDashboardProps {
  clientId: string;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ clientId }) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Mock data - replace with real data from your API
  const metrics = {
    lastWeek: { completed: 3, total: 3 },
    lastMonth: { completed: 4, total: 4 },
    nextWeek: { assigned: 2 },
    weight: {
      current: 74.4,
      change: -0.4,
      history: [/* Add weight history data */]
    },
    sleep: {
      current: { hours: 6, minutes: 57 },
      history: [/* Add sleep history data */]
    },
    heartRate: {
      current: 66,
      change: -5.7,
      history: [/* Add heart rate history data */]
    },
    steps: {
      current: 8381,
      history: [/* Add steps history data */]
    }
  };

  const clientInfo = {
    name: "Ben yoyoajfoiasnsdikosandas Andrew",
    email: "ben@demo",
    location: "AmericaLos,Angeles",
    timezone: "5:16 AM",
    goal: "Run a marathon without stopping to walk",
    upcomingEvent: {
      name: "10km City2Surf Fun Run",
      target: "in under 50m!",
      daysLeft: 36
    },
    notes: [
      { text: "Need program while traveling for 2 weeks", date: "May 19 - 3:56 PM" }
    ],
    limitations: [
      { text: "Leg injury last year", date: "May 5 - 3:56 PM" },
      { text: "Ben did a couple of physical therapy sessions in July 2018", date: "May 5 - 3:56 PM" }
    ],
    progressPhotos: [
      { date: "04/30", url: "/progress-1.jpg" },
      { date: "12/30", url: "/progress-2.jpg" }
    ]
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="w-full flex items-center gap-3 px-4 h-14 border-b bg-white dark:bg-slate-900">
        <span className="text-lg font-semibold">{clientInfo.name}</span>
        <span className="text-sm text-muted-foreground ml-2">{clientInfo.location}</span>
      </div>

      <Tabs defaultValue="overview" className="p-6 w-full">
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="food-journal">Food Journal</TabsTrigger>
          <TabsTrigger value="macros">Macros</TabsTrigger>
          <TabsTrigger value="meal-plan">Meal Plan</TabsTrigger>
          <TabsTrigger value="on-demand">On-demand</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="flex w-full gap-6">
            {/* Left: All Clients (sidebar) */}
            <div className="min-w-[250px] max-w-xs w-full">
              {/* TODO: Insert All Clients list component here if you have one */}
            </div>
            {/* Right: Client Details (main panel) */}
            <div className="flex-1 w-full">
              <div className="mb-6 w-full">
                <h2 className="text-lg font-semibold mb-4">Training</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        LAST 7 DAYS
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metrics.lastWeek.completed}/{metrics.lastWeek.total}
                      </div>
                      <p className="text-sm text-muted-foreground">Tracked</p>
                    </CardContent>
                  </Card>
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        LAST 30 DAYS
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metrics.lastMonth.completed}/{metrics.lastMonth.total}
                      </div>
                      <p className="text-sm text-muted-foreground">Tracked</p>
                    </CardContent>
                  </Card>
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        NEXT WEEK
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metrics.nextWeek.assigned}
                      </div>
                      <p className="text-sm text-muted-foreground">Assigned</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="mb-6 w-full">
                <CardHeader>
                  <CardTitle>Body Metrics Overview</CardTitle>
                  <div className="text-sm text-muted-foreground">Last 4 weeks</div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div>
                      <div className="mb-2">
                        <span className="text-2xl font-bold">{metrics.weight.current}</span>
                        <span className="text-sm ml-1">kg</span>
                        <span className={`text-sm ml-2 ${metrics.weight.change < 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {metrics.weight.change}%
                        </span>
                      </div>
                      <div className="h-[100px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={metrics.weight.history}>
                            <Line type="monotone" dataKey="value" stroke="#8884d8" />
                            <XAxis dataKey="date" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2">
                        <span className="text-2xl font-bold">{metrics.sleep.current.hours}h {metrics.sleep.current.minutes}min</span>
                      </div>
                      <div className="h-[100px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={metrics.sleep.history}>
                            <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                            <XAxis dataKey="date" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 w-full">
              <Card className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Goal & Countdown</CardTitle>
                    <Badge>Shared with client</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-medium mb-2">General Goal</h3>
                  <p className="text-sm text-muted-foreground mb-4">{clientInfo.goal}</p>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icons.FlameIcon className="w-5 h-5 text-orange-500" />
                      <span className="font-medium">{clientInfo.upcomingEvent.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{clientInfo.upcomingEvent.target}</p>
                    <div className="mt-2 text-sm">
                      <span className="font-bold">{clientInfo.upcomingEvent.daysLeft}</span>
                      <span className="text-muted-foreground ml-1">Days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Notes</CardTitle>
                    <Button variant="ghost" size="sm">
                      <Icons.PencilIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {clientInfo.notes.map((note, i) => (
                      <li key={i} className="text-sm">
                        <p>{note.text}</p>
                        <p className="text-muted-foreground text-xs">{note.date}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Limitations/Injuries</CardTitle>
                    <Button variant="ghost" size="sm">
                      <Icons.PencilIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {clientInfo.limitations.map((limitation, i) => (
                      <li key={i} className="text-sm">
                        <p>{limitation.text}</p>
                        <p className="text-muted-foreground text-xs">{limitation.date}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Progress Photo</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">View All</Button>
                      <Button variant="ghost" size="sm">Compare</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    {clientInfo.progressPhotos.map((photo, i) => (
                      <div key={i}>
                        <img src={photo.url} alt={`Progress ${photo.date}`} className="w-full h-32 object-cover rounded-lg" />
                        <p className="text-center text-sm mt-2">{photo.date}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="training">
          <div className="space-y-6 w-full">
            <TrainingCalendar clientId={clientId} />
          </div>
        </TabsContent>

        {/* Add other tab contents */}
      </Tabs>
    </div>
  );
};

export default ClientDashboard; 
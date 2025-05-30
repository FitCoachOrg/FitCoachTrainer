import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import * as Icons from "@/lib/icons";
import { useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Mock data
const clients = [
  { name: "Sarah Johnson", score: 72, progress: 60 },
  { name: "Tom Lee", score: 65, progress: 40 },
  { name: "Emily Smith", score: 80, progress: 90 },
  { name: "John Doe", score: 60, progress: 30 },
];

const averageScore =
  clients.reduce((sum, c) => sum + c.score, 0) / clients.length;
const belowAverage = clients.filter((c) => c.score < averageScore);

const AverageClientScoreCard = () => {
  const [, navigate] = useLocation();
  
  // Dummy progress data for the line graph
  const progressData = [
    { week: "W1", progress: 10 },
    { week: "W2", progress: 30 },
    { week: "W3", progress: 50 },
    { week: "W4", progress: 70 },
    { week: "W5", progress: 90 },
  ];

  return (
    <Card className="bg-white dark:bg-black shadow-sm">
      <CardHeader>
        <CardTitle>Average Client Score</CardTitle>
        <div className="text-3xl font-bold text-blue-800 dark:text-blue-600">
          {averageScore.toFixed(1)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Clients below average and their weekly progress:
        </div>
        {belowAverage.length === 0 ? (
          <div className="text-green-600 dark:text-green-400 text-sm">All clients are above average!</div>
        ) : (
          <ul className="space-y-3">
            {belowAverage.map((client) => (
              <li key={client.name} className="group relative">
                <div className="flex flex-col">
                  <span className="font-medium text-">{client.name}</span>
                  <span className="text-xs text-gray-400 mb-1">Score: {client.score}</span>
                  <Progress value={client.progress} className="h-2" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Weekly Progress: {client.progress}%</span>
                </div>

                {/* Dropdown below client item */}
                <div className="absolute left-0 right-0 top-full mt-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
                    <div className="h-32 w-full mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <XAxis dataKey="week" hide />
                          <YAxis domain={[0, 100]} hide />
                          <Tooltip />
                          <Line type="monotone" dataKey="progress" stroke="#2563eb" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate("/nutrition-plans")}>
                        <Icons.UtensilsIcon className="mr-2 h-4 w-4" />
                        Nutritional Plan
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate("/fitness-plans")}>
                        <Icons.DumbbellIcon className="mr-2 h-4 w-4" />
                        Fitness Plan
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                      >
                        <Icons.PencilIcon className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                      >
                        <Icons.UserIcon className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AverageClientScoreCard; 
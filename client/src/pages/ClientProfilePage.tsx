import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  Ruler,
  Weight,
  MapPin,
  Edit,
  MoreHorizontal,
  Activity,
  Target,
  TrendingUp,
  Clock,
  ArrowLeft,
} from "lucide-react"

// Sample client data
const sampleClient = {
  id: "1",
  trainerId: 1,
  name: "Sarah Johnson",
  email: "sarah.johnson@example.com",
  avatarUrl: "/placeholder.svg?height=120&width=120",
  phone: "+1 (555) 123-4567",
  username: "sarah_j",
  height: 165,
  weight: 62,
  dob: "1992-03-15",
  genderName: "Female",
  isActive: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  location: "New York, NY",
  goals: ["Weight Loss", "Muscle Toning", "Endurance"],
  membershipType: "Premium",
}

const sampleClients = [
  {
    client_id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    client_id: "2",
    name: "Mike Chen",
    email: "mike.chen@example.com",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    client_id: "3",
    name: "Emma Wilson",
    email: "emma.wilson@example.com",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    status: "pending",
  },
  {
    client_id: "4",
    name: "David Brown",
    email: "david.brown@example.com",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
]

const ClientStats = () => {
  const stats = [
    { label: "Workouts Completed", value: "47", icon: Activity, color: "text-green-600" },
    { label: "Goals Achieved", value: "3", icon: Target, color: "text-blue-600" },
    { label: "Progress Score", value: "85%", icon: TrendingUp, color: "text-purple-600" },
    { label: "Days Active", value: "127", icon: Clock, color: "text-orange-600" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card
            key={index}
            className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-black"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-50 dark:bg-gray-800 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

const  ClientDashboard = ({ clientId }: { clientId: string }) => {
  return (
    <div className="space-y-6">
      <ClientStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { activity: "Completed Upper Body Workout", time: "2 hours ago", type: "workout" },
                { activity: "Updated nutrition log", time: "1 day ago", type: "nutrition" },
                { activity: "Achieved weekly goal", time: "3 days ago", type: "goal" },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.type === "workout"
                        ? "bg-green-500"
                        : item.type === "nutrition"
                          ? "bg-blue-500"
                          : "bg-purple-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.activity}</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Goals Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleClient.goals.map((goal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{goal}</span>
                    <span className="text-sm text-gray-500">{Math.floor(Math.random() * 40) + 60}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ClientProfilePage() {
  const [client, setClient] = useState(sampleClient)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("1")

  const filteredClients = sampleClients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    // In real app, fetch client data here
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Loading client profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Client</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Enhanced Client List Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                    All Clients
                  </CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {filteredClients.length}
                  </Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200/60 focus:border-blue-300 focus:ring-blue-200/50 dark:bg-neutral-700"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {filteredClients.map((c) => (
                    <button
                      key={c.client_id}
                      onClick={() => handleClientSelect(c.client_id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                        c.client_id === selectedClientId
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-500 shadow-md dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                        <AvatarImage src={c.avatarUrl || "/placeholder.svg"} alt={c.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-semibold truncate">{c.name}</div>
                        {c.email && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.email}</div>}
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${c.status === "active" ? "bg-green-500" : "bg-yellow-500"}`}
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Main Content */}
          <div className="flex-1 space-y-6">
            {/* Enhanced Profile Header */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden dark:bg-black">
              <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-32 relative">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-4 right-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
              <CardContent className="relative pt-0 pb-6">
                <div className="flex flex-col md:flex-row items-start gap-6 -mt-16">
                  <Avatar className="h-32 w-32 ring-4 ring-white shadow-2xl">
                    <AvatarImage src={client.avatarUrl || "/placeholder.svg"} alt={client.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold">
                      {client.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 pt-16 md:pt-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 mt-2">{client.name}</h1>
                        {client.username && <p className="text-gray-500 dark:text-gray-400 mb-3">@{client.username}</p>}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                            {client.membershipType}
                          </Badge>
                          <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                            Active Member
                          </Badge>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    <Separator className="my-4" />

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Born {new Date(client.dob).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.height} cm</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.weight} kg</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.location}</span>
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-gray-400">
                      Member since {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Dashboard */}
            <ClientDashboard clientId={client.id} />
          </div>
        </div>
      </div>
    </div>
  )
}

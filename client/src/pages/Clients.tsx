import type React from "react"
import { useState, useEffect } from "react"
import { useClients, MappedClient } from "@/hooks/use-clients"
import { useAuth } from "@/hooks/use-auth"
import ClientProfileModal from "@/components/clients/ClientProfileModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Client } from "@shared/schema"
import ClientForm from "@/components/clients/ClientForm"
import * as Icons from "@/lib/icons"
import { useToast } from "@/hooks/use-toast"
import { SidebarProvider, SidebarContent } from "@/components/ui/sidebar"
import { useNavigate } from "react-router-dom"

const STATUS_FILTERS = [
  { label: "All Clients", value: "all" },
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Inactive", value: "inactive" }
]

// Helper function to calculate days since last activity
const getDaysSinceActivity = (lastActivity: string | null) => {
  if (!lastActivity) return 999; // Return a large number for no activity
  const today = new Date()
  const activityDate = new Date(lastActivity)
  const diffTime = Math.abs(today.getTime() - activityDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Helper function to get activity status color
const getActivityStatusColor = (days: number) => {
  if (days <= 3) return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30"
  if (days <= 5) return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30"
  return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30"
}

// Progress bar component
const ProgressBar: React.FC<{ value: number; className?: string }> = ({ value, className = "" }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 ${className}`}>
    <div
      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
)

const Clients: React.FC = () => {
  const { trainerId, isLoading: isAuthLoading } = useAuth()
  const { clients, isLoading: isClientsLoading, error } = useClients(trainerId || undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClient, setSelectedClient] = useState<MappedClient | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()
  const navigate = useNavigate()

  // Get filter from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const filter = params.get('filter')
    
    if (filter && STATUS_FILTERS.some(f => f.value === filter)) {
      setStatusFilter(filter)
    }
  }, [])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    
    if (statusFilter === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', statusFilter)
    }
    
    navigate(`?${params.toString()}`, { replace: true })
  }, [statusFilter, navigate])

  if (isAuthLoading || isClientsLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!trainerId) {
    return (
      <div className="text-center py-12">
        <Icons.AlertTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-lg font-semibold">Authentication Error</h3>
        <p className="text-gray-500 dark:text-gray-400">Please log in to view your clients.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Icons.AlertTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-lg font-semibold">Error Loading Clients</h3>
        <p className="text-gray-500 dark:text-gray-400">{error.message}</p>
      </div>
    )
  }

  const filteredClients = clients?.filter((client) => {
    // Search filter
    const matchesSearch =
      client.cl_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.cl_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.cl_username.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const daysSinceActivity = getDaysSinceActivity(client.last_active)
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && daysSinceActivity <= 3) ||
      (statusFilter === "pending" && client.status === "pending") ||
      (statusFilter === "inactive" && daysSinceActivity > 7)

    return matchesSearch && matchesStatus
  }) || []

  const handleViewProfile = (client: MappedClient) => {
    setSelectedClient(client)
    setIsProfileModalOpen(true)
  }

  const handleEdit = (client: MappedClient) => {
    setSelectedClient(client)
    setIsFormModalOpen(true)
  }

  const handleAddNew = () => {
    setSelectedClient(null)
    setIsFormModalOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormModalOpen(false)
    toast({
      title: selectedClient ? "Client updated" : "Client added",
      description: selectedClient
        ? "The client has been successfully updated."
        : "The client has been successfully added.",
    })
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-[#f8f9fb] via-[#f0f4f9] to-[#e8f2ff] dark:from-black dark:via-slate-900 dark:to-slate-800">
        {/* Enhanced Sidebar Filters */}
        <aside className="w-64 bg-white/90 backdrop-blur-sm border-r border-gray-200/70 flex flex-col py-6 px-4 dark:bg-black/90 dark:border-gray-800/70 dark:text-white shadow-lg">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            <Icons.UsersIcon className="h-5 w-5 text-blue-500" /> Clients
          </h2>
          <nav className="flex-1">
            <ul className="space-y-2">
              {STATUS_FILTERS.map((filter) => (
                <li key={filter.value}>
                  <button
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      statusFilter === filter.value
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-500 shadow-md dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400 dark:border-blue-400"
                        : "text-gray-700 hover:bg-gray-100/70 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-800/50"
                    }`}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    <span>{filter.label}</span>
                    <span
                      className={`text-xs font-semibold rounded-full px-2.5 py-1 ml-2 ${
                        statusFilter === filter.value
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {filter.value === "all"
                        ? clients?.length || 0
                        : clients?.filter(c => {
                            if (filter.value === "active") return getDaysSinceActivity(c.last_active) <= 3;
                            if (filter.value === "pending") return c.status === "pending";
                            if (filter.value === "inactive") return getDaysSinceActivity(c.last_active) > 7;
                            return false;
                          }).length || 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <SidebarContent>
          <div className="max-w-8xl mx-auto w-full pt-8 px-6">
            {/* Enhanced Header and Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
                  All Clients ({filteredClients.length})
                </h1>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <Icons.SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-200/50 shadow-sm hover:shadow-md transition-all duration-200 dark:bg-slate-900/80 dark:border-gray-700 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  />
                </div>
                <Button
                  onClick={handleAddNew}
                  className="ml-2 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 px-6 h-11"
                >
                  <Icons.PlusIcon className="h-4 w-4 mr-2" /> Add Client
                </Button>
              </div>
            </div>

            {/* Enhanced Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 dark:bg-slate-900/90 dark:border-gray-800/50 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-gray-50/80 to-blue-50/30 dark:from-slate-800/80 dark:to-slate-700/30">
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Last Activity
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Goals
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Experience
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Icons.SearchIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            No clients found
                          </h3>
                          <p className="text-gray-500 dark:text-gray-500 mb-6">Try adjusting your search or filters</p>
                          <Button
                            onClick={handleAddNew}
                            variant="outline"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <Icons.PlusIcon className="h-4 w-4 mr-2" /> Add New Client
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client, index) => {
                      const daysSinceActivity = getDaysSinceActivity(client.last_active)
                      const activityColorClass = getActivityStatusColor(daysSinceActivity)

                      return (
                        <tr
                          key={client.client_id}
                          className={`${
                            index % 2 === 0 ? "bg-gray-50/40 dark:bg-slate-800/20" : "bg-white/40 dark:bg-slate-900/20"
                          } hover:bg-blue-50/70 dark:hover:bg-blue-900/20 transition-all duration-200 cursor-pointer border-b border-gray-100/50 dark:border-gray-800/50 group`}
                          onClick={() => navigate(`/client/${client.client_id}`)}
                        >
                          <td className="flex items-center gap-4 px-6 py-5 whitespace-nowrap">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-700 group-hover:shadow-xl transition-shadow duration-200">
                              {client.cl_pic ? (
                                <img
                                  src={client.cl_pic}
                                  alt={client.cl_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                                  {client.cl_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-base">
                                {client.cl_name}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {client.cl_email}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${
                                daysSinceActivity <= 3 ? 'bg-green-500 animate-pulse' : 
                                daysSinceActivity <= 5 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                              <span className={`font-medium ${
                                daysSinceActivity <= 3 ? 'text-green-700 dark:text-green-400' : 
                                daysSinceActivity <= 5 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'
                              }`}>
                                {daysSinceActivity === 999 ? 'Never' : `${daysSinceActivity}d ago`}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${activityColorClass}`}>
                              {daysSinceActivity <= 3 ? 'Active' : daysSinceActivity <= 5 ? 'Moderate' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {client.cl_primary_goal || 'Not set'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {client.training_experience || 'Not specified'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Client Profile Modal */}
            <ClientProfileModal
              client={selectedClient}
              open={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
            />
            {/* Client Form Modal */}
            <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedClient ? "Edit Client" : "Add New Client"}</DialogTitle>
                </DialogHeader>
                {trainerId && (
                  <ClientForm 
                    client={selectedClient ?? undefined} 
                    onSuccess={handleFormSuccess} 
                    trainerId={trainerId} 
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </SidebarContent>
      </div>
    </SidebarProvider>
  )
}

export default Clients
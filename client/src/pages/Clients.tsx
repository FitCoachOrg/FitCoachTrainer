import type React from "react"

import { useState } from "react"
import { useClients } from "@/hooks/use-clients"
import ClientProfileModal from "@/components/clients/ClientProfileModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Client } from "@shared/schema"
import ClientForm from "@/components/clients/ClientForm"
import * as Icons from "@/lib/icons"
import { useToast } from "@/hooks/use-toast"
import { SidebarProvider, SidebarContent } from "@/components/ui/sidebar"
import { useLocation } from "wouter"

const STATUS_FILTERS = [
  { label: "All Clients", value: "all" },
  { label: "Connected", value: "connected" },
  { label: "Pending", value: "pending" },
  { label: "Offline", value: "offline" },
  { label: "Waiting Activation", value: "waiting" },
  { label: "Need Programming", value: "need_programming" },
  { label: "Archived", value: "archived" },
]

const Clients: React.FC = () => {
  const { clients, isLoading, error } = useClients(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()
  const [, navigate] = useLocation()

  const filteredClients = clients?.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
    // Placeholder: all clients are 'connected' for now
    const matchesStatus = statusFilter === "all" || statusFilter === "connected"
    return matchesSearch && matchesStatus
  })

  const handleViewProfile = (client: Client) => {
    setSelectedClient(client)
    setIsProfileModalOpen(true)
  }

  const handleEdit = (client: Client) => {
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
    window.location.reload()
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
                        : filter.value === "connected"
                          ? clients?.length || 0
                          : 0}
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
                  All Clients ({filteredClients?.length || 0})
                </h1>
                <div className="flex gap-3 flex-wrap">
                  <select
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 dark:bg-black/80 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                    title="Category"
                  >
                    <option>Category: All</option>
                  </select>
                  <select
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 dark:bg-black/80 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                    title="Status"
                  >
                    <option>Status: All</option>
                  </select>
                  <select
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 dark:bg-black/80 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                    title="Last Activity"
                  >
                    <option>Last Activity</option>
                  </select>
                  <select
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 dark:bg-black/80 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                    title="Last Assigned Workout"
                  >
                    <option>Last Assigned Workout</option>
                  </select>
                  <button className="text-blue-600 text-sm font-medium ml-2 hover:text-blue-800 transition-colors dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    Hide filters
                  </button>
                </div>
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
                      Last 7d Training
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Last 30d Training
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Last 7d Tasks
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Engagement Score
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Nutritional Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading clients...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredClients && filteredClients.length > 0 ? (
                    filteredClients.map((client, index) => (
                      <tr
                        key={client.client_id}
                        className={`${
                          index % 2 === 0 ? "bg-gray-50/40 dark:bg-slate-800/20" : "bg-white/40 dark:bg-slate-900/20"
                        } hover:bg-blue-50/70 dark:hover:bg-blue-900/20 transition-all duration-200 cursor-pointer border-b border-gray-100/50 dark:border-gray-800/50 group`}
                        onClick={() => navigate(`/client/${client.client_id}`)}
                      >
                        <td className="flex items-center gap-4 px-6 py-5 whitespace-nowrap">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-700 group-hover:shadow-xl transition-shadow duration-200">
                            {client.avatarUrl ? (
                              <img
                                src={client.avatarUrl || "/placeholder.svg"}
                                alt={client.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                                {client.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                            )}
                          </div>
                          <span
                            className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-base"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/client/${client.client_id}`)
                            }}
                          >
                            {client.name}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">5d</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                                style={{ width: "100%" }}
                              ></div>
                            </div>
                            <span className="text-green-600 dark:text-green-400 font-semibold text-sm">100%</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                                style={{ width: "100%" }}
                              ></div>
                            </div>
                            <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">100%</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: "100%" }}
                              ></div>
                            </div>
                            <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm">100%</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                            Online
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                            Connected
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-center">80</p>
                        </td>
                        <td className="px-6 py-5">
                         <p className="text-center">60</p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
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
                <ClientForm client={selectedClient ?? undefined} onSuccess={handleFormSuccess} trainerId={1} />
              </DialogContent>
            </Dialog>
          </div>
        </SidebarContent>
      </div>
    </SidebarProvider>
  )
}

export default Clients

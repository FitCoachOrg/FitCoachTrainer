import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useClients } from "@/hooks/use-clients"
import { supabase } from "@/lib/supabase"
import type { client } from "@/lib/database.types"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import * as Icons from "@/lib/icons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ClientProfileModalProps {
  client:
    | (client & {
        program: {
          program_id: number
          program_name: string
        } | null
      })
    | null
  onClose: () => void
}

export default function ClientProfileModal({ client, onClose }: ClientProfileModalProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("details")
  const { deleteClient } = useClients(() => {
    onClose()
  })

  if (!client) return null

  function handleNavigate() {
    if (client) {
      navigate(`/client/${client.client_id}`)
      onClose()
    }
  }

  async function handleDelete() {
    if (client) {
      await deleteClient(client.client_id)
    }
  }

  return (
    <Dialog open={!!client} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Client profile</DialogTitle>
          <DialogDescription>
            View and manage client information
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="details">Client details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                {client.avatar_url ? (
                  <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  <Icons.UserIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{client.name}</h3>
                <p className="text-gray-500 dark:text-gray-400">Client ID: {client.client_id}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default">{client.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Goals
              </h4>
              <p className="text-sm">No goals specified</p>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Training Experience
              </h4>
              <p className="text-sm">No experience specified</p>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg mb-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                No documents attached
              </span>
              <Button variant="outline" size="sm">
                <Icons.PaperclipIcon className="mr-2 h-4 w-4" />
                Attach
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="plans">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg mb-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                No plans assigned yet
              </span>
              <Button variant="outline" size="sm">
                <Icons.PlusIcon className="mr-2 h-4 w-4" />
                Assign Plan
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete client
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleNavigate}>
              View Full Profile
            </Button>
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

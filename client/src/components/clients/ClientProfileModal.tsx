import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import * as Icons from "@/lib/icons";
import { useClients, MappedClient } from "@/hooks/use-clients";
import { useLocation } from "wouter";

interface ClientProfileModalProps {
  client: MappedClient | null;
  open: boolean;
  onClose: () => void;
}

const ClientProfileModal: React.FC<ClientProfileModalProps> = ({
  client,
  open,
  onClose,
}) => {
  const { deleteClient } = useClients();
  const [activeTab, setActiveTab] = useState("details");
  const [, navigate] = useLocation();

  if (!client) return null;

  const handleDelete = async () => {
    await deleteClient.mutateAsync(client.client_id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
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
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                {client.cl_pic ? (
                  <img
                    src={client.cl_pic}
                    alt={client.cl_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                    <Icons.UserIcon className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-semibold">{client.cl_name}</h3>
                <p className="text-gray-500 dark:text-gray-400">{client.cl_email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={client.status === 'active' ? "default" : "secondary"}>
                    {client.status}
                  </Badge>
                  {client.cl_phone && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {client.cl_phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Goals
              </h4>
              <p className="text-sm">{client.cl_primary_goal || "No goals specified"}</p>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Training Experience
              </h4>
              <p className="text-sm">{client.training_experience || "No experience specified"}</p>
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
              disabled={!!deleteClient && !!deleteClient.isPending ? deleteClient.isPending : false}
            >
              Delete client
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/client/${client.client_id}`)}>
              View Full Profile
            </Button>
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientProfileModal;

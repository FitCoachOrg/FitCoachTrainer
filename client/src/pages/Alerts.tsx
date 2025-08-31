import { useState } from "react";
import { useAlerts } from "@/hooks/use-alerts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as Icons from "@/lib/icons";
import { useToast } from "@/hooks/use-toast";
import { Alert } from "@shared/schema";

// Create a schema for alert creation
const alertSchema = z.object({
  title: z.string().min(2, "Title is required"),
  message: z.string().min(2, "Message is required"),
  clientId: z.number().nullable().optional(),
});

type AlertFormValues = z.infer<typeof alertSchema>;

const Alerts: React.FC = () => {
  const { alerts, clients, isLoading, markAsRead, createAlert, deleteAlert } = useAlerts();
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<AlertFormValues>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      title: "",
      message: "",
      clientId: null,
    },
  });

  const handleSelectAll = () => {
    if (selectedAlerts.length === alerts?.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alerts?.map(alert => alert.id) || []);
    }
  };

  const handleSelectAlert = (id: number) => {
    if (selectedAlerts.includes(id)) {
      setSelectedAlerts(selectedAlerts.filter(alertId => alertId !== id));
    } else {
      setSelectedAlerts([...selectedAlerts, id]);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      for (const alertId of selectedAlerts) {
        await markAsRead.mutateAsync(alertId);
      }
      toast({
        title: "Alerts marked as read",
        description: `${selectedAlerts.length} alert(s) marked as read.`,
      });
      setSelectedAlerts([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error marking alerts as read.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAlerts = async () => {
    try {
      for (const alertId of selectedAlerts) {
        await deleteAlert.mutateAsync(alertId);
      }
      toast({
        title: "Alerts deleted",
        description: `${selectedAlerts.length} alert(s) deleted successfully.`,
      });
      setSelectedAlerts([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error deleting alerts.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: AlertFormValues) => {
    try {
      await createAlert.mutateAsync({
        trainerId: 1, // In a real app, this would be the logged-in trainer's ID
        ...data,
      });
      toast({
        title: "Alert created",
        description: "The alert has been successfully created.",
      });
      setIsCreateModalOpen(false);
      form.reset({
        title: "",
        message: "",
        clientId: null,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error creating the alert.",
        variant: "destructive",
      });
    }
  };

  const getClientName = (clientId: number | null | undefined) => {
    if (!clientId) return "All Clients";
    return clients?.find(client => client.id === clientId)?.name || "Unknown Client";
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <div className="flex gap-2">
          {selectedAlerts.length > 0 ? (
            <>
              <Button variant="outline" onClick={handleMarkAsRead} disabled={markAsRead.isPending}>
                <Icons.CheckIcon className="h-4 w-4 mr-2" />
                Mark as Read
              </Button>
              <Button variant="destructive" onClick={handleDeleteAlerts} disabled={deleteAlert.isPending}>
                <Icons.TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Icons.PlusIcon className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert Center</CardTitle>
          <CardDescription>
            Manage notifications and alerts for you and your clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md" />
              ))}
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div>
              <div className="flex items-center mb-4">
                <Checkbox
                  id="selectAll"
                  checked={alerts.length > 0 && selectedAlerts.length === alerts.length}
                  onCheckedChange={handleSelectAll}
                />
                <label
                  htmlFor="selectAll"
                  className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Select All
                </label>
              </div>

              <div className="space-y-3">
                {alerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    isSelected={selectedAlerts.includes(alert.id)}
                    onSelect={handleSelectAlert}
                    getClientName={getClientName}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Icons.BellIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-semibold">No alerts</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You're all caught up! There are no alerts at the moment.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Icons.PlusIcon className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Alert Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Alert</DialogTitle>
            <DialogDescription>
              Create a notification for yourself or your clients
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter alert title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter alert message"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Client (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => 
                        field.onChange(value === "all" ? null : parseInt(value))
                      }
                      defaultValue={field.value?.toString() || "all"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || createAlert.isPending}
                >
                  {form.formState.isSubmitting || createAlert.isPending ? (
                    <Icons.Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Create Alert
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface AlertItemProps {
  alert: Alert;
  isSelected: boolean;
  onSelect: (id: number) => void;
  getClientName: (clientId: number | null | undefined) => string;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, isSelected, onSelect, getClientName }) => {
  const { markAsRead, deleteAlert } = useAlerts();
  const { toast } = useToast();

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsRead.mutateAsync(alert.id);
      toast({
        title: "Alert marked as read",
        description: "The alert has been marked as read.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error marking the alert as read.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteAlert.mutateAsync(alert.id);
      toast({
        title: "Alert deleted",
        description: "The alert has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error deleting the alert.",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className={`p-4 rounded-lg border ${
        alert.isRead 
          ? "bg-gray-50 dark:bg-slate-800/50" 
          : "bg-white dark:bg-slate-800 border-primary-200 dark:border-primary-800"
      } cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-slate-700/50`}
      onClick={() => onSelect(alert.id)}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(alert.id)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className={`font-medium ${!alert.isRead ? "text-primary-700 dark:text-primary-300" : ""}`}>
                {alert.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {alert.message}
              </p>
            </div>
            <div className="flex gap-2">
              {!alert.isRead && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleMarkAsRead}
                  className="h-8 w-8"
                >
                  <Icons.CheckIcon className="h-4 w-4" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Icons.MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!alert.isRead && (
                    <DropdownMenuItem onClick={handleMarkAsRead}>
                      <Icons.CheckIcon className="h-4 w-4 mr-2" />
                      Mark as read
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600 dark:text-red-400">
                    <Icons.TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <span className="flex items-center">
              <Icons.UserIcon className="h-3 w-3 mr-1" />
              {getClientName(alert.clientId)}
            </span>
            <span className="mx-2">•</span>
            <span>
              {new Date(alert.createdAt).toLocaleDateString()} at {new Date(alert.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
            {!alert.isRead && (
              <>
                <span className="mx-2">•</span>
                <span className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300">
                  New
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;

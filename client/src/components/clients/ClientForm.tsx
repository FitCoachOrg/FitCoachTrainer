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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Client, InsertClient } from "@shared/schema";
import { useClients } from "@/hooks/use-clients";

const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  goals: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: Client;
  onSuccess: () => void;
  trainerId: number;
}

const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSuccess,
  trainerId,
}) => {
  const { createClient, updateClient } = useClients();
  const isEditing = !!client;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || "",
      email: client?.email || "",
      phone: client?.phone || "",
      goals: client?.goals || "",
      notes: client?.notes || "",
      isActive: client?.isActive ?? true,
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      if (isEditing && client) {
        await updateClient.mutateAsync({
          id: client.id,
          ...data,
        });
      } else {
        await createClient.mutateAsync({
          trainerId,
          ...data,
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving client:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Client name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="client@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="(123) 456-7890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />    

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={createClient.isPending || updateClient.isPending}
          >
            {isEditing ? "Update Client" : "Add Client"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;

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
import { Client } from "@shared/schema";
import { useClients, MappedClient } from "@/hooks/use-clients";

const clientSchema = z.object({
  cl_name: z.string().min(2, "Name must be at least 2 characters"),
  cl_email: z.string().email("Invalid email address"),
  cl_phone: z.string().nullable(),
  cl_username: z.string().min(2, "Username must be at least 2 characters"),
  cl_primary_goal: z.string().nullable(),
  cl_target_weight: z.number().nullable(),
  cl_activity_level: z.string().nullable(),
  specific_outcome: z.string().nullable(),
  goal_timeline: z.string().nullable(),
  obstacles: z.string().nullable(),
  confidence_level: z.number().nullable(),
  training_experience: z.string().nullable(),
  previous_training: z.string().nullable(),
  training_days_per_week: z.number().nullable(),
  training_time_per_session: z.string().nullable(),
  training_location: z.string().nullable(),
  available_equipment: z.array(z.string()).nullable(),
  injuries_limitations: z.string().nullable(),
  focus_areas: z.array(z.string()).nullable(),
  eating_habits: z.string().nullable(),
  diet_preferences: z.array(z.string()).nullable(),
  food_allergies: z.string().nullable(),
  preferred_meals_per_day: z.number().nullable(),
  cl_age: z.number().nullable(),
  cl_sex: z.string().nullable(),
  onboarding_completed: z.boolean().default(false),
  sleep_hours: z.number().nullable(),
  cl_stress: z.string().nullable(),
  cl_alcohol: z.string().nullable(),
  cl_supplements: z.string().nullable(),
  cl_gastric_issues: z.string().nullable(),
  motivation_style: z.string().nullable(),
  cl_pic: z.string().nullable(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: MappedClient;
  onSuccess: () => void;
  trainerId: string;
}

const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSuccess,
  trainerId,
}) => {
  const { createClient, updateClient } = useClients(trainerId);
  const isEditing = !!client;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      cl_name: client?.cl_name || "",
      cl_email: client?.cl_email || "",
      cl_phone: client?.cl_phone || null,
      cl_username: client?.cl_username || "",
      cl_primary_goal: client?.cl_primary_goal || null,
      cl_target_weight: client?.cl_target_weight || null,
      cl_activity_level: client?.cl_activity_level || null,
      specific_outcome: client?.specific_outcome || null,
      goal_timeline: client?.goal_timeline || null,
      obstacles: client?.obstacles || null,
      confidence_level: client?.confidence_level || null,
      training_experience: client?.training_experience || null,
      previous_training: client?.previous_training || null,
      training_days_per_week: client?.training_days_per_week || null,
      training_time_per_session: client?.training_time_per_session || null,
      training_location: client?.training_location || null,
      available_equipment: client?.available_equipment || null,
      injuries_limitations: client?.injuries_limitations || null,
      focus_areas: client?.focus_areas || null,
      eating_habits: client?.eating_habits || null,
      diet_preferences: client?.diet_preferences || null,
      food_allergies: client?.food_allergies || null,
      preferred_meals_per_day: client?.preferred_meals_per_day || null,
      cl_age: client?.cl_age || null,
      cl_sex: client?.cl_sex || null,
      onboarding_completed: client?.onboarding_completed || false,
      sleep_hours: client?.sleep_hours || null,
      cl_stress: client?.cl_stress || null,
      cl_alcohol: client?.cl_alcohol || null,
      cl_supplements: client?.cl_supplements || null,
      cl_gastric_issues: client?.cl_gastric_issues || null,
      motivation_style: client?.motivation_style || null,
      cl_pic: client?.cl_pic || null,
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      if (isEditing && client) {
        await updateClient.mutateAsync({
          client_id: client.client_id,
          ...data,
          status: client.status,
          cl_height: client.cl_height,
          cl_weight: client.cl_weight,
          cl_dob: client.cl_dob,
          cl_gender_name: client.cl_gender_name,
          onboarding_progress: client.onboarding_progress,
          wake_time: client.wake_time,
          bed_time: client.bed_time,
          workout_time: client.workout_time,
          workout_days: client.workout_days,
          bf_time: client.bf_time,
          lunch_time: client.lunch_time,
          dinner_time: client.dinner_time,
          snack_time: client.snack_time,
          last_login: client.last_login,
          last_logout: client.last_logout,
          last_active: client.last_active,
          current_streak: client.current_streak,
          longest_streak: client.longest_streak,
        });
      } else {
        await createClient.mutateAsync({
          trainer_id: trainerId,
          ...data,
          status: 'pending',
          cl_height: null,
          cl_weight: null,
          cl_dob: null,
          cl_gender_name: null,
          onboarding_progress: null,
          wake_time: null,
          bed_time: null,
          workout_time: null,
          workout_days: null,
          bf_time: null,
          lunch_time: null,
          dinner_time: null,
          snack_time: null,
          last_login: null,
          last_logout: null,
          last_active: null,
          current_streak: null,
          longest_streak: null,
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cl_name"
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
            name="cl_username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cl_email"
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
            name="cl_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="(123) 456-7890" 
                    {...field} 
                    value={field.value || ''}
                    onChange={e => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="cl_primary_goal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Goal</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Client's primary fitness goal" 
                  {...field} 
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="training_experience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Training Experience</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Client's training experience" 
                  {...field} 
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value || null)}
                />
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

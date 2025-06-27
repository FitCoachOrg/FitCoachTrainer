import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface ClientProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const ClientProfileModal: React.FC<ClientProfileModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [trainerName, setTrainerName] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch trainer information on component mount
  useEffect(() => {
    async function fetchTrainerInfo() {
      try {
        // Get current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user?.email) {
          console.error("Error fetching session:", sessionError);
          return;
        }

        // Get trainer ID from trainer table
        const { data: trainerData, error: trainerError } = await supabase
          .from("trainer")
          .select("id, trainer_name")
          .eq("trainer_email", session.user.email)
          .single();

        if (trainerError) {
          console.error("Error fetching trainer info:", trainerError);
          return;
        }

        if (trainerData) {
          setTrainerId(trainerData.id);
          setTrainerName(trainerData.trainer_name);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    }

    if (open) {
      fetchTrainerInfo();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!trainerId) {
        throw new Error("Trainer information not available");
      }

      // Get the JWT token from the current session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("Authentication token not available");
      }

      // Call the Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send_client_invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clientEmail: email,
          clientName: name,
          trainerName: trainerName,
          trainerId: trainerId,
          customMessage: customMessage || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      toast({
        title: "Invitation Sent",
        description: "Client invitation has been sent successfully.",
      });

      // Reset form and close modal
      setEmail("");
      setName("");
      setCustomMessage("");
      onClose();
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Client's Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter client's email"
              required
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Client's Name (Optional)
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter client's name"
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Custom Message (Optional)
            </label>
            <Textarea
              id="message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message to your invitation"
              className="w-full min-h-[80px]"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !trainerId}>
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientProfileModal;

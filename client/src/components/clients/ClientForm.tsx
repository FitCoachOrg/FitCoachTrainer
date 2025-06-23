import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ClientFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: "Invitation to FitCoachTrainer",
          text: "You have been invited to join FitCoachTrainer. Click the link below to get started.",
          html: `
            <h2>Welcome to FitCoachTrainer!</h2>
            <p>You have been invited to join our fitness coaching platform.</p>
            <p>Click the link below to get started:</p>
            <a href="http://localhost:5173/signup">Join Now</a>
          `
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      toast({
        title: "Invitation Sent",
        description: "Client invitation has been sent successfully.",
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Invitation"}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;

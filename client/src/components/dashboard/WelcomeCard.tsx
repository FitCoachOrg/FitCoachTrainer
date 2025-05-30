import { Card } from "@/components/ui/card";
import * as Icons from "@/lib/icons";

interface WelcomeCardProps {
  name?: string;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ name = "Coach" }) => {
  return (
    <Card className="bg-white dark:bg-black rounded-xl shadow-sm p-6 mb-6 dark:border-neutral-600 border-black">
      <div className="flex items-start">
        <div className="text-3xl mr-4">
          <Icons.WaveIcon className="h-8 w-8 text-black dark:text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Welcome, {name}!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay organized with smart alerts and modular UI to manage clients effectively. 
            Deliver personalized fitness and nutrition plans effortlessly.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default WelcomeCard;

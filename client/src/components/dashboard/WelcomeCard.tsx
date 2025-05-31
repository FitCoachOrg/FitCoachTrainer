import { Card } from "@/components/ui/card";
import * as Icons from "@/lib/icons";

interface WelcomeCardProps {
  name?: string;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ name = "Coach" }) => {
  return (
    <Card className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md p-8  mb-8 border border-neutral-200 dark:border-neutral-700 transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className="text-4xl">
          <Icons.WaveIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome, <span className="text-green-600 dark:text-green-400">{name}</span>!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Stay organized with smart alerts and a modular UI to manage clients effectively. <br className="hidden sm:block" />
            Deliver personalized fitness and nutrition plans effortlessly.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default WelcomeCard;

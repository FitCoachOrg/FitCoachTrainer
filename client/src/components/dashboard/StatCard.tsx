import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardVariant = "default" | "success" | "warning" | "danger" | "info";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: StatCardVariant;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  variant = "default",
}) => {
  const getVariantStyles = (): { bg: string; text: string } => {
    switch (variant) {
      case "success":
        return {
          bg: "bg-green-100 dark:bg-green-900/30",
          text: "text-green-600 dark:text-green-400",
        };
      case "warning":
        return {
          bg: "bg-amber-100 dark:bg-amber-900/30",
          text: "text-amber-600 dark:text-amber-400",
        };
      case "danger":
        return {
          bg: "bg-rose-100 dark:bg-rose-900/30",
          text: "text-rose-600 dark:text-rose-400",
        };
      case "info":
        return {
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "text-blue-600 dark:text-blue-400",
        };
      default:
        return {
          bg: "bg-gray-100 dark:bg-slate-700/50",
          text: "text-gray-700 dark:text-gray-300",
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl  font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
          <div className={cn("w-8 h-8 flex items-center justify-center rounded-full", variantStyles.bg)}>
            {icon}
          </div>
        </div>
        <p className={cn("text-3xl font-bold", variantStyles.text)}>{value}</p>
      </CardContent>
    </Card>
  );
};

export default StatCard;

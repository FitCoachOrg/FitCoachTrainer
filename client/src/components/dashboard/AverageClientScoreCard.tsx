import { Card } from "@/components/ui/card";
import { usePayments } from "@/hooks/use-payments";
import { useNavigate } from "react-router-dom";
import * as Icons from "@/lib/icons";

const AverageClientScoreCard = () => {
    const { payments, isLoading } = usePayments();
    const navigate = useNavigate();

    const handleNavigation = () => {
        navigate('/payments');
    };

    return (
        <Card className="bg-white dark:bg-black shadow-sm" onClick={handleNavigation}>
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-semibold">Avg. Client Score</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Across all clients</p>
                    </div>
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <Icons.UsersIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                </div>
                {isLoading ? (
                    <div className="h-10 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
                ) : (
                    <p className="text-3xl font-bold">
                        {payments && payments.length > 0
                            ? (payments.reduce((acc, p) => acc + p.amount, 0) / payments.length).toFixed(2)
                            : "N/A"}
                    </p>
                )}
            </div>
        </Card>
    );
};

export default AverageClientScoreCard; 
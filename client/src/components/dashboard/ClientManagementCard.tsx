import React from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsersIcon, ArrowRightIcon } from "lucide-react";

// This is a mock data structure. Replace with your actual client data fetching logic.
const mockClients = [
    { id: 1, name: "Sarah Johnson", lastActivity: "2 days ago", avatar: "/avatars/sarah.png" },
    { id: 2, name: "Mike Chen", lastActivity: "5 days ago", avatar: "/avatars/mike.png" },
    { id: 3, name: "Emma Wilson", lastActivity: "1 day ago", avatar: "/avatars/emma.png" },
];

const ClientManagementCard = () => {
    const navigate = useNavigate();

    const handleNavigation = () => {
        navigate('/clients');
    };

    return (
        <Card className="bg-white dark:bg-black shadow-sm">
            <CardHeader>
                <CardTitle>Client Management</CardTitle>
                <CardDescription>
                    Overview of your clients.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {mockClients.map(client => (
                        <div key={client.id} className="flex items-center">
                            <img src={client.avatar} alt={client.name} className="w-10 h-10 rounded-full mr-4" />
                            <div className="flex-1">
                                <p className="font-semibold">{client.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{client.lastActivity}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={handleNavigation}>
                    View All Clients <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );
};

export default ClientManagementCard;

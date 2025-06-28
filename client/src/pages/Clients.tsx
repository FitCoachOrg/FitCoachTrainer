import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClientProfileModal from "@/components/clients/ClientProfileModal";
import * as Icons from "@/lib/icons";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarContent } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { formatUtcToLocal, getDaysSince, getShortAgo } from "@/lib/utils";
import { getOrCreateEngagementScore } from "@/lib/client-engagement";
import { format } from "date-fns";
import { Tooltip } from "@/components/ui/tooltip";

const STATUS_FILTERS = [
  { label: "All Clients", value: "all" },
];

const Clients: React.FC = () => {
  const [clients, setClients] = useState<{
    client_id: number;
    cl_name: string;
    last_checkIn?: string;
    last_active?: string;
    current_streak?: number | null;
    longest_streak?: number | null;
    active_session?: boolean | null;
    status?: string;
  }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add state for the enhanced UI
  const [selectedClient, setSelectedClient] = useState<{ client_id: number; cl_name: string } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [engagementFilter, setEngagementFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  let clientIds: number[] = [];
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [engagementScores, setEngagementScores] = useState<{ [clientId: number]: number | null }>({});
  const [engagementScores7d, setEngagementScores7d] = useState<{ [clientId: number]: number | null }>({});
  const [engagementScores30d, setEngagementScores30d] = useState<{ [clientId: number]: number | null }>({});

  const [clientImageUrls, setClientImageUrls] = useState<{ [clientId: number]: string | null }>({});
  const [clientStatuses, setClientStatuses] = useState<{ [clientId: number]: string }>({});

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("[DEBUG] Session fetched:", session, sessionError);
        if (sessionError) throw sessionError;
        const authUserId = session?.user?.id;
        const authUserEmail = session?.user?.email;
        console.log("[DEBUG] Auth User ID:", authUserId);
        console.log("[DEBUG] Auth User Email:", authUserEmail);
        if (!authUserEmail) {
          setClients([]);
          setLoading(false);
          console.log("[DEBUG] No auth user email found. Returning empty client list.");
          return;
        }
        // Fetch the trainer row using the email
        const { data: trainerRows, error: trainerError } = await supabase
          .from("trainer")
          .select("id")
          .eq("trainer_email", authUserEmail)
          .limit(1);

        if (trainerError) throw trainerError;
        if (!trainerRows || trainerRows.length === 0) {
          setClients([]);
          setLoading(false);
          
          return;
        }
        const trainerId = trainerRows[0].id;

        // Get client ids and status from trainer_client_web
        const { data: relationshipData, error: relationshipError } = await supabase
          .from("trainer_client_web")
          .select("client_id, status")
          .eq("trainer_id", trainerId);
          
        
        if (relationshipError) throw relationshipError;
        if (!relationshipData || relationshipData.length === 0) {
          setClients([]);
          setLoading(false);
          return;
        }
        clientIds = relationshipData.map((rel) => rel.client_id).filter(Boolean);
        
        // Create status mapping
        const statusMap: { [clientId: number]: string } = {};
        relationshipData.forEach((rel) => {
          if (rel.client_id) {
            statusMap[rel.client_id] = rel.status || 'pending';
          }
        });
        setClientStatuses(statusMap);
        
        // Only proceed if we have valid client IDs
        if (clientIds.length === 0) {
          setClients([]);
          setLoading(false);
          return;
        }
        
        // Get client names and merge with status
        const { data: clientData, error: clientError } = await supabase
          .from("client")
          .select("client_id, cl_name, last_checkIn, last_active, current_streak, longest_streak, active_session")
          .in("client_id", clientIds);
        if (clientError) throw clientError;
        
        // Merge client data with status
        const clientsWithStatus = (clientData || []).map(client => ({
          ...client,
          status: statusMap[client.client_id] || 'pending'
        }));
        setClients(clientsWithStatus);
        
        // --- DEBUG: Log clientIds and all rows in activity_info and meal_info ---
        const { data: allActivity, error: allActivityError } = await supabase
          .from("activity_info")
          .select("client_id,activity,created_at");
        const { data: allMeals, error: allMealsError } = await supabase
          .from("meal_info")
          .select("client_id,calories,protein,carbs,fat,meal_type");
        // --- END DEBUG ---
      } catch (err: any) {
        setError(err.message || "Unknown error");
        console.error("[DEBUG] Error in fetchClients:", err);
      } finally {
        setLoading(false);
      }
      
      // Only query additional tables if we have valid client IDs
      if (clientIds.length > 0) {
        // Try to fetch activity info - handle gracefully if table doesn't exist
        try {
          const { data: activityInfo, error: activityError } = await supabase
            .from("activity_info")
            .select("client_id, last_weight_time, last_excercise_input, last_sleep_info")
            .in("client_id", clientIds);
          if (activityError) {
            console.error("[DEBUG] Error fetching activity info:", activityError);
          }
        } catch (activityErr) {
          console.log("[DEBUG] activity_info table might not exist or have different structure");
        }
        
        // Try to fetch meal info - handle gracefully if table doesn't exist
        try {
          const { data: mealInfo, error: mealError } = await supabase
            .from("meal_info")
            .select("client_id,calories,protein,carbs,fat,meal_type")
            .in("client_id", clientIds);
          if (mealError) {
            console.error("[DEBUG] Error fetching meal info:", mealError);
          }
        } catch (mealErr) {
          console.log("[DEBUG] meal_info table might not exist or have different structure");
        }
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    async function fetchEngagementScoresFromTable() {
      // Get yesterday's date in YYYY-MM-DD
      const now = new Date();
      const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
      const forDate = format(yesterday, "yyyy-MM-dd");
      // For 7d: get 7 days ago to yesterday
      const sevenDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7));
      const forDate7d = format(sevenDaysAgo, "yyyy-MM-dd");
      // For 30d: get 30 days ago to yesterday
      const thirtyDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30));
      const forDate30d = format(thirtyDaysAgo, "yyyy-MM-dd");
      if (clients.length === 0) return;
      // 1d fetch
      const { data, error } = await supabase
        .from("client_engagement_score")
        .select("client_id, eng_score, for_date")
        .in("client_id", clients.map(c => c.client_id))
        .eq("for_date", forDate);
      if (error) {
        console.error("Error fetching engagement scores from table:", error);
        return;
      }
      const scores: { [clientId: number]: number | null } = {};
      (data || []).forEach((row: any) => {
        scores[row.client_id] = row.eng_score;
      });
      setEngagementScores(scores);
      // 7d fetch
      const { data: data7d, error: error7d } = await supabase
        .from("client_engagement_score")
        .select("client_id, eng_score, for_date")
        .in("client_id", clients.map(c => c.client_id))
        .gte("for_date", forDate7d)
        .lte("for_date", forDate);
      if (error7d) {
        console.error("Error fetching 7d engagement scores from table:", error7d);
        return;
      }
      // Group by client and average for 7d
      const scores7d: { [clientId: number]: number | null } = {};
      const grouped7d: { [clientId: number]: number[] } = {};
      (data7d || []).forEach((row: any) => {
        if (!grouped7d[row.client_id]) grouped7d[row.client_id] = [];
        if (typeof row.eng_score === 'number') grouped7d[row.client_id].push(row.eng_score);
      });
      Object.keys(grouped7d).forEach(cid => {
        const arr = grouped7d[Number(cid)];
        if (arr.length > 0) {
          scores7d[Number(cid)] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
        } else {
          scores7d[Number(cid)] = null;
        }
      });
      setEngagementScores7d(scores7d);
      // 30d fetch
      const { data: data30d, error: error30d } = await supabase
        .from("client_engagement_score")
        .select("client_id, eng_score, for_date")
        .in("client_id", clients.map(c => c.client_id))
        .gte("for_date", forDate30d)
        .lte("for_date", forDate);
      if (error30d) {
        console.error("Error fetching 30d engagement scores from table:", error30d);
        return;
      }
      // Group by client and average for 30d
      const scores30d: { [clientId: number]: number | null } = {};
      const grouped30d: { [clientId: number]: number[] } = {};
      (data30d || []).forEach((row: any) => {
        if (!grouped30d[row.client_id]) grouped30d[row.client_id] = [];
        if (typeof row.eng_score === 'number') grouped30d[row.client_id].push(row.eng_score);
      });
      Object.keys(grouped30d).forEach(cid => {
        const arr = grouped30d[Number(cid)];
        if (arr.length > 0) {
          scores30d[Number(cid)] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
        } else {
          scores30d[Number(cid)] = null;
        }
      });
      setEngagementScores30d(scores30d);
    }
    if (clients.length > 0) {
      fetchEngagementScoresFromTable();
    }
  }, [clients]);

  useEffect(() => {
    async function fetchClientImageUrls() {
      if (!clients.length) return;
      const urls: { [clientId: number]: string | null } = {};
      await Promise.all(clients.map(async (client) => {
        const filePath = `${client.client_id}.jpg`;
        const { data, error } = await supabase.storage
          .from('client-images')
          .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
        if (data && data.signedUrl) {
          urls[client.client_id] = data.signedUrl;
        } else {
          urls[client.client_id] = null;
        }
      }));
      setClientImageUrls(urls);
    }
    fetchClientImageUrls();
  }, [clients]);

  // Get filter from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    const engagement = params.get('engagement');
    
    if (filter && STATUS_FILTERS.some(f => f.value === filter)) {
      setStatusFilter(filter);
    }                                                                         
    if (engagement === 'low') {
      setEngagementFilter('low');
    }
  }, []);

  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (statusFilter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', statusFilter);
    }
    
    if (engagementFilter === 'all') {
      params.delete('engagement');
    } else {
      params.set('engagement', engagementFilter);
    }
    
    navigate(`?${params.toString()}`, { replace: true });
  }, [statusFilter, engagementFilter, navigate]);

  // Enhanced filtering logic that works with the existing data structure
  const filteredClients = clients.filter((client) => {
    // Search filter - use cl_name since that's what we have from Supabase
    const matchesSearch = client.cl_name.toLowerCase().includes(searchQuery.toLowerCase());

    // Use actual last_active for activity calculation
    const daysSinceActivity = getDaysSince((client as any).last_active);

    // Status filter
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "inactive" && daysSinceActivity !== null && daysSinceActivity > 7);

    // Engagement score filter (mocked for now)
    const matchesEngagement = true;
    // Outcome score filter (mocked for now)
    const matchesOutcome = true;
    // Activity filter
    const matchesActivity = 
      activityFilter === "all" ||
      (activityFilter === "recent" && daysSinceActivity !== null && daysSinceActivity <= 3) ||
      (activityFilter === "moderate" && daysSinceActivity !== null && daysSinceActivity > 3 && daysSinceActivity <= 7) ||
      (activityFilter === "inactive" && daysSinceActivity !== null && daysSinceActivity > 7);

    return matchesSearch && matchesStatus && matchesEngagement && matchesOutcome && matchesActivity;
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let comparisonResult = 0;
    
    if (sortColumn === 'last_active_ago') {
      const aValue = (a as any).last_active;
      const bValue = (b as any).last_active;
      
      // Handle N/A values - put them at the bottom regardless of sort direction
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1; // a is N/A, send to end
      if (!bValue) return -1; // b is N/A, send to end

      // Convert timestamps to milliseconds for proper comparison
      const nowMs = new Date().getTime();
      const aMs = new Date(aValue.endsWith('Z') ? aValue : `${aValue}Z`).getTime();
      const bMs = new Date(bValue.endsWith('Z') ? bValue : `${bValue}Z`).getTime();
      
      const aDiffMs = nowMs - aMs;
      const bDiffMs = nowMs - bMs;
      
      // More recent activity should have smaller difference (smaller is "earlier" in ascending sort)
      comparisonResult = aDiffMs - bDiffMs;
    } else if (sortColumn === 'cl_name') {
      comparisonResult = (a as any).cl_name.localeCompare((b as any).cl_name);
    } else if (sortColumn === 'engagement_1d') {
      const aScore = engagementScores[a.client_id];
      const bScore = engagementScores[b.client_id];
      
      // Handle N/A values - put them at the bottom
      if ((aScore === null || aScore === undefined) && (bScore === null || bScore === undefined)) return 0;
      if (aScore === null || aScore === undefined) return 1;
      if (bScore === null || bScore === undefined) return -1;
      
      comparisonResult = aScore - bScore;
    } else if (sortColumn === 'engagement_7d') {
      const aScore = engagementScores7d[a.client_id];
      const bScore = engagementScores7d[b.client_id];
      
      // Handle N/A values - put them at the bottom
      if ((aScore === null || aScore === undefined) && (bScore === null || bScore === undefined)) return 0;
      if (aScore === null || aScore === undefined) return 1;
      if (bScore === null || bScore === undefined) return -1;
      
      comparisonResult = aScore - bScore;
    } else if (sortColumn === 'engagement_30d') {
      const aScore = engagementScores30d[a.client_id];
      const bScore = engagementScores30d[b.client_id];
      
      // Handle N/A values - put them at the bottom
      if ((aScore === null || aScore === undefined) && (bScore === null || bScore === undefined)) return 0;
      if (aScore === null || aScore === undefined) return 1;
      if (bScore === null || bScore === undefined) return -1;
      
      comparisonResult = aScore - bScore;
    } else if (sortColumn === 'current_streak') {
      const aStreak = a.current_streak;
      const bStreak = b.current_streak;
      
      // Handle N/A values - put them at the bottom
      if ((aStreak === null || aStreak === undefined) && (bStreak === null || bStreak === undefined)) return 0;
      if (aStreak === null || aStreak === undefined) return 1;
      if (bStreak === null || bStreak === undefined) return -1;
      
      comparisonResult = aStreak - bStreak;
    } else if (sortColumn === 'longest_streak') {
      const aStreak = a.longest_streak;
      const bStreak = b.longest_streak;
      
      // Handle N/A values - put them at the bottom
      if ((aStreak === null || aStreak === undefined) && (bStreak === null || bStreak === undefined)) return 0;
      if (aStreak === null || aStreak === undefined) return 1;
      if (bStreak === null || bStreak === undefined) return -1;
      
      comparisonResult = aStreak - bStreak;
    } else if (sortColumn === 'active_session') {
      const aSession = a.active_session;
      const bSession = b.active_session;
      
      // Convert boolean to number for comparison (true = 1, false = 0)
      const aValue = aSession ? 1 : 0;
      const bValue = bSession ? 1 : 0;
      
      comparisonResult = aValue - bValue;
    } else if (sortColumn === 'outcome_score') {
      // Currently showing 100% for all - treat as equal
      comparisonResult = 0;
    } else if (sortColumn === 'status') {
      const aStatus = a.status || 'pending';
      const bStatus = b.status || 'pending';
      
      // Sort active first, then pending/others
      if (aStatus === 'active' && bStatus !== 'active') return -1;
      if (bStatus === 'active' && aStatus !== 'active') return 1;
      
      // If both are the same status or both are non-active, sort alphabetically
      comparisonResult = aStatus.localeCompare(bStatus);
    } else {
      // Fallback for other columns
      let aValue: any = (a as any)[sortColumn];
      let bValue: any = (b as any)[sortColumn];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparisonResult = aValue - bValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparisonResult = aValue.localeCompare(bValue);
      }
    }

    return sortDirection === 'asc' ? comparisonResult : -comparisonResult;
  });

  const handleViewProfile = (client: { client_id: number; cl_name: string }) => {
    setSelectedClient(client);
    setIsProfileModalOpen(true);
  };

  const handleEdit = (client: { client_id: number; cl_name: string }) => {
    setSelectedClient(client);
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedClient(null);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    toast({
      title: selectedClient ? "Client updated" : "Client added",
      description: selectedClient
        ? "The client has been successfully updated."
        : "The client has been successfully added.",
    });
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Icons.AlertTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-lg font-semibold">Error Loading Clients</h3>
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-[#f8f9fb] via-[#f0f4f9] to-[#e8f2ff] dark:from-black dark:via-slate-900 dark:to-slate-800">
        {/* Enhanced Sidebar Filters */}
        <aside className="w-64 bg-white/90 backdrop-blur-sm border-r border-gray-200/70 flex flex-col py-6 px-4 dark:bg-black/90 dark:border-gray-800/70 dark:text-white shadow-lg">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            <Icons.UsersIcon className="h-5 w-5 text-blue-500" /> Clients
          </h2>
          <nav className="flex-1">
            <ul className="space-y-2">
              {STATUS_FILTERS.map((filter) => (
                <li key={filter.value}>
                  <button
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      statusFilter === filter.value
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-500 shadow-md dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400 dark:border-blue-400"
                        : "text-gray-700 hover:bg-gray-100/70 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-800/50"
                    }`}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    <span>{filter.label}</span>
                    <span
                      className={`text-xs font-semibold rounded-full px-2.5 py-1 ml-2 ${
                        statusFilter === filter.value
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {filter.value === "all"
                        ? clients.length || 0
                        : filter.value === "inactive"
                          ? clients.length || 0
                          : 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <SidebarContent>
          <div className="max-w-8xl mx-auto w-full pt-8 px-6">
            {/* Enhanced Header and Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
                  All Clients ({filteredClients.length || 0})
                </h1>
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={engagementFilter}
                    onChange={(e) => setEngagementFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 dark:bg-black/80 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                    title="Engagement Score"
                  >
                    <option value="all">Engagement: All</option>
                    <option value="high">High (80-100)</option>
                    <option value="medium">Medium (50-79)</option>
                    <option value="low">Low (0-49)</option>
                  </select>
                  <select
                    value={outcomeFilter}
                    onChange={(e) => setOutcomeFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 dark:bg-black/80 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                    title="Outcome Score"
                  >
                    <option value="all">Outcome: All</option>
                    <option value="high">High (80-100)</option>
                    <option value="medium">Medium (50-79)</option>
                    <option value="low">Low (0-49)</option>
                  </select>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 dark:bg-black/80 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                    title="Last Activity"
                  >
                    <option value="all">Activity: All</option>
                    <option value="recent">Recent (≤3 days)</option>
                    <option value="moderate">Moderate (4-7 days)</option>
                    <option value="inactive">Inactive (&gt;7 days)</option>
                  </select>
                  <button 
                    onClick={() => {
                      setEngagementFilter("all");
                      setOutcomeFilter("all");
                      setActivityFilter("all");
                      setStatusFilter("all");
                      setSearchQuery("");
                    }}
                    className="text-blue-600 text-sm font-medium ml-2 hover:text-blue-800 transition-colors dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <Icons.SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-200/50 shadow-sm hover:shadow-md transition-all duration-200 dark:bg-slate-900/80 dark:border-gray-700 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  />
                </div>
                <Button
                  onClick={handleAddNew}
                  className="ml-2 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 px-6 h-11"
                >
                  <Icons.PlusIcon className="h-4 w-4 mr-2" /> Add Client
                </Button>
              </div>
            </div>

            {/* Enhanced Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 dark:bg-slate-900/90 dark:border-gray-800/50 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-gray-50/80 to-blue-50/30 dark:from-slate-800/80 dark:to-slate-700/30">
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide cursor-pointer" onClick={() => handleSort('cl_name')}>
                      Name {sortColumn === 'cl_name' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide cursor-pointer" onClick={() => handleSort('last_active_ago')}>
                      Last Active (ago) {sortColumn === 'last_active_ago' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide cursor-pointer" onClick={() => handleSort('engagement_1d')} title="Engagement for yesterday (UTC). Calculated as (completed tasks / total tasks) * 100 for that day.">
                      Client Engagement (1d) {sortColumn === 'engagement_1d' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide cursor-pointer" onClick={() => handleSort('engagement_7d')} title="Average engagement for the last 7 days (yesterday and previous 6 days). Calculated as the mean of daily engagement scores.">
                      Client Engagement (7d) {sortColumn === 'engagement_7d' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide cursor-pointer" onClick={() => handleSort('engagement_30d')} title="Average engagement for the last 30 days (yesterday and previous 29 days). Calculated as the mean of daily engagement scores.">
                      Client Engagement (30d) {sortColumn === 'engagement_30d' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide cursor-pointer" onClick={() => handleSort('current_streak')}>
                      Current Streak {sortColumn === 'current_streak' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide cursor-pointer" onClick={() => handleSort('longest_streak')}>
                      Longest Streak {sortColumn === 'longest_streak' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide cursor-pointer" onClick={() => handleSort('active_session')}>
                      Active Session {sortColumn === 'active_session' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide cursor-pointer" onClick={() => handleSort('status')}>
                      Status {sortColumn === 'status' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide cursor-pointer" onClick={() => handleSort('outcome_score')}>
                      Outcome Score {sortColumn === 'outcome_score' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClients.length > 0 ? (
                    sortedClients.map((client, index) => {
                      const daysSinceActivity = getDaysSince((client as any).last_active);
                      return (
                        <tr
                          key={client.client_id}
                          className={`$${
                            index % 2 === 0 ? "bg-gray-50/40 dark:bg-slate-800/20" : "bg-white/40 dark:bg-slate-900/20"
                          } hover:bg-blue-50/70 dark:hover:bg-blue-900/20 transition-all duration-200 cursor-pointer border-b border-gray-100/50 dark:border-gray-800/50 group`}
                          onClick={() => navigate(`/client/${client.client_id}`)}
                        >
                          <td className="flex items-center gap-4 px-6 py-5 whitespace-nowrap">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-700 group-hover:shadow-xl transition-shadow duration-200">
                              {clientImageUrls[client.client_id] ? (
                                <img
                                  src={clientImageUrls[client.client_id] || undefined}
                                  alt={client.cl_name}
                                  className="w-full h-full object-cover rounded-full"
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              ) : (
                                <div className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                                  {client.cl_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                              )}
                            </div>
                            <span
                              className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-base"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/client/${client.client_id}`);
                              }}
                            >
                              {client.cl_name}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            {(() => {
                              const lastActive = (client as any).last_active;
                              const ago = getShortAgo(lastActive) || 'N/A';
                              let tooltip = '';
                              if (lastActive) {
                                const date = new Date(lastActive);
                                // Use user's local time zone for formatting
                                const options: Intl.DateTimeFormatOptions = {
                                  month: 'long',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                };
                                let localString = date.toLocaleString(undefined, options);
                                // Add ordinal suffix to day
                                const day = date.getDate();
                                const ordinal = (n: number) => n + (['st','nd','rd'][((n+90)%100-10)%10-1]||'th');
                                localString = localString.replace(String(day), ordinal(day));
                                tooltip = localString;
                              }
                              return (
                                <span
                                  className="font-medium text-gray-700 dark:text-gray-300"
                                  title={tooltip}
                                >
                                  {ago}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3" title="Engagement for yesterday (UTC). Calculated as (completed tasks / total tasks) * 100 for that day.">
                              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${engagementScores[client.client_id] !== undefined && engagementScores[client.client_id] !== null ? engagementScores[client.client_id] : 0}%` }}></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                                {engagementScores[client.client_id] !== undefined && engagementScores[client.client_id] !== null
                                  ? `${engagementScores[client.client_id]}%`
                                  : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3" title="Average engagement for the last 7 days (yesterday and previous 6 days). Calculated as the mean of daily engagement scores.">
                              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${engagementScores7d[client.client_id] !== undefined && engagementScores7d[client.client_id] !== null ? engagementScores7d[client.client_id] : 0}%` }}></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                                {engagementScores7d[client.client_id] !== undefined && engagementScores7d[client.client_id] !== null
                                  ? `${engagementScores7d[client.client_id]}%`
                                  : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3" title="Average engagement for the last 30 days (yesterday and previous 29 days). Calculated as the mean of daily engagement scores.">
                              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${engagementScores30d[client.client_id] !== undefined && engagementScores30d[client.client_id] !== null ? engagementScores30d[client.client_id] : 0}%` }}></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                                {engagementScores30d[client.client_id] !== undefined && engagementScores30d[client.client_id] !== null
                                  ? `${engagementScores30d[client.client_id]}%`
                                  : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            {client.current_streak !== undefined && client.current_streak !== null ? (
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">{client.current_streak}</span>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            {client.longest_streak !== undefined && client.longest_streak !== null ? (
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">{client.longest_streak}</span>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <span className="flex items-center justify-center">
                              <span
                                className={`inline-block w-3 h-3 rounded-full ${client.active_session ? 'bg-green-500' : 'bg-red-500'}`}
                                title={client.active_session ? 'Active' : 'Inactive'}
                              ></span>
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span 
                              className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                                client.status === 'active' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}
                              title={client.status === 'active' ? 'Client has accepted invitation and profile is set up' : 'Invitation is still pending'}
                            >
                              {client.status === 'active' ? 'Active' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: '100%' }}></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                                100%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Icons.SearchIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            No clients found
                          </h3>
                          <p className="text-gray-500 dark:text-gray-500 mb-6">Try adjusting your search or filters</p>
                          <Button
                            onClick={handleAddNew}
                            variant="outline"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <Icons.PlusIcon className="h-4 w-4 mr-2" /> Add New Client
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Client Profile Modal */}
            <ClientProfileModal
              open={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
            />
            {/* Client Form Modal */}
            <ClientProfileModal
              open={isFormModalOpen}
              onClose={() => setIsFormModalOpen(false)}
            />
          </div>
        </SidebarContent>
      </div>
    </SidebarProvider>
  );
};

export default Clients;
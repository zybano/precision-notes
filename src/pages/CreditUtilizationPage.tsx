import { useEffect, useState } from "react";
import { useOrgAuth } from "@/contexts/OrgAuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  fetchOrganizationStaffUtilization,
  fetchStaffUtilization,
  fetchStaffActivityLog
} from "@/services/orgAuthApi";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StaffUtilizationData {
  user_id: string;
  user_email: string;
  user_name: string;
  total_credits_used: number;
  total_documents_generated: number;
  total_transcriptions_completed: number;
  last_activity_date?: string;
}

interface ActivityLog {
  id: string;
  activity_type: 'transcription' | 'document_generation' | 'combined_request';
  credits_used: number;
  document_format?: string;
  processing_time_seconds?: string;
  created_at: string;
}

export default function CreditUtilizationPage() {
  const { session, user } = useOrgAuth();
  const [staffUtilization, setStaffUtilization] = useState<StaffUtilizationData[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [dateRange, setDateRange] = useState<"7days" | "30days" | "all">("30days");
  const [totals, setTotals] = useState({
    total_credits: 0,
    total_documents: 0,
    total_transcriptions: 0,
    active_staff: 0
  });

  const token = session?.token;
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!token) return;
    loadUtilizationData();
  }, [token, dateRange]);

  useEffect(() => {
    if (!token || !selectedUserId) return;
    loadActivityLog();
  }, [token, selectedUserId]);

  const loadUtilizationData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const endDate = new Date().toISOString().split('T')[0];
      let startDate = "";

      if (dateRange === "7days") {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        startDate = date.toISOString().split('T')[0];
      } else if (dateRange === "30days") {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        startDate = date.toISOString().split('T')[0];
      }

      if (isAdmin) {
        const response = await fetchOrganizationStaffUtilization(
          token,
          startDate || undefined,
          endDate
        );
        setStaffUtilization(response.staff_utilization || []);
        setTotals(response.totals || {
          total_credits: 0,
          total_documents: 0,
          total_transcriptions: 0,
          active_staff: 0
        });
      } else {
        // For staff, load their own utilization
        const response = await fetchStaffUtilization(token, user?.id, startDate || undefined, endDate);
        setTotals({
          total_credits: response?.totals?.total_credits || 0,
          total_documents: response?.totals?.total_documents || 0,
          total_transcriptions: response?.totals?.total_transcriptions || 0,
          active_staff: 1
        });
      }
    } catch (error) {
      console.error(error);
      toast.error((error as Error)?.message ?? "Unable to load utilization data");
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLog = async () => {
    if (!token || !selectedUserId) return;

    try {
      setLoadingActivity(true);
      const response = await fetchStaffActivityLog(token, selectedUserId, undefined, undefined, 50);
      setActivityLog(response.activities);
    } catch (error) {
      console.error(error);
      toast.error((error as Error)?.message ?? "Unable to load activity log");
    } finally {
      setLoadingActivity(false);
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'transcription': return 'Transcription';
      case 'document_generation': return 'Document Generation';
      case 'combined_request': return 'Combined Request';
      default: return type;
    }
  };

  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case 'transcription': return 'default';
      case 'document_generation': return 'secondary';
      case 'combined_request': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Credit Utilization</h1>
              <p className="text-slate-600">Monitor credit usage across {isAdmin ? "your team" : "your account"}</p>
            </div>
          </div>

          {/* Date Range Filter */}
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Card className="p-6 text-sm text-slate-500">Loading utilization data...</Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-500">Total Credits Used</h3>
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{totals.total_credits.toLocaleString()}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-500">Documents Generated</h3>
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{totals.total_documents.toLocaleString()}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-500">Transcriptions</h3>
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{totals.total_transcriptions.toLocaleString()}</p>
              </Card>

              {isAdmin && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-500">Active Staff</h3>
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{totals.active_staff}</p>
                </Card>
              )}
            </div>

            {/* Staff Utilization Table (Admin only) */}
            {isAdmin && staffUtilization.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">Staff Utilization Breakdown</h2>
                  <Button variant="outline" size="sm" onClick={loadUtilizationData}>
                    Refresh
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-left">
                      <tr>
                        <th className="p-3 font-medium">Staff Member</th>
                        <th className="p-3 font-medium text-right">Credits Used</th>
                        <th className="p-3 font-medium text-right">Documents</th>
                        <th className="p-3 font-medium text-right">Transcriptions</th>
                        <th className="p-3 font-medium">Last Activity</th>
                        <th className="p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffUtilization.map((staff) => (
                        <tr key={staff.user_id} className="border-t hover:bg-slate-50">
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-slate-900">{staff.user_name}</p>
                              <p className="text-xs text-slate-500">{staff.user_email}</p>
                            </div>
                          </td>
                          <td className="p-3 text-right font-medium text-slate-900">
                            {staff.total_credits_used.toLocaleString()}
                          </td>
                          <td className="p-3 text-right text-slate-600">
                            {staff.total_documents_generated.toLocaleString()}
                          </td>
                          <td className="p-3 text-right text-slate-600">
                            {staff.total_transcriptions_completed.toLocaleString()}
                          </td>
                          <td className="p-3 text-slate-600 text-xs">
                            {staff.last_activity_date
                              ? new Date(staff.last_activity_date).toLocaleDateString()
                              : "Never"}
                          </td>
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUserId(staff.user_id)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Activity Log */}
            {selectedUserId && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">Activity Log</h2>
                  <Button variant="outline" size="sm" onClick={() => setSelectedUserId("")}>
                    Close
                  </Button>
                </div>

                {loadingActivity ? (
                  <p className="text-sm text-slate-500">Loading activity...</p>
                ) : activityLog.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No activity found</p>
                ) : (
                  <div className="space-y-3">
                    {activityLog.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getActivityTypeBadge(activity.activity_type) as any}>
                              {getActivityTypeLabel(activity.activity_type)}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(activity.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-slate-700 space-y-1">
                            {activity.document_format && (
                              <p>Format: {activity.document_format}</p>
                            )}
                            {activity.processing_time_seconds && (
                              <p className="text-xs text-slate-500">
                                Processing time: {activity.processing_time_seconds}s
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">
                            {activity.credits_used} credits
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Empty State for Staff */}
            {!isAdmin && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">My Activity</h2>
                <p className="text-slate-500 text-center py-8">
                  Detailed activity log coming soon. Use the summary cards above to track your usage.
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

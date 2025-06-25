import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface DashboardContentProps {
  user: User | null;
}

interface ComplaintStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}

interface UserProfile {
  role: string;
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [stats, setStats] = useState<ComplaintStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0
  });
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    if (user) {
      console.log('Dashboard loading for user:', user.id);
      fetchUserProfile();
      fetchDashboardData();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile for user:', user?.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      console.log('Profile data:', profile, 'Error:', error);
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (profile) {
        console.log('User role:', profile.role);
        setUserRole(profile.role || 'user');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
      // Test the get_current_user_role function
      const { data: roleTest, error: roleError } = await supabase
        .rpc('get_current_user_role');
      
      console.log('Current user role from function:', roleTest, 'Error:', roleError);

      // Fetch complaint statistics - this should work with RLS policies
      const { data: complaints, error } = await supabase
        .from('complaints')
        .select('status, user_id, id, title, created_at');

      console.log('Complaints query result:', complaints, 'Error:', error);

      if (error) {
        console.error('Error fetching complaints:', error);
        throw error;
      }

      // Calculate statistics
      const statsData = complaints?.reduce(
        (acc, complaint) => {
          acc.total++;
          // Handle the case where status might be null
          const status = complaint.status || 'pending';
          if (status === 'in_progress') {
            acc.inProgress++;
          } else {
            acc[status as keyof ComplaintStats]++;
          }
          return acc;
        },
        { total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0 }
      ) || { total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0 };

      console.log('Calculated stats:', statsData);
      setStats(statsData);

      // Fetch recent complaints with profiles
      const recentData = complaints?.slice(0, 5) || [];
      
      // Fetch profile data for each recent complaint
      const recentWithProfiles = await Promise.all(
        recentData.map(async (complaint) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', complaint.user_id)
            .single();

          return {
            ...complaint,
            profiles: profileError ? null : profileData
          };
        })
      );

      console.log('Recent complaints with profiles:', recentWithProfiles);
      setRecentComplaints(recentWithProfiles);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <AlertTriangle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <div className="bg-gray-100 p-4 rounded text-sm text-gray-600">
        <p>Debug Info: User Role = {userRole}, User ID = {user?.id}</p>
        <p>Stats: {JSON.stringify(stats)}</p>
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {user?.user_metadata?.full_name || 'User'}!
        </h2>
        <p className="text-teal-100">
          {userRole === 'admin' || userRole === 'staff' 
            ? `Here's an overview of all complaint management activity. (${userRole.toUpperCase()} VIEW)`
            : "Here's an overview of your complaint management activity."
          }
        </p>
        {(userRole === 'admin' || userRole === 'staff') && (
          <div className="mt-3 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            <span className="text-sm">You can view and manage all complaints in the system</span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-teal-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userRole === 'admin' || userRole === 'staff' ? 'Total Complaints (All)' : 'Total Complaints'}
            </CardTitle>
            <FileText className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{stats.total}</div>
            <p className="text-xs text-gray-600">
              {userRole === 'admin' || userRole === 'staff' ? 'System-wide submissions' : 'All time submissions'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-gray-600">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-gray-600">Being processed</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-gray-600">Successfully resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Complaints */}
      <Card className="bg-white/80 backdrop-blur-sm border-teal-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            <span>Recent Complaints</span>
          </CardTitle>
          <CardDescription>
            {userRole === 'admin' || userRole === 'staff' 
              ? 'Latest complaint submissions from all users'
              : 'Your latest complaint submissions and their current status'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentComplaints.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No complaints found.</p>
              <p className="text-sm">
                {userRole === 'admin' || userRole === 'staff' 
                  ? 'No complaints have been submitted yet.'
                  : 'Click "New Complaint" to get started.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex items-center justify-between p-4 bg-teal-50 rounded-lg border border-teal-100"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{complaint.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{complaint.category}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Submitted {new Date(complaint.created_at).toLocaleDateString()}</span>
                      {(userRole === 'admin' || userRole === 'staff') && complaint.profiles && (
                        <>
                          <span>•</span>
                          <span>By: {complaint.profiles.full_name || complaint.profiles.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(complaint.status)}>
                      {getStatusIcon(complaint.status)}
                      <span className="ml-1 capitalize">
                        {complaint.status?.replace('_', ' ') || 'pending'}
                      </span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

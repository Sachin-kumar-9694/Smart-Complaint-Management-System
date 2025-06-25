import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Filter, Download, Eye, Calendar, User as UserIcon, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface ComplaintsListProps {
  user: User | null;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user_id: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export function ComplaintsList({ user }: ComplaintsListProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [userRole, setUserRole] = useState<string>('user');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      console.log('ComplaintsList loading for user:', user.id);
      fetchUserProfile();
      fetchComplaints();
    }
  }, [user]);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile for complaints list...');
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      console.log('Profile data for complaints:', profile, 'Error:', error);

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      if (profile) {
        console.log('User role in complaints list:', profile.role);
        setUserRole(profile.role || 'user');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchComplaints = async () => {
    try {
      console.log('Fetching complaints for list view...');
      
      // Test current user role
      const { data: roleTest, error: roleError } = await supabase
        .rpc('get_current_user_role');
      
      console.log('Current user role test:', roleTest, 'Error:', roleError);

      // First fetch complaints - RLS should handle filtering based on user role
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Complaints data:', complaintsData, 'Error:', complaintsError);

      if (complaintsError) {
        console.error('Error fetching complaints:', complaintsError);
        throw complaintsError;
      }

      // Then fetch profile data for each complaint
      const complaintsWithProfiles = await Promise.all(
        (complaintsData || []).map(async (complaint) => {
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

      console.log('Final complaints with profiles:', complaintsWithProfiles);
      setComplaints(complaintsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching complaints:', error);
      toast({
        title: "Error loading complaints",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = complaints;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(complaint =>
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (complaint.profiles?.full_name && complaint.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (complaint.profiles?.email && complaint.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(complaint => complaint.priority === priorityFilter);
    }

    setFilteredComplaints(filtered);
  };

  const updateComplaintStatus = async (complaintId: string, newStatus: "pending" | "in_progress" | "resolved" | "rejected") => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
        })
        .eq('id', complaintId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Complaint status changed to ${newStatus.replace('_', ' ')}`,
      });

      // Refresh complaints list
      fetchComplaints();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <div className="bg-gray-100 p-4 rounded text-sm text-gray-600">
        <p>Debug Info: User Role = {userRole}, Total Complaints = {complaints.length}</p>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          {userRole === 'admin' || userRole === 'staff' ? 'All Complaints' : 'My Complaints'}
        </h2>
        <p className="text-gray-600">
          {userRole === 'admin' || userRole === 'staff' 
            ? 'View and manage all complaints in the system'
            : 'Track and manage all your submitted complaints'
          }
        </p>
        {(userRole === 'admin' || userRole === 'staff') && (
          <div className="mt-2 flex items-center justify-center">
            <Shield className="h-4 w-4 mr-2 text-teal-600" />
            <span className="text-sm text-teal-600 font-medium">{userRole.toUpperCase()} VIEW</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-teal-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-teal-600" />
            <span>Filter & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder={
                    userRole === 'admin' || userRole === 'staff' 
                      ? "Search complaints, users..." 
                      : "Search complaints..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-teal-200 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-teal-200 focus:border-teal-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="border-teal-200 focus:border-teal-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-teal-100">
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {complaints.length === 0 ? "No complaints found" : "No complaints match your filters"}
              </h3>
              <p className="text-gray-500">
                {complaints.length === 0 
                  ? (userRole === 'admin' || userRole === 'staff' 
                      ? "No complaints have been submitted yet." 
                      : "You haven't submitted any complaints yet."
                    )
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredComplaints.map((complaint) => (
            <Card key={complaint.id} className="bg-white/80 backdrop-blur-sm border-teal-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-800 mb-2">
                      {complaint.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={getStatusColor(complaint.status)}>
                        {(complaint.status || 'pending').replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getPriorityColor(complaint.priority)}>
                        {(complaint.priority || 'medium').toUpperCase()} PRIORITY
                      </Badge>
                      <Badge variant="outline" className="text-teal-600 border-teal-200">
                        {complaint.category}
                      </Badge>
                      {(userRole === 'admin' || userRole === 'staff') && complaint.user_id !== user?.id && (
                        <Badge variant="outline" className="text-purple-600 border-purple-200">
                          <UserIcon className="h-3 w-3 mr-1" />
                          Other User
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <CardDescription className="text-gray-600">
                  {complaint.description.length > 150 
                    ? `${complaint.description.substring(0, 150)}...` 
                    : complaint.description
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Submitted: {new Date(complaint.created_at).toLocaleDateString()}</span>
                    </div>
                    {complaint.resolved_at && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Resolved: {new Date(complaint.resolved_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {(userRole === 'admin' || userRole === 'staff') && complaint.profiles && (
                      <div className="flex items-center space-x-1">
                        <UserIcon className="h-4 w-4" />
                        <span>By: {complaint.profiles.full_name || complaint.profiles.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {(userRole === 'admin' || userRole === 'staff') && (
                      <Select
                        value={complaint.status}
                        onValueChange={(value: "pending" | "in_progress" | "resolved" | "rejected") => updateComplaintStatus(complaint.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {complaint.attachment_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(complaint.attachment_url!, '_blank')}
                        className="border-teal-200 text-teal-600 hover:bg-teal-50"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Attachment
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredComplaints.length > 0 && (
        <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
          <CardContent className="p-4">
            <div className="text-center text-sm text-teal-700">
              Showing {filteredComplaints.length} of {complaints.length} complaints
              {userRole === 'admin' || userRole === 'staff' ? ' (system-wide)' : ''}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

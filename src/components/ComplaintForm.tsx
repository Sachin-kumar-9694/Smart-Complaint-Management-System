
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

type ComplaintPriority = Database["public"]["Enums"]["complaint_priority"];
type ComplaintStatus = Database["public"]["Enums"]["complaint_status"];

interface ComplaintFormProps {
  user: User | null;
  onSuccess?: () => void;
}

export function ComplaintForm({ user, onSuccess }: ComplaintFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as ComplaintPriority
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const categories = [
    "Technical Issue",
    "Service Quality",
    "Billing & Payment",
    "Product Defect",
    "Customer Service",
    "Delivery & Shipping",
    "Website/App Issue",
    "Privacy Concern",
    "Refund Request",
    "Other"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'priority') {
      setFormData({
        ...formData,
        [name]: value as ComplaintPriority
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const uploadAttachment = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Error uploading file",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let attachmentUrl = null;
      
      if (attachment) {
        attachmentUrl = await uploadAttachment(attachment);
        if (!attachmentUrl) {
          throw new Error("Failed to upload attachment");
        }
      }

      const { error } = await supabase
        .from('complaints')
        .insert({
          user_id: user?.id!,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          attachment_url: attachmentUrl,
          status: 'pending' as ComplaintStatus
        });

      if (error) throw error;

      toast({
        title: "Complaint submitted successfully",
        description: "Your complaint has been submitted and is being reviewed.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        priority: "medium" as ComplaintPriority
      });
      setAttachment(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error submitting complaint",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          Submit New Complaint
        </h2>
        <p className="text-gray-600">Describe your issue in detail so we can assist you better</p>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-teal-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-teal-600" />
            <span>Complaint Details</span>
          </CardTitle>
          <CardDescription>
            Please provide as much detail as possible to help us resolve your issue quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Complaint Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="border-teal-200 focus:border-teal-500"
                placeholder="Brief summary of your complaint"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                  required
                >
                  <SelectTrigger className="border-teal-200 focus:border-teal-500">
                    <SelectValue placeholder="Select complaint category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => handleSelectChange('priority', value)}
                >
                  <SelectTrigger className="border-teal-200 focus:border-teal-500">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={6}
                className="border-teal-200 focus:border-teal-500"
                placeholder="Describe your complaint in detail. Include any relevant information such as dates, order numbers, or specific issues you encountered."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment">Attachment (Optional)</Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="attachment"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,.doc,.docx"
                  className="border-teal-200 focus:border-teal-500"
                />
                <Upload className="h-5 w-5 text-teal-600" />
              </div>
              {attachment && (
                <p className="text-sm text-teal-600">
                  Selected: {attachment.name}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Supported formats: Images, PDF, Word documents (Max: 10MB)
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                disabled={loading || uploading}
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? "Submitting..." : uploading ? "Uploading..." : "Submit Complaint"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

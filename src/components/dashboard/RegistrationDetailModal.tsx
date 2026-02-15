import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  User, Mail, Phone, MapPin, Calendar, FileText, 
  Download, CheckCircle, XCircle, Clock, CreditCard, Eye
} from "lucide-react";

interface Registration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  grade: string | null;
  class?: string | null;
  role: string;
  status: string;
  created_at: string;
  user_id: string | null;
  id_document_url: string | null;
  proof_of_address_url: string | null;
  payment_proof_url: string | null;
  report_url?: string | null;
  id_number: string | null;
  address: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  admin_notes?: string | null;
}

interface RegistrationDetailModalProps {
  registration: Registration | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (reg: Registration) => void;
  onReject: (reg: Registration) => void;
  isLoading: boolean;
}

export function RegistrationDetailModal({
  registration,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isLoading,
}: RegistrationDetailModalProps) {
  if (!registration) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-primary">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-accent text-accent-foreground">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{registration.first_name} {registration.last_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">{registration.role.replace('_', ' ')}</Badge>
                {getStatusBadge(registration.status)}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{registration.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{registration.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">ID Number</p>
                  <p className="text-sm font-medium">{registration.id_number || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Registration Date</p>
                  <p className="text-sm font-medium">{new Date(registration.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            {registration.address && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm font-medium">{registration.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Academic Information (for learners) */}
          {registration.role === 'learner' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Academic Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Grade Applying</p>
                  <p className="text-sm font-medium">{registration.grade || 'Not specified'}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Class</p>
                  <p className="text-sm font-medium">{registration.class || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Parent/Guardian Information (for learners) */}
          {registration.role === 'learner' && (registration.parent_name || registration.parent_phone) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Parent/Guardian Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {registration.parent_name && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <User className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Parent Name</p>
                      <p className="text-sm font-medium">{registration.parent_name}</p>
                    </div>
                  </div>
                )}
                {registration.parent_phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Phone className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Parent Phone</p>
                      <p className="text-sm font-medium">{registration.parent_phone}</p>
                    </div>
                  </div>
                )}
                {registration.parent_email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 sm:col-span-2">
                    <Mail className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Parent Email</p>
                      <p className="text-sm font-medium">{registration.parent_email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Uploaded Documents</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <DocumentLink 
                label="ID Document" 
                url={registration.id_document_url} 
              />
              <DocumentLink 
                label="Proof of Address" 
                url={registration.proof_of_address_url} 
              />
              {registration.role === 'learner' && (
                <>
                  <DocumentLink 
                    label="School Report" 
                    url={registration.report_url || null} 
                  />
                  <DocumentLink 
                    label="Payment Proof" 
                    url={registration.payment_proof_url} 
                    icon={<CreditCard className="w-4 h-4" />}
                  />
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {registration.status === 'pending' && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button 
                className="flex-1" 
                onClick={() => onApprove(registration)}
                disabled={isLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Registration
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => onReject(registration)}
                disabled={isLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Registration
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentLink({ label, url, icon }: { label: string; url: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
      <div className="flex items-center gap-2">
        {icon || <FileText className="w-4 h-4 text-muted-foreground" />}
        <span className="text-sm">{label}</span>
      </div>
      {url ? (
        <div className="flex items-center gap-1">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" title="View document">
              <Eye className="w-4 h-4 text-primary" />
            </Button>
          </a>
          <a href={url} download target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" title="Download document">
              <Download className="w-4 h-4 text-primary" />
            </Button>
          </a>
        </div>
      ) : (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-4 h-4" /> Not uploaded
        </span>
      )}
    </div>
  );
}

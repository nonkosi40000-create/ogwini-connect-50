import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const isValidEmail = /^[^\s@]+@gmail\.com$/i.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) return;

    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-lg text-foreground">Ogwini</span>
        </div>

        {sent ? (
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Check Your Email</h2>
            <p className="text-muted-foreground mb-2">
              A password reset link has been sent to:
            </p>
            <p className="font-medium text-foreground mb-4">{email}</p>
            <p className="text-sm text-muted-foreground mb-4">
              Click the link in the email to set a new password. The link will expire in 1 hour.
            </p>
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-6 text-left">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">💡 Didn't receive it?</strong> Check your <strong>spam/junk folder</strong>. 
                The email is sent from a no-reply address and may be filtered automatically.
              </p>
            </div>
            <Button variant="outline" onClick={() => setSent(false)}>
              Send Again
            </Button>
          </div>
        ) : (
          <>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Forgot Password</h2>
            <p className="text-muted-foreground mb-8">
              Enter your @gmail.com email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email">Email Address (@gmail.com)</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your @gmail.com email"
                    required
                  />
                </div>
                {email && !isValidEmail && (
                  <p className="text-xs text-destructive mt-1">Email must end with @gmail.com</p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !isValidEmail}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

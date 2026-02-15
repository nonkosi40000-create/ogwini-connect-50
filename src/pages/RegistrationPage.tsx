import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, Mail, Phone, MapPin, School, Upload, CheckCircle, AlertCircle, 
  FileText, CreditCard, Copy, Check, Briefcase, BookOpen, Loader2 
} from "lucide-react";

interface FormData {
  // Common fields
  role: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  dateOfBirth: string;
  email: string;
  backupEmail: string;
  phone: string;
  address: string;
  hasDisability: string;
  disabilityDescription: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  password: string;
  confirmPassword: string;
  
  // Learner-specific
  previousSchool: string;
  gradeApplying: string;
  classApplying: string;
  electiveSubjects: string[];
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentIdNumber: string;
  parentAddress: string;
  
  // Staff-specific
  gradeTeaching: string;
  subjects: string[];
  departmentId: string;
}

interface UploadedFiles {
  idDocument: File | null;
  proofOfAddress: File | null;
  lastReport: File | null;
  proofOfPayment: File | null;
  qualification: File | null;
  parentId: File | null;
}

// Grade structure: 8A-8K through 12A-12K
const gradeClasses: Record<string, string[]> = {
  "Grade 8": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
  "Grade 9": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
  "Grade 10": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
  "Grade 11": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
  "Grade 12": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
};

const grades = [
  { name: "Grade 8", available: true, spots: 45 },
  { name: "Grade 9", available: true, spots: 32 },
  { name: "Grade 10", available: true, spots: 28 },
  { name: "Grade 11", available: false, spots: 0 },
  { name: "Grade 12", available: true, spots: 15 },
];

const roles = [
  { value: "learner", label: "Learner", description: "Student applying to the school" },
  { value: "teacher", label: "Teacher", description: "Educator applying for a teaching position" },
  { value: "hod", label: "Head of Department", description: "HOD overseeing a department" },
  { value: "llc", label: "Language Learning Coordinator", description: "LLC overseeing language subjects" },
  { value: "grade_head", label: "Grade Head", description: "Senior teacher overseeing a grade" },
  { value: "principal", label: "Principal", description: "School principal" },
  { value: "deputy_principal", label: "Deputy Principal", description: "Deputy principal with academic oversight" },
  { value: "admin", label: "Administrator", description: "School admin managing registrations and approvals" },
  { value: "finance", label: "Finance", description: "Finance department staff managing fees and statements" },
  { value: "librarian", label: "Librarian", description: "Library staff managing e-learning materials" },
];

// Compulsory subjects for Grade 8-9
const grade8to9Subjects = [
  "IsiZulu", "English (FAL)", "Afrikaans (SAL)", "Mathematics", "Natural Sciences",
  "Life Orientation", "Dramatic Arts", "Music", "Visual Arts", "History",
  "Geography", "Technology", "Economics", "Accounting"
];

// Additional elective subjects for Grade 10-12
const grade10to12Electives = [
  { name: "Physical Sciences", stream: "Science" },
  { name: "Life Sciences", stream: "Science" },
  { name: "Technical Mathematics", stream: "Technology" },
  { name: "Technical Physical Sciences", stream: "Technology" },
  { name: "E.G.D (Engineering Graphics & Design)", stream: "Technology" },
  { name: "Mechanical Technology", stream: "Technology" },
  { name: "Agricultural Sciences", stream: "General" },
  { name: "Information Technology", stream: "Commerce" },
  { name: "Computer Applications Technology", stream: "Commerce" },
  { name: "Accounting", stream: "Commerce" },
  { name: "Business Studies", stream: "Commerce" },
  { name: "Economics", stream: "Commerce" },
  { name: "Geography", stream: "General" },
  { name: "History", stream: "General" },
  { name: "Tourism", stream: "General" },
];

// Teacher subjects (combined list)
const teacherSubjects = [
  "IsiZulu", "English (FAL)", "Afrikaans (SAL)", "Mathematics", "Natural Sciences",
  "Life Orientation", "Dramatic Arts", "Music", "Visual Arts", "History",
  "Geography", "Technology", "Economics", "Accounting", "Physical Sciences",
  "Life Sciences", "Technical Mathematics", "Technical Physical Sciences",
  "E.G.D (Engineering Graphics & Design)", "Mechanical Technology",
  "Agricultural Sciences", "Information Technology", "Computer Applications Technology",
  "Business Studies", "Tourism"
];

const bankingDetails = {
  bankName: "FNB (First National Bank)",
  accountName: "Ogwini Comprehensive Technical High School",
  accountNumber: "62890547123",
  branchCode: "250655",
  reference: "REG-[YOUR ID NUMBER]",
};

// Department selector for teaching staff
function DepartmentSelector({ departmentId, onChange }: { departmentId: string; onChange: (val: string) => void }) {
  const [depts, setDepts] = useState<{ id: string; name: string; code: string }[]>([]);
  useEffect(() => {
    supabase.from('departments').select('*').order('name').then(({ data }) => {
      if (data) setDepts(data);
    });
  }, []);
  return (
    <div>
      <Label htmlFor="departmentId">Department *</Label>
      <select id="departmentId" value={departmentId} onChange={(e) => onChange(e.target.value)} required className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground">
        <option value="">Select your department</option>
        {depts.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
      </select>
    </div>
  );
}

export default function RegistrationPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = role selection
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
const [formData, setFormData] = useState<FormData>({
    role: "",
    firstName: "",
    lastName: "",
    idNumber: "",
    dateOfBirth: "",
    email: "",
    backupEmail: "",
    phone: "",
    address: "",
    hasDisability: "",
    disabilityDescription: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    password: "",
    confirmPassword: "",
    previousSchool: "",
    gradeApplying: "",
    classApplying: "",
    electiveSubjects: [],
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    parentIdNumber: "",
    parentAddress: "",
    gradeTeaching: "",
    subjects: [],
    departmentId: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
    idDocument: null,
    proofOfAddress: null,
    lastReport: null,
    proofOfPayment: null,
    qualification: null,
    parentId: null,
  });

  const isLearner = formData.role === "learner";
  const isStaff = ["teacher", "grade_head", "principal", "hod", "llc", "finance", "librarian", "admin"].includes(formData.role);
  const isTeachingStaff = ["teacher", "grade_head", "principal", "hod", "llc"].includes(formData.role);
  const isNonTeachingStaff = ["admin", "finance", "librarian"].includes(formData.role);

  const validateIdNumber = (id: string) => /^\d{13}$/.test(id);
  const validatePhone = (phone: string) => /^(\+27|0)\d{9}$/.test(phone.replace(/\s/g, ""));
  const validateEmail = (email: string) => /^[^\s@]+@gmail\.com$/i.test(email);
  const validatePassword = (pw: string) => {
    if (pw.length < 8) return "Password must be at least 8 characters.";
    if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) return "Password must contain at least one special character.";
    return null;
  };

  // Extract age from ID number
  const getAgeFromId = (id: string) => {
    if (id.length !== 13) return null;
    const year = parseInt(id.substring(0, 2));
    const month = parseInt(id.substring(2, 4));
    const day = parseInt(id.substring(4, 6));
    const currentYear = new Date().getFullYear();
    const century = year > 30 ? 1900 : 2000;
    const birthYear = century + year;
    const age = currentYear - birthYear;
    return age;
  };

  // Extract date of birth from SA ID number
  const getDobFromId = (id: string): string => {
    if (id.length !== 13) return "";
    const yy = parseInt(id.substring(0, 2));
    const mm = id.substring(2, 4);
    const dd = id.substring(4, 6);
    const century = yy > 30 ? 1900 : 2000;
    const yyyy = century + yy;
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'gradeApplying') {
      setFormData({ ...formData, [name]: value, classApplying: '', electiveSubjects: [] });
    } else if (name === 'idNumber') {
      const dob = getDobFromId(value);
      setFormData({ ...formData, idNumber: value, dateOfBirth: dob || formData.dateOfBirth });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubjectChange = (subject: string) => {
    const current = formData.subjects;
    if (current.includes(subject)) {
      setFormData({ ...formData, subjects: current.filter(s => s !== subject) });
    } else {
      setFormData({ ...formData, subjects: [...current, subject] });
    }
  };

  const handleElectiveChange = (subject: string) => {
    const current = formData.electiveSubjects;
    if (current.includes(subject)) {
      setFormData({ ...formData, electiveSubjects: current.filter(s => s !== subject) });
    } else if (current.length < 4) {
      setFormData({ ...formData, electiveSubjects: [...current, subject] });
    } else {
      toast({ title: "Maximum Subjects", description: "You can only select 4 elective subjects.", variant: "destructive" });
    }
  };

  const isGrade10Plus = ["Grade 10", "Grade 11", "Grade 12"].includes(formData.gradeApplying);

  const handleFileUpload = (field: keyof UploadedFiles) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadedFiles({ ...uploadedFiles, [field]: file });
    if (file) {
      toast({ title: "File Uploaded", description: `${file.name} has been uploaded.` });
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: "Copied!", description: `${field} copied to clipboard.` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const selectedGrade = grades.find(g => g.name === formData.gradeApplying);
  const userAge = getAgeFromId(formData.idNumber);

  const uploadFile = async (file: File, folder: string) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('registration-docs')
      .upload(`${folder}/${fileName}`, file);
    
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('registration-docs').getPublicUrl(`${folder}/${fileName}`);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation: ensure required documents are uploaded
    if (!uploadedFiles.idDocument || !uploadedFiles.proofOfAddress) {
      toast({ title: "Missing Documents", description: "ID Document and Proof of Address are required.", variant: "destructive" });
      return;
    }
    if (isLearner && !uploadedFiles.lastReport) {
      toast({ title: "Missing Report", description: "Previous school report is required.", variant: "destructive" });
      return;
    }
    if (isLearner && !uploadedFiles.proofOfPayment) {
      toast({ title: "Missing Payment Proof", description: "Please upload proof of payment before submitting.", variant: "destructive" });
      return;
    }
    if (isStaff && !uploadedFiles.qualification) {
      toast({ title: "Missing Qualification", description: "Qualification document is required.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      // Upload files
      let idDocUrl = null, proofAddrUrl = null, reportUrl = null, paymentUrl = null, qualUrl = null;
      
      if (uploadedFiles.idDocument) {
        idDocUrl = await uploadFile(uploadedFiles.idDocument, 'id-docs');
      }
      if (uploadedFiles.proofOfAddress) {
        proofAddrUrl = await uploadFile(uploadedFiles.proofOfAddress, 'address-proofs');
      }
      if (uploadedFiles.lastReport) {
        reportUrl = await uploadFile(uploadedFiles.lastReport, 'reports');
      }
      if (uploadedFiles.proofOfPayment) {
        paymentUrl = await uploadFile(uploadedFiles.proofOfPayment, 'payments');
      }
      if (uploadedFiles.qualification) {
        qualUrl = await uploadFile(uploadedFiles.qualification, 'qualifications');
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role,
          }
        }
      });

      // If user already exists, try signing in and re-submitting registration
      if (authError && (authError.message?.includes('already registered') || authError.message?.includes('already_exists'))) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          throw new Error("This email is already registered. If this is your account, please use the correct password or go to the login page.");
        }

        // Update the existing rejected registration with new role/data
        if (signInData.user) {
          const { error: updateRegError } = await supabase
            .from('registrations')
            .update({
              role: formData.role as any,
              first_name: formData.firstName,
              last_name: formData.lastName,
              status: formData.role === 'admin' ? 'approved' : 'pending',
              phone: formData.phone,
              id_number: formData.idNumber,
              grade: isLearner ? formData.gradeApplying : formData.gradeTeaching,
              class: isLearner ? formData.classApplying : null,
              address: formData.address,
              parent_name: formData.parentName,
              parent_phone: formData.parentPhone,
              parent_email: formData.parentEmail,
              id_document_url: idDocUrl,
              proof_of_address_url: proofAddrUrl,
              report_url: reportUrl,
            payment_proof_url: paymentUrl,
            elective_subjects: isLearner && isGrade10Plus ? formData.electiveSubjects : [],
            department_id: isTeachingStaff && formData.departmentId ? formData.departmentId : null,
            updated_at: new Date().toISOString(),
            })
            .eq('user_id', signInData.user.id);

          if (updateRegError) console.error('Re-registration update error:', updateRegError);

          // Sign out so they wait for approval
          await supabase.auth.signOut();

          toast({
            title: "Application Re-Submitted!",
            description: "Your application has been updated and is pending review. Please allow up to 48 hours.",
          });
          setStep(7);
          setSubmitting(false);
          return;
        }
      } else if (authError) {
        throw authError;
      }

      // Update registration with all details
      if (authData.user) {
        const { error: regError } = await supabase
          .from('registrations')
          .update({
            phone: formData.phone,
            id_number: formData.idNumber,
            grade: isLearner ? formData.gradeApplying : formData.gradeTeaching,
            class: isLearner ? formData.classApplying : null,
            address: formData.address,
            parent_name: formData.parentName,
            parent_phone: formData.parentPhone,
            parent_email: formData.parentEmail,
            id_document_url: idDocUrl,
            proof_of_address_url: proofAddrUrl,
            report_url: reportUrl,
            payment_proof_url: paymentUrl,
            elective_subjects: isLearner && isGrade10Plus ? formData.electiveSubjects : [],
            department_id: isTeachingStaff && formData.departmentId ? formData.departmentId : null,
          })
          .eq('user_id', authData.user.id);

        if (regError) console.error('Registration update error:', regError);

        // Send confirmation email via edge function
        try {
          await supabase.functions.invoke('send-registration-email', {
            body: {
              email: formData.email,
              firstName: formData.firstName,
              lastName: formData.lastName,
              role: formData.role,
            },
          });
        } catch (emailErr) {
          console.error('Confirmation email error:', emailErr);
        }
      }

      const isAdminRole = formData.role === 'admin';
      toast({
        title: isAdminRole ? "Admin Account Created!" : "Application Submitted!",
        description: isAdminRole
          ? "Your admin account is active. You can sign in now."
          : "A confirmation email has been sent. Please allow up to 48 hours for review.",
      });
      setStep(7);
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  const getSteps = () => {
    if (isLearner) {
      return ["Role", "Personal", "Contact", "Parent", "Documents", "Payment", "Complete"];
    }
    if (isNonTeachingStaff) {
      return ["Role", "Personal", "Contact", "Documents", "Complete"];
    }
    return ["Role", "Personal", "Contact", "Professional", "Documents", "Complete"];
  };

  const steps = getSteps();
  const maxSteps = steps.length - 1;

  const nextStep = () => {
    // Role selection
    if (step === 0) {
      if (!formData.role) {
        toast({ title: "Select Role", description: "Please select who you are registering as.", variant: "destructive" });
        return;
      }
    }

    // Personal info validation
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.idNumber || !formData.password) {
        toast({ title: "Required Fields", description: "Please fill in all required fields.", variant: "destructive" });
        return;
      }
      if (!validateIdNumber(formData.idNumber)) {
        toast({ title: "Invalid ID Number", description: "Please enter a valid 13-digit SA ID number.", variant: "destructive" });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" });
        return;
      }
      const pwError = validatePassword(formData.password);
      if (pwError) {
        toast({ title: "Weak Password", description: pwError, variant: "destructive" });
        return;
      }
      if (isLearner && formData.gradeApplying && !selectedGrade?.available) {
        toast({ title: "Grade Full", description: "Selected grade is full.", variant: "destructive" });
        return;
      }
      if (isLearner && !formData.classApplying) {
        toast({ title: "Select Class", description: "Please select your class.", variant: "destructive" });
        return;
      }
      if (isLearner && isGrade10Plus && formData.electiveSubjects.length !== 4) {
        toast({ title: "Select Subjects", description: "Please select exactly 4 elective subjects.", variant: "destructive" });
        return;
      }
    }

    // Contact validation
    if (step === 2) {
      if (!validateEmail(formData.email)) {
        toast({ title: "Invalid Email", description: "Email must be a @gmail.com address.", variant: "destructive" });
        return;
      }
      if (!validatePhone(formData.phone)) {
        toast({ title: "Invalid Phone", description: "Phone must be a South African number (10 digits starting with 0 or +27).", variant: "destructive" });
        return;
      }
      if (!formData.address.trim()) {
        toast({ title: "Required", description: "Physical address is required.", variant: "destructive" });
        return;
      }
      if (!formData.nextOfKinName.trim() || !validatePhone(formData.nextOfKinPhone)) {
        toast({ title: "Next of Kin", description: "Next of kin name and valid SA phone number required.", variant: "destructive" });
        return;
      }
    }

    // Parent info for learners
    if (step === 3 && isLearner) {
      if (!formData.parentName || !formData.parentPhone) {
        toast({ title: "Required Fields", description: "Parent information is required.", variant: "destructive" });
        return;
      }
    }

    // Documents - step 4 for learner/teaching staff, step 3 for non-teaching staff
    const docStep = isNonTeachingStaff ? 3 : 4;
    if (step === docStep) {
      if (!uploadedFiles.idDocument || !uploadedFiles.proofOfAddress) {
        toast({ title: "Missing Documents", description: "Please upload required documents.", variant: "destructive" });
        return;
      }
      if (isLearner && !uploadedFiles.lastReport) {
        toast({ title: "Missing Report", description: "Please upload previous school report.", variant: "destructive" });
        return;
      }
      if (isStaff && !uploadedFiles.qualification) {
        toast({ title: "Missing Qualification", description: "Please upload qualification document.", variant: "destructive" });
        return;
      }
    }

    setStep(step + 1);
  };

  return (
    <Layout>
      {/* Header */}
      <section className="py-12 lg:py-16 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Registration Portal
            </span>
            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Join <span className="text-primary">Ogwini</span> School
            </h1>
            <p className="text-muted-foreground">
              {step === 0 ? "Select your role to begin registration" : `Step ${step} of ${maxSteps}`}
            </p>
          </div>

          {/* Progress */}
          {step > 0 && (
            <div className="flex justify-center gap-2 mt-8 flex-wrap max-w-xl mx-auto">
              {steps.slice(0, -1).map((label, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs ${
                    step > i ? "bg-primary text-primary-foreground" :
                    step === i + 1 ? "bg-primary text-primary-foreground" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {step > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < steps.length - 2 && <div className={`w-6 h-0.5 ${step > i ? "bg-primary" : "bg-secondary"}`} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Form */}
      <section className="py-8 lg:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Success */}
            {((isLearner && step === 7) || (isNonTeachingStaff && step === 5) || (isTeachingStaff && step === 6)) ? (
              <div className="glass-card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                {formData.role === 'admin' ? (
                  <>
                    <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Admin Account Activated!</h2>
                    <p className="text-muted-foreground mb-2">
                      Your administrator account has been automatically approved.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Please check your email to verify your account, then sign in to access your Admin Dashboard.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Application Submitted!</h2>
                    <p className="text-muted-foreground mb-2">
                      A confirmation email has been sent to <strong className="text-foreground">{formData.email}</strong>.
                    </p>
                    <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 my-4 text-left">
                      <p className="text-sm text-foreground font-medium mb-2">⏳ What happens next:</p>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Our admin team will review your documents and personal information</li>
                        <li>Please allow <strong className="text-foreground">up to 48 hours</strong> for your registration to be processed</li>
                        <li>You will be notified once your registration is approved</li>
                        <li>Once approved, you can sign in to access your dashboard</li>
                      </ul>
                    </div>
                  </>
                )}
                <Button onClick={() => navigate('/login')}>Go to Login</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-card p-6 lg:p-8">
                {/* Step 0: Role Selection */}
                {step === 0 && (
                  <div className="space-y-6">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-4 text-center">
                      Who are you registering as?
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {roles.map((role) => (
                        <label
                          key={role.value}
                          className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.role === role.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role.value}
                            checked={formData.role === role.value}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <span className="font-semibold text-foreground">{role.label}</span>
                          <span className="text-sm text-muted-foreground">{role.description}</span>
                          {formData.role === role.value && (
                            <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-primary" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 1: Personal Information */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Personal Information
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="idNumber">SA ID Number (13 digits) *</Label>
                      <Input id="idNumber" name="idNumber" value={formData.idNumber} onChange={handleChange} maxLength={13} required />
                      {userAge && <p className="text-xs text-muted-foreground mt-1">Age: {userAge} years old</p>}
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
                    </div>
                    
                    {isLearner && (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="gradeApplying">Grade Applying For *</Label>
                            <select id="gradeApplying" name="gradeApplying" value={formData.gradeApplying} onChange={handleChange} required className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground">
                              <option value="">Select grade</option>
                              {grades.map((g) => (
                                <option key={g.name} value={g.name} disabled={!g.available}>
                                  {g.name} {g.available ? `(${g.spots} spots)` : "(FULL)"}
                                </option>
                              ))}
                            </select>
                          </div>
                          {formData.gradeApplying && (
                            <div>
                              <Label htmlFor="classApplying">Class *</Label>
                              <select id="classApplying" name="classApplying" value={formData.classApplying} onChange={handleChange} required className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground">
                                <option value="">Select class</option>
                                {gradeClasses[formData.gradeApplying]?.map((cls) => (
                                  <option key={cls} value={cls}>
                                    {formData.gradeApplying} {cls}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Elective subjects for Grade 10+ */}
                        {isGrade10Plus && (
                          <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                            <Label className="text-base font-semibold text-foreground">Choose 4 Elective Subjects *</Label>
                            <p className="text-sm text-muted-foreground mb-3">
                              Selected: {formData.electiveSubjects.length}/4 subjects
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {grade10to12Electives.map((subject) => (
                                <label
                                  key={subject.name}
                                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                    formData.electiveSubjects.includes(subject.name)
                                      ? "border-primary bg-primary/10"
                                      : "border-border hover:bg-secondary/50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.electiveSubjects.includes(subject.name)}
                                    onChange={() => handleElectiveChange(subject.name)}
                                    className="rounded border-input"
                                  />
                                  <div>
                                    <span className="text-sm text-foreground">{subject.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">({subject.stream})</span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div>
                      <Label htmlFor="hasDisability">Do you have a disability? *</Label>
                      <select id="hasDisability" name="hasDisability" value={formData.hasDisability} onChange={handleChange} required className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground">
                        <option value="">Select</option>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    {formData.hasDisability === "yes" && (
                      <div>
                        <Label htmlFor="disabilityDescription">Please specify your disability and any accommodations needed *</Label>
                        <textarea
                          id="disabilityDescription"
                          name="disabilityDescription"
                          value={formData.disabilityDescription}
                          onChange={handleChange}
                          required
                          rows={3}
                          className="w-full px-4 py-2 rounded-lg bg-secondary border border-input text-foreground resize-none"
                          placeholder="e.g. Visual impairment – requires enlarged print materials and front-row seating"
                        />
                      </div>
                    )}

                    <div className="border-t border-border pt-4 mt-4">
                      <h3 className="font-medium text-foreground mb-3">Create Password</h3>
                      <p className="text-xs text-muted-foreground mb-3">Min 8 characters, at least 1 number and 1 special character</p>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="password">Password *</Label>
                          <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                          {formData.password && validatePassword(formData.password) && (
                            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {validatePassword(formData.password)}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password *</Label>
                          <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Passwords do not match
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact Information */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-primary" />
                      Contact Information
                    </h2>
                    <div>
                      <Label htmlFor="email">Email Address (@gmail.com required) *</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="example@gmail.com" />
                      {formData.email && !validateEmail(formData.email) && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Email must end with @gmail.com
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="backupEmail">Backup Email Address *</Label>
                      <Input id="backupEmail" name="backupEmail" type="email" value={formData.backupEmail} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number (+27 or 0XX) *</Label>
                      <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required placeholder="0XX XXX XXXX" />
                    </div>
                    <div>
                      <Label htmlFor="address">Physical Address *</Label>
                      <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
                    </div>
                    <div className="border-t border-border pt-4">
                      <h3 className="font-medium text-foreground mb-3">Next of Kin</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nextOfKinName">Name *</Label>
                          <Input id="nextOfKinName" name="nextOfKinName" value={formData.nextOfKinName} onChange={handleChange} required />
                        </div>
                        <div>
                          <Label htmlFor="nextOfKinPhone">Phone *</Label>
                          <Input id="nextOfKinPhone" name="nextOfKinPhone" value={formData.nextOfKinPhone} onChange={handleChange} required />
                        </div>
                      </div>
                    </div>
                    
                    {isLearner && (
                      <div>
                        <Label htmlFor="previousSchool">Previous School *</Label>
                        <Input id="previousSchool" name="previousSchool" value={formData.previousSchool} onChange={handleChange} required />
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Parent (Learner) or Professional (Staff) */}
                {step === 3 && isLearner && (
                  <div className="space-y-4">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <School className="w-5 h-5 text-primary" />
                      Parent/Guardian Information
                    </h2>
                    <div>
                      <Label htmlFor="parentName">Full Name *</Label>
                      <Input id="parentName" name="parentName" value={formData.parentName} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="parentIdNumber">ID Number (13 digits) *</Label>
                      <Input id="parentIdNumber" name="parentIdNumber" value={formData.parentIdNumber} onChange={handleChange} maxLength={13} required />
                    </div>
                    <div>
                      <Label htmlFor="parentPhone">Phone Number *</Label>
                      <Input id="parentPhone" name="parentPhone" value={formData.parentPhone} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="parentEmail">Email Address *</Label>
                      <Input id="parentEmail" name="parentEmail" type="email" value={formData.parentEmail} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="parentAddress">Physical Address *</Label>
                      <Input id="parentAddress" name="parentAddress" value={formData.parentAddress} onChange={handleChange} required />
                    </div>
                  </div>
                )}

                {step === 3 && isTeachingStaff && (
                  <div className="space-y-4">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                      Professional Information
                    </h2>
                    <DepartmentSelector departmentId={formData.departmentId} onChange={(val) => setFormData({ ...formData, departmentId: val })} />
                    <div>
                      <Label htmlFor="gradeTeaching">Grade You Will Be Teaching *</Label>
                      <select id="gradeTeaching" name="gradeTeaching" value={formData.gradeTeaching} onChange={handleChange} required className="w-full h-11 px-4 rounded-lg bg-secondary border border-input text-foreground">
                        <option value="">Select grade</option>
                        {grades.map((g) => (
                          <option key={g.name} value={g.name}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Subjects You Will Teach *</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {teacherSubjects.map((subject) => (
                          <label key={subject} className="flex items-center gap-2 p-2 rounded-lg border border-border cursor-pointer hover:bg-secondary/50">
                            <input
                              type="checkbox"
                              checked={formData.subjects.includes(subject)}
                              onChange={() => handleSubjectChange(subject)}
                              className="rounded border-input"
                            />
                            <span className="text-sm text-foreground">{subject}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Documents */}
                {((isLearner && step === 4) || (isTeachingStaff && step === 4) || (isNonTeachingStaff && step === 3)) && (
                  <div className="space-y-4">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-primary" />
                      Upload Documents (Certified)
                    </h2>
                    
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                        <Label htmlFor="idDocument" className="cursor-pointer flex items-center gap-3">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">ID Document (Certified) *</p>
                            <p className="text-xs text-muted-foreground">PDF, JPG or PNG</p>
                          </div>
                          {uploadedFiles.idDocument && <CheckCircle className="w-5 h-5 text-primary" />}
                        </Label>
                        <Input id="idDocument" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload("idDocument")} className="hidden" />
                      </div>

                      <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                        <Label htmlFor="proofOfAddress" className="cursor-pointer flex items-center gap-3">
                          <MapPin className="w-8 h-8 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Proof of Address (Certified) *</p>
                            <p className="text-xs text-muted-foreground">Utility bill or bank statement</p>
                          </div>
                          {uploadedFiles.proofOfAddress && <CheckCircle className="w-5 h-5 text-primary" />}
                        </Label>
                        <Input id="proofOfAddress" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload("proofOfAddress")} className="hidden" />
                      </div>

                      {isLearner && (
                        <>
                          <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                            <Label htmlFor="lastReport" className="cursor-pointer flex items-center gap-3">
                              <FileText className="w-8 h-8 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="font-medium text-foreground">Previous School Report *</p>
                                <p className="text-xs text-muted-foreground">Latest report card</p>
                              </div>
                              {uploadedFiles.lastReport && <CheckCircle className="w-5 h-5 text-primary" />}
                            </Label>
                            <Input id="lastReport" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload("lastReport")} className="hidden" />
                          </div>

                          <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                            <Label htmlFor="parentId" className="cursor-pointer flex items-center gap-3">
                              <User className="w-8 h-8 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="font-medium text-foreground">Parent/Guardian ID (Certified) *</p>
                                <p className="text-xs text-muted-foreground">Parent's certified ID</p>
                              </div>
                              {uploadedFiles.parentId && <CheckCircle className="w-5 h-5 text-primary" />}
                            </Label>
                            <Input id="parentId" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload("parentId")} className="hidden" />
                          </div>
                        </>
                      )}

                      {isStaff && (
                        <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                          <Label htmlFor="qualification" className="cursor-pointer flex items-center gap-3">
                            <BookOpen className="w-8 h-8 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">Qualification Document (Certified) *</p>
                              <p className="text-xs text-muted-foreground">Degree/Diploma certificate</p>
                            </div>
                            {uploadedFiles.qualification && <CheckCircle className="w-5 h-5 text-primary" />}
                          </Label>
                          <Input id="qualification" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload("qualification")} className="hidden" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 5: Payment (Learner only) */}
                {step === 5 && isLearner && (
                  <div className="space-y-4">
                    <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      School Fees Payment
                    </h2>

                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <h3 className="font-semibold text-foreground mb-3">Banking Details</h3>
                      <div className="space-y-2">
                        {[
                          { label: "Bank", value: bankingDetails.bankName },
                          { label: "Account", value: bankingDetails.accountName },
                          { label: "Number", value: bankingDetails.accountNumber },
                          { label: "Branch", value: bankingDetails.branchCode },
                          { label: "Reference", value: `REG-${formData.idNumber || "ID"}` },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between bg-background/50 rounded p-2">
                            <div>
                              <p className="text-xs text-muted-foreground">{item.label}</p>
                              <p className="font-mono text-sm text-foreground">{item.value}</p>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => copyToClipboard(item.value, item.label)}>
                              {copiedField === item.label ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <Label htmlFor="proofOfPayment" className="cursor-pointer flex items-center gap-3">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">Proof of Payment *</p>
                          <p className="text-xs text-muted-foreground">Bank confirmation or screenshot</p>
                        </div>
                        {uploadedFiles.proofOfPayment && <CheckCircle className="w-5 h-5 text-primary" />}
                      </Label>
                      <Input id="proofOfPayment" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload("proofOfPayment")} className="hidden" />
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-border">
                  {step > 0 && (
                    <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                      Previous
                    </Button>
                  )}
                  {((isLearner && step < 5) || (isTeachingStaff && step < 4) || (isNonTeachingStaff && step < 3) || step === 0) ? (
                    <Button type="button" className="ml-auto" onClick={nextStep}>
                      {step === 0 ? "Get Started" : "Next Step"}
                    </Button>
                  ) : (
                    <Button type="submit" className="ml-auto" disabled={submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Submit Application
                    </Button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}

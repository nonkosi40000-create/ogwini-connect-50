import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TeacherRating {
  teacher_id: string;
  teacher_name: string;
  subject: string;
  average_rating: number;
  total_ratings: number;
}

interface TeacherRatingsProps {
  departmentId: string;
}

export function TeacherRatings({ departmentId }: TeacherRatingsProps) {
  const [ratings, setRatings] = useState<TeacherRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, [departmentId]);

  const fetchRatings = async () => {
    setLoading(true);

    try {
      // Get subjects in this department
      const { data: subjects } = await supabase
        .from("subjects")
        .select("name")
        .eq("department_id", departmentId);

      if (!subjects || subjects.length === 0) {
        setRatings([]);
        setLoading(false);
        return;
      }

      const subjectNames = subjects.map((s) => s.name);

      // Get ratings for these subjects
      const { data: ratingsData } = await supabase
        .from("teacher_ratings")
        .select("teacher_id, subject, rating")
        .in("subject", subjectNames);

      if (!ratingsData || ratingsData.length === 0) {
        setRatings([]);
        setLoading(false);
        return;
      }

      // Get teacher profiles
      const teacherIds = [...new Set(ratingsData.map((r) => r.teacher_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", teacherIds);

      // Aggregate ratings by teacher and subject
      const aggregated: Record<string, TeacherRating> = {};

      ratingsData.forEach((rating) => {
        const key = `${rating.teacher_id}-${rating.subject}`;
        if (!aggregated[key]) {
          const profile = profiles?.find((p) => p.user_id === rating.teacher_id);
          aggregated[key] = {
            teacher_id: rating.teacher_id,
            teacher_name: profile
              ? `${profile.first_name} ${profile.last_name}`
              : "Unknown Teacher",
            subject: rating.subject,
            average_rating: 0,
            total_ratings: 0,
          };
        }
        aggregated[key].total_ratings += 1;
        aggregated[key].average_rating += rating.rating;
      });

      // Calculate averages
      Object.values(aggregated).forEach((agg) => {
        agg.average_rating = agg.average_rating / agg.total_ratings;
      });

      setRatings(Object.values(aggregated).sort((a, b) => b.average_rating - a.average_rating));
    } catch (error) {
      console.error("Error fetching ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4) {
      return (
        <Badge variant="default">
          <TrendingUp className="w-3 h-3 mr-1" />
          Excellent
        </Badge>
      );
    } else if (rating >= 3) {
      return (
        <Badge variant="secondary">
          <Minus className="w-3 h-3 mr-1" />
          Good
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <TrendingDown className="w-3 h-3 mr-1" />
          Needs Improvement
        </Badge>
      );
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(rating)
                          ? "text-accent fill-accent"
                          : "text-muted-foreground"
                      }`}
                    />
        ))}
        <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Teacher Performance</h2>
        <p className="text-sm text-muted-foreground">
          Anonymous student ratings for teachers in your department
        </p>
      </div>

      {ratings.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Total Reviews</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratings.map((rating, index) => (
                  <TableRow key={`${rating.teacher_id}-${rating.subject}-${index}`}>
                    <TableCell className="font-medium">{rating.teacher_name}</TableCell>
                    <TableCell>{rating.subject}</TableCell>
                    <TableCell>{renderStars(rating.average_rating)}</TableCell>
                    <TableCell>{rating.total_ratings} reviews</TableCell>
                    <TableCell>{getRatingBadge(rating.average_rating)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Ratings Yet</h3>
            <p className="text-muted-foreground">
              Teacher ratings from students will appear here once submitted.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Loader2, MessageSquare, TrendingUp, TrendingDown, User } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TeacherRating {
  id: string;
  teacher_id: string;
  rating: number;
  feedback: string | null;
  subject: string;
  created_at: string;
}

interface TeacherProfile {
  user_id: string;
  first_name: string;
  last_name: string;
}

interface AggregatedRating {
  teacher: TeacherProfile;
  averageRating: number;
  totalRatings: number;
  ratings: TeacherRating[];
}

interface TeacherRatingsViewProps {
  departmentFilter?: string;
}

export function TeacherRatingsView({ departmentFilter }: TeacherRatingsViewProps) {
  const [loading, setLoading] = useState(true);
  const [aggregatedRatings, setAggregatedRatings] = useState<AggregatedRating[]>([]);

  useEffect(() => {
    fetchRatings();
  }, [departmentFilter]);

  const fetchRatings = async () => {
    setLoading(true);

    // Fetch all teacher ratings
    const { data: ratings, error: ratingsError } = await supabase
      .from('teacher_ratings')
      .select('*')
      .order('created_at', { ascending: false });

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError);
      setLoading(false);
      return;
    }

    // Get unique teacher IDs
    const teacherIds = [...new Set(ratings?.map(r => r.teacher_id) || [])];

    if (teacherIds.length === 0) {
      setAggregatedRatings([]);
      setLoading(false);
      return;
    }

    // Fetch teacher profiles
    const { data: teachers } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', teacherIds);

    // Aggregate ratings by teacher
    const aggregated = teacherIds.map(teacherId => {
      const teacherRatings = ratings?.filter(r => r.teacher_id === teacherId) || [];
      const teacher = teachers?.find(t => t.user_id === teacherId);
      const avgRating = teacherRatings.reduce((sum, r) => sum + r.rating, 0) / teacherRatings.length;

      return {
        teacher: teacher || { user_id: teacherId, first_name: 'Unknown', last_name: 'Teacher' },
        averageRating: avgRating,
        totalRatings: teacherRatings.length,
        ratings: teacherRatings,
      };
    }).sort((a, b) => b.averageRating - a.averageRating);

    setAggregatedRatings(aggregated);
    setLoading(false);
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return <Badge className="bg-primary">Excellent</Badge>;
    if (rating >= 3.5) return <Badge className="bg-accent">Good</Badge>;
    if (rating >= 2.5) return <Badge variant="secondary">Average</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-accent fill-accent' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading ratings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-accent" />
          Teacher Ratings Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {aggregatedRatings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No teacher ratings yet</p>
            <p className="text-sm">Ratings will appear here when students submit feedback.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {aggregatedRatings.map((item) => (
              <AccordionItem key={item.teacher.user_id} value={item.teacher.user_id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{item.teacher.first_name} {item.teacher.last_name}</p>
                        <p className="text-xs text-muted-foreground">{item.totalRatings} ratings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {renderStars(Math.round(item.averageRating))}
                      <span className="font-bold text-lg">{item.averageRating.toFixed(1)}</span>
                      {getRatingBadge(item.averageRating)}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {/* Rating Distribution */}
                    <div className="grid grid-cols-5 gap-2 p-3 rounded-lg bg-secondary/50">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = item.ratings.filter(r => r.rating === star).length;
                        const percentage = (count / item.totalRatings) * 100;
                        return (
                          <div key={star} className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <span className="text-sm font-medium">{star}</span>
                              <Star className="w-3 h-3 text-accent fill-accent" />
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-accent rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{count}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Feedback Comments */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Student Feedback
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {item.ratings.filter(r => r.feedback).slice(0, 10).map(rating => (
                          <div key={rating.id} className="p-3 rounded-lg bg-secondary/30">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">{rating.subject}</span>
                              <div className="flex items-center gap-1">
                                {renderStars(rating.rating)}
                              </div>
                            </div>
                            <p className="text-sm text-foreground">{rating.feedback}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(rating.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                        {item.ratings.filter(r => r.feedback).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            No written feedback yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

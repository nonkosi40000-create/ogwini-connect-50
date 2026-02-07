-- Create storage buckets for library materials and subscription proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('library-materials', 'library-materials', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('subscription-proofs', 'subscription-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for library-materials
CREATE POLICY "Anyone can view library materials" ON storage.objects FOR SELECT USING (bucket_id = 'library-materials');
CREATE POLICY "Librarians can upload library materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'library-materials' AND (has_role(auth.uid(), 'librarian') OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Librarians can delete library materials" ON storage.objects FOR DELETE USING (bucket_id = 'library-materials' AND (has_role(auth.uid(), 'librarian') OR has_role(auth.uid(), 'admin')));

-- Storage policies for subscription-proofs
CREATE POLICY "Learners can upload subscription proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'subscription-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Finance can view subscription proofs" ON storage.objects FOR SELECT USING (bucket_id = 'subscription-proofs' AND (has_role(auth.uid(), 'finance') OR has_role(auth.uid(), 'admin') OR auth.uid()::text = (storage.foldername(name))[1]));

-- Add missing DELETE policy on user_preferences table
-- This allows users to delete their own preference data (GDPR compliance)
CREATE POLICY "Users can delete their own preferences"
ON public.user_preferences
FOR DELETE
USING (auth.uid() = user_id);
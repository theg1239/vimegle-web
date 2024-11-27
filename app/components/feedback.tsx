'use client';

import React from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/app/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface FeedbackFormProps {
  onSubmit: (feedback: { text: string; experience: string }) => Promise<void>;
}

export function FeedbackForm({ onSubmit }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedbackText, setFeedbackText] = React.useState('');
  const [experience, setExperience] = React.useState('neutral');
  const [characterCount, setCharacterCount] = React.useState(0);

  const RATE_LIMIT_DURATION = 60 * 60 * 1000; 

  const getLocalStorageItem = (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      //console.error('Error accessing local storage', error);
      return null;
    }
  };

  const setLocalStorageItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      //console.error('Error accessing local storage', error);
    }
  };

  const handleFeedbackTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const text = e.target.value;
    setFeedbackText(text);
    setCharacterCount(text.length);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        text: feedbackText,
        experience,
      });

      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your valuable feedback!',
      });

      setFeedbackText('');
      setCharacterCount(0);
      setExperience('neutral');
    } catch (error) {
      //console.error('Feedback submission error:', error);
      toast({
        title: 'Submission Failed',
        description:
          'There was an error submitting your feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-purple-900/20 border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <MessageSquare className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Feedback
          </h2>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="feedback"
              className="text-sm font-medium text-gray-200"
            ></Label>
            <Textarea
              id="feedback"
              placeholder="Tell us what you think..."
              className="min-h-[100px] bg-purple-500/5 border-purple-500/20 text-white placeholder-gray-400"
              value={feedbackText}
              onChange={handleFeedbackTextChange}
              required
              maxLength={200}
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">
                {characterCount} / 200 characters
              </p>
              {characterCount > 200 && (
                <p className="text-sm text-red-500">
                  Character limit exceeded. Please limit your feedback to 200
                  characters.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-200">
              How was your experience?
            </Label>
            <RadioGroup
              value={experience}
              onValueChange={setExperience}
              className="flex justify-between"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="positive" id="positive" />
                <Label htmlFor="positive" className="text-sm text-gray-300">
                  Positive
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neutral" id="neutral" />
                <Label htmlFor="neutral" className="text-sm text-gray-300">
                  Neutral
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="negative" id="negative" />
                <Label htmlFor="negative" className="text-sm text-gray-300">
                  Negative
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={
              isSubmitting || characterCount === 0 || characterCount > 200
            }
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-center text-sm text-gray-400">
        Your feedback helps us improve our service
      </CardFooter>
    </Card>
  );
}

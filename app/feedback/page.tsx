'use client';

import { FeedbackForm } from '@/app/components/feedback';
import Header from '@/app/components/header';

export default function FeedbackPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <Header />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.1), transparent 25%)',
          animation: 'mesh 15s ease infinite',
        }}
      />
      <div className="relative z-10 w-full max-w-md mx-auto">
        <FeedbackForm
          onSubmit={async (feedback) => {
            const response = await fetch('/api/feedback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(feedback),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Feedback submission failed');
            }
          }}
        />
      </div>
    </div>
  );
}
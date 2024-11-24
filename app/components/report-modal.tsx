'use client';

import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '@/app/components/ui/button';

interface ReportModalProps {
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ onClose, onSubmit }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
<div className="fixed inset-0 bg-black opacity-50"></div>
<div className="bg-white dark:bg-gray-800 rounded-lg p-6 z-10 w-11/12 max-w-md">
        <Dialog.Title className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Report User</Dialog.Title>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 mb-2">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Select a reason</option>
            <option value="NSFW Content">NSFW Content</option>
            <option value="Harassment">Harassment</option>
            <option value="Spam">Spam</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="flex justify-end space-x-2">
          <Button onClick={onClose} variant="ghost" className="px-4 py-2">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reason} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white">
            Submit
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ReportModal;

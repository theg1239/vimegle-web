"use client";

import React, { useState } from 'react';
import Modal from './modal'; // Adjust the path as necessary
import { Button } from '@/app/components/ui/button';

const ModalTest: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} ariaLabel="Test Modal">
        <div>
          <h2 className="text-xl font-bold mb-4">Test Modal</h2>
          <p>This is a test modal.</p>
          <Button onClick={() => setIsModalOpen(false)} className="mt-4">Close</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ModalTest;

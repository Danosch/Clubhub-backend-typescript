// src/features/support/SupportPage.tsx
import React, { useState } from 'react';
import Button from '../../components/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';

/** Support page with feedback form and simple FAQ accordion. */
export default function SupportPage() {
  const [subject, setSubject]   = useState('');
  const [email, setEmail]       = useState('');
  const [message, setMessage]   = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I join a club?',
      answer: 'Browse clubs on the Explore page and click Join to become a member.'
    },
    {
      question: 'How do I create a new club?',
      answer: 'Navigate to the Clubs section and use the Create Club form to start a new club.'
    },
    {
      question: 'Where can I report a bug or issue?',
      answer: 'Use the form above to send feedback or contact support@example.com.'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Temporarily disabled until backend is implemented
    // Intentionally do nothing
  };

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Support & Feedback</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject"
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Your Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@university.edu"
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your issue or feedback…"
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
          <Button type="submit" disabled variant="neutral">
            Available soon
          </Button>
        </form>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full flex justify-between items-center p-4 text-left"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                {openIndex === idx ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {openIndex === idx && (
                <div className="px-4 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

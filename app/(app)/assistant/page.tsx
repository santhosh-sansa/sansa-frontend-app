'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ThreadSidebar } from '@/components/assistant/thread-sidebar';

export default function AssistantPage() {
  const [activeThread, setActiveThread] = useState<string | null>(null);

  return (
    <div className="flex h-full">
      {/* Thread sidebar */}
      <ThreadSidebar activeThreadId={activeThread} onSelectThread={setActiveThread} />

      {/* Premium Chat Interface */}
      <div className="flex-1">
        <ChatInterface threadId={activeThread ?? undefined} />
      </div>
    </div>
  );
}

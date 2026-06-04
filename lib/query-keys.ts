export const queryKeys = {
  credits: {
    balance: ['credits', 'balance'] as const,
  },
  apiList: (path: string) => ['api-list', path] as const,
  job: (id: string) => ['job', id] as const,
  assistant: {
    threads: ['assistant', 'threads'] as const,
    thread: (id: string) => ['assistant', 'thread', id] as const,
    messages: (threadId: string) => ['assistant', 'messages', threadId] as const,
  },
  notifications: ['notifications'] as const,
};

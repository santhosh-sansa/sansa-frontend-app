'use client';

import { GradientText } from '@/components/ui/gradient-text';
import { EmptyState } from '@/components/ui/empty-state';
import { FolderKanban } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold"><GradientText>Projects</GradientText></h1>
        <p className="text-sm text-muted-foreground">திட்டங்கள் — Manage projects & tasks</p>
      </div>
      <EmptyState icon={<FolderKanban className="h-6 w-6" />} title="Projects Coming Soon" description="Kanban boards, task management, and team collaboration" />
    </div>
  );
}

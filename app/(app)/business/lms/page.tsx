'use client';

import { GradientText } from '@/components/ui/gradient-text';
import { EmptyState } from '@/components/ui/empty-state';
import { GraduationCap } from 'lucide-react';

export default function LmsPage() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold"><GradientText>Learning Management</GradientText></h1>
        <p className="text-sm text-muted-foreground">கற்றல் — Training & courses for your team</p>
      </div>
      <EmptyState icon={<GraduationCap className="h-6 w-6" />} title="LMS Coming Soon" description="Create courses, track progress, and upskill your team with AI-powered learning" />
    </div>
  );
}

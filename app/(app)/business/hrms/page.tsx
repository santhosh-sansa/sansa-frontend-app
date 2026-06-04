'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PulseDot } from '@/components/ui/pulse-dot';
import { Users, Plus, Briefcase } from 'lucide-react';

type Employee = { id: string; name: string; department: string; designation: string; status: string };

export default function HrmsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['hrms', 'employees'],
    queryFn: async () => {
      const res = await apiFetch<{ employees: Employee[] }>('/api/hrms/employees');
      if (isApiError(res)) throw new Error(res.error);
      return res.employees || [];
    },
  });

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold"><GradientText>HRMS</GradientText></h1>
          <p className="text-sm text-muted-foreground">ஊழியர் மேலாண்மை — Employee management</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" />Add Employee</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !data?.length ? (
        <EmptyState icon={<Briefcase className="h-6 w-6" />} title="No employees" description="Add your team members" action={<Button>Add Employee</Button>} />
      ) : (
        <div className="space-y-3">
          {data.map((emp) => (
            <AnimatedCard key={emp.id} className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">{emp.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{emp.name}</p>
                <p className="text-xs text-muted-foreground">{emp.designation} • {emp.department}</p>
              </div>
              <PulseDot status={emp.status === 'active' ? 'online' : 'idle'} />
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}

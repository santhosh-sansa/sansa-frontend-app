'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GradientText } from '@/components/ui/gradient-text';
import { AnimatedCard } from '@/components/ui/animated-card';
import { EmptyState } from '@/components/ui/empty-state';
import { FolderOpen, Upload, File, Image, FileText, Film, Music, MoreVertical } from 'lucide-react';

type DriveItem = { id: string; name: string; objectType: string; mimeType: string; sizeBytes: number; createdAt: string };

function getIcon(mime: string) {
  if (mime.startsWith('image/')) return <Image className="h-5 w-5 text-pink-500" />;
  if (mime.startsWith('video/')) return <Film className="h-5 w-5 text-blue-500" />;
  if (mime.startsWith('audio/')) return <Music className="h-5 w-5 text-amber-500" />;
  if (mime.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DrivePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['drive', 'files'],
    queryFn: async () => {
      const res = await apiFetch<{ files: DriveItem[] }>('/api/drive/files');
      if (isApiError(res)) throw new Error(res.error);
      return res.files || [];
    },
  });

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold"><GradientText>Drive</GradientText></h1>
          <p className="text-sm text-muted-foreground">கோப்புகள் — Your files & uploads</p>
        </div>
        <Button className="gap-2"><Upload className="h-4 w-4" />Upload</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : !data?.length ? (
        <EmptyState icon={<FolderOpen className="h-6 w-6" />} title="Drive is empty" description="Upload files to get started" action={<Button className="gap-2"><Upload className="h-4 w-4" />Upload Files</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((file) => (
            <AnimatedCard key={file.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">{file.objectType === 'folder' ? <FolderOpen className="h-5 w-5 text-primary" /> : getIcon(file.mimeType)}</div>
                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
              </div>
              <div>
                <p className="text-xs font-medium truncate">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatSize(Number(file.sizeBytes))}</p>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}

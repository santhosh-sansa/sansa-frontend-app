'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const HASH_MAP: Record<string, string> = {
  'tools/banner': '/tools/banner',
  'tools/poster': '/tools/poster',
  'tools/card': '/tools/card',
  'tools/social': '/tools/social',
  'tools/thumbnail': '/tools/thumbnail',
  'tools/bg-remove': '/tools/bg-remove',
  'tools/compress': '/tools/compress',
  'tools/whiteboard': '/tools/whiteboard',
  'studio/voice': '/studio/voice',
  'studio/image': '/studio/image',
  'business/crm': '/business/crm',
  'business/hrms': '/business/hrms',
  'business/projects': '/business/projects',
  'business/lms': '/business/lms',
  'business/helpdesk': '/business/helpdesk',
  'platform/drive': '/platform/drive',
  'platform/templates': '/platform/templates',
  'platform/marketplace': '/platform/marketplace',
  'platform/analytics': '/platform/analytics',
  'platform/knowledge': '/platform/knowledge',
  assistant: '/assistant',
};

export function HashRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash && HASH_MAP[hash]) {
      router.replace(HASH_MAP[hash]);
    }
  }, [router]);

  return null;
}

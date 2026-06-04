'use client';

import { Image } from 'lucide-react';
import { ToolPagePremium } from '@/components/ToolPagePremium';

export default function ImageStudioPage() {
  return (
    <ToolPagePremium
      title="Image AI"
      titleTa="பட AI"
      tool="image"
      placeholder="A vibrant Tamil festival scene with kolam patterns, golden light, and traditional silk sarees…"
      description="Generate stunning AI images from text descriptions. Supports English and Tamil prompts."
      creditCost={3}
      icon={<Image className="h-6 w-6" />}
    />
  );
}

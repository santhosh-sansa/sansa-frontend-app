import { ToolPage } from '@/components/ToolPage';

const TOOLS: Record<string, { title: string; titleTa: string }> = {
  banner: { title: 'Banner Maker', titleTa: 'பேனர் தயாரிப்பு' },
  poster: { title: 'Poster Maker', titleTa: 'போஸ்டர் தயாரிப்பு' },
  card: { title: 'Business Cards', titleTa: 'வணிக அட்டை' },
  social: { title: 'Social Media', titleTa: 'சமூக ஊடகம்' },
  thumbnail: { title: 'Thumbnail', titleTa: 'சிறுபடம்' },
};

export function generateStaticParams() {
  return Object.keys(TOOLS).map((tool) => ({ tool }));
}

export default async function ToolRoute({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const meta = TOOLS[tool] || { title: tool, titleTa: tool };
  return <ToolPage title={meta.title} titleTa={meta.titleTa} tool={tool} />;
}

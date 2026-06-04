import {
  MessageSquare,
  LayoutDashboard,
  Palette,
  FolderOpen,
  Users,
  Ticket,
  FileText,
  Bot,
  Mic,
  Settings,
  Shield,
  CreditCard,
  Image,
  Video,
  FileSearch,
  Wand2,
  BarChart3,
  Store,
  Layout,
  Briefcase,
  GraduationCap,
  FolderKanban,
  BookOpen,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  label: string;
  labelTa?: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  isNew?: boolean;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', labelTa: 'டாஷ்போர்டு', href: '/', icon: LayoutDashboard },
      { label: 'AI Chat', labelTa: 'AI அரட்டை', href: '/assistant', icon: MessageSquare },
      { label: 'AI Agents', labelTa: 'AI முகவர்கள்', href: '/agents', icon: Bot, isNew: true },
      { label: 'Automation', labelTa: 'தானியங்கி', href: '/automation', icon: Zap, isNew: true },
    ],
  },
  {
    title: 'Creative Studio',
    items: [
      { label: 'AI Image Gen', labelTa: 'AI பட உருவாக்கம்', href: '/studio/image', icon: Wand2 },
      { label: 'Image Editor', labelTa: 'பட திருத்தி', href: '/studio/editor', icon: Image },
      { label: 'Video Editor', labelTa: 'வீடியோ திருத்தி', href: '/studio/video', icon: Video },
      { label: 'PDF Editor', labelTa: 'PDF திருத்தி', href: '/studio/pdf', icon: FileSearch },
      { label: 'Templates', labelTa: 'வார்ப்புருக்கள்', href: '/studio/templates', icon: Layout },
      { label: 'Voice Studio', labelTa: 'குரல் ஸ்டூடியோ', href: '/studio/voice', icon: Mic },
      { label: 'Creative Tools', labelTa: 'படைப்பு கருவிகள்', href: '/studio', icon: Palette },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'CRM', labelTa: 'தொடர்பு நிர்வாகம்', href: '/business/crm', icon: Users },
      { label: 'Helpdesk', labelTa: 'உதவி மேசை', href: '/business/helpdesk', icon: Ticket },
      { label: 'Invoices', labelTa: 'விலைப்பட்டியல்', href: '/business/invoices', icon: FileText },
      { label: 'HRMS', labelTa: 'ஊழியர் மேலாண்மை', href: '/business/hrms', icon: Briefcase },
      { label: 'Projects', labelTa: 'திட்டங்கள்', href: '/business/projects', icon: FolderKanban },
      { label: 'LMS', labelTa: 'கற்றல் மேலாண்மை', href: '/business/lms', icon: GraduationCap },
    ],
  },
  {
    title: 'Platform',
    items: [
      { label: 'Drive', labelTa: 'கோப்பு சேமிப்பு', href: '/platform/drive', icon: FolderOpen },
      { label: 'Marketplace', labelTa: 'சந்தை', href: '/platform/marketplace', icon: Store },
      { label: 'Analytics', labelTa: 'பகுப்பாய்வு', href: '/platform/analytics', icon: BarChart3 },
      { label: 'Knowledge', labelTa: 'அறிவுத்தளம்', href: '/platform/knowledge', icon: BookOpen },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Billing', labelTa: 'கட்டணம்', href: '/billing', icon: CreditCard },
      { label: 'Settings', labelTa: 'அமைப்புகள்', href: '/settings', icon: Settings },
    ],
  },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Admin Panel', href: '/admin', icon: Shield },
];

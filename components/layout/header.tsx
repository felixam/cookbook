import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
}

export function Header({ title, showBack = false, backHref = '/', actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="flex items-center h-14 px-4 gap-2">
        {showBack && (
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
          </Button>
        )}
        <h1 className="font-semibold text-lg flex-1 truncate">{title}</h1>
        {actions}
      </div>
    </header>
  );
}

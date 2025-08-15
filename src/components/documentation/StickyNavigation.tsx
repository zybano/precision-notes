import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface NavigationAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  loading?: boolean;
  loadingText?: string;
}

interface StickyNavigationProps {
  leftContent?: React.ReactNode;
  rightActions?: NavigationAction[];
  primaryAction?: NavigationAction;
  className?: string;
}

const StickyNavigation: React.FC<StickyNavigationProps> = ({
  leftContent,
  rightActions = [],
  primaryAction,
  className = ''
}) => {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg ${className}`}>
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            {leftContent && (
              <div className="text-sm text-muted-foreground">
                {leftContent}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {rightActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                variant={action.variant || 'outline'}
                size="sm"
              >
                {action.loading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {action.loading ? action.loadingText : action.label}
              </Button>
            ))}
            
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
                variant={primaryAction.variant || 'default'}
              >
                {primaryAction.loading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {primaryAction.loading ? primaryAction.loadingText : primaryAction.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyNavigation;
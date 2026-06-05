import { useCallback } from 'react';

export function useExcelExport() {
  const getThemeName = useCallback(() => {
    if (typeof document === 'undefined') return 'indigo';
    const classes = document.documentElement.className + ' ' + document.body.className;
    if (classes.includes('aura-red')) return 'red';
    if (classes.includes('aura-blue')) return 'blue';
    if (classes.includes('aura-amber')) return 'amber';
    if (classes.includes('aura-orange')) return 'orange';
    if (classes.includes('aura-emerald')) return 'emerald';
    if (classes.includes('aura-rose')) return 'rose';
    if (classes.includes('aura-purple')) return 'purple';
    return 'indigo';
  }, []);

  const handleExcelClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const url = e.currentTarget.href;
    const separator = url.includes('?') ? '&' : '?';
    window.open(`${url}${separator}theme=${getThemeName()}`, '_blank');
  }, [getThemeName]);

  return { getThemeName, handleExcelClick };
}

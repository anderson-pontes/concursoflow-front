import type {ComponentProps,ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {BarChart3} from 'lucide-react';
import {Card,CardContent,CardHeader} from '@/components/ui/card';
import {cn} from '@/lib/utils';

/** Equal-height grid surfaces on desktop; intrinsic height when stacked. */
export function DashboardCard({className,...props}:ComponentProps<typeof Card>) {
 return <Card className={cn('h-auto lg:h-full',className)} {...props}/>;
}
export function DashboardCardHeader({className,...props}:ComponentProps<typeof CardHeader>) {
 return <CardHeader className={cn('flex flex-col gap-1',className)} {...props}/>;
}
export function DashboardCardBody({className,...props}:ComponentProps<typeof CardContent>) {
 return <CardContent className={cn('flex min-h-0 flex-1 flex-col gap-4',className)} {...props}/>;
}
export function DashboardCardActions({className,children}:{className?:string;children:ReactNode}) {
 return <div className={cn('mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-3',className)}>{children}</div>;
}
export function DashboardEmptyPlot({children,to,action}:{children:ReactNode;to:string;action:string}) {
 return <div className="flex min-h-36 flex-1 flex-col items-center justify-center gap-2 rounded-lg bg-muted/20 px-4 py-5 text-center">
  <BarChart3 className="size-7 text-muted-foreground/70" aria-hidden/>
  <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{children}</p>
  <Link to={to} className="inline-flex min-h-10 items-center rounded px-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{action}</Link>
 </div>;
}

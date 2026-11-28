import {apiUnavailableMessage} from '@/lib/apiQuery';
import {CartesianGrid,Line,LineChart,XAxis,YAxis} from 'recharts';
import {ChartContainer,ChartTooltip} from '@/components/ui/chart';
import {CardContent,CardTitle,CardDescription} from '@/components/ui/card';
import {DashboardCard as Card,DashboardCardHeader as CardHeader,DashboardEmptyPlot} from '@/components/dashboard/DashboardCard';
import {Button} from '@/components/ui/button';
import {DashboardStudyProgress} from '@/components/dashboard/DashboardStudyProgress';
import {formatDashboardDuration as fmtMinutosEstudo} from '@/lib/dashboard/analysis';
import {formatNumericDate} from '@/lib/dashboard/dates';
import {percentBR,type DashboardAnalysis,type AnalysisDay} from '@/lib/dashboard/analysis';
import {DashboardKpiSkeleton} from "@/components/dashboard/DashboardPeriodKpis";
export {DashboardDisciplineCharts} from "@/components/dashboard/DashboardDisciplineCharts";
export {DashboardPeriodKpis} from "@/components/dashboard/DashboardPeriodKpis";

export function AnalyticsState({loading,error,retry,cause}:{loading:boolean;error:boolean;retry:()=>void;cause?:unknown}) {
 if (loading) return <DashboardKpiSkeleton />;
 return error ? <Card><CardContent className="pt-2"><p role="alert" className="text-sm">{apiUnavailableMessage(cause) ?? 'Não foi possível carregar os dados deste período.'}</p><Button className="mt-3" variant="outline" onClick={retry}>Tentar novamente</Button></CardContent></Card> : null;
}
function DailyTooltip({day,accuracy}:{day?:AnalysisDay;accuracy:boolean}) {
 if(!day)return null;
 return <div className="rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-md"><p className="mb-2 font-semibold">{formatNumericDate(day.data)}</p>{accuracy?<><p>{percentBR(day.acertos_pct)}</p><p>{day.acertos} acertos / {day.questoes_total} questões</p></>:<><p>Planejado: {fmtMinutosEstudo(day.minutos_planejados)}</p><p>Estudado: {fmtMinutosEstudo(day.minutos_estudados)}</p></>}</div>;
}
const accuracyConfig={acertos_pct:{label:'Acertos',color:'var(--dashboard-success)'}};
export function DashboardDailyCharts({data}:{data:DashboardAnalysis}) {
 const hasQuestions=data.dias.some(d=>d.questoes_total>0);
 const accuracyDays=data.dias.map(day=>({...day,acertos_pct:day.questoes_total>0?day.acertos_pct:null}));
 return <div data-dashboard-row="daily" className="grid items-start gap-4 lg:items-stretch lg:grid-cols-2">
  <DashboardStudyProgress days={data.dias}/>
<Card><CardHeader><CardTitle>Evolução dos acertos</CardTitle><CardDescription>Acertos ÷ questões respondidas · dias sem questões não têm percentual</CardDescription></CardHeader><CardContent className="flex flex-1 flex-col gap-3">{hasQuestions?<><div className="flex min-h-6 items-center gap-1 text-xs"><i className="inline-block size-2.5 rounded-sm bg-dashboard-success" aria-hidden/>Acertos</div><ChartContainer config={accuracyConfig} className="h-64 w-full aspect-auto"><LineChart data={accuracyDays} accessibilityLayer margin={{left:-12,right:8}}><CartesianGrid vertical={false}/><XAxis dataKey="data" tickFormatter={d=>String(d).slice(8,10)+'/'+String(d).slice(5,7)} tickLine={false} minTickGap={24}/><YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} width={50} tickLine={false}/><ChartTooltip content={({active,payload})=>active?<DailyTooltip day={payload?.[0]?.payload as AnalysisDay|undefined} accuracy/>:null}/><Line type="monotone" dataKey="acertos_pct" name="Acertos" stroke="var(--dashboard-success)" strokeWidth={3} connectNulls={false} dot={{r:3,fill:'var(--dashboard-success)'}} isAnimationActive={false}/></LineChart></ChartContainer></>:<DashboardEmptyPlot to="/estudos/historico" action="Ver registros de estudo">Sem questões respondidas neste período. Registre acertos e erros ao estudar.</DashboardEmptyPlot>}</CardContent></Card>
  <details className="min-w-0 rounded-lg border border-border bg-card px-4 py-3 text-sm lg:col-span-2"><summary className="cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ver dados dos gráficos</summary><div className="relative mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><caption className="sr-only">Dados diários do período</caption><thead><tr>{['Data','Planejado','Realizado','Acertos','Respondidas','Taxa'].map(s=><th key={s} className="p-2">{s}</th>)}</tr></thead><tbody>{data.dias.map(d=><tr key={d.data} className="border-t border-border"><td className="p-2 whitespace-nowrap">{formatNumericDate(d.data)}</td><td>{fmtMinutosEstudo(d.minutos_planejados)}</td><td>{fmtMinutosEstudo(d.minutos_estudados)}</td><td>{d.acertos}</td><td>{d.questoes_total}</td><td>{percentBR(d.questoes_total>0?d.acertos_pct:null)}</td></tr>)}</tbody></table></div></details>
 </div>;
}

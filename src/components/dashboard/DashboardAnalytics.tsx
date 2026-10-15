import {useState} from 'react';
import {apiUnavailableMessage} from '@/lib/apiQuery';
import {Link} from 'react-router-dom';
import {BookOpen,CheckCheck,Clock3,ListChecks} from 'lucide-react';
import {CartesianGrid,Line,LineChart,XAxis,YAxis} from 'recharts';
import {ChartContainer,ChartTooltip} from '@/components/ui/chart';
import {CardContent,CardTitle,CardDescription} from '@/components/ui/card';
import {DashboardCard as Card,DashboardCardHeader as CardHeader,DashboardCardActions,DashboardEmptyPlot} from '@/components/dashboard/DashboardCard';
import {Button} from '@/components/ui/button';
import {DashboardStudyProgress} from '@/components/dashboard/DashboardStudyProgress';
import {Skeleton} from '@/components/ui/skeleton';
import {getDisciplinaColor, getDisciplinaPalette} from '@/components/disciplinas/disciplinaPalettes';
import {DisciplineColorIndicator} from '@/components/disciplinas/DisciplineColorIndicator';
import {formatDashboardDuration as fmtMinutosEstudo} from '@/lib/dashboard/analysis';
import {formatNumericDate} from '@/lib/dashboard/dates';
import {percentBR,type DashboardAnalysis,type AnalysisDay,type AnalysisDiscipline} from '@/lib/dashboard/analysis';

export function AnalyticsState({loading,error,retry,cause}:{loading:boolean;error:boolean;retry:()=>void;cause?:unknown}) {
 return loading?<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Carregando indicadores">{[0,1,2,3].map(i=><Skeleton key={i} className="h-28 rounded-xl"/>)}</div>:error?<Card><CardContent className="pt-2"><p role="alert" className="text-sm">{apiUnavailableMessage(cause) ?? 'Não foi possível carregar os dados deste período.'}</p><Button className="mt-3" variant="outline" onClick={retry}>Tentar novamente</Button></CardContent></Card>:null;
}
export function DashboardPeriodKpis({data}:{data:DashboardAnalysis}) {
 const t=data.totais;
 const rows=[
  {label:'Tempo estudado',value:fmtMinutosEstudo(t.minutos_estudados),sub:t.meta_periodo_minutos==null?'Meta não definida':`Meta do período: ${fmtMinutosEstudo(t.meta_periodo_minutos)}`,Icon:Clock3,color:'text-dashboard-time bg-dashboard-time/10'},
  {label:'Questões respondidas',value:t.questoes_total.toLocaleString('pt-BR'),sub:'Acertos + erros · sem questões em branco',Icon:ListChecks,color:'text-dashboard-attention bg-dashboard-attention/10'},
  {label:'Taxa de acertos',value:percentBR(t.acertos_pct),sub:`${t.acertos.toLocaleString('pt-BR')} acertos em ${t.questoes_total.toLocaleString('pt-BR')} questões`,Icon:CheckCheck,color:'text-dashboard-success bg-dashboard-success/10'},
  {label:'Progresso do edital',value:percentBR(t.progresso_edital_pct),sub:`${t.topicos_concluidos} de ${t.topicos_total} tópicos · acumulado atual`,Icon:BookOpen,color:'text-primary bg-primary/10'},
 ];
 return <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{rows.map(({label,value,sub,Icon,color})=><Card key={label} className="gap-2 py-4"><CardContent className="flex items-start gap-3"><span className={`rounded-lg p-2.5 ${color}`}><Icon className="size-5" aria-hidden/></span><div className="min-w-0"><h2 className="text-xs font-medium text-muted-foreground">{label}</h2><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub}</p></div></CardContent></Card>)}</div>;
}
function DailyTooltip({day,accuracy}:{day?:AnalysisDay;accuracy:boolean}) {
 if(!day)return null;
 return <div className="rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-md"><p className="mb-2 font-semibold">{formatNumericDate(day.data)}</p>{accuracy?<><p>{percentBR(day.acertos_pct)}</p><p>{day.acertos} acertos / {day.questoes_total} questões</p></>:<><p>Planejado: {fmtMinutosEstudo(day.minutos_planejados)}</p><p>Estudado: {fmtMinutosEstudo(day.minutos_estudados)}</p></>}</div>;
}
const accuracyConfig={acertos_pct:{label:'Acertos',color:'var(--dashboard-success)'}};
export function DashboardDailyCharts({data}:{data:DashboardAnalysis}) {
 const hasQuestions=data.dias.some(d=>d.questoes_total>0);
 return <div data-dashboard-row="daily" className="grid items-start gap-4 xl:items-stretch xl:grid-cols-2">
  <DashboardStudyProgress days={data.dias}/>
  <Card><CardHeader className="flex flex-col gap-1"><CardTitle>Evolução dos acertos</CardTitle><CardDescription>Acertos ÷ questões respondidas · dias sem questões não têm percentual</CardDescription></CardHeader><CardContent className="flex flex-1 flex-col gap-3"><div className="flex min-h-6 items-center gap-1 text-xs"><i className="inline-block size-2.5 rounded-sm bg-dashboard-success" aria-hidden/>Acertos</div>{hasQuestions?<ChartContainer config={accuracyConfig} className="h-64 w-full aspect-auto"><LineChart data={data.dias} accessibilityLayer margin={{left:-12,right:8}}><CartesianGrid vertical={false}/><XAxis dataKey="data" tickFormatter={d=>String(d).slice(8,10)+'/'+String(d).slice(5,7)} tickLine={false} minTickGap={24}/><YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} width={50} tickLine={false}/><ChartTooltip content={({active,payload})=>active?<DailyTooltip day={payload?.[0]?.payload as AnalysisDay|undefined} accuracy/>:null}/><Line dataKey="acertos_pct" name="Acertos" stroke="var(--dashboard-success)" strokeWidth={3} connectNulls={false} dot={{r:3}} isAnimationActive={false}/></LineChart></ChartContainer>:<DashboardEmptyPlot to="/estudos/historico" action="Ver registros de estudo">Sem questões respondidas neste período. Registre acertos e erros ao estudar.</DashboardEmptyPlot>}</CardContent></Card>
  <details className="min-w-0 rounded-lg border border-border px-4 py-3 text-sm xl:col-span-2"><summary className="cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ver dados dos gráficos</summary><div className="relative mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><caption className="sr-only">Dados diários do período</caption><thead><tr>{['Data','Planejado','Realizado','Acertos','Respondidas','Taxa'].map(s=><th key={s} className="p-2">{s}</th>)}</tr></thead><tbody>{data.dias.map(d=><tr key={d.data} className="border-t border-border"><td className="p-2 whitespace-nowrap">{formatNumericDate(d.data)}</td><td>{fmtMinutosEstudo(d.minutos_planejados)}</td><td>{fmtMinutosEstudo(d.minutos_estudados)}</td><td>{d.acertos}</td><td>{d.questoes_total}</td><td>{percentBR(d.acertos_pct)}</td></tr>)}</tbody></table></div></details>
 </div>;
}
function DisciplineBars({rows,distribution}:{rows:AnalysisDiscipline[];distribution:boolean}) {
 const [expanded,setExpanded]=useState(false);
 const sorted=[...rows].filter(d=>!distribution||d.minutos_estudados>0).sort((a,b)=>distribution?b.minutos_estudados-a.minutos_estudados:(a.progresso_pct??101)-(b.progresso_pct??101)||a.nome.localeCompare(b.nome,'pt-BR'));
 return <Card><CardHeader><CardTitle>{distribution?'Distribuição do tempo':'Progresso por disciplina'}</CardTitle><CardDescription>{distribution?'Somente tempo efetivamente estudado no período':'Acumulado atual · menor progresso primeiro'}</CardDescription></CardHeader>
  <CardContent className="flex flex-1 flex-col gap-4">
   {!sorted.length?<DashboardEmptyPlot to={distribution?'/cronograma':'/disciplinas?view=edital'} action={distribution?'Planejar estudos':'Abrir edital'}>{distribution?'Nenhum estudo registrado neste período.':'Nenhuma disciplina cadastrada.'}</DashboardEmptyPlot>:<div className="space-y-4">{(expanded?sorted:sorted.slice(0,6)).map(d=>{
    const value=distribution?d.participacao_tempo_pct:d.progresso_pct;
    return <div key={d.id}><div className="mb-2 flex items-start justify-between gap-3"><Link to={`/disciplinas/${d.id}`} className="flex min-w-0 items-center gap-2 break-words text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><DisciplineColorIndicator disciplinaId={d.id} shape="dot" label={`Cor de ${d.nome}`} />{d.nome}</Link><span className="shrink-0 text-xs tabular-nums">{distribution?fmtMinutosEstudo(d.minutos_estudados):percentBR(value)}</span></div><div role={value==null?undefined:'meter'} aria-label={`${d.nome}: ${distribution?'participação do tempo':'progresso'}`} aria-valuenow={value??undefined} aria-valuemin={0} aria-valuemax={100} aria-valuetext={percentBR(value)} className="h-4 overflow-hidden rounded-md bg-muted"><div className={`h-full rounded-md ${distribution?getDisciplinaPalette(d.id).progressFill:'bg-primary'}`} style={{width:`${Math.max(0,Math.min(100,value??0))}%`, ...(distribution ? {backgroundColor:getDisciplinaColor(d.id).color} : {})}}/></div><p className="mt-1 text-xs text-muted-foreground">{distribution?`${percentBR(value)} do tempo estudado`:`${d.topicos_concluidos} de ${d.topicos_total} tópicos concluídos`}</p></div>;
   })}</div>}
   <DashboardCardActions>{sorted.length>6&&<Button variant="ghost" onClick={()=>setExpanded(v=>!v)}>{expanded?'Mostrar menos':`Ver todas as ${sorted.length} disciplinas`}</Button>}<Link to="/disciplinas?view=edital" className="inline-flex min-h-10 items-center text-sm font-medium text-primary hover:underline">Abrir edital</Link></DashboardCardActions>
  </CardContent>
 </Card>;
}
export function DashboardDisciplineCharts({data}:{data:DashboardAnalysis}) {
 return <div data-dashboard-row="disciplines" className="grid items-start gap-4 xl:items-stretch xl:grid-cols-2"><DisciplineBars rows={data.disciplinas} distribution={false}/><DisciplineBars rows={data.disciplinas} distribution/></div>;
}

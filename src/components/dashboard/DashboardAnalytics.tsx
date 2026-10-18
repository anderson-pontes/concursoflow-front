import {useState} from 'react';
import {apiUnavailableMessage} from '@/lib/apiQuery';
import {Link} from 'react-router-dom';
import {BookOpen,CheckCheck,Clock3,ListChecks} from 'lucide-react';
import {CartesianGrid,Line,LineChart,XAxis,YAxis,PieChart,Pie,Cell} from 'recharts';
import {ChartContainer,ChartTooltip} from '@/components/ui/chart';
import {CardContent,CardTitle,CardDescription} from '@/components/ui/card';
import {DashboardCard as Card,DashboardCardHeader as CardHeader,DashboardCardActions,DashboardEmptyPlot} from '@/components/dashboard/DashboardCard';
import {Button} from '@/components/ui/button';
import {DashboardStudyProgress} from '@/components/dashboard/DashboardStudyProgress';
import {Skeleton} from '@/components/ui/skeleton';
import {getDisciplinaColor} from '@/components/disciplinas/disciplinaPalettes';
import {DisciplineColorIndicator} from '@/components/disciplinas/DisciplineColorIndicator';
import {formatDashboardDuration as fmtMinutosEstudo} from '@/lib/dashboard/analysis';
import {formatNumericDate} from '@/lib/dashboard/dates';
import {percentBR,type DashboardAnalysis,type AnalysisDay,type AnalysisDiscipline} from '@/lib/dashboard/analysis';
import {studySurface, type StudyTone} from '@/lib/ui/studySurface';

export function AnalyticsState({loading,error,retry,cause}:{loading:boolean;error:boolean;retry:()=>void;cause?:unknown}) {
 return loading?<div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Carregando indicadores">{[0,1,2,3].map(i=><Skeleton key={i} className="h-32 rounded-xl"/>)}</div>:error?<Card><CardContent className="pt-2"><p role="alert" className="text-sm">{apiUnavailableMessage(cause) ?? 'Não foi possível carregar os dados deste período.'}</p><Button className="mt-3" variant="outline" onClick={retry}>Tentar novamente</Button></CardContent></Card>:null;
}
export function DashboardPeriodKpis({data}:{data:DashboardAnalysis}) {
 const t=data.totais;
 const rows=[
  {label:'Tempo estudado',value:fmtMinutosEstudo(t.minutos_estudados),sub:t.meta_periodo_minutos==null?'Meta não definida · período selecionado':`Meta do período: ${fmtMinutosEstudo(t.meta_periodo_minutos)}`,Icon:Clock3,tone:'indigo'},
  {label:'Questões respondidas',value:t.questoes_total.toLocaleString('pt-BR'),sub:'Acertos + erros · sem questões em branco',Icon:ListChecks,tone:'amber'},
  {label:'Taxa de acertos',value:percentBR(t.questoes_total>0?t.acertos_pct:null),sub:`${t.acertos.toLocaleString('pt-BR')} acertos em ${t.questoes_total.toLocaleString('pt-BR')} questões`,Icon:CheckCheck,tone:'emerald'},
  {label:'Progresso do edital',value:percentBR(t.topicos_total>0?t.progresso_edital_pct:null),sub:`${t.topicos_concluidos} de ${t.topicos_total} tópicos · acumulado atual`,Icon:BookOpen,tone:'violet'},
 ];
 return <div aria-label="Indicadores de desempenho" className="grid min-w-0 auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">{rows.map(({label,value,sub,Icon,tone})=><div key={label} className={`flex min-w-0 flex-col rounded-xl p-3 sm:p-4 ${studySurface(tone as StudyTone)}`}><div className="flex min-w-0 items-start justify-between gap-2"><h2 className="min-h-8 min-w-0 text-xs font-medium leading-4">{label}</h2><Icon className="size-4 shrink-0" aria-hidden/></div><p className="my-2 break-words text-2xl font-semibold tabular-nums tracking-tight">{value}</p><p className="mt-auto text-xs leading-relaxed">{sub}</p></div>)}</div>;
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
function DisciplineBars({rows}:{rows:AnalysisDiscipline[]}) {
 const [expanded,setExpanded]=useState(false);
 const sorted=[...rows].sort((a,b)=>(a.progresso_pct??101)-(b.progresso_pct??101)||a.nome.localeCompare(b.nome,'pt-BR'));
 return <Card><CardHeader><CardTitle>Progresso por disciplina</CardTitle><CardDescription>Acumulado atual · menor domínio primeiro</CardDescription></CardHeader>
  <CardContent className="flex flex-1 flex-col gap-4">
   {!sorted.length?<DashboardEmptyPlot to="/disciplinas?view=edital" action="Abrir edital">Nenhuma disciplina cadastrada.</DashboardEmptyPlot>:<div className="space-y-4">{(expanded?sorted:sorted.slice(0,6)).map(d=>{
    const value=d.progresso_pct;
    return <div key={d.id}><div className="mb-2 flex items-start justify-between gap-3"><Link to={`/disciplinas/${d.id}`} className="flex min-w-0 items-start gap-2 text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [overflow-wrap:anywhere]"><DisciplineColorIndicator disciplinaId={d.id} shape="dot" label={`Cor de ${d.nome}`} />{d.nome}</Link><span className="shrink-0 text-xs tabular-nums">{percentBR(value)}</span></div><div role={value==null?undefined:'meter'} aria-label={`${d.nome}: progresso`} aria-valuenow={value??undefined} aria-valuemin={0} aria-valuemax={100} aria-valuetext={percentBR(value)} className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{width:`${Math.max(0,Math.min(100,value??0))}%`,backgroundColor:getDisciplinaColor(d.id).color}}/></div><p className="mt-1 text-xs text-muted-foreground">{d.topicos_concluidos} de {d.topicos_total} tópicos dominados</p></div>;
   })}</div>}
   <DashboardCardActions>{sorted.length>6&&<Button variant="ghost" onClick={()=>setExpanded(v=>!v)}>{expanded?'Mostrar menos':`Ver todas as ${sorted.length} disciplinas`}</Button>}<Link to="/disciplinas?view=edital" className="inline-flex min-h-10 items-center text-sm font-medium text-primary hover:underline">Abrir edital</Link></DashboardCardActions>
  </CardContent>
 </Card>;
}
function TimeDistribution({rows}:{rows:AnalysisDiscipline[]}) {
 const [expanded,setExpanded]=useState(false);
 const sorted=[...rows].filter(row=>row.minutos_estudados>0).sort((a,b)=>b.minutos_estudados-a.minutos_estudados);
 const total=sorted.reduce((sum,row)=>sum+row.minutos_estudados,0);
 return <Card><CardHeader><CardTitle>Distribuição do tempo</CardTitle><CardDescription>{total>0?`${fmtMinutosEstudo(total)} estudados no período`:'Tempo efetivamente estudado no período'}</CardDescription></CardHeader>
  <CardContent className="flex flex-1 flex-col gap-4">
   {!sorted.length?<DashboardEmptyPlot to="/cronograma" action="Planejar estudos">Nenhum estudo registrado neste período.</DashboardEmptyPlot>:<>
    {sorted.length>1?<ChartContainer config={{tempo:{label:'Tempo estudado'}}} className="mx-auto h-48 w-full max-w-xs aspect-auto"><PieChart accessibilityLayer><Pie data={sorted} dataKey="minutos_estudados" nameKey="nome" innerRadius="55%" outerRadius="90%" strokeWidth={2} isAnimationActive={false}>{sorted.map(row=><Cell key={row.id} fill={getDisciplinaColor(row.id).color}/>)}</Pie><ChartTooltip content={({active,payload})=>{const row=payload?.[0]?.payload as AnalysisDiscipline|undefined;return active&&row?<div className="max-w-64 rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-md"><p className="mb-1 font-medium">{row.nome}</p><p>{fmtMinutosEstudo(row.minutos_estudados)} · {percentBR(row.participacao_tempo_pct)} do tempo</p></div>:null;}}/></PieChart></ChartContainer>:<div className="h-3 overflow-hidden rounded-full bg-muted" aria-hidden><div className="h-full w-full rounded-full" style={{backgroundColor:getDisciplinaColor(sorted[0]!.id).color}}/></div>}
    <ul className="space-y-3" aria-label="Tempo por disciplina">{(expanded?sorted:sorted.slice(0,6)).map(row=><li key={row.id} className="flex min-w-0 items-start justify-between gap-3"><Link to={`/disciplinas/${row.id}`} className="flex min-w-0 items-start gap-2 text-sm leading-relaxed hover:underline [overflow-wrap:anywhere]"><DisciplineColorIndicator disciplinaId={row.id} shape="dot"/>{row.nome}</Link><span className="shrink-0 text-right text-sm font-medium tabular-nums">{fmtMinutosEstudo(row.minutos_estudados)}<span className="block text-xs font-normal text-muted-foreground">{percentBR(row.participacao_tempo_pct)} do tempo</span></span></li>)}</ul>
   </>}
   <DashboardCardActions>{sorted.length>6&&<Button variant="ghost" onClick={()=>setExpanded(value=>!value)}>{expanded?'Mostrar menos':`Ver todas as ${sorted.length} disciplinas`}</Button>}<Link to="/estudos/historico" className="inline-flex min-h-10 items-center text-sm font-medium text-primary hover:underline">Ver histórico de estudos</Link></DashboardCardActions>
  </CardContent>
 </Card>;
}
export function DashboardDisciplineCharts({data}:{data:DashboardAnalysis}) {
 return <div data-dashboard-row="disciplines" className="grid items-start gap-4 lg:items-stretch lg:grid-cols-2"><DisciplineBars rows={data.disciplinas}/><TimeDistribution rows={data.disciplinas}/></div>;
}

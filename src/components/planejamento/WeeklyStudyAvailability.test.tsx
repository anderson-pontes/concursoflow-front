import React from "react";
import {render,screen,fireEvent,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {it,expect,vi,beforeAll} from "vitest";
import {WeeklyStudyAvailability} from "@/components/planejamento/WeeklyStudyAvailability";
beforeAll(()=>{HTMLElement.prototype.scrollIntoView??=vi.fn();});
function Harness({initial={0:60,1:60,2:60,3:60,4:60}}:{initial?:Record<number,number>}) {
 const [value,setValue]=React.useState(initial);
 const [valid,setValid]=React.useState(true);
 return <><WeeklyStudyAvailability value={value} onChange={setValue} onValidityChange={setValid} /><output data-testid="minutes">{JSON.stringify(value)}</output><output data-testid="valid">{String(valid)}</output></>;
}
it('restaura a última duração ao reativar e exclui descanso do total',()=>{
 render(<Harness initial={{0:95}}/>);
 fireEvent.click(screen.getByRole('checkbox',{name:'Estudar na Segunda'}));
 expect(screen.getByTestId('minutes')).toHaveTextContent('"0":0');
 expect(screen.queryByRole('combobox',{name:'Duração de Segunda'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('checkbox',{name:'Estudar na Segunda'}));
 expect(screen.getByTestId('minutes')).toHaveTextContent('"0":95');
});
it('aplica em dias úteis, todos, selecionados e limpa sem alterar dias fora do alvo',async()=>{
 render(<Harness initial={{5:45}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Aplicar de seg. a sex.'}));
 expect(JSON.parse(screen.getByTestId('minutes').textContent!)).toEqual({0:120,1:120,2:120,3:120,4:120,5:45});
 fireEvent.click(screen.getByRole('button',{name:'Aplicar todos os dias'}));
 expect(Object.values(JSON.parse(screen.getByTestId('minutes').textContent!))).toEqual(Array(7).fill(120));
 fireEvent.click(screen.getByRole('button',{name:'Limpar semana'}));
 expect(Object.values(JSON.parse(screen.getByTestId('minutes').textContent!))).toEqual(Array(7).fill(0));
 expect(screen.queryByRole('checkbox',{name:'Copiar para Domingo'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Copiar para dias selecionados'}));
 fireEvent.click(screen.getByRole('checkbox',{name:'Copiar para Domingo'}));
 fireEvent.click(screen.getByRole('button',{name:'Aplicar aos dias selecionados'}));
 expect(screen.queryByRole('checkbox',{name:'Copiar para Domingo'})).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Copiar para dias selecionados'})).toHaveFocus();
 expect(JSON.parse(screen.getByTestId('minutes').textContent!)).toEqual({0:0,1:0,2:0,3:0,4:0,5:0,6:120});
});
it('permite HH:mm personalizado e mantém os minutos sem confundir duração com hora do dia',async()=>{
 const user=userEvent.setup();render(<Harness/>);
 screen.getByRole('combobox',{name:'Duração de Segunda'}).focus();
 await user.keyboard('{Enter}');
 fireEvent.click(screen.getByRole('option',{name:'Personalizar duração'}));
 const input=screen.getByRole('textbox',{name:'Duração personalizada de Segunda'});
 fireEvent.change(input,{target:{value:'02:30'}});
 expect(screen.getByTestId('minutes')).toHaveTextContent('"0":150');
 fireEvent.change(input,{target:{value:'02:75'}});
 expect(input).toHaveAttribute('aria-invalid','true');
 await waitFor(()=>expect(screen.getByTestId('valid')).toHaveTextContent('false'));
 expect(screen.getByTestId('minutes')).toHaveTextContent('"0":150');
 fireEvent.click(screen.getByRole('button',{name:'Limpar semana'}));
 await waitFor(()=>expect(screen.queryByText('Use HH:mm, de 00:00 a 24:00.')).not.toBeInTheDocument());
 expect(screen.getByTestId('valid')).toHaveTextContent('true');
});
it('integra seleção e duração no mesmo card sem duplicar controles',()=>{
 const {container}=render(<Harness/>);
 expect(container.querySelectorAll('.availability-day')).toHaveLength(7);
 expect(screen.getAllByRole('checkbox')).toHaveLength(7);
 expect(screen.queryByText('Ajustar duração')).not.toBeInTheDocument();
 const day=screen.getByRole('checkbox',{name:'Estudar na Segunda'}).closest('.availability-day');
 expect(day?.querySelector('[aria-label="Duração de Segunda"]')).toBeInTheDocument();
 expect(screen.queryByRole('combobox',{name:'Duração de Domingo'})).not.toBeInTheDocument();
});
it('descartar um dia inválido limpa o bloqueio e permite reativar a última duração válida',async()=>{
 render(<Harness initial={{0:95}}/>);
 fireEvent.change(screen.getByRole('textbox',{name:'Duração personalizada de Segunda'}),{target:{value:'00:75'}});
 await waitFor(()=>expect(screen.getByTestId('valid')).toHaveTextContent('false'));
 fireEvent.click(screen.getByRole('checkbox',{name:'Estudar na Segunda'}));
 await waitFor(()=>expect(screen.getByTestId('valid')).toHaveTextContent('true'));
 fireEvent.click(screen.getByRole('checkbox',{name:'Estudar na Segunda'}));
 expect(screen.getByRole('textbox',{name:'Duração personalizada de Segunda'})).toHaveValue('01:35');
});
it('aplicação em outro dia preserva uma duração personalizada ainda em edição',async()=>{
 render(<Harness initial={{0:95}}/>);
 fireEvent.change(screen.getByRole('textbox',{name:'Duração personalizada de Segunda'}),{target:{value:'01:'}});
 fireEvent.click(screen.getByRole('button',{name:'Copiar para dias selecionados'}));
 fireEvent.click(screen.getByRole('checkbox',{name:'Copiar para Domingo'}));
 fireEvent.click(screen.getByRole('button',{name:'Aplicar aos dias selecionados'}));
 expect(screen.getByRole('textbox',{name:'Duração personalizada de Segunda'})).toHaveValue('01:');
 expect(screen.getByTestId('valid')).toHaveTextContent('false');
 expect(screen.getByTestId('minutes')).toHaveTextContent('"6":120');
});

import { describe, expect, it } from "vitest";
import { layoutDay, timeMinutes } from "./temporalLayout";
import type { Bloco } from "@/lib/cronograma/types";
const event=(id:string,start:string,end:string)=>({id,hora_inicio:start,hora_fim:end} as Bloco);
describe("temporal agenda",()=>{
  it("rejects unknown and invalid times without inventing them",()=>{
    expect(timeMinutes("")).toBeNull();expect(timeMinutes("24:10")).toBeNull();expect(timeMinutes("08:60")).toBeNull();expect(timeMinutes("08:15:00")).toBe(495);
    const data=layoutDay([event("legacy","",""),event("short","08:00","08:15")]);expect(data.timed).toHaveLength(0);expect(data.agenda.map(e=>e.id)).toEqual(["legacy","short"]);
  });
  it("separates simultaneous events and reuses a lane after an interval",()=>{
    const data=layoutDay([event("a","08:00","10:00"),event("b","09:00","11:00"),event("c","10:00","11:00")]);expect(data.lanes).toBe(2);expect(data.timed.map(e=>e.lane)).toEqual([0,1,0]);
  });
});

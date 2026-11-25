export const scheduleDefaults = {menu:'Programação', badge:'', title:'Programação de Painéis e Mesas Redondas', subtitle:'Programação atualizada.', allDays:'Todos os Dias', allTypes:'Todos os Formatos', panel:'Painel', roundtable:'Mesa Redonda', workshop:'Oficina', other:'Outro', speaker:'Palestrantes', search:'Buscar por tema ou palestrante...'};
export type ScheduleLabels = typeof scheduleDefaults;
export const typeLabel = (type:string, labels:ScheduleLabels) => ({Painel:labels.panel,'Mesa Redonda':labels.roundtable,Oficina:labels.workshop,Outro:labels.other}[type] || type);
export function scheduleDate(iso:string){return new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Rio_Branco',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));}
export function compareSchedule(a:{id:string},b:{id:string},order:string[],fallback:number){const ai=order.indexOf(a.id),bi=order.indexOf(b.id);return ai<0&&bi<0?fallback:ai<0?1:bi<0?-1:ai-bi;}

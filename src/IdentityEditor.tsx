import React,{useEffect,useState,useId} from 'react';
import {supabase} from './lib/supabase';
import {Theme,defaultTheme,colorLabels,normalizeTheme,themeVariables,validHex,contrast} from './lib/theme';

function ColorField({label,description,value,onChange}:{label:string;description?:string;value:string;onChange:(v:string)=>void}){
 const descriptionId=useId();
 const [hex,setHex]=useState(value);useEffect(()=>setHex(value),[value]);const valid=validHex(hex);
 return <div><span className="block text-sm font-medium">{label}</span><div className="flex gap-2 items-center mt-1">
  <input aria-label={label+' — seletor de cor'} aria-describedby={description?descriptionId:undefined} type="color" value={value} onChange={e=>{setHex(e.target.value);onChange(e.target.value)}}/>
  <input aria-label={label+' — hexadecimal'} aria-describedby={description?descriptionId:undefined} className="w-28 font-mono" value={hex} maxLength={7} spellCheck={false} aria-invalid={!valid} onChange={e=>{setHex(e.target.value);if(validHex(e.target.value))onChange(e.target.value)}} onBlur={()=>{if(!valid)setHex(value)}}/>
 </div>{description&&<p id={descriptionId} className="text-sm mt-2">{description}</p>}{!valid&&<small role="alert">Use # e seis dígitos, por exemplo #4338CA. Ao sair, o valor anterior será mantido.</small>}</div>;
}
const gradientLabels={brand:'Logomarca e marca',title:'Texto de destaque da capa',banner:'Banner da programação',hero:'Fundo e sobreposição da capa'};
export default function IdentityEditor(){
 const [theme,setTheme]=useState<Theme>(normalizeTheme(defaultTheme)),[saved,setSaved]=useState<Theme>(normalizeTheme(defaultTheme));
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const dirty=JSON.stringify(theme)!==JSON.stringify(saved);
 useEffect(()=>{let alive=true;(async()=>{try{const {data,error}=await supabase.from('seacom_site_content').select('visual_theme').eq('id',1).single();if(error)throw error;if(alive){const next=normalizeTheme(data.visual_theme);setTheme(next);setSaved(next)}}catch{if(alive)setError('Não foi possível carregar as cores. Verifique a conexão e execute SQL-IDENTIDADE-VISUAL.sql no Supabase antes de tentar novamente.')}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[dirty]);
 function color(key:string,value:string){setTheme(t=>({...t,colors:{...t.colors,[key]:value}}));setNotice('')}
 async function save(){setBusy(true);setNotice('');try{
  const next=normalizeTheme(theme);
  const {data,error}=await supabase.from('seacom_site_content').update({visual_theme:next,updated_at:new Date().toISOString()}).eq('id',1).select('id').single();
  if(error||!data)throw error||Error('Atualização não autorizada.');
  setTheme(next);setSaved(next);setNotice('Identidade visual salva. O site público já pode carregar as novas cores.');window.dispatchEvent(new Event('seacom:content-updated'));
 }catch{setNotice('Não foi possível salvar. Confira sua permissão Site → Editar, a conexão e a migração SQL. Suas alterações continuam na prévia.')}finally{setBusy(false)}}
 const pairs=[['Texto / fundo','text','background'],['Títulos / fundo','title','background'],['Texto / cartão','text','card'],['Botão','buttonText','button'],['Botão ao passar o mouse','buttonText','buttonHover'],['Links / fundo','link','background'],['Menu / cabeçalho','menu','header'],['Rodapé','footerText','footer']];
 if(loading)return <p role="status">Carregando identidade visual...</p>;
 if(error)return <p role="alert">{error} Reabra esta seção para tentar novamente.</p>;
 return <section className="identity-editor space-y-5" aria-labelledby="identity-heading">
  <h2 id="identity-heading" className="text-xl font-bold">Cores e identidade visual</h2>
  <p>Escolha no seletor ou digite a cor hexadecimal. A prévia muda imediatamente. O site público muda somente ao salvar. Sair desta seção descarta alterações pendentes.</p>
  <div className="flex flex-wrap gap-3"><button disabled={busy||!dirty} onClick={save}>{busy?'Salvando...':'Salvar cores'}</button><button disabled={busy} onClick={()=>{setTheme(normalizeTheme(defaultTheme));setNotice('Padrões carregados na prévia. Clique em Salvar cores para publicar.')}}>Restaurar padrões</button><button disabled={busy||!dirty} onClick={()=>{setTheme(normalizeTheme(saved));setNotice('Alterações descartadas.')}}>Descartar alterações</button></div>
  <p role="status" aria-live="polite">{notice||(dirty?'Alterações pendentes de salvamento.':'Identidade salva carregada.')}</p>
  <div className="identity-preview identity-surface" style={themeVariables(theme) as React.CSSProperties} aria-label="Prévia em tempo real">
   <header className="p-4 flex flex-wrap gap-4 items-center"><strong>SEACOM 2026</strong><nav className="flex gap-3"><button type="button">Início</button><button type="button" aria-current="page">Mídias</button></nav></header>
   <div className="identity-hero relative p-6"><div><h3 className="text-2xl font-bold">Sua identidade em destaque</h3><span className="identity-gradient-title bg-clip-text text-transparent text-xl">Semana Acadêmica de Comunicação</span></div></div>
   <div className="p-5"><article className="bg-surface border border-slate-200 rounded-xl p-4 space-y-3"><h3 className="text-slate-900 text-xl font-bold">Notícias e programação</h3><p>Textos, cartões e links acompanham a identidade escolhida.</p><a href="#identity-heading" onClick={e=>e.preventDefault()} className="underline">Link de exemplo</a><div className="flex flex-wrap gap-3"><button type="button">Inscrever-se (prévia)</button><button type="button" disabled>Indisponível</button></div><div className="flex flex-wrap gap-2"><span className="bg-emerald-50 text-emerald-700 p-2 rounded">Sucesso</span><span className="bg-amber-50 text-amber-900 p-2 rounded">Aviso</span><span className="bg-red-50 text-red-700 p-2 rounded">Erro</span></div></article></div>
   <div className="identity-gradient-banner p-5 text-white">Banner da programação</div><div className="identity-gradient-brand p-5 text-white">Gradiente da marca</div><footer className="p-4">SEACOM • Rodapé</footer>
  </div>
  <details open><summary className="font-bold cursor-pointer">Contraste e acessibilidade</summary><p className="text-sm">Referência para texto comum: 4,5:1. Confira também o foco com a tecla Tab e o texto sobre imagens e degradês, que depende de cada ponto do fundo.</p><ul>{pairs.map(([label,a,b])=>{const ratio=contrast(theme.colors[a],theme.colors[b]);return <li key={label}>{label}: {ratio.toFixed(2)}:1 — {ratio>=4.5?'Adequado':'Ajuste as cores para melhorar a leitura'}</li>})}</ul></details>
  <fieldset disabled={busy} className="space-y-4"><legend className="text-lg font-bold">Cores do site</legend><p>Algumas cores são compartilhadas por vários elementos. A descrição de cada campo informa onde a alteração será aplicada. Cabeçalho, menu, botões principais e rodapé têm controles próprios no grupo Elementos do site.</p>
   {[...new Set(Object.values(colorLabels).map(x=>x[0]))].map(group=><details key={group} open={group==='Elementos do site'}><summary className="font-semibold cursor-pointer py-2">{group}</summary><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 py-3">{Object.entries(colorLabels).filter(([,v])=>v[0]===group).map(([key,[,label,description]])=><ColorField key={key} label={label} description={description} value={theme.colors[key]} onChange={v=>color(key,v)}/>)}</div></details>)}
  </fieldset>
  <fieldset disabled={busy} className="space-y-5"><legend className="text-lg font-bold">Degradês</legend>{Object.entries(theme.gradients).map(([key,g])=><div key={key} className="border rounded-xl p-4 space-y-3"><h3 className="font-bold">{gradientLabels[key]}</h3><div className="grid sm:grid-cols-3 gap-3">{[['start','Cor inicial'],['middle','Cor intermediária'],['end','Cor final']].map(([stop,label])=><ColorField key={stop} label={gradientLabels[key]+' — '+label} value={g[stop]} onChange={v=>setTheme(t=>({...t,gradients:{...t.gradients,[key]:{...g,[stop]:v}}}))}/>)}</div><label className="block">Direção <select value={[0,90,180,270].includes(g.angle)?g.angle:'custom'} onChange={e=>{if(e.target.value!=='custom')setTheme(t=>({...t,gradients:{...t.gradients,[key]:{...g,angle:Number(e.target.value)}}}))}}><option value="0">Para cima</option><option value="90">Para a direita</option><option value="180">Para baixo</option><option value="270">Para a esquerda</option><option value="custom">Ângulo personalizado</option></select></label><label className="block">Ângulo: {g.angle}° <input aria-label={gradientLabels[key]+' — ângulo'} type="range" min="0" max="360" value={g.angle} onChange={e=>setTheme(t=>({...t,gradients:{...t.gradients,[key]:{...g,angle:Number(e.target.value)}}}))}/></label><div aria-label={'Prévia do degradê '+gradientLabels[key]} className="h-16 rounded" style={{backgroundImage:`linear-gradient(${g.angle}deg,${g.start},${g.middle},${g.end})`}}/></div>)}</fieldset>
 </section>;
}

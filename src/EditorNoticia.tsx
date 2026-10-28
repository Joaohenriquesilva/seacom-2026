import React,{useEffect,useRef,useState} from 'react';
import {newsToHtml,sanitizeNewsHtml} from './lib/newsRichText';

type Props={value:string,onChange:(value:string)=>void,resetKey:string,onUploadImage?:(file:File)=>Promise<string>};
const button='rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600';
export default function EditorNoticia({value,onChange,resetKey,onUploadImage}:Props){
 const [font,setFont]=useState('Arial'),[size,setSizeState]=useState('16'),[uploading,setUploading]=useState(false),[uploadError,setUploadError]=useState('');
 const fileInput=useRef<HTMLInputElement>(null);
 const savedRange=useRef<Range|null>(null);
 const editor=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(editor.current)editor.current.innerHTML=newsToHtml(value)},[resetKey]);
 const rememberSelection=()=>{const selection=window.getSelection();if(selection?.rangeCount&&editor.current?.contains(selection.anchorNode)){savedRange.current=selection.getRangeAt(0).cloneRange();const el=(selection.anchorNode?.nodeType===Node.ELEMENT_NODE?selection.anchorNode:selection.anchorNode?.parentElement) as HTMLElement|null;if(el){const style=getComputedStyle(el);const family=style.fontFamily.split(',')[0].replace(/["']/g,'').trim();if(['Arial','Georgia','Verdana','Tahoma','Times New Roman','Trebuchet MS','Courier New'].includes(family))setFont(family);const px=Math.round(parseFloat(style.fontSize));if([12,14,16,18,20,24,28,32,36,40].includes(px))setSizeState(String(px));}}};
 const restoreSelection=()=>{editor.current?.focus();if(savedRange.current){const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(savedRange.current)}};
 const insertFigure=(url:string,caption:string)=>{restoreSelection();const selection=window.getSelection();if(!selection?.rangeCount)return;const range=selection.getRangeAt(0);range.deleteContents();const figure=document.createElement('figure');figure.className='seacom-news-figure';const img=document.createElement('img');img.src=url;img.alt=caption||'Fotografia da notícia';figure.append(img);const figcaption=document.createElement('figcaption');figcaption.textContent=caption;figure.append(figcaption);range.insertNode(figure);const p=document.createElement('p');p.append(document.createElement('br'));figure.after(p);range.setStart(p,0);range.collapse(true);selection.removeAllRanges();selection.addRange(range);savedRange.current=range.cloneRange();sync()};
 const addImage=async(file:File)=>{if(!onUploadImage)return;const caption=window.prompt('Legenda da fotografia (ex.: Foto: Victor Hugo Santos)');if(caption===null)return;setUploading(true);setUploadError('');try{const url=await onUploadImage(file);insertFigure(url,caption)}catch(e:any){setUploadError(e?.message||'Não foi possível enviar a imagem.')}finally{setUploading(false)}};
 const quoteSelection=()=>{restoreSelection();const selection=window.getSelection();if(!selection?.rangeCount||selection.isCollapsed){window.alert('Selecione o trecho da citação antes de clicar.');return;}const range=selection.getRangeAt(0);const text=selection.toString();if(!text.trim())return;range.deleteContents();const em=document.createElement('em');em.textContent='“'+text+'”';range.insertNode(em);range.setStartAfter(em);range.collapse(true);selection.removeAllRanges();selection.addRange(range);sync()};
 const sync=()=>{if(editor.current)onChange(sanitizeNewsHtml(editor.current.innerHTML))};
 const cmd=(command:string,arg?:string)=>{restoreSelection();document.execCommand(command,false,arg);sync()};
 const setSize=(size:string)=>{restoreSelection();document.execCommand('fontSize',false,'7');editor.current?.querySelectorAll('font[size="7"]').forEach(el=>{el.removeAttribute('size');(el as HTMLElement).style.fontSize=size+'px'});sync()};
 const link=()=>{const url=window.prompt('Cole o endereço do link (https://...)');if(url===null)return;if(!/^https?:\/\//i.test(url)){window.alert('Use um endereço começando com https:// ou http://');return;}cmd('createLink',url)};
 return <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
  <div className="flex flex-wrap items-center gap-1.5 border-b bg-slate-50 p-2" onMouseDown={e=>{if((e.target as HTMLElement).closest('button'))e.preventDefault()}} role="toolbar" aria-label="Ferramentas de formatação da notícia">
   <select aria-label="Fonte" title="Fonte" className={button} value={font} onChange={e=>{setFont(e.target.value);cmd('fontName',e.target.value)}}>{['Arial','Georgia','Verdana','Tahoma','Times New Roman','Trebuchet MS','Courier New'].map(f=><option key={f} value={f}>{f}</option>)}</select>
   <select aria-label="Tamanho da fonte" title="Tamanho da fonte" className={button} value={size} onChange={e=>{setSizeState(e.target.value);setSize(e.target.value)}}>{[12,14,16,18,20,24,28,32,36,40].map(s=><option key={s} value={s}>{s}px</option>)}</select>
   <select aria-label="Estilo de parágrafo" className={button} defaultValue="" onChange={e=>{if(e.target.value)cmd('formatBlock',e.target.value);e.target.value=''}}><option value="">Parágrafo</option><option value="p">Texto normal</option><option value="h2">Título</option><option value="h3">Subtítulo</option><option value="blockquote">Citação</option></select>
   <button type="button" className={button} title="Transformar seleção em citação com aspas e itálico" onClick={quoteSelection}>“ ” Citação</button>
   {onUploadImage&&<><button type="button" className={button} disabled={uploading} onClick={()=>{rememberSelection();fileInput.current?.click()}}>{uploading?'Enviando foto...':'+ Foto com legenda'}</button><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void addImage(file)}}/></>}
   <button type="button" className={button} title="Negrito" aria-label="Negrito" onClick={()=>cmd('bold')}><b>N</b></button>
   <button type="button" className={button} title="Itálico" aria-label="Itálico" onClick={()=>cmd('italic')}><i>I</i></button>
   <button type="button" className={button} title="Sublinhado" aria-label="Sublinhado" onClick={()=>cmd('underline')}><u>S</u></button>
   <button type="button" className={button} title="Tachado" aria-label="Tachado" onClick={()=>cmd('strikeThrough')}><s>T</s></button>
   <button type="button" className={button} title="Alinhar à esquerda" onClick={()=>cmd('justifyLeft')}>≡</button>
   <button type="button" className={button} title="Centralizar" onClick={()=>cmd('justifyCenter')}>≡ centro</button>
   <button type="button" className={button} title="Alinhar à direita" onClick={()=>cmd('justifyRight')}>≡ direita</button>
   <button type="button" className={button} title="Justificar" onClick={()=>cmd('justifyFull')}>Justificar</button>
   <button type="button" className={button} title="Lista com marcadores" onClick={()=>cmd('insertUnorderedList')}>• Lista</button>
   <button type="button" className={button} title="Lista numerada" onClick={()=>cmd('insertOrderedList')}>1. Lista</button>
   <button type="button" className={button} onClick={link}>Inserir link</button>
   <button type="button" className={button} onClick={()=>cmd('unlink')}>Remover link</button>
   <button type="button" className={button} title="Remover formatação" onClick={()=>cmd('removeFormat')}>Limpar estilo</button>
   <button type="button" className={button} title="Desfazer" onClick={()=>cmd('undo')}>↶</button>
   <button type="button" className={button} title="Refazer" onClick={()=>cmd('redo')}>↷</button>
  </div>
  <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label="Texto completo da notícia" aria-multiline="true" data-placeholder="Escreva aqui o texto completo da notícia..." className="seacom-richtext min-h-[260px] p-4 text-slate-800 outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500" onInput={()=>{sync();rememberSelection()}} onKeyUp={rememberSelection} onMouseUp={rememberSelection} onBlur={sync} onPaste={e=>{e.preventDefault();const plain=e.clipboardData.getData('text/plain');document.execCommand('insertText',false,plain);sync()}}/>
  {uploadError&&<p role="alert" className="p-2 text-red-700">{uploadError}</p>}
  <p className="border-t bg-slate-50 px-3 py-2 text-xs text-slate-600">Selecione um trecho para aplicar a formatação. O texto é salvo junto com a notícia.</p>
 </div>
}

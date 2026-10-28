/** Sanitização compartilhada do HTML das notícias (sem scripts ou atributos de evento). */
const TAGS = new Set(['P','DIV','BR','STRONG','B','EM','I','U','S','STRIKE','H2','H3','H4','BLOCKQUOTE','UL','OL','LI','A','SPAN','FONT']);
const FONTS = ['Arial','Georgia','Verdana','Tahoma','Times New Roman','Trebuchet MS','Courier New'];
const escapeHtml = (s:string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function isRichText(value:string){return /<\/?(?:p|div|br|strong|b|em|i|u|s|h[2-4]|ul|ol|li|blockquote|span|font|a)\b/i.test(value||'')}
export function sanitizeNewsHtml(value:string):string {
 if(typeof document==='undefined')return escapeHtml(value||'');
 const doc=new DOMParser().parseFromString(value||'','text/html');
 const clean=(node:Node):string=>{
  if(node.nodeType===Node.TEXT_NODE)return escapeHtml(node.textContent||'');
  if(node.nodeType!==Node.ELEMENT_NODE)return '';
  const el=node as Element, tag=el.tagName;
  const children=Array.from(el.childNodes).map(clean).join('');
  if(!TAGS.has(tag))return children;
  if(tag==='BR')return '<br>';
  const normalizedTag=tag==='FONT'?'span':tag.toLowerCase();
  const attrs:string[]=[];
  if(tag==='A'){
   const href=el.getAttribute('href')||'';
   if(/^https?:\/\//i.test(href)||/^mailto:/i.test(href))attrs.push(`href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow"`);
  }
  const style=(el.getAttribute('style')||'').split(';');
  const allowed:string[]=[];
  for(const item of style){
   const colon=item.indexOf(':');if(colon<0)continue;
   const property=item.slice(0,colon).trim().toLowerCase(),v=item.slice(colon+1).trim();
   if(property==='font-family'&&FONTS.some(f=>v.replace(/["']/g,'').toLowerCase().split(',')[0].trim()===f.toLowerCase()))allowed.push(`font-family:${v.replace(/[^\w\s,'"-]/g,'')}`);
   if(property==='font-size'&&/^\d{1,2}(px|pt)$/.test(v)&&parseInt(v)>=10&&parseInt(v)<=48)allowed.push(`font-size:${v}`);
   if(property==='text-align'&&/^(left|center|right|justify)$/.test(v))allowed.push(`text-align:${v}`);
   if(property==='color'&&/^(#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/i.test(v))allowed.push(`color:${v}`);
  }
  if(tag==='FONT'){
   const face=el.getAttribute('face')||'';
   if(FONTS.some(f=>f.toLowerCase()===face.toLowerCase()))allowed.push(`font-family:${face}`);
   const size=Number(el.getAttribute('size'));
   if(size>=1&&size<=7)allowed.push(`font-size:${[0,10,13,16,18,24,32,40][size]}px`);
   const color=el.getAttribute('color')||'';
   if(/^#[0-9a-f]{3,8}$/i.test(color))allowed.push(`color:${color}`);
  }
  const align=el.getAttribute('align')||'';
  if(/^(left|center|right|justify)$/.test(align))allowed.push(`text-align:${align}`);
  if(allowed.length)attrs.push(`style="${escapeHtml(allowed.join(';'))}"`);
  return `<${normalizedTag}${attrs.length?' '+attrs.join(' '):''}>${children}</${normalizedTag}>`;
 };
 return Array.from(doc.body.childNodes).map(clean).join('');
}
export function newsToHtml(value:string){return isRichText(value)?sanitizeNewsHtml(value):escapeHtml(value||'').replace(/\r?\n/g,'<br>')}
export function newsPlainText(value:string){if(typeof document==='undefined')return value.replace(/<[^>]+>/g,'');const div=document.createElement('div');div.innerHTML=newsToHtml(value);return (div.textContent||'').trim()}

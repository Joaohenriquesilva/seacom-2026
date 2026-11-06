import React,{useEffect,useState} from 'react';
import {supabase} from './lib/supabase';
import {defaultTheme,normalizeTheme,themeVariables} from './lib/theme';

export default function ThemeProvider({children}:{children:React.ReactNode}){
 const [theme,setTheme]=useState(defaultTheme);
 useEffect(()=>{
  let alive=true,sequence=0;
  async function load(){const request=++sequence;try{
   const {data,error}=await supabase.from('seacom_site_content').select('visual_theme').eq('id',1).maybeSingle();
   if(alive&&request===sequence&&!error)setTheme(normalizeTheme(data?.visual_theme));
  }catch{/* Rede indisponível: mantém a última identidade carregada. */}}
  const refresh=()=>{if(!document.hidden)void load()};
  void load();const timer=window.setInterval(refresh,60000);
  window.addEventListener('seacom:content-updated',refresh);window.addEventListener('focus',refresh);
  document.addEventListener('visibilitychange',refresh);
  return()=>{alive=false;clearInterval(timer);window.removeEventListener('seacom:content-updated',refresh);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)};
 },[]);
 return <div className="identity-surface min-h-screen" style={themeVariables(theme) as React.CSSProperties}>{children}</div>;
}

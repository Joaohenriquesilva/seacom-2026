import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaultTheme,normalizeTheme,themeVariables,validHex,contrast,colorLabels} from '../src/lib/theme.ts';

test('Banco vazio ou migração ainda ausente mantém os padrões',()=>{
 for(const value of [null,undefined,{},[],{colors:null,gradients:'invalid'}])assert.deepEqual(normalizeTheme(value),defaultTheme);
});
test('Rejeita injeção CSS, chaves desconhecidas e valores incompletos',()=>{
 const theme=normalizeTheme({colors:{button:'red; background:url(https://example.com)',title:'#123',text:'#123456',injected:'#ffffff'},gradients:{hero:{start:'url(x)',middle:'#abcdef',end:'#112233',angle:Infinity}}});
 assert.equal(theme.colors.button,defaultTheme.colors.button);assert.equal(theme.colors.text,'#123456');assert.equal(theme.colors.injected,undefined);
 assert.equal(theme.gradients.hero.start,defaultTheme.gradients.hero.start);assert.equal(theme.gradients.hero.angle,90);
 assert.ok(!JSON.stringify(themeVariables(theme)).includes('url('));
});
test('Todas as cores possuem controles e todas geram RGB para opacidade Tailwind',()=>{
 for(const [key,value] of Object.entries(defaultTheme.colors)){assert.ok(colorLabels[key]);assert.ok(validHex(value));assert.match(themeVariables(defaultTheme)['--seacom-'+key],/^\d+ \d+ \d+$/)}
});
test('Ângulos limitados e três cores preservadas após serialização',()=>{
 const theme=normalizeTheme({gradients:{hero:{start:'#112233',middle:'#445566',end:'#778899',angle:999},brand:{angle:-1}}});
 assert.equal(theme.gradients.hero.angle,360);assert.equal(theme.gradients.brand.angle,0);
 assert.equal(themeVariables(theme)['--seacom-gradient-hero'],'linear-gradient(360deg, #112233, #445566, #778899)');
 assert.deepEqual(normalizeTheme(JSON.parse(JSON.stringify(theme))),theme);
});
test('Restaurar e editar não modifica os padrões',()=>{
 const copy=normalizeTheme(defaultTheme);copy.colors.button='#000000';copy.gradients.hero.start='#ffffff';assert.notEqual(copy.colors.button,defaultTheme.colors.button);assert.notEqual(copy.gradients.hero.start,defaultTheme.gradients.hero.start);
});
test('Contraste WCAG: preto/branco e pares principais padrão',()=>{
 assert.equal(contrast('#000000','#ffffff'),21);assert.equal(contrast('#ffffff','#ffffff'),1);
 for(const [a,b]of [['text','background'],['title','background'],['buttonText','button'],['link','background'],['menu','header']])assert.ok(contrast(defaultTheme.colors[a],defaultTheme.colors[b])>=4.5);
});
test('Todas as cores Tailwind usadas no código passam por variáveis',()=>{
 const config=JSON.parse(readFileSync(new URL('../tailwind.config.cjs',import.meta.url),'utf8').replace('module.exports=',''));
 const files=['App','AdminSeguro','ModulosAdmin','Checkin','DefinirSenhaConvite','EditorNoticia','ProgramacaoAdmin','ProgramacaoSupabase','IdentityEditor'];
 for(const f of files){const source=readFileSync(new URL('../src/'+f+'.tsx',import.meta.url),'utf8');for(const match of source.matchAll(/(?:bg|text|border|ring|shadow|outline|from|via|to)-([a-z]+)-(\d{2,3})\b/g)){const [,family,shade]=match;assert.ok(config.theme.extend.colors[family]?.[shade]?.includes('var(--seacom-'),f+': '+family+'-'+shade)}}
});

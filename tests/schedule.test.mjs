import test from 'node:test';
import assert from 'node:assert/strict';
import {compareSchedule,scheduleDate,typeLabel,scheduleDefaults} from '../src/lib/scheduleConfig.ts';
test('ordem manual precede atividades novas e mantém fallback cronológico',()=>{const a={id:'a'},b={id:'b'},c={id:'c'};assert.deepEqual([a,b,c].sort((x,y)=>compareSchedule(x,y,['b','a'],x.id.localeCompare(y.id))).map(x=>x.id),['b','a','c']);assert.equal(compareSchedule(a,b,[], -1),-1)});
test('data do Acre e rótulo sem mudar identificador',()=>{assert.equal(scheduleDate('2026-12-03T02:00:00Z'),'2026-12-02');assert.equal(typeLabel('Painel',{...scheduleDefaults,panel:'Conferência'}),'Conferência')});

import test from 'node:test';
import assert from 'node:assert/strict';
import { editionStyle, selectShowcaseTournament } from '../src/lib/tournament-presentation.ts';

const first = { id:'season-one', status:'finished', startDate:'2026-09-06', endDate:'2026-09-15', participants:[{team:'old-team'}] };
const second = { id:'season-two', status:'upcoming', startDate:'2026-10-15', endDate:'2026-10-27' };
const third = { id:'season-three', status:'upcoming', startDate:'2026-12-10', endDate:'2026-12-22', participants:[{team:'later-team'}] };

test('keeps the last completed roster until the next edition has participants',()=>{
  assert.equal(selectShowcaseTournament([second, first])?.id,'season-one');
  assert.equal(selectShowcaseTournament([{...second,participants:[]},first])?.id,'season-one');
});
test('publishing participants for Series II replaces the old showcase roster',()=>{
  const announced={...second,participants:[{team:'new-team'},{team:'another-team'}]};
  assert.equal(selectShowcaseTournament([first,announced]),announced);
  assert.deepEqual(selectShowcaseTournament([first,announced])?.participants,announced.participants);
});
test('does not substitute a later edition for an unannounced next roster',()=>{
  assert.equal(selectShowcaseTournament([third,second,first])?.id,'season-one');
});
test('a live edition takes precedence over upcoming editions',()=>{
  const live={...first,status:'live'};
  assert.equal(selectShowcaseTournament([third,second,live]),live);
});
test('selects the latest completed roster without reordering the input',()=>{
  const finishedSecond={...second,status:'finished',participants:[{team:'new-team'}]};
  const input=Object.freeze([finishedSecond,first]);
  assert.equal(selectShowcaseTournament(input),finishedSecond);
  assert.equal(input[0],finishedSecond);
});
test('does not invent a roster when no edition has assigned teams',()=>{
  assert.equal(selectShowcaseTournament([]),undefined);
  assert.equal(selectShowcaseTournament([second]),undefined);
});
test('standard blue editions use the site palette while custom colors are scoped',()=>{
  assert.equal(editionStyle(),undefined);
  assert.equal(editionStyle('#1477e7'),undefined);
  const violet=editionStyle('#8b3dff');
  assert.match(violet,/--edition-accent:#8b3dff/);
  assert.match(violet,/--edition-ink:color-mix/);
  assert.doesNotMatch(violet,/--c-bg:/);
  assert.equal(editionStyle('red;display:none'),undefined);
});

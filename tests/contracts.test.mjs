import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { parseDocument, validateDocument, validateBundle } from '../contracts/index.mjs';
import { canonicalContent, computeContentHash } from '../contracts/content-hash.mjs';
import { oracleCanonical, oracleHash, VECTOR } from './fixtures/contracts/hash-oracle.mjs';
import { buildCases, validBundle, clone, good, bad, performanceBundle, fixtureMetrics } from './fixtures/contracts/cases.mjs';

const cases=buildCases();
const manifest=JSON.parse(readFileSync(new URL('./fixtures/contracts/manifest.json',import.meta.url),'utf8'));
const manifestById=new Map(manifest.map(row=>[row.id,row]));
function freeze(value,seen=new Set()) {
 if(value&&typeof value==='object'&&!Object.isFrozen(value)&&!seen.has(value)) {
  seen.add(value);
  for(const descriptor of Object.values(Object.getOwnPropertyDescriptors(value)))if('value'in descriptor)freeze(descriptor.value,seen);
  Object.freeze(value);
 }
 return value;
}
function descriptorSnapshot(root) {
 const records=[];const seen=new Map();
 function visit(value) {
  if(!value||typeof value!=='object')return value;
  if(seen.has(value))return {reference:seen.get(value)};
  const index=records.length;seen.set(value,index);records.push(null);
  const descriptors=Reflect.ownKeys(value).map(key=>{const descriptor=Object.getOwnPropertyDescriptor(value,key);return [key,'value'in descriptor?{...descriptor,value:visit(descriptor.value)}:descriptor];});
  records[index]={prototype:Object.getPrototypeOf(value),descriptors};return {reference:index};
 }
 visit(root);return records;
}
export function checkManifest(rows) {
 assert.equal(new Set(rows.map(row=>row.id)).size,rows.length,'duplicate manifest ID');
 assert.deepEqual(rows.map(row=>row.id).sort(),cases.map(row=>row.id).sort(),'every declared evidence item is required');
 for(const item of cases) {
  const row=rows.find(candidate=>candidate.id===item.id);
  assert.deepEqual(row,{id:item.id,obligationId:item.obligationId,caseId:item.caseId,inputFixture:`cases.mjs#${item.id}`,expected:item.expected},`manifest declaration ${item.id}`);
 }
}
test('V6 manifest completeness and omission rejection',()=>{
 checkManifest(manifest);
 assert.throws(()=>checkManifest(manifest.slice(1)),{name:'AssertionError'});
});
function materialize(item) {
 let data=validBundle().diagnostic;
 let getterCalls=0;
 const factory=item.input.factory;
 const values={undefined:undefined,function:()=>0,symbol:Symbol('input'),bigint:1n,date:new Date(),nan:NaN,infinity:Infinity};
 if(factory in values)data.candidates[0][factory==='date'?'unused':'title']=values[factory];
 if(factory==='date')data.candidates[0]=values.date;
 if(factory==='class'){class Candidate {};data.candidates[0]=new Candidate();}
 if(factory==='sparse')data.hypotheses=new Array(1);
 if(factory==='accessor')Object.defineProperty(data.candidates[0],'title',{enumerable:true,get(){getterCalls++;return 'SECRET-RESPONSE';}});
 if(factory==='cycle')data.extra=data;
 if(factory==='bundle-accessor'){data=validBundle();Object.defineProperty(data,'result',{enumerable:true,get(){getterCalls++;return {};}});}
 if(factory==='bundle-symbol'){data=validBundle();data[Symbol('input')]=true;}
 if(factory==='null-prototype')Object.setPrototypeOf(data,null);
 return {data,getterCalls:()=>getterCalls};
}
for(const item of cases.filter(item=>item.surface!=='performance')) test(`${item.id} [${item.obligationId}/${item.caseId}]`,()=>{
 const expected=manifestById.get(item.id)?.expected;
 assert.ok(expected,'declared manifest expectation must exist');
 const input=item.surface==='factory'?materialize(item):{data:clone(item.input),getterCalls:()=>0};
 freeze(input.data);
 const before=item.surface==='factory'?descriptorSnapshot(input.data):clone(input.data);
 const validate=()=>item.surface==='parser'?parseDocument(input.data,item.kind):item.surface==='bundle'||item.input?.factory?.startsWith('bundle-')?validateBundle(input.data):validateDocument(input.data,item.kind);
 const actual=validate();
 assert.deepEqual(actual,expected);
 assert.deepEqual(validate(),actual,'repeat validation is deterministic');
 assert.equal(input.getterCalls(),0,'getter must never execute');
 if(item.surface==='factory')assert.deepEqual(descriptorSnapshot(input.data),before,'own properties remain unchanged');
 else assert.deepEqual(input.data,before,'input and all snapshots remain unchanged');
 assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort(),'return keys are exactly the expected keys (duplicateOf only when declared)');
 for(const error of actual.errors) assert.deepEqual(Object.keys(error).sort(),['code','path'],'errors reveal only code and pointer');
 assert.ok(!JSON.stringify(actual).includes('SECRET-RESPONSE'));
});
test('V6 approved toolchain Node exact version',()=>assert.equal(process.versions.node,'26.8.1'));
test('V6 approved toolchain npm exact version',()=>assert.match(process.env.npm_config_user_agent??'',/^npm\/11\.19\.0(?:\s|$)/));
test('V5 public API signatures and caller errors never throw',()=>{
 assert.equal(typeof parseDocument,'function');
 assert.equal(typeof validateDocument,'function');
 assert.equal(typeof validateBundle,'function');
 assert.deepEqual(validateDocument(undefined,'diagnostic'),bad('TYPE',''));
 assert.deepEqual(parseDocument(undefined,'diagnostic'),bad('TYPE',''));
 assert.deepEqual(validateBundle(undefined),bad('TYPE',''));
});

test('V2.performance [Q2] jointly maximal padded bundle 10 measured validations',t=>{
 const bundle=performanceBundle();
 const metrics=Object.fromEntries(['diagnostic','lesson','result','map'].map(kind=>[kind,fixtureMetrics(bundle[kind])]));
 for(const metric of Object.values(metrics))assert.ok(metric.bytes<=1048576);
 assert.equal(metrics.diagnostic.bytes,1048576);
 assert.equal(metrics.map.bytes,1048576);
 freeze(bundle);
 assert.deepEqual(validateBundle(bundle),manifestById.get('V2.performance').expected,'excluded warmup must accept the fixture');
 const timings=[];
 for(let run=0;run<10;run++){
  const start=performance.now();
  const result=validateBundle(bundle);
  const elapsed=performance.now()-start;
  assert.deepEqual(result,manifestById.get('V2.performance').expected);
  timings.push(elapsed);
  assert.ok(elapsed<=1000,`run ${run+1}: ${elapsed.toFixed(3)} ms exceeds 1000 ms`);
 }
 t.diagnostic(JSON.stringify({specVersion:4,metrics,timingsMs:timings,maxMs:Math.max(...timings)}));
});

const reverseKeys=value=>Array.isArray(value)?value.map(reverseKeys):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).reverse().map(([key,child])=>[key,reverseKeys(child)])):value;
const baseResult=()=>validBundle().result;
const answered=(answer,extra={})=>{const r=baseResult();r.responses[0].answer=answer;return {...r,...extra};};

test('CH-V3 [V3/C10] fixed vector: canonical string and SHA-256 computed outside Node',async()=>{
 assert.equal(oracleCanonical(VECTOR.input),VECTOR.canonical,'oracle self-check');
 assert.equal(oracleHash(VECTOR.input),VECTOR.hash,'oracle self-check');
 const input=freeze(structuredClone(VECTOR.input));
 assert.equal(canonicalContent(input),VECTOR.canonical);
 assert.equal(await computeContentHash(input),VECTOR.hash);
});
for(const [name,variant] of [
 ['key-order',r=>reverseKeys(r)],
 ['resultId',r=>({...r,resultId:'result-other'})],
 ['contentHash-value',r=>({...r,contentHash:`sha256-${'0'.repeat(64)}`})],
]) test(`CH-V3.same-hash.${name} [V3/${name==='key-order'?'C10':'C9'}] input difference does not change canonicalContent or hash`,async()=>{
 const base=baseResult();
 const changed=freeze(variant(structuredClone(base)));
 assert.equal(canonicalContent(changed),oracleCanonical(base));
 assert.equal(canonicalContent(changed),canonicalContent(freeze(structuredClone(base))));
 assert.equal(await computeContentHash(changed),oracleHash(base));
});
const twoResponses=()=>{const r=baseResult();r.responses.push({...structuredClone(r.responses[0]),responseId:'response-b',attempt:2,previousResponseId:'response-a',recordedAt:'2026-10-04T00:00:01.000Z'});return r;};
for(const [name,make] of [
 ['recordedAt',()=>{const changed=baseResult();changed.responses[0].recordedAt='2026-10-04T00:00:01.000Z';return [baseResult(),changed];}],
 ['nested-array-order',()=>{const original=twoResponses();const changed=twoResponses();changed.responses.reverse();return [original,changed];}],
 ['korean-string',()=>[answered('abc'),answered('한국어 답변')]],
]) test(`CH-V3.different-hash.${name} [V3/C10] hashed content change changes canonicalContent and hash and matches the oracle`,async()=>{
 const [left,right]=make();
 assert.notEqual(oracleCanonical(left),oracleCanonical(right),'oracle: the variants really differ');
 assert.notEqual(canonicalContent(freeze(structuredClone(left))),canonicalContent(freeze(structuredClone(right))));
 const hashes=[await computeContentHash(freeze(structuredClone(left))),await computeContentHash(freeze(structuredClone(right)))];
 assert.notEqual(hashes[0],hashes[1]);
 assert.deepEqual(hashes,[oracleHash(left),oracleHash(right)]);
});

for(const [name,input] of [
 ['base',baseResult()],
 ['korean',answered('한국어로 비용과 놓친 결함을 비교한다')],
 ['korean-reversed-keys',reverseKeys(answered('한국어로 비용과 놓친 결함을 비교한다'))],
 ['two-responses',twoResponses()],
 ['other-resultId',{...baseResult(),resultId:'result-z'}],
]) test(`CH-V6.${name} [V6/C10] node:crypto oracle equals computeContentHash and validateDocument accepts the filled document`,async()=>{
 const doc=freeze(structuredClone(input));
 const expected=oracleHash(input);
 const computed=await computeContentHash(doc);
 assert.equal(computed,expected);
 assert.deepEqual(validateDocument({...input,contentHash:computed},'result'),good);
 assert.deepEqual(validateDocument({...input,contentHash:expected.replace(/.$/,c=>c==='0'?'1':'0')},'result'),bad('HASH','/contentHash'),'a one-digit change is rejected');
});

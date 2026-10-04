import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateInspection,validateSimulationBinding,inspectionModel} from '../examples/manufacturing-inspection/model.mjs';
import {inspectionLesson,inspectionScenarios} from '../examples/manufacturing-inspection/lesson.mjs';
import {inspectionAssessmentGuide} from '../examples/manufacturing-inspection/assessment-guide.mjs';
import {validateDocument} from '../contracts/index.mjs';
import {calculationCases,validationCases,bindingCases,hostileBindingCases,fixed,fields,good,independentBinding} from './fixtures/simulation/cases.mjs';
const cases=[...calculationCases(),...validationCases(),...bindingCases(),...hostileBindingCases()];
const manifest=JSON.parse(readFileSync(new URL('./fixtures/simulation/manifest.json',import.meta.url),'utf8'));
const valueKeys=['sampleSize','truePositive','falsePositive','falseNegative','trueNegative','positiveCount','positivePredictiveValue','accuracy'].sort();
function freeze(value,seen=new Set()){
 if(value&&typeof value==='object'&&!seen.has(value)){seen.add(value);for(const d of Object.values(Object.getOwnPropertyDescriptors(value)))if('value'in d)freeze(d.value,seen);Object.freeze(value);}return value;
}
function snapshot(root){
 const seen=new Map(),records=[];
 function visit(value){if(!value||typeof value!=='object')return value;if(seen.has(value))return {ref:seen.get(value)};const id=records.length;seen.set(value,id);records.push(null);records[id]={prototype:Object.getPrototypeOf(value),descriptors:Reflect.ownKeys(value).map(key=>{const d=Object.getOwnPropertyDescriptor(value,key);return [key,'value'in d?{...d,value:visit(d.value)}:d];})};return {ref:id};}visit(root);return records;
}
function close(actual,expected){
 assert.deepEqual(Object.keys(actual).sort(),valueKeys);
 for(const key of valueKeys)if(expected[key]===null)assert.equal(actual[key],null,key);else {assert.equal(typeof actual[key],'number',key);assert.ok(Math.abs(actual[key]-expected[key])<=1e-9,`${key}: ${actual[key]} vs ${expected[key]}`);}
 assert.ok(Math.abs(actual.truePositive+actual.falsePositive+actual.falseNegative+actual.trueNegative-10000)<=1e-9);
}
export function checkSimulationManifest(rows,items=cases){
 assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);
 assert.deepEqual(rows.map(x=>x.id).sort(),items.map(x=>x.id).sort(),'all spec-declared evidence items must exist');
 for(const row of rows)assert.equal(row.obligationId,row.id.split('.')[0]);
}
test('V5 manifest complete; removing any one finite evidence item fails',()=>{
 checkSimulationManifest(manifest);
 for(const row of manifest){assert.throws(()=>checkSimulationManifest(manifest.filter(x=>x.id!==row.id)),{name:'AssertionError'});assert.throws(()=>checkSimulationManifest(manifest,cases.filter(x=>x.id!==row.id)),{name:'AssertionError'});}
});
for(const item of cases)test(`${item.id} [spec v4]`,()=>{
 freeze(item.input);const before=snapshot(item.input);
 const call=()=>item.id.startsWith('V3')?validateSimulationBinding(item.input.model,item.input.lesson):calculateInspection(item.input);
 const actual=call();
 if(item.expected.ok&&'value'in item.expected){assert.deepEqual(Object.keys(actual).sort(),['ok','value']);assert.equal(actual.ok,true);close(actual.value,item.expected.value);}else assert.deepEqual(actual,item.expected);
 assert.deepEqual(call(),actual,'deterministic repeated call');
 assert.deepEqual(snapshot(item.input),before,'no descriptor or nested input mutation');
 assert.equal(item.calls?.()??0,0,'no getter execution');
 if(!actual.ok){assert.deepEqual(Object.keys(actual).sort(),['errors','ok']);for(const error of actual.errors)assert.deepEqual(Object.keys(error).sort(),['code','path']);assert.ok(!JSON.stringify(actual).includes('SECRET-RESPONSE'));}
 assert.deepEqual(JSON.parse(JSON.stringify(actual)),actual,'output JSON stability including null');
});
test('V3 real model and lesson, deep frozen and JSON round trip',()=>{
 assert.deepEqual(Object.keys(inspectionModel).sort(),['inputIds','modelId','modelRevision','sampleSize','simulationContentId']);
 assert.equal(inspectionModel.modelId,'manufacturing-inspection');assert.equal(inspectionModel.modelRevision,1);assert.equal(inspectionModel.sampleSize,10000);
 assert.deepEqual(Object.keys(inspectionModel.inputIds).sort(),fields.toSorted());
 assert.deepEqual(validateDocument(inspectionLesson,'lesson'),good);
 freeze(inspectionModel);freeze(inspectionLesson);const before=snapshot({model:inspectionModel,lesson:inspectionLesson});
 assert.deepEqual(validateSimulationBinding(inspectionModel,inspectionLesson),good);
 assert.deepEqual(validateSimulationBinding(inspectionModel,inspectionLesson),good);
 assert.deepEqual(snapshot({model:inspectionModel,lesson:inspectionLesson}),before);
 const m=JSON.parse(JSON.stringify(inspectionModel)),l=JSON.parse(JSON.stringify(inspectionLesson));assert.deepEqual(validateSimulationBinding(m,l),good);
 const independent=independentBinding();assert.deepEqual(validateDocument(independent.lesson,'lesson'),good);
});
test('V4 fixed concepts, two decisions and every content role, 18 minute stages',()=>{
 assert.equal(inspectionLesson.concepts.length,5);assert.equal(inspectionLesson.decisions.length,2);
 assert.deepEqual(inspectionLesson.activities.filter(x=>x.required).map(x=>x.stage),['diagnosis','orientation','exploration','assessment','return','map']);
 assert.deepEqual(inspectionLesson.activities.filter(x=>x.required).map(x=>x.minutes),[2,1,6,5,2,2]);
 for(const decision of inspectionLesson.decisions)for(const role of ['explanation','simulation','application','failure','assessment'])assert.equal(inspectionLesson.content.find(x=>x.contentId===decision[`${role}Id`])?.role,role);
 for(const concept of inspectionLesson.concepts)assert.match(concept.label,/[가-힣]/);
 for(const content of inspectionLesson.content)assert.match(content.text,/[가-힣]/);
 assert.deepEqual(inspectionScenarios,fixed.slice(0,3).map(([,scenarioId,values])=>({scenarioId,inputs:Object.fromEntries(fields.map((f,i)=>[f,values[i]]))})));
});
test('V4 assessment guide has every rubric dimension, references and separate fresh oracle',()=>{
 const guide=inspectionAssessmentGuide,rubric=inspectionLesson.rubric;
 assert.deepEqual(Object.keys(guide).sort(),['lessonId','lessonRevision','rubricId','rubricVersion','transferCase','criteria','hints','feedback'].sort());
 for(const key of ['lessonId','lessonRevision'])assert.equal(guide[key],inspectionLesson[key]);
 for(const key of ['rubricId','rubricVersion'])assert.equal(guide[key],rubric[key]);
 assert.deepEqual(guide.transferCase.inputs,{defectPercent:2,detectionPercent:80,falsePositivePercent:2});close(guide.transferCase.expected,fixed[3][3]);
 assert.equal(guide.criteria.length,5);
 assert.deepEqual(guide.criteria.map(x=>x.dimension).sort(),['concept','prediction-model','transfer','question','choice-meaning'].sort());
 for(const criterion of guide.criteria){
  const declared=rubric.criteria.find(x=>x.criterionId===criterion.criterionId);assert.ok(declared);
  for(const key of ['dimension','mode','rule'])assert.equal(criterion[key],declared[key]);
  assert.equal(criterion.mode,criterion.dimension==='prediction-model'?'automatic':'agent');
  assert.deepEqual(Object.keys(criterion).sort(),['criterionId','dimension','mode','rule','examples','pending','skipped'].sort());
  assert.deepEqual(Object.keys(criterion.examples).sort(),['supported','partial','not_demonstrated'].sort());
  for(const text of [...Object.values(criterion.examples),criterion.pending,criterion.skipped])assert.match(text,/[가-힣]/);
 }
 assert.ok(guide.hints.length>=2);for(const hint of guide.hints){assert.deepEqual(Object.keys(hint).sort(),['level','text']);assert.match(hint.text,/[가-힣]/);}
 assert.deepEqual(Object.keys(guide.feedback).sort(),['matched','mismatched']);for(const text of Object.values(guide.feedback))assert.match(text,/[가-힣]/);
 assert.deepEqual(JSON.parse(JSON.stringify(guide)),guide);
});

import {oracleHash, reseal} from './hash-oracle.mjs';
export const clone = value => structuredClone(value);
const dimensions = ['concept','prediction-model','transfer','question','choice-meaning'];
const roles = ['explanation','simulation','application','failure','assessment'];
const stages = ['diagnosis','orientation','exploration','assessment','return','map'];
export function validBundle() {
  const diagnostic = {kind:'diagnostic',version:1,diagnosticId:'diagnostic-a',profileId:'profile-a',contextKind:'work',candidates:[{candidateId:'candidate-a',title:'Manufacturing inspection',decisionQuestion:'Which inspection?',reason:'Decide the inspection',preview:'Compare inspections'}],selection:'candidate-a',confirmation:'confirmed',hypotheses:[{candidateId:'candidate-a',category:'common-knowledge-gap',rationale:'Unknown decision variable',status:'hypothesis'}]};
  const lesson = {kind:'lesson',version:1,lessonId:'lesson-a',lessonRevision:1,profileId:'profile-a',diagnosticId:'diagnostic-a',candidateId:'candidate-a',contextKind:'work',concepts:[{conceptId:'concept-a',conceptRevision:1,label:'Inspection cost'}],content:roles.map(role=>({contentId:`content-${role}`,role,text:`Inspection ${role}`,conceptIds:['concept-a']})),decisions:[{decisionId:'decision-a',question:'Which inspection?',choices:['Inspect','Sample'],requiredInformation:['Cost'],explanationId:'content-explanation',simulationId:'content-simulation',applicationId:'content-application',failureId:'content-failure',assessmentId:'content-assessment'}],inputs:[{inputId:'input-a',unit:'items',min:0,max:10,default:5}],activities:stages.map(stage=>({activityId:`activity-${stage}`,stage,contentIds:['content-assessment'],required:true,minutes:3})),rubric:{rubricId:'rubric-a',rubricVersion:1,criteria:dimensions.map(dimension=>({criterionId:`criterion-${dimension}`,dimension,conceptIds:['concept-a'],contentId:'content-assessment',mode:'agent',rule:'Explain the decision'}))}};
  const result = {kind:'result',version:2,resultId:'result-a',profileId:'profile-a',lessonId:'lesson-a',lessonRevision:1,baseMapRevision:1,sequence:1,previousResultId:null,state:'partial',responses:[{responseId:'response-a',activityId:'activity-assessment',conceptId:'concept-a',conceptRevision:1,purpose:'explanation',attempt:1,previousResponseId:null,answer:'Compare cost and missed defects',help:'none',recordedAt:'2026-10-04T00:00:00.000Z',visibility:'unknown'}],assessments:[{assessmentId:'assessment-a',responseId:'response-a',criterionId:'criterion-concept',rubricVersion:1,status:'pending',reviewer:'unreviewed',context:'Manufacturing inspection',help:'none'}]};
  result.contentHash = oracleHash(result);
  const map = {kind:'map',version:2,profileId:'profile-a',revision:1,lessons:[clone(lesson)],results:[clone(result)],observations:[{observationId:'observation-a',resultId:'result-a',assessmentId:'assessment-a',conceptId:'concept-a',conceptRevision:1}],nextPaths:[{pathId:'path-a',lessonId:'lesson-a',conceptId:'concept-a',conceptRevision:1,reason:'Review inspection cost',lessonStatus:'placed'}]};
  return {diagnostic,lesson,result,map,previousResult:null};
}
export const good = {ok:true,errors:[]};
export const bad = (code,path) => ({ok:false,errors:[{code,path}]});
export function fieldAt(object,path) { const keys=path.split('/').slice(1); let parent=object; for (const key of keys.slice(0,-1)) parent=parent[key]; return [parent,keys.at(-1)]; }
const S = type => ({type});
const E = (...members) => ({type:'enum',members});
const A = (item,min=0,max=1000) => ({type:'array',item,min,max});
const O = fields => ({type:'object',fields});
const id = S('id'), rev=S('revision'), str=S('string'), num=S('number');
const candidate=O({candidateId:id,title:str,decisionQuestion:str,reason:str,preview:str});
const hypothesis=O({candidateId:id,category:E('common-knowledge-gap','unknown-concept'),rationale:str,status:E('hypothesis')});
const concept=O({conceptId:id,conceptRevision:rev,label:str});
const content=O({contentId:id,role:E(...roles),text:str,conceptIds:A(id,1)});
const decision=O({decisionId:id,question:str,choices:A(str,2),requiredInformation:A(str,1),explanationId:id,simulationId:id,applicationId:id,failureId:id,assessmentId:id});
const input=O({inputId:id,unit:str,min:num,max:num,default:num});
const activity=O({activityId:id,stage:E(...stages),contentIds:A(id),required:S('boolean'),minutes:num});
const criterion=O({criterionId:id,dimension:E(...dimensions),conceptIds:A(id,1),contentId:id,mode:E('automatic','agent'),rule:str});
const rubric=O({rubricId:id,rubricVersion:rev,criteria:A(criterion,5)});
const response=O({responseId:id,activityId:id,conceptId:id,conceptRevision:rev,purpose:E('prediction','explanation','transfer','question','choice','view','calculation-error'),attempt:rev,previousResponseId:S('nullable-id'),answer:S('nullable-string'),help:E('none','hint','agent','unknown'),recordedAt:S('timestamp'),visibility:E('before-output','after-output','unknown')});
const assessment=O({assessmentId:id,responseId:id,criterionId:id,rubricVersion:rev,status:E('pending','supported','partial','not_demonstrated','skipped'),reviewer:E('unreviewed','automatic','agent'),context:str,help:E('none','hint','agent','unknown')});
const EXPECTED_VERSION = {diagnostic:1,lesson:1,result:2,map:2};
const root = (kind,fields) => O({kind:E(kind),version:{type:'version',valid:EXPECTED_VERSION[kind]},...fields});
export const syntax = {
 diagnostic:root('diagnostic',{diagnosticId:id,profileId:id,contextKind:E('work','interest'),candidates:A(candidate,1,3),selection:S('nullable-id'),confirmation:E('confirmed','deferred','unconfirmed'),hypotheses:A(hypothesis)}),
 lesson:root('lesson',{lessonId:id,lessonRevision:rev,profileId:id,diagnosticId:id,candidateId:id,contextKind:E('work','interest'),concepts:A(concept,1),content:A(content,1),decisions:A(decision,1),inputs:A(input,1),activities:A(activity,1),rubric}),
 result:root('result',{resultId:id,contentHash:S('contenthash'),profileId:id,lessonId:id,lessonRevision:rev,baseMapRevision:rev,sequence:rev,previousResultId:S('nullable-id'),state:E('partial','completed'),responses:A(response),assessments:A(assessment)}),
 map:root('map',{profileId:id,revision:rev,lessons:A(null),results:A(null),observations:A(O({observationId:id,resultId:id,assessmentId:id,conceptId:id,conceptRevision:rev})),nextPaths:A(O({pathId:id,lessonId:id,conceptId:id,conceptRevision:rev,reason:str,lessonStatus:E('placed','planned')}))})
};
syntax.map.fields.lessons.item=syntax.lesson;
syntax.map.fields.results.item=syntax.result;
function structuralCases(cases) {
 for (const kind of Object.keys(syntax)) {
  const base=validBundle()[kind];
  const add = (id,path,value,expected,remove=false) => {const data=clone(base); const [parent,key]=fieldAt(data,path); if(remove) delete parent[key]; else parent[key]=value; reseal(data); cases.push({id:`V1.${kind}.${id}.${path.replaceAll('/','.')}`,obligationId:'V1',caseId:'C6',surface:'document',kind,input:data,expected});};
  function walk(schema,path,value) {
   if(schema.type==='object') {
    add('extra',`${path}/extra`,true,bad('UNKNOWN_FIELD',`${path}/extra`));
    for(const [field,child] of Object.entries(schema.fields)) {const p=`${path}/${field}`; add('missing',p,null,bad('REQUIRED',p),true); add('wrong-type',p,child.type==='boolean'?0:child.type==='number'||child.type==='revision'||child.type==='version'?'invalid':child.type==='nullable-id'||child.type==='nullable-string'?false:child.type==='array'||child.type==='object'?false:0,bad('TYPE',p)); walk(child,p,value[field]);}
   } else if(schema.type==='array') {if(value.length){add('element-wrong-type',`${path}/0`,schema.item.type==='object'?false:0,bad('TYPE',`${path}/0`));walk(schema.item,`${path}/0`,value[0]);}}
   else if(schema.type==='enum') {
    add('unknown-enum',path,'invalid',bad(path.endsWith('/kind')?'KIND':'VALUE',path));
    for(const member of schema.members) {const data=clone(base); const [parent,key]=fieldAt(data,path); parent[key]=member; data.extra=true; reseal(data); cases.push({id:`V1.${kind}.enum-${member}.${path.replaceAll('/','.')}`,obligationId:'V1',caseId:'C6',surface:'document',kind,input:data,expected:bad('UNKNOWN_FIELD','/extra')});}
   } else if(schema.type==='id'||schema.type==='nullable-id') {
    for(const length of [63,64]){const data=clone(base);const[parent,key]=fieldAt(data,path);parent[key]='a'.repeat(length);data.extra=true;reseal(data);cases.push({id:`V1.${kind}.id-length-${length}.${path.replaceAll('/','.')}`,obligationId:'V1',caseId:'C4',surface:'document',kind,input:data,expected:bad('UNKNOWN_FIELD','/extra')});}
    for(const invalid of ['', 'A','a_b','a'.repeat(65)]) add(`id-${invalid.length}-${invalid.slice(0,2)}`,path,invalid,bad('VALUE',path));
   } else if(schema.type==='string'||schema.type==='nullable-string') add('blank',path,'  ',bad('VALUE',path));
   else if(schema.type==='timestamp') {for(const invalid of ['2026-02-30T00:00:00.000Z','2026-10-04T00:00:00Z','2026-10-04T00:00:00.000+00:00','invalid']) add(`timestamp-${invalid}`,path,invalid,bad('VALUE',path));}
   else if(schema.type==='version') {for(const version of [0,1,path.startsWith('/lessons/')||kind==='lesson'?4:kind==='diagnostic'?3:2,1.5].filter(v=>v!==schema.valid)) add(`version-${version}`,path,version,bad('VERSION',path));}
  }
  walk(syntax[kind],'',base);
 }
}
export function buildCases() {
 const cases=[];
 const rawPush=(id,obligationId,caseId,surface,input,expected=good,kind)=>cases.push({id,obligationId,caseId,surface,input,expected,...(kind?{kind}:{})});
 const push=(id,obligationId,caseId,surface,input,expected=good,kind)=>rawPush(id,obligationId,caseId,surface,reseal(input),expected,kind);
 const doc=(id,kind,change,expected=good,obligation='V3',caseId='C7')=>{const input=clone(validBundle()[kind]); change(input);push(id,obligation,caseId,'document',input,expected,kind);};
 const bundle=(id,change,expected=good,obligation='V3',caseId='C7')=>{const input=validBundle();input.map={kind:'map',version:2,profileId:'profile-a',revision:1,lessons:[],results:[],observations:[],nextPaths:[]};change(input);push(id,obligation,caseId,'bundle',input,expected);};
 for(const kind of Object.keys(syntax)) push(`V1.valid.${kind}`,'V1','C1','document',validBundle()[kind],good,kind);
 structuralCases(cases);
 for(const kind of Object.keys(syntax)) {
  for(const value of [null,0,true,'value',[]]) push(`V1.scalar.${kind}.${JSON.stringify(value)}`,'V1','C11','document',value,bad('TYPE',''),kind);
  push(`V5.roundtrip.${kind}`,'V5','C3','parser',JSON.stringify(validBundle()[kind]),good,kind);
 }
 push('V5.json','V5','C6','parser','{',bad('JSON',''),'diagnostic');
 push('V5.parser-type','V5','C6','parser',false,bad('TYPE',''),'diagnostic');
 push('V5.invalid-kind','V5','C6','document',validBundle().diagnostic,bad('KIND',''),'invalid');
 push('V5.parser-invalid-kind','V5','C6','parser','{}',bad('KIND',''),'invalid');
 doc('V5.multiple-errors','diagnostic',d=>{delete d.profileId;d.contextKind='hobby';},{ok:false,errors:[{code:'REQUIRED',path:'/profileId'},{code:'VALUE',path:'/contextKind'}]},'V5','C12');
 bundle('V5.skip-cross-structural',b=>{b.lesson.profileId='other-profile';delete b.result.state;},bad('REQUIRED','/result/state'),'V5','C12');
 for(const name of ['diagnostic','lesson','result','map','previousResult']) {
  bundle(`V1.envelope.missing.${name}`,b=>delete b[name],bad('REQUIRED',`/${name}`),'V1','C6');
 }
 bundle('V1.envelope.extra',b=>b.extra=true,bad('UNKNOWN_FIELD','/extra'),'V1','C6');
 for(const confirmation of ['confirmed','deferred','unconfirmed']) for(const selection of [null,'candidate-a']) doc(`V3.confirmation.${confirmation}.${selection}`,'diagnostic',d=>{d.confirmation=confirmation;d.selection=selection;},confirmation==='confirmed'?selection?good:bad('STATE','/confirmation'):selection?bad('STATE','/confirmation'):good);
 doc('V3.selection.missing','diagnostic',d=>d.selection='absent',bad('REFERENCE','/selection'));
 doc('V3.hypothesis.missing','diagnostic',d=>d.hypotheses[0].candidateId='absent',bad('REFERENCE','/hypotheses/0/candidateId'));
 doc('V3.candidate.duplicate','diagnostic',d=>d.candidates.push(clone(d.candidates[0])),bad('DUPLICATE','/candidates/1/candidateId'));
 for(const role of roles) {
  doc(`V3.role.${role}.valid`,'lesson',()=>{});
  doc(`V3.role.${role}.missing`,'lesson',l=>l.decisions[0][`${role}Id`]='absent',bad('REFERENCE',`/decisions/0/${role}Id`));
  doc(`V3.role.${role}.wrong`,'lesson',l=>l.decisions[0][`${role}Id`]=`content-${role==='assessment'?'explanation':'assessment'}`,bad('REFERENCE',`/decisions/0/${role}Id`));
 }
 const lessonRefs=['/content/0/conceptIds/0','/activities/0/contentIds/0','/rubric/criteria/0/conceptIds/0','/rubric/criteria/0/contentId'];
 for(const path of lessonRefs) {doc(`V3.lesson.ref.match.${path}`,'lesson',()=>{});doc(`V3.lesson.ref.missing.${path}`,'lesson',l=>{const [p,k]=fieldAt(l,path);p[k]='absent';},bad('REFERENCE',path));}
 doc('V3.criterion.role','lesson',l=>l.rubric.criteria[0].contentId='content-explanation',bad('REFERENCE','/rubric/criteria/0/contentId'));
 for(const collection of ['concepts','content','decisions','inputs','activities']) {const idField={concepts:'conceptId',content:'contentId',decisions:'decisionId',inputs:'inputId',activities:'activityId'}[collection]; doc(`V3.duplicate.${collection}`,'lesson',l=>{const item=clone(l[collection][0]);if(collection==='activities')item.required=false;l[collection].push(item);},bad('DUPLICATE',`/${collection}/${validBundle().lesson[collection].length}/${idField}`));}
 doc('V3.duplicate.criteria','lesson',l=>l.rubric.criteria.push(clone(l.rubric.criteria[0])),bad('DUPLICATE','/rubric/criteria/5/criterionId'));
 for(const stage of stages) doc(`V3.required-stage.${stage}`,'lesson',l=>{l.activities.find(a=>a.stage===stage).required=false;l.activities.find(a=>a.stage!==stage).minutes=6;},bad('STATE','/activities'));
 for(const dimension of dimensions) doc(`V3.dimension.${dimension}`,'lesson',l=>l.rubric.criteria.find(c=>c.dimension===dimension).dimension=dimension==='concept'?'question':'concept',bad('STATE','/rubric/criteria'));
 for(const field of ['diagnosticId','candidateId','contextKind']) bundle(`V3.bundle.${field}`,b=>b.lesson[field]=field==='contextKind'?'interest':'absent',bad('REFERENCE',`/lesson/${field}`));
 bundle('V3.bundle.deferred',b=>{b.diagnostic.confirmation='deferred';b.diagnostic.selection=null;},{ok:false,errors:[{code:'REFERENCE',path:'/lesson/candidateId'},{code:'STATE',path:'/diagnostic/confirmation'}]});
 for(const part of ['diagnostic','lesson','result','map']) bundle(`V3.profile.${part}`,b=>{b[part].profileId='other-profile';if(part==='map'){b.map.lessons=[];b.map.results=[];b.map.observations=[];b.map.nextPaths=[];}},part==='diagnostic'?{ok:false,errors:['lesson','map','result'].map(name=>({code:'PROFILE',path:`/${name}/profileId`}))}:part==='lesson'?{ok:false,errors:[{code:'PROFILE',path:'/lesson/profileId'},{code:'PROFILE',path:'/result/profileId'}]}:bad('PROFILE',`/${part}/profileId`));
 bundle('V3.lessonId',b=>b.result.lessonId='absent',bad('REFERENCE','/result/lessonId'));
 for(const [path,code,value] of [['/result/lessonRevision','REVISION',2],['/result/baseMapRevision','REVISION',2],['/result/responses/0/activityId','REFERENCE','absent'],['/result/responses/0/conceptId','REFERENCE','absent'],['/result/responses/0/conceptRevision','REVISION',2],['/result/assessments/0/criterionId','REFERENCE','absent'],['/result/assessments/0/rubricVersion','REVISION',2]]) bundle(`V3.bundle.ref.${path}`,b=>{const[p,k]=fieldAt(b,path);p[k]=value;if(path==='/result/responses/0/conceptId')b.result.assessments=[];},bad(code,path));
 bundle('V3.criterion.concept-membership',b=>{b.lesson.concepts.push({conceptId:'concept-b',conceptRevision:1,label:'Other concept'});b.result.responses[0].conceptId='concept-b';},bad('REFERENCE','/result/assessments/0/criterionId'));
 for(const mode of ['agent','automatic']) for(const reviewer of ['unreviewed','automatic','agent']) for(const status of ['pending','supported','partial','not_demonstrated','skipped']) {
  const permitted=status==='pending'||status==='skipped'||reviewer===mode;
  bundle(`V4.table.${mode}.${reviewer}.${status}`,b=>{b.map={kind:'map',version:2,profileId:'profile-a',revision:1,lessons:[],results:[],observations:[],nextPaths:[]};b.lesson.rubric.criteria[0].mode=mode;b.result.assessments[0].reviewer=reviewer;b.result.assessments[0].status=status;},permitted?good:reviewer==='unreviewed'?{ok:false,errors:[{code:'STATE',path:'/result/assessments/0/reviewer'},{code:'STATE',path:'/result/assessments/0/status'}]}:bad('STATE','/result/assessments/0/reviewer'),'V4','C8');
 }
 for(const answer of [null,'Performed task']) for(const status of ['pending','supported','skipped']) doc(`V4.answer.${answer===null?'null':'text'}.${status}`,'result',r=>{r.responses[0].answer=answer;r.assessments[0].status=status;r.assessments[0].reviewer='agent';},answer===null&&status==='supported'?bad('STATE','/assessments/0/status'):good,'V4','C8');
 for(const purpose of ['prediction','explanation','transfer','question','choice','view','calculation-error']) doc(`V4.purpose.${purpose}`,'result',r=>{r.responses[0].purpose=purpose;if(purpose==='prediction')r.responses[0].visibility='before-output';r.assessments[0].status='supported';r.assessments[0].reviewer='agent';},['view','calculation-error'].includes(purpose)?bad('STATE','/assessments/0/status'):good,'V4','C8');
 for(const help of ['none','hint','agent','unknown']) {
  doc(`V4.help.${help}.match`,'result',r=>{r.responses[0].help=help;r.assessments[0].help=help;r.assessments[0].status='supported';r.assessments[0].reviewer='agent';},good,'V4','C2');
  doc(`V4.help.${help}.mismatch`,'result',r=>{r.responses[0].help=help;r.assessments[0].help=help==='none'?'hint':'none';},bad('STATE','/assessments/0/help'),'V4','C8');
 }
 doc('V4.context.missing','result',r=>{r.assessments[0].status='supported';r.assessments[0].reviewer='agent';delete r.assessments[0].context;},bad('REQUIRED','/assessments/0/context'),'V4','C8');
 doc('V4.context.present','result',r=>{r.assessments[0].status='supported';r.assessments[0].reviewer='agent';},good,'V4','C2');
 for(const visibility of ['before-output','after-output','unknown']) doc(`V4.prediction.first.${visibility}`,'result',r=>{r.responses[0].purpose='prediction';r.responses[0].visibility=visibility;},visibility==='before-output'?good:bad('STATE','/responses/0/visibility'),'V4','C9');
 function retry(r,purpose='explanation') {r.responses[0].purpose=purpose;if(purpose==='prediction')r.responses[0].visibility='before-output';r.responses.push({...clone(r.responses[0]),responseId:'response-b',attempt:2,previousResponseId:'response-a',recordedAt:'2026-10-04T00:00:01.000Z',visibility:purpose==='prediction'?'after-output':'unknown'});}
 doc('V4.retry.valid','result',r=>retry(r),good,'V4','C9');
 for(const visibility of ['before-output','after-output','unknown']) doc(`V4.prediction.retry.${visibility}`,'result',r=>{retry(r,'prediction');r.responses[1].visibility=visibility;},visibility==='after-output'?good:bad('STATE','/responses/1/visibility'),'V4','C9');
 for(const [field,value,code] of [['attempt',3,'STATE'],['previousResponseId','absent','REFERENCE'],['activityId','activity-map','STATE'],['conceptId','concept-b','STATE'],['purpose','question','STATE'],['recordedAt','2026-10-03T00:00:00.000Z','STATE']]) doc(`V4.retry.${field}`,'result',r=>{retry(r);r.responses[1][field]=value;},bad(code,`/responses/1/${field}`),'V4','C9');
 doc('V4.retry.forward','result',r=>{retry(r);r.responses.reverse();},bad('REFERENCE','/responses/0/previousResponseId'),'V4','C9');
 doc('V4.retry.original-deleted','result',r=>{retry(r);r.responses.shift();r.assessments=[];},bad('REFERENCE','/responses/0/previousResponseId'),'V4','C9');
 doc('V4.first.previous','result',r=>r.responses[0].previousResponseId='absent',bad('STATE','/responses/0/previousResponseId'),'V4','C9');
 doc('V4.sequence.first.previous','result',r=>r.previousResultId='absent',bad('STATE','/previousResultId'),'V4','C9');
 doc('V4.sequence.next.null','result',r=>r.sequence=2,bad('STATE','/previousResultId'),'V4','C9');
 for(const state of ['partial','completed']) doc(`V4.state.${state}`,'result',r=>{r.state=state;r.responses[0].help='unknown';r.assessments[0].help='unknown';},good,'V4','C2');
 doc('V4.skipped-prediction','result',r=>{r.responses[0].purpose='prediction';r.responses[0].visibility='before-output';r.responses[0].answer=null;},good,'V4','C2');
 doc('V4.empty-response','result',r=>{r.responses=[];r.assessments=[];},good,'V4','C10');
 function checkpoint(b){b.previousResult=clone(b.result);b.result.resultId='result-b';b.result.sequence=2;b.result.previousResultId='result-a';retry(b.result);b.result.assessments.push({...clone(b.result.assessments[0]),assessmentId:'assessment-b',responseId:'response-b'});}
 bundle('V4.checkpoint.valid',checkpoint,good,'V4','C3');
 bundle('V4.checkpoint.key-order',b=>{checkpoint(b);b.previousResult.responses[0]=Object.fromEntries(Object.entries(b.previousResult.responses[0]).reverse());},good,'V4','C3');
 bundle('V4.checkpoint.prediction-modified',b=>{b.result.responses[0].purpose='prediction';b.result.responses[0].visibility='before-output';checkpoint(b);b.result.responses[0].purpose='prediction';b.result.responses[0].visibility='before-output';b.result.responses[1].purpose='prediction';b.result.responses[1].visibility='after-output';b.result.responses[0].answer='Replacement prediction';},bad('STATE','/result/responses'),'V4','C9');
 bundle('V4.checkpoint.response-order',b=>{checkpoint(b);b.result.responses.reverse();},{ok:false,errors:[{code:'REFERENCE',path:'/result/responses/0/previousResponseId'},{code:'STATE',path:'/result/responses'}]},'V4','C9');
 bundle('V4.checkpoint.prediction-original-deleted',b=>{b.result.responses[0].purpose='prediction';b.result.responses[0].visibility='before-output';checkpoint(b);b.result.responses[0].purpose='prediction';b.result.responses[0].visibility='before-output';b.result.responses[1].purpose='prediction';b.result.responses[1].visibility='after-output';b.previousResult.assessments=[];b.result.assessments=[];b.result.responses.shift();},{ok:false,errors:[{code:'REFERENCE',path:'/result/responses/0/previousResponseId'},{code:'STATE',path:'/result/responses'}]},'V4','C9');
 bundle('V4.checkpoint.response-modified',b=>{checkpoint(b);b.result.responses[0].answer='Replacement prediction';},bad('STATE','/result/responses'),'V4','C9');
 bundle('V4.checkpoint.response-deleted',b=>{checkpoint(b);b.result.responses=[];b.result.assessments=[];}, {ok:false,errors:[{code:'STATE',path:'/result/assessments'},{code:'STATE',path:'/result/responses'}]},'V4','C9');
 bundle('V4.checkpoint.assessment-modified',b=>{checkpoint(b);b.result.assessments[0].context='Replacement';},bad('STATE','/result/assessments'),'V4','C9');
 bundle('V4.checkpoint.assessment-order',b=>{checkpoint(b);b.result.assessments.reverse();},bad('STATE','/result/assessments'),'V4','C9');
 bundle('V4.checkpoint.absent',b=>{checkpoint(b);b.previousResult=null;},bad('REFERENCE','/result/previousResultId'),'V4','C9');
 for(const [field,code,value] of [['profileId','PROFILE','other-profile'],['lessonId','REFERENCE','other-lesson'],['lessonRevision','REVISION',2],['baseMapRevision','REVISION',2],['sequence','STATE',3]]) bundle(`V4.checkpoint.${field}`,b=>{checkpoint(b);b.previousResult[field]=value;if(field==='sequence'){b.previousResult.previousResultId='result-prior';}},bad(code,`/result/${field}`),'V4','C9');
 bundle('V4.checkpoint.previous-id',b=>{checkpoint(b);b.result.previousResultId='other-result';},bad('REFERENCE','/result/previousResultId'),'V4','C9');
 bundle('V4.same-id.same',b=>{b.map=validBundle().map;},{ok:true,errors:[],duplicateOf:'result-a'},'V4','C3');
 bundle('V4.same-id.conflict',b=>{b.map=validBundle().map;b.result.responses[0].answer='Different content';},bad('CONFLICT','/result/resultId'),'V4','C9');
 bundle('V3.same-lesson.conflict',b=>{b.map=validBundle().map;b.lesson.concepts[0].label='Different label';},bad('CONFLICT','/lesson/lessonRevision'));
 bundle('V3.new-lesson',b=>{b.map.lessons=[];b.map.results=[];b.map.observations=[];b.map.nextPaths=[];});
 doc('V3.map.lesson-revision.same','map',m=>m.lessons.push(clone(m.lessons[0])),bad('DUPLICATE','/lessons/1/lessonId'));
 doc('V3.map.lesson-revision.other','map',m=>{const lesson=clone(m.lessons[0]);lesson.lessonRevision=2;m.lessons.push(lesson);});
 for(const [path,code,value] of [['/lessons/0/profileId','PROFILE','other-profile'],['/results/0/profileId','PROFILE','other-profile'],['/results/0/lessonId','REFERENCE','absent'],['/results/0/lessonRevision','REVISION',2],['/results/0/baseMapRevision','REVISION',2],['/observations/0/resultId','REFERENCE','absent'],['/observations/0/assessmentId','REFERENCE','absent'],['/observations/0/conceptId','REFERENCE','absent'],['/observations/0/conceptRevision','REVISION',2],['/nextPaths/0/lessonId','REFERENCE','absent'],['/nextPaths/0/conceptId','REFERENCE','absent'],['/nextPaths/0/conceptRevision','REVISION',2]]) doc(`V3.map.ref.${path}`,'map',m=>{const[p,k]=fieldAt(m,path);p[k]=value;if(path==='/lessons/0/profileId'){m.results=[];m.observations=[];}},bad(code,path));
 // V13 decision table (R18/C21): lessonStatus x {lessonId absent, conceptId absent, revision mismatch}
 const np=(status,field,value)=>m=>{m.nextPaths[0].lessonStatus=status;if(field)m.nextPaths[0][field]=value;};
 doc('V13.placed.all-exist','map',np('placed'),good,'V13','C21');
 for(const [field,value,code] of [['lessonId','absent','REFERENCE'],['conceptId','absent','REFERENCE'],['conceptRevision',2,'REVISION']]) {
  doc(`V13.placed.${field}-mismatch`,'map',np('placed',field,value),bad(code,`/nextPaths/0/${field}`),'V13','C21');
  doc(`V13.planned.${field}-mismatch`,'map',np('planned',field,value),good,'V13','C21');
 }
 doc('V13.lessonStatus.missing','map',m=>delete m.nextPaths[0].lessonStatus,bad('REQUIRED','/nextPaths/0/lessonStatus'),'V13','C21');
 doc('V13.lessonStatus.other-value','map',np('archived'),bad('VALUE','/nextPaths/0/lessonStatus'),'V13','C21');
 for(const [collection,idField] of [['results','resultId'],['observations','observationId'],['nextPaths','pathId']]) doc(`V3.map.duplicate.${collection}`,'map',m=>m[collection].push(clone(m[collection][0])),bad('DUPLICATE',`/${collection}/1/${idField}`));
 for(const [collection,idField] of [['responses','responseId'],['assessments','assessmentId']]) doc(`V3.result.duplicate.${collection}`,'result',r=>r[collection].push(clone(r[collection][0])),bad('DUPLICATE',`/${collection}/1/${idField}`));
 doc('V3.result.assessment-response','result',r=>r.assessments[0].responseId='absent',bad('REFERENCE','/assessments/0/responseId'));
 doc('V3.map.empty','map',m=>{m.lessons=[];m.results=[];m.observations=[];m.nextPaths=[];},good,'V3','C10');
 doc('V3.map.checkpoint.valid','map',m=>{const b=validBundle();checkpoint(b);m.results.push(b.result);},good);
 doc('V3.map.checkpoint.absent','map',m=>{const b=validBundle();checkpoint(b);m.results=[b.result];m.observations=[];},bad('REFERENCE','/results/0/previousResultId'));
 for(const kind of Object.keys(syntax)) {
  const base=validBundle()[kind];
  function boundaries(schema,path,value) {
   if(schema.type==='object') for(const [name,child] of Object.entries(schema.fields)) boundaries(child,`${path}/${name}`,value[name]);
   else if(schema.type==='array') {
    if(value.length)boundaries(schema.item,`${path}/0`,value[0]);
    const sizes=[schema.min-1,schema.min,schema.min+1,schema.max-1,schema.max,schema.max+1].filter((n,i,all)=>n>=0&&all.indexOf(n)===i);
    for(const n of sizes) {const data=clone(base);const[p,k]=fieldAt(data,path);const sample=value[0]??(schema.item.type==='id'?'concept-a':schema.item.type==='string'?'Value':null);p[k]=Array.from({length:n},()=>clone(sample));data.extra=true;const errors=[{code:'UNKNOWN_FIELD',path:'/extra'}];if(n<schema.min)errors.push({code:'RANGE',path});if(n>schema.max)errors.push({code:'LIMIT',path});errors.sort((a,b)=>a.code.localeCompare(b.code)||a.path.localeCompare(b.path));push(`V2.array.${kind}.${path}.${n}`,'V2','C4','document',data,{ok:false,errors},kind);}
   } else if(schema.type==='revision') for(const n of [0,1,2,Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER+1,1.5]) {const data=clone(base);const[p,k]=fieldAt(data,path);p[k]=n;data.extra=true;const errors=[{code:'UNKNOWN_FIELD',path:'/extra'}];if(n<1||!Number.isSafeInteger(n))errors.push({code:Number.isSafeInteger(n)?'RANGE':'VALUE',path});errors.sort((a,b)=>a.code.localeCompare(b.code)||a.path.localeCompare(b.path));push(`V2.integer.${kind}.${path}.${n}`,'V2','C4','document',data,{ok:false,errors},kind);}
  }
  boundaries(syntax[kind],'',base);
 }

 for(const kind of Object.keys(syntax)) {
  const base=validBundle()[kind];
  const arrays=[];
  function locate(schema,path,value) {
   if(schema.type==='object')for(const [field,child]of Object.entries(schema.fields))locate(child,`${path}/${field}`,value[field]);
   else if(schema.type==='array'){arrays.push({path,schema});if(value.length)locate(schema.item,`${path}/0`,value[0]);}
  }
  locate(syntax[kind],'',base);
  for(const {path,schema}of arrays)for(const size of [schema.max-1,schema.max]){
   const data=clone(base);
   const inLesson=kind==='lesson'||path.startsWith('/lessons/0/');
   const inResult=kind==='result'||path.startsWith('/results/0/');
   const lesson=inLesson?(kind==='lesson'?data:data.lessons[0]):null;
   const result=inResult?(kind==='result'?data:data.results[0]):null;
   const relative=path.replace(/^\/(lessons|results)\/0/,'');
   const[p,k]=fieldAt(data,path);
   if(kind==='diagnostic'&&path==='/candidates')p[k]=Array.from({length:size},(_,i)=>({...clone(base.candidates[0]),candidateId:i===0?'candidate-a':`candidate-${i}`}));
   else if(kind==='diagnostic'&&path==='/hypotheses')p[k]=Array.from({length:size},()=>clone(base.hypotheses[0]));
   else if(inLesson){
    if(relative==='/concepts')lesson.concepts=Array.from({length:size},(_,i)=>({...clone(lesson.concepts[0]),conceptId:i===0?'concept-a':`concept-${i}`}));
    else if(relative==='/content')lesson.content=Array.from({length:size},(_,i)=>i<5?clone(lesson.content[i]):{...clone(lesson.content[0]),contentId:`content-${i}`});
    else if(relative==='/decisions')lesson.decisions=Array.from({length:size},(_,i)=>({...clone(lesson.decisions[0]),decisionId:i===0?'decision-a':`decision-${i}`}));
    else if(relative==='/inputs')lesson.inputs=Array.from({length:size},(_,i)=>({...clone(lesson.inputs[0]),inputId:i===0?'input-a':`input-${i}`}));
    else if(relative==='/activities')lesson.activities=Array.from({length:size},(_,i)=>i<6?clone(lesson.activities[i]):{...clone(lesson.activities[0]),activityId:`activity-${i}`,required:false});
    else if(relative==='/rubric/criteria')lesson.rubric.criteria=Array.from({length:size},(_,i)=>i<5?clone(lesson.rubric.criteria[i]):{...clone(lesson.rubric.criteria[0]),criterionId:`criterion-${i}`});
    else if(relative.endsWith('/conceptIds')){lesson.concepts=Array.from({length:size},(_,i)=>({...clone(lesson.concepts[0]),conceptId:i===0?'concept-a':`concept-${i}`}));p[k]=lesson.concepts.map(c=>c.conceptId);}
    else if(relative.endsWith('/contentIds')){lesson.content=Array.from({length:size},(_,i)=>i<5?clone(lesson.content[i]):{...clone(lesson.content[0]),contentId:`content-${i}`});p[k]=lesson.content.map(c=>c.contentId);}
    else p[k]=Array.from({length:size},()=>clone(p[k][0]));
   }else if(inResult){
    if(relative==='/responses')result.responses=Array.from({length:size},(_,i)=>({...clone(result.responses[0]),responseId:i===0?'response-a':`response-${i}`,attempt:i+1,previousResponseId:i===0?null:i===1?'response-a':`response-${i-1}`}));
    else result.assessments=Array.from({length:size},(_,i)=>({...clone(result.assessments[0]),assessmentId:i===0?'assessment-a':`assessment-${i}`}));
   }else if(kind==='map'){
    const collection=path.slice(1);
    const field={lessons:'lessonId',results:'resultId',observations:'observationId',nextPaths:'pathId'}[collection];
    p[k]=Array.from({length:size},(_,i)=>({...clone(p[k][0]),[field]:i===0?p[k][0][field]:`${collection.toLowerCase()}-${i}`}));
   }
   push(`V2.valid-upper.${kind}.${path}.${size}`,'V2','C4','document',data,good,kind);
  }
 }
 doc('V2.valid-empty-hypotheses','diagnostic',d=>d.hypotheses=[],good,'V2','C4');
 doc('V2.valid-empty-activity-content','lesson',l=>l.activities[0].contentIds=[],good,'V2','C4');
 for(const value of [-0.01,0,10,10.01]) doc(`V2.default.${value}`,'lesson',l=>l.inputs[0].default=value,value<0||value>10?bad('RANGE','/inputs/0/default'):good,'V2','C5');
 doc('V2.min-equals-max','lesson',l=>{l.inputs[0].min=5;l.inputs[0].max=5;},bad('RANGE','/inputs/0/max'),'V2','C5');
 for(const budget of [14.99,15,15.01,19.99,20,20.01]) doc(`V2.positive-budget.${budget}`,'lesson',l=>l.activities.forEach(a=>a.minutes=budget/6),budget>20?bad('RANGE','/activities'):good,'V2','C5');
 for(const minutes of [-1,0,0.01]) doc(`V2.minutes.${minutes}`,'lesson',l=>{l.activities[0].minutes=minutes;l.extra=true;},{ok:false,errors:[...(minutes<=0?[{code:'RANGE',path:'/activities/0/minutes'}]:[]),{code:'UNKNOWN_FIELD',path:'/extra'}]},'V2','C5');
 for(const size of [65535,65536,65537]) {
  doc(`V2.string.ascii.${size}`,'diagnostic',d=>d.candidates[0].title='a'.repeat(size),size>65536?bad('LIMIT','/candidates/0/title'):good,'V2','C4');
  doc(`V2.string.utf8.${size}`,'diagnostic',d=>d.candidates[0].title='é'.repeat(Math.floor(size/2))+'a'.repeat(size%2),size>65536?bad('LIMIT','/candidates/0/title'):good,'V2','C4');
 }
 for(const size of [1048575,1048576,1048577]) {const raw=JSON.stringify(validBundle().diagnostic);push(`V2.parser.bytes.${size}`,'V2','C4','parser',raw+' '.repeat(size-Buffer.byteLength(raw)),size>1048576?bad('LIMIT',''):good,'diagnostic');}
 for(const properties of [999,1000,1001]) {const data={kind:'diagnostic',version:1};for(let i=0;i<properties-2;i++)data[`field-${i}`]=1;const expected=properties>1000?bad('LIMIT',''):{ok:false,errors:[...Object.keys(syntax.diagnostic.fields).filter(field=>field!=='kind'&&field!=='version').map(field=>({code:'REQUIRED',path:`/${field}`})),...Object.keys(data).filter(field=>field.startsWith('field-')).map(field=>({code:'UNKNOWN_FIELD',path:`/${field}`}))].sort((a,b)=>a.code.localeCompare(b.code)||a.path.localeCompare(b.path))};push(`V2.object.properties.${properties}`,'V2','C4','document',data,expected,'diagnostic');}
 for(const properties of [999,1000,1001]){const data=validBundle();for(let i=0;i<properties-5;i++)data[`field-${i}`]=1;const expected=properties>1000?bad('LIMIT',''):{ok:false,errors:Array.from({length:properties-5},(_,i)=>({code:'UNKNOWN_FIELD',path:`/field-${i}`})).sort((a,b)=>a.path.localeCompare(b.path))};push(`V2.envelope.properties.${properties}`,'V2','C4','bundle',data,expected);}
 for(const depth of [31,32,33]) {const data=validBundle().diagnostic;let current=data;let path='';for(let n=2;n<=depth;n++){current.extra={};current=current.extra;path+='/extra';}const errors=[{code:'UNKNOWN_FIELD',path:'/extra'}];if(depth>32)errors.unshift({code:'LIMIT',path});push(`V2.depth.${depth}`,'V2','C4','document',data,{ok:false,errors},'diagnostic');}
 doc('V5.pointer-escaping','diagnostic',d=>d['a~/b']=true,bad('UNKNOWN_FIELD','/a~0~1b'),'V5','C11');
 for(const name of ['__proto__','constructor','prototype']) {const data=validBundle().diagnostic;Object.defineProperty(data,name,{value:true,enumerable:true});push(`V5.malicious.${name}`,'V5','C11','document',data,bad('UNKNOWN_FIELD',`/${name}`),'diagnostic');}
 bundle('V6.domain.non-statistical',b=>{b.diagnostic.candidates[0].title='Choose a poem';b.lesson.concepts[0].label='Poetic rhythm';b.lesson.inputs[0].unit='syllables';b.lesson.inputs[0].min=-10;b.lesson.inputs[0].default=-5;b.lesson.inputs[0].max=0;b.map.lessons=[clone(b.lesson)];},good,'V6','C10');
 bundle('V6.domain.manufacturing',()=>{},good,'V6','C1');

 for(const [factory,path] of [['undefined','/candidates/0/title'],['function','/candidates/0/title'],['symbol','/candidates/0/title'],['bigint','/candidates/0/title'],['date','/candidates/0'],['class','/candidates/0'],['sparse','/hypotheses/0'],['accessor','/candidates/0/title'],['cycle','/extra'],['nan','/candidates/0/title'],['infinity','/candidates/0/title']]) push(`V5.nonjson.${factory}`,'V5','C11','factory',{factory},bad('TYPE',path),'diagnostic');
 for(const factory of ['bundle-accessor','bundle-symbol'])push(`V5.nonjson.${factory}`,'V5','C11','factory',{factory},bad('TYPE',factory==='bundle-accessor'?'/result':''));
 push('V5.null-prototype','V5','C11','factory',{factory:'null-prototype'},good,'diagnostic');
 for(const kind of Object.keys(syntax)) {
  const data=validBundle()[kind];data.extra=true;push(`V5.frozen-invalid.${kind}`,'V5','C11','document',data,bad('UNKNOWN_FIELD','/extra'),kind);
 }
 push('V2.performance','V2','C4','performance',{fixture:'performanceBundle'},{ok:true,errors:[],duplicateOf:'result-a'});
 bundle('V5.secret-response',b=>{b.result.responses[0].answer='SECRET-RESPONSE';b.result.version=1;},bad('VERSION','/result/version'),'V5','C6');
 push('V5.bundle-scalar','V5','C11','bundle',null,bad('TYPE',''));
 // ---- content-hash spec v1 obligations (ids carry the CH- prefix because V1..V10 names collide with earlier specs)
 for(const kind of Object.keys(syntax)) for(const version of [0,1,1.5,kind==='lesson'?4:2]) {
  const input=clone(validBundle()[kind]);input.version=version;if(kind==='diagnostic'&&version===2){input.reactions=[{round:1,candidateId:'candidate-a',reaction:'similar',askedBack:null}];input.ladder=[{step:1,conceptId:'concept-a',label:'Concept A',answer:'known',askedBack:null}];}reseal(input);
  rawPush(`CH-V1.version.${kind}.${version}`,'CH-V1','C7','document',input,version===EXPECTED_VERSION[kind]||(kind==='diagnostic'&&version===2)?good:bad('VERSION','/version'),kind);
 }
 {
  const valid=validBundle().result.contentHash, hex=valid.slice('sha256-'.length);
  if(hex===hex.toUpperCase())throw new Error('fixture hash has no letters; uppercase partition would be vacuous');
  const value=bad('VALUE','/contentHash'), type=bad('TYPE','/contentHash');
  for(const [name,hash,expected] of [['valid',valid,good],['no-prefix',hex,value],['sha1-prefix',`sha1-${hex}`,value],['uppercase-hex',`sha256-${hex.toUpperCase()}`,value],['length-63',`sha256-${hex.slice(1)}`,value],['length-65',`sha256-${hex}0`,value],['non-hex-char',`sha256-g${hex.slice(1)}`,value],['non-string-number',5,type],['non-string-null',null,type],['missing',undefined,bad('REQUIRED','/contentHash')]]) {
   const input=validBundle().result;
   if(hash===undefined)delete input.contentHash;else input.contentHash=hash;
   rawPush(`CH-V2.${name}`,'CH-V2','C6','document',input,expected,'result');
  }
 }
 {
  const mutations={
   scalar:r=>{r.state=r.state==='partial'?'completed':'partial';},
   response:r=>{r.responses[0].answer+=' changed';},
   assessment:r=>{r.assessments[0].context+=' changed';},
  };
  for(const [field,mutate] of Object.entries(mutations)) {
   const id=surface=>`CH-V4.${surface}.${field}`;
   const doc=validBundle().result;mutate(doc);
   rawPush(id('result'),'CH-V4','C4','document',doc,bad('HASH','/contentHash'),'result');
   const map=validBundle().map;const second=clone(map.results[0]);second.resultId='result-b';mutate(second);map.results.push(second);
   rawPush(id('map-results-1'),'CH-V4','C5','document',map,bad('HASH','/results/1/contentHash'),'map');
   const bundleResult=validBundle();bundleResult.map={kind:'map',version:2,profileId:'profile-a',revision:1,lessons:[],results:[],observations:[],nextPaths:[]};mutate(bundleResult.result);
   rawPush(id('bundle-result'),'CH-V4','C4','bundle',bundleResult,bad('HASH','/result/contentHash'));
   const previous=validBundle();previous.map={kind:'map',version:2,profileId:'profile-a',revision:1,lessons:[],results:[],observations:[],nextPaths:[]};checkpoint(previous);reseal(previous);mutate(previous.previousResult);mutate(previous.result);previous.result.contentHash=oracleHash(previous.result);
   rawPush(id('bundle-previousResult'),'CH-V4','C4','bundle',previous,bad('HASH','/previousResult/contentHash'));
   const inMap=validBundle();const item=clone(inMap.result);item.resultId='result-m';mutate(item);
   inMap.map={kind:'map',version:2,profileId:'profile-a',revision:1,lessons:[clone(inMap.lesson)],results:[item],observations:[],nextPaths:[]};
   rawPush(id('bundle-map-results-0'),'CH-V4','C5','bundle',inMap,bad('HASH','/map/results/0/contentHash'));
  }
 }
 {
  const dup={ok:true,errors:[],duplicateOf:'result-a'};
  const withMap=(id,change,expected,caseId)=>{const b=validBundle();b.map=validBundle().map;change(b);rawPush(id,'CH-V5',caseId,'bundle',reseal(b),expected);};
  withMap('CH-V5.same-id-same-content',()=>{},dup,'C3');
  withMap('CH-V5.same-id-different-content',b=>{b.result.responses[0].answer='Different content';},bad('CONFLICT','/result/resultId'),'C8');
  withMap('CH-V5.different-id-same-hash',b=>{b.result.resultId='result-new';},dup,'C2');
  withMap('CH-V5.different-id-different-hash',b=>{b.result.resultId='result-new';b.result.responses[0].answer='Another answer';},good,'C2');
  withMap('CH-V5.duplicate-plus-other-error',b=>{b.result.resultId='result-new';b.diagnostic.profileId='other-profile';},{ok:false,errors:['lesson','map','result'].map(name=>({code:'PROFILE',path:`/${name}/profileId`}))},'C11');
  const stale=validBundle();stale.map={kind:'map',version:2,profileId:'profile-a',revision:1,lessons:[],results:[],observations:[],nextPaths:[]};stale.result.extra=true;
  rawPush('CH-V5.structural-error-with-stale-hash.bundle','CH-V5','C11','bundle',stale,bad('UNKNOWN_FIELD','/result/extra'));
  const staleDoc=validBundle().result;staleDoc.extra=true;
  rawPush('CH-V5.structural-error-with-stale-hash.document','CH-V5','C11','document',staleDoc,bad('UNKNOWN_FIELD','/extra'),'result');
 }
 return cases;
}
export function performanceBundle() {
 const bundle=validBundle();
 bundle.diagnostic.hypotheses=Array.from({length:20},()=>clone(bundle.diagnostic.hypotheses[0]));
 for(let i=0;i<12;i++) bundle.lesson.content.push({contentId:`padding-${i}`,role:'explanation',text:'Padding',conceptIds:['concept-a']});
 for(let i=1;i<12;i++) bundle.result.responses.push({...clone(bundle.result.responses[0]),responseId:`response-${i}`,attempt:i+1,previousResponseId:i===1?'response-a':`response-${i-1}`});
 function fill(document,containers,key,target) {
  let remaining=target-Buffer.byteLength(JSON.stringify(document));
  for(const object of containers) {const increment=Math.min(remaining,65536-Buffer.byteLength(object[key]));object[key]+='a'.repeat(increment);remaining-=increment;if(!remaining)break;}
  if(remaining!==0)throw new Error(`Independent padding capacity exceeded: ${remaining}`);
 }
 fill(bundle.diagnostic,bundle.diagnostic.hypotheses,'rationale',1048576);
 bundle.map.lessons=[bundle.lesson];bundle.map.results=[bundle.result];
 const available=1048576-Buffer.byteLength(JSON.stringify(bundle.map));
 fill(bundle.lesson,bundle.lesson.content,'text',Buffer.byteLength(JSON.stringify(bundle.lesson))+Math.floor(available/2));
 fill(bundle.result,bundle.result.responses,'answer',Buffer.byteLength(JSON.stringify(bundle.result))+Math.ceil(available/2));
 bundle.result.contentHash=oracleHash(bundle.result);
 return bundle;
}
export function fixtureMetrics(document) {
 const collections={};let depth=0;let maxProperties=0;let maxStringBytes=0;
 function walk(value,path,level) {
  if(typeof value==='string')maxStringBytes=Math.max(maxStringBytes,Buffer.byteLength(value));
  if(!value||typeof value!=='object')return;
  depth=Math.max(depth,level);
  if(Array.isArray(value))collections[path]=value.length;else maxProperties=Math.max(maxProperties,Object.keys(value).length);
  for(const [key,child] of Object.entries(value))walk(child,`${path}/${key}`,level+1);
 }
 walk(document,'',1);
 return {bytes:Buffer.byteLength(JSON.stringify(document)),depth,maxProperties,maxStringBytes,collections};
}

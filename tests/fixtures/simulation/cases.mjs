import { validBundle, clone } from '../contracts/cases.mjs';
export const fields=['defectPercent','detectionPercent','falsePositivePercent'];
export const good={ok:true,errors:[]};
export const bad=(code,path)=>({ok:false,errors:[{code,path}]});
export const baseline=()=>({defectPercent:1,detectionPercent:90,falsePositivePercent:5});
export function independentBinding(){
 const lesson=validBundle().lesson;
 lesson.inputs=fields.map((field,i)=>({inputId:`inspection-${field.replace(/[A-Z]/g,c=>`-${c.toLowerCase()}`)}`,unit:'%',min:0,max:100,default:[1,90,5][i]}));
 const model={modelId:'manufacturing-inspection',modelRevision:1,sampleSize:10000,simulationContentId:'content-simulation',inputIds:Object.fromEntries(fields.map((field,i)=>[field,lesson.inputs[i].inputId]))};
 return {model,lesson};
}
export const value=(tp,fp,fn,tn,ppv,accuracy)=>({sampleSize:10000,truePositive:tp,falsePositive:fp,falseNegative:fn,trueNegative:tn,positiveCount:tp+fp,positivePredictiveValue:ppv,accuracy});
export const fixed=[
 ['C1','baseline-a',[1,90,5],value(90,495,10,9405,2/13,9495/10000)],
 ['C2','population-contrast',[10,90,5],value(900,450,100,8550,2/3,9450/10000)],
 ['C3','candidate-b',[1,80,1],value(80,99,20,9801,80/179,9881/10000)],
 ['C4','fresh',[2,80,2],value(160,196,40,9604,40/89,9764/10000)],
 ['C6','fractional',[0.015,90,5],value(1.35,499.925,0.15,9498.575,54/20051,9499.925/10000)],
 ['C6','no-defects-no-false-positives',[0,90,0],value(0,0,0,10000,null,1)],
 ['C6','no-detection',[1,0,0],value(0,0,100,9900,null,.99)],
 ['C6','all-defects-no-detection',[100,0,5],value(0,0,10000,0,null,0)]
];
// Count populations independently in integer hundredths of a percent; no production API participates.
function boundaryOracle(input){
 const [d,s,f]=fields.map(k=>BigInt(Math.round(input[k]*100)));
 const scale=10000n;
 const defectPopulation=d, soundPopulation=scale-d;
 const tp=Number(defectPopulation*s)/10000, fn=Number(defectPopulation*(scale-s))/10000;
 const fp=Number(soundPopulation*f)/10000, tn=Number(soundPopulation*(scale-f))/10000;
 return value(tp,fp,fn,tn,tp+fp===0?null:tp/(tp+fp),(tp+tn)/10000);
}
export function calculationCases(){
 const cases=fixed.map(([caseId,name,values,expected])=>({id:`V1.${name}`,caseId,input:Object.fromEntries(fields.map((f,i)=>[f,values[i]])),expected:{ok:true,value:expected}}));
 for(const field of fields)for(const n of [-.01,0,.01,99.99,100,100.01]){
  const input={...baseline(),[field]:n};cases.push({id:`V1.boundary.${field}.${n}`,caseId:'C5',input,expected:n<0||n>100?bad('RANGE',`/${field}`):{ok:true,value:boundaryOracle(input)}});
 }
 for(const d of [0,100])for(const s of [0,100])for(const f of [0,100]){
  const input={defectPercent:d,detectionPercent:s,falsePositivePercent:f};cases.push({id:`V1.corner.${d}.${s}.${f}`,caseId:'C5',input,expected:{ok:true,value:boundaryOracle(input)}});
 }
 return cases;
}
export function validationCases(){
 const cases=[];
 const partitions=[['string','SECRET-RESPONSE'],['null',null],['boolean',true],['undefined',undefined],['nan',NaN],['positive-infinity',Infinity],['negative-infinity',-Infinity],['negative',-1],['above-100',101]];
 for(const field of fields){
  cases.push({id:`V2.${field}.valid`,input:baseline(),expected:{ok:true,value:fixed[0][3]}});
  const missing=baseline();delete missing[field];cases.push({id:`V2.${field}.missing`,input:missing,expected:bad('REQUIRED',`/${field}`)});
  for(const [name,n]of partitions)cases.push({id:`V2.${field}.${name}`,input:{...baseline(),[field]:n},expected:bad(name==='negative'||name==='above-100'?'RANGE':'TYPE',`/${field}`)});
 }
 for(const [name,input]of [['null',null],['array',[]],['scalar',1],['nonplain',new Date()]])cases.push({id:`V2.root.${name}`,input,expected:bad('TYPE','')});
 cases.push({id:'V2.extra',input:{...baseline(),extra:'SECRET-RESPONSE'},expected:bad('UNKNOWN_FIELD','/extra')});
 const symbol=baseline();symbol[Symbol('secret')]='SECRET-RESPONSE';cases.push({id:'V2.symbol',input:symbol,expected:bad('TYPE','')});
 for(const field of fields){let calls=0;const input=baseline();Object.defineProperty(input,field,{enumerable:true,get(){calls++;return 'SECRET-RESPONSE';}});cases.push({id:`V2.accessor.${field}`,input,calls:()=>calls,expected:bad('TYPE',`/${field}`)});}
 const mixed=baseline();delete mixed.defectPercent;mixed.detectionPercent=-1;mixed.falsePositivePercent='SECRET-RESPONSE';mixed.extra=true;
 cases.push({id:'V2.multiple-sorted',input:mixed,expected:{ok:false,errors:[{code:'RANGE',path:'/detectionPercent'},{code:'REQUIRED',path:'/defectPercent'},{code:'TYPE',path:'/falsePositivePercent'},{code:'UNKNOWN_FIELD',path:'/extra'}]}});
 return cases;
}
export function bindingCases(){
 const cases=[];
 const add=(id,change,expected=good)=>{const input=independentBinding();change(input);cases.push({id:`V3.${id}`,input,expected});};
 add('valid',()=>{});
 add('C12.independent-structural-errors',x=>{x.model.modelRevision='1';x.lesson.inputs=false;},{ok:false,errors:[{code:'TYPE',path:'/lesson/inputs'},{code:'TYPE',path:'/model/modelRevision'}]});
 add('C12.independent-declaration-errors',x=>{x.model.modelId='other-model';x.model.modelRevision=2;x.model.sampleSize=9999;},{ok:false,errors:[{code:'KIND',path:'/model/modelId'},{code:'RANGE',path:'/model/sampleSize'},{code:'VERSION',path:'/model/modelRevision'}]});
 add('C12.suppress-dependent-metadata',x=>{x.model.modelRevision=2;x.lesson.inputs[0].default=42;},bad('VERSION','/model/modelRevision'));
 add('C12.suppress-dependent-reference',x=>{delete x.model.modelRevision;x.model.simulationContentId='absent';},bad('REQUIRED','/model/modelRevision'));
 add('C12.symbol-owner-deduplication',x=>{for(const target of [x.model,x.lesson]){target[Symbol('first-secret')]='SECRET-RESPONSE';target[Symbol('second-secret')]='SECRET-RESPONSE';}},{ok:false,errors:[{code:'TYPE',path:'/lesson'},{code:'TYPE',path:'/model'}]});
 const schema={modelId:1,modelRevision:'1',sampleSize:'10000',simulationContentId:1,inputIds:false};
 for(const [field,type]of Object.entries(schema)){
  add(`model.${field}.valid`,()=>{});
  add(`model.${field}.missing`,x=>delete x.model[field],bad('REQUIRED',`/model/${field}`));
  add(`model.${field}.type`,x=>x.model[field]=type,bad('TYPE',`/model/${field}`));
 }
 add('model.extra',x=>x.model.extra=true,bad('UNKNOWN_FIELD','/model/extra'));
 for(const [field,n,code]of [['modelId','other-model','KIND'],['modelRevision',2,'VERSION'],['sampleSize',9999,'RANGE'],['simulationContentId','Bad ID','VALUE']])add(`model.${field}.invalid`,x=>x.model[field]=n,bad(code,`/model/${field}`));
 add('inputIds.extra',x=>x.model.inputIds.extra='input-extra',bad('UNKNOWN_FIELD','/model/inputIds/extra'));
 for(const field of fields){
  add(`inputId.${field}.existing`,()=>{});
  add(`inputId.${field}.missing-field`,x=>delete x.model.inputIds[field],bad('REQUIRED',`/model/inputIds/${field}`));
  add(`inputId.${field}.type`,x=>x.model.inputIds[field]=1,bad('TYPE',`/model/inputIds/${field}`));
  add(`inputId.${field}.missing-reference`,x=>x.model.inputIds[field]='absent',bad('REFERENCE',`/model/inputIds/${field}`));
  add(`inputId.${field}.invalid`,x=>x.model.inputIds[field]='Bad ID',bad('VALUE',`/model/inputIds/${field}`));
 }
 add('content.existing',()=>{});
 add('content.missing',x=>x.model.simulationContentId='absent',bad('REFERENCE','/model/simulationContentId'));
 add('content.wrong-role',x=>x.model.simulationContentId='content-explanation',bad('REFERENCE','/model/simulationContentId'));
 for(const [i,field]of fields.entries())for(const key of ['unit','min','max','default']){
  add(`metadata.${field}.${key}.match`,()=>{});
  add(`metadata.${field}.${key}.mismatch`,x=>x.lesson.inputs[i][key]=key==='unit'?'items':key==='min'?1:key==='max'?99:42,bad(key==='unit'?'VALUE':'RANGE',`/lesson/inputs/${i}/${key}`));
 }
 add('unrelated',x=>{x.lesson.inputs.push({inputId:'unrelated',unit:'items',min:0,max:10,default:5});x.lesson.content.push({contentId:'unrelated',role:'explanation',text:'별도 설명',conceptIds:['concept-a']});});
 for(const target of ['model','lesson'])for(const [name,n]of [['null',null],['array',[]],['scalar',2],['nonplain',new Date()]])add(`${target}.root.${name}`,x=>x[target]=n,bad('TYPE',`/${target}`));
 for(const collection of ['content','inputs']){
  add(`lesson.${collection}.missing`,x=>delete x.lesson[collection],bad('REQUIRED',`/lesson/${collection}`));
  add(`lesson.${collection}.type`,x=>x.lesson[collection]=false,bad('TYPE',`/lesson/${collection}`));
  add(`lesson.${collection}.item`,x=>x.lesson[collection][0]=false,bad('TYPE',`/lesson/${collection}/0`));
  for(const key of collection==='content'?['contentId','role']:['inputId','unit','min','max','default']){
   add(`lesson.${collection}.${key}.missing`,x=>delete x.lesson[collection][0][key],bad('REQUIRED',`/lesson/${collection}/0/${key}`));
   add(`lesson.${collection}.${key}.type`,x=>x.lesson[collection][0][key]=typeof x.lesson[collection][0][key]==='number'?'secret':42,bad('TYPE',`/lesson/${collection}/0/${key}`));
  }
 }
 return cases;
}
export function hostileBindingCases(){
 const cases=[];
 const add=(id,path,change)=>{const input=independentBinding();let calls=0;change(input,()=>{calls++;return 'SECRET-RESPONSE';});cases.push({id:`V3.${id}`,input,calls:()=>calls,expected:bad('TYPE',path)});};
 const locations=[['inputIds','/model/inputIds',x=>[x.model,'inputIds']]];
 for(const key of ['modelId','modelRevision','sampleSize','simulationContentId'])locations.push([`model.${key}`,`/model/${key}`,x=>[x.model,key]]);
 for(const field of fields)locations.push([`inputIds.${field}`,`/model/inputIds/${field}`,x=>[x.model.inputIds,field]]);
 for(const collection of ['content','inputs']){
  locations.push([`lesson.${collection}`,`/lesson/${collection}`,x=>[x.lesson,collection]]);
  locations.push([`lesson.${collection}.item`,`/lesson/${collection}/0`,x=>[x.lesson[collection],'0']]);
  for(const key of collection==='content'?['contentId','role']:['inputId','unit','min','max','default'])locations.push([`lesson.${collection}.${key}`,`/lesson/${collection}/0/${key}`,x=>[x.lesson[collection][0],key]]);
 }
 for(const [name,path,locate]of locations)add(`accessor.${name}`,path,(x,get)=>{const [parent,key]=locate(x);Object.defineProperty(parent,key,{enumerable:true,get});});
 for(const [name,path,locate]of [['model','/model',x=>x.model],['inputIds','/model/inputIds',x=>x.model.inputIds],['lesson','/lesson',x=>x.lesson],['content-item','/lesson/content/0',x=>x.lesson.content[0]],['input-item','/lesson/inputs/0',x=>x.lesson.inputs[0]]])add(`symbol.${name}`,path,x=>locate(x)[Symbol('secret')]='SECRET-RESPONSE');
 for(const field of fields){const input=independentBinding();const earlier=field==='defectPercent'?'detectionPercent':'defectPercent';input.model.inputIds[field]=input.model.inputIds[earlier];const blamed=field==='defectPercent'?'detectionPercent':field;cases.push({id:`V3.inputId.${field}.duplicated`,input,expected:bad('DUPLICATE',`/model/inputIds/${blamed}`)});}
 return cases;
}

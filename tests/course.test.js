const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const COURSE=JSON.parse(fs.readFileSync('src/course.json','utf8'));
COURSE.rigNotes=JSON.parse(fs.readFileSync('src/rig_notes.json','utf8'));
const source=fs.readFileSync('src/app.js','utf8');
function boot(storage,options={}){
  const element=()=>({hidden:true,textContent:'',value:'',classList:{toggle(){}},addEventListener(){}});
  const ctx=vm.createContext({COURSE,localStorage:{getItem:()=>storage.value,setItem:(key,value)=>{if(options.blocked)throw Error('blocked');storage.value=value}},document:{querySelector:element,querySelectorAll:()=>[],createElement:()=>({click(){options.downloaded.clicked=true},remove(){options.downloaded.removed=true}}),body:{appendChild(){options.downloaded.appended=true}}},window:{confirm:()=>true},URL:{createObjectURL(blob){options.downloaded.blob=blob;return 'blob:mock'},revokeObjectURL(){}},Blob,clearTimeout(){},setTimeout(){},Date,console});
  vm.runInContext(source.slice(0,source.indexOf('renderNav();updateProgress();addEventListener')),ctx);
  return ctx;
}
test('48 independent recording identifiers and known studio/live corrections',()=>{
  assert.equal(COURSE.tracks.length,48);
  assert.equal(COURSE.days.length,14);
  assert.equal(Object.keys(COURSE.bassists).length,39);
  assert.deepEqual(Object.keys(COURSE.spotifyByTrack).map(Number),COURSE.tracks.map(t=>t.id));
  for(const id of Object.values(COURSE.spotifyByTrack))assert.match(id,/^[A-Za-z0-9]{22}$/);
  assert.equal(COURSE.spotifyByTrack[6],'4imW8rgHwQ3rAmYoeGxW6F');
  assert.equal(COURSE.spotifyByTrack[34],'2FeiLxyPTi837wdD2rMcfD');
  assert.notEqual(COURSE.spotifyByTrack[6],'6MqfTP3OwngywVTOS5OAFt');
  assert.notEqual(COURSE.spotifyByTrack[34],'26QE9Tvw8lhsXRBz2VPfq2');
  assert.equal(COURSE.spotifyTracks,undefined);
});
test('references and lesson links resolve to existing records',()=>{
  const ids=new Set(COURSE.tracks.map(t=>t.id));
  for(const day of COURSE.days)for(const id of day.tracks)assert.ok(ids.has(id));
  for(const track of COURSE.tracks){assert.ok(COURSE.bassists[track.bassist]);for(const key of track.sources)assert.ok(COURSE.sources[key],key)}
  for(const profile of Object.values(COURSE.bassists))for(const key of profile.sources||[])assert.ok(COURSE.sources[key],key);
  for(const group of COURSE.comparisons)for(const id of group.tracks)assert.ok(ids.has(id));
  assert.equal(COURSE.days.flatMap(d=>d.tracks).length,48);
});
test('old local save remains readable; invalid schema does not crash boot',()=>{
  const valid=boot({value:JSON.stringify({days:{1:true},tracks:{6:true},notes:{1:'旧メモ'}})});
  assert.equal(vm.runInContext('state.notes[1]',valid),'旧メモ');
  assert.equal(vm.runInContext('state.tracks[6]',valid),true);
  const corrupt=boot({value:'{"days":null}'});
  assert.equal(vm.runInContext('Object.keys(state.days).length',corrupt),0);
});
test('two tabs merge changes to different fields instead of losing data',()=>{
  const storage={value:'{}'},a=boot(storage),b=boot(storage);
  vm.runInContext('save("notes",1,"A")',a);
  vm.runInContext('save("tracks",6,true)',b);
  vm.runInContext('save("days",2,true)',a);
  assert.deepEqual(JSON.parse(storage.value),{days:{2:true},tracks:{6:true},notes:{1:'A'}});
});
test('a blocked browser still keeps unsaved input available for export',()=>{
  const ctx=boot({value:'{}'},{blocked:true});
  vm.runInContext('save("notes",3,"未保存の文章")',ctx);
  assert.equal(vm.runInContext('state.notes[3]',ctx),'未保存の文章');
});
test('deep links and day-specific reflection examples',()=>{
  const ctx=boot({value:'{}'});
  assert.equal(vm.runInContext('trackHash(34)',ctx),'#day-10/track-34');
  assert.equal(vm.runInContext('Object.keys(answerExamples).length',ctx),14);
  assert.equal(vm.runInContext('spotifyId(COURSE.tracks[5])',ctx),'4imW8rgHwQ3rAmYoeGxW6F');
});
test('playlist listening path keeps all 48 numbers in order and links across day boundaries',()=>{
  assert.deepEqual(COURSE.tracks.map(t=>t.id),Array.from({length:48},(_,i)=>i+1));
  const ctx=boot({value:'{}'});
  const index=vm.runInContext('playlistPage(0)',ctx);
  assert.deepEqual([...index.matchAll(/href="#playlist\/track-(\d+)"/g)].map(m=>+m[1]),COURSE.tracks.map(t=>t.id));
  const sixth=vm.runInContext('playlistPage(6)',ctx);
  assert.match(sixth,/href="#playlist\/track-5"/);
  assert.match(sixth,/href="#playlist\/track-7"/);
  assert.match(sixth,/href="#day-03\/track-6"/);
  assert.match(sixth,/プレイリストに入っているこの曲は別の録音版です/);
});
test('track embeds expose playlist and exact recording separately, with mismatch warning',()=>{
  const ctx=boot({value:'{}'});
  const playlist=`https://open.spotify.com/playlist/${COURSE.playlist}`;
  for(const track of COURSE.tracks){
    const html=vm.runInContext(`spotifyPlayer(COURSE.tracks[${track.id-1}])`,ctx);
    assert.ok(html.includes(`href="${playlist}"`),track.id);
    assert.ok(html.includes(`href="https://open.spotify.com/track/${COURSE.spotifyByTrack[track.id]}"`),track.id);
    assert.equal(html.includes('プレイリストに入っているこの曲は別の録音版です'),[6,34].includes(track.id),track.id);
  }
});
test('all 39 players have distinct rig exercises and cited factual rig details resolve',()=>{
  assert.deepEqual(Object.keys(COURSE.rigNotes.profiles).sort(),Object.keys(COURSE.bassists).sort());
  for(const [name,rig] of Object.entries(COURSE.rigNotes.profiles)){
    for(const field of ['hands','setup','fx','check'])assert.ok(rig[field]?.length>25,`${name}: ${field}`);
    for(const key of rig.refs||[])assert.match(COURSE.rigNotes.references[key]?.url||'',/^https:\/\//);
  }
  const ctx=boot({value:'{}'});
  assert.match(vm.runInContext('rigPanel("Chris Squire")',ctx),/本人談/);
  assert.match(vm.runInContext('rigGuidePage()',ctx),/120〜180Hz/);
});
test('JSON backup contains notes and both check groups, and uses a clickable DOM link',async()=>{
  const storage={value:'{}'},downloaded={};
  const ctx=boot(storage,{downloaded});
  vm.runInContext('save("notes",1,"私のメモ");save("days",1,true);save("tracks",6,true);exportData()',ctx);
  assert.equal(downloaded.appended,true);
  assert.equal(downloaded.clicked,true);
  assert.equal(downloaded.removed,true);
  const backup=JSON.parse(await downloaded.blob.text());
  assert.equal(backup.format,'bass-listening-lab');
  assert.equal(backup.version,1);
  assert.equal(backup.notes[1],'私のメモ');
  assert.equal(backup.days[1],true);
  assert.equal(backup.tracks[6],true);
});

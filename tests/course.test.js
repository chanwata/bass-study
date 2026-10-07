const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const COURSE=JSON.parse(fs.readFileSync('src/course.json','utf8'));
COURSE.rigNotes=JSON.parse(fs.readFileSync('src/rig_notes.json','utf8'));
COURSE.youtubeByTrack=JSON.parse(fs.readFileSync('src/youtube.json','utf8'));
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
test('each lesson shows every track inline and repeats a bassist profile only once per day',()=>{
  const ctx=boot({value:'{}'});
  for(const day of COURSE.days){
    const html=vm.runInContext(`lessonPage(COURSE.days[${day.id-1}])`,ctx);
    assert.equal((html.match(/<article class="track-card"/g)||[]).length,day.tracks.length,`Day ${day.id}`);
    assert.equal((html.match(/class="bassist-profile"/g)||[]).length,new Set(day.tracks.map(id=>COURSE.tracks[id-1].bassist)).size,`Day ${day.id}`);
    assert.doesNotMatch(html,/<details\b|<summary\b/,`Day ${day.id}`);
    for(const id of day.tracks)assert.ok(html.includes(`id="track-${id}"`));
  }
  const day1=vm.runInContext('lessonPage(COURSE.days[0])',ctx);
  assert.equal((day1.match(/James Jamerson：人物・機材・音/g)||[]).length,1);
  assert.equal((day1.match(/<h5>略歴<\/h5>/g)||[]).length,1);
  const day13=vm.runInContext('lessonPage(COURSE.days[12])',ctx);
  assert.equal((day13.match(/Pino Palladino：人物・機材・音/g)||[]).length,1);
});
test('Spotify order is a lookup index into the themed lesson sequence',()=>{
  assert.deepEqual(COURSE.tracks.map(t=>t.id),Array.from({length:48},(_,i)=>i+1));
  const ctx=boot({value:'{}'});
  const index=vm.runInContext('playlistPage()',ctx);
  assert.deepEqual([...index.matchAll(/class="catalog-row" href="([^"]+)"/g)].map(m=>m[1]),COURSE.tracks.map(t=>{const day=COURSE.days.find(d=>d.tracks.includes(t.id));return `#day-${String(day.id).padStart(2,'0')}/track-${t.id}`}));
  assert.match(index,/学習はDay 1〜14を順に進め/);
  assert.match(index,/6曲目と34曲目/);
});
test('48 YouTube posters and retained Spotify recording links resolve separately',()=>{
  const ctx=boot({value:'{}'});
  const playlist=`https://open.spotify.com/playlist/${COURSE.playlist}`;
  assert.deepEqual(Object.keys(COURSE.youtubeByTrack).map(Number),COURSE.tracks.map(t=>t.id));
  for(const track of COURSE.tracks){
    const html=vm.runInContext(`videoPlayer(COURSE.tracks[${track.id-1}])`,ctx);
    const youtube=COURSE.youtubeByTrack[track.id];
    assert.match(youtube,/^[A-Za-z0-9_-]{11}$/);
    assert.ok(html.includes(`data-youtube="${youtube}"`),track.id);
    assert.ok(html.includes(`https://i.ytimg.com/vi/${youtube}/hqdefault.jpg`),track.id);
    assert.ok(html.includes(`href="https://www.youtube.com/watch?v=${youtube}"`),track.id);
    assert.ok(!html.includes(`href="${playlist}"`),track.id);
    assert.ok(html.includes(`href="https://open.spotify.com/track/${COURSE.spotifyByTrack[track.id]}"`),track.id);
    assert.equal(html.includes('元のSpotifyプレイリストに入っている録音は教材の指定版と異なります'),[6,34].includes(track.id),track.id);
  }
  const day=vm.runInContext('lessonPage(COURSE.days[0])',ctx);
  assert.equal(day.split(`href="${playlist}"`).length-1,1);
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

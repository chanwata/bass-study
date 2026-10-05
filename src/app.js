const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];
const STORAGE_KEY = 'bass-listening-lab-v1';
const trackById = new Map(COURSE.tracks.map(t => [t.id, t]));
let state = {days:{}, tracks:{}, notes:{}};
try { state = {...state, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')}; }
catch (_) { $('#storage-notice').hidden=false; $('#storage-notice').textContent='このブラウザでは保存済みデータを読み込めませんでした。教材はそのまま使えます。'; }
function save(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (_) { $('#storage-notice').hidden=false; $('#storage-notice').textContent='進捗とメモをブラウザに保存できません。メモの書き出しを使ってください。'; }
  updateProgress();
}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(msg){const el=$('#toast');el.textContent=msg;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,2200)}
function dayHash(n){return `#day-${String(n).padStart(2,'0')}`}
function updateProgress(){const n=Object.values(state.days||{}).filter(Boolean).length;$('#progress').value=n;$('#progress-label').textContent=`${n} / 14日`;$$('.day-link').forEach((a,i)=>{const c=$('.day-check',a);if(c)c.textContent=state.days[i+1]?'✓':''})}
function renderNav(){
  const groups=[['SOUL / FUNK',COURSE.days.slice(0,6)],['FUSION',COURSE.days.slice(6,10)],['ROCK / MODERN',COURSE.days.slice(10)]];
  $('#day-nav').innerHTML=groups.map(([name,days])=>`<div class="nav-section">${name}</div>${days.map(d=>`<a class="day-link" href="${dayHash(d.id)}"><span class="day-number">${String(d.id).padStart(2,'0')}</span><span>${esc(d.title)}</span><span class="day-check">${state.days[d.id]?'✓':''}</span></a>`).join('')}`).join('');
}
function sourceLinks(track){
  if(!track.sources.length)return '';
  return `<div class="source-links"><b>録音情報・参考：</b> ${track.sources.map(k=>{const s=COURSE.sources[k];return s?`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`:''}).join('')}</div>`;
}
function profileSourceLinks(profile){
  if(!profile?.sources?.length)return '';
  return `<div class="source-links"><b>人物資料：</b> ${profile.sources.map(k=>{const s=COURSE.sources[k];return s?`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`:''}).join('')}</div>`;
}
function profileGrid(profile){return `<div class="profile-grid">
  <div><h5>略歴</h5><p>${esc(profile.bio)}</p></div>
  <div><h5>代表的な使用機材</h5><p>${esc(profile.gear)}</p></div>
  <div><h5>プレイスタイル</h5><p>${esc(profile.style)}</p></div>
  <div><h5>楽器の使い方・奏法</h5><p>${esc(profile.technique)}</p></div>
  <div class="profile-sound"><h5>音の特徴</h5><p>${esc(profile.sound)}</p></div>
  </div>${profileSourceLinks(profile)}`}
function spotifyPlayer(track){
  const id=COURSE.spotifyTracks?.[track.id-1]||track.spotify;
  if(!id)return '';
  return `<div class="track-player"><span class="eyebrow">LISTEN HERE</span><iframe title="Spotifyで${esc(track.artist)}「${esc(track.title)}」を再生" src="https://open.spotify.com/embed/track/${id}?utm_source=generator&amp;theme=0" width="100%" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe><p>ここで再生しながら、下の聴きどころを確かめる。</p></div>`;
}
function trackCard(track, dayId){
  const profile=COURSE.bassists[track.bassist];
  const version=track.version?`<div class="version-alert"><b>録音を確認：</b> ${esc(track.version)}</div>`:'';
  const spotifyId=COURSE.spotifyTracks?.[track.id-1]||track.spotify;
  const spotify=spotifyId?`https://open.spotify.com/track/${spotifyId}`:`https://open.spotify.com/search/${encodeURIComponent(track.artist+' '+track.title)}`;
  return `<details class="track-card" id="track-${track.id}">
  <summary><span class="track-index">${String(track.id).padStart(2,'0')}</span><span class="track-summary"><h3>${esc(track.title)}</h3><p>${esc(track.artist)} · Bass: ${esc(track.bassist)}</p></span><span class="disclosure" aria-hidden="true">＋</span></summary>
  <div class="track-body">
    <div class="recording"><b>対象録音</b>${esc(track.album)} (${track.year}) · Bass: ${esc(track.bassist)}</div>${version}${spotifyPlayer(track)}
    <p class="track-thesis">${esc(track.thesis)}</p><p>${esc(track.background)}</p><p>${esc(track.analysis)}</p>
    ${profile?`<details class="bassist-profile"><summary><span>WHO PLAYS IT?</span><b>${esc(track.bassist)}：人物・機材・音</b></summary><div class="bassist-profile-body">${profileGrid(profile)}<p class="gear-caveat">機材はキャリアを通した代表例。対象録音で使われた個体を示す場合は本文で明記しています。</p></div></details>`:''}
    <h4 class="track-subhead">3回目までに聴くこと</h4><ol class="listen-steps">${track.listens.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
    <div class="exercise"><h4>ベースを持ったら</h4><p>${esc(track.exercise)}</p></div>
    <p class="pitfall"><b>ここは雑に覚えない：</b> ${esc(track.pitfall)}</p>
    <div class="track-actions"><a class="button-link" href="${spotify}" target="_blank" rel="noopener noreferrer">Spotifyアプリで開く</a><label class="track-check"><input type="checkbox" data-track="${track.id}" ${state.tracks[track.id]?'checked':''}> 3回聴いた</label></div>${sourceLinks(track)}
  </div></details>`;
}
function rhythmLab(day){
  if(![4,5,6,13].includes(day.id))return '';
  return `<section class="panel"><span class="eyebrow">RHYTHM LAB</span><h2>16分の重さを置いてみる</h2><p class="muted">これは譜面ではなく、強い音と軽い音の配置を考える小さな道具。パターンを選び、口や1音で再現する。</p><div class="rhythm-selector"><button data-pattern="backbeat" aria-pressed="true">バックビート</button><button data-pattern="one">1拍目</button><button data-pattern="space">休符の輪郭</button><button data-pattern="ghost">ゴースト</button></div><div class="rhythm-grid" id="rhythm-grid" aria-label="16分音符のグリッド"></div><p class="rhythm-caption" id="rhythm-caption"></p><div class="tempo-control"><label>練習テンポ <input id="tempo" type="range" min="50" max="110" value="72"></label><output id="tempo-output">72 BPM</output></div></section>`;
}
const patterns={
  backbeat:{hit:[0,6,8,14],ghost:[3,5,11,13],text:'強い音を拍頭だけに置かず、2拍目・4拍目周辺へ配置。ベースで弾く前に「タ・カ」の強弱で歌う。'},
  one:{hit:[0,7,11],ghost:[2,5,10,14],text:'最初の音が強く聞こえるよう、前の小節の終わりを想像して空ける。1拍目の音量だけを上げない。'},
  space:{hit:[0,3,8,10],ghost:[],text:'鳴っていないマスを数える。休符のあとに来る音が、どれだけ輪郭を持つかを試す。'},
  ghost:{hit:[0,6,8,14],ghost:[1,3,5,7,9,11,13,15],text:'濃いマスが主要音、薄いマスがゴースト。二種類を同じ音量へそろえない。'}
};
function setPattern(name){const p=patterns[name];const labels=['1','e','&','a','2','e','&','a','3','e','&','a','4','e','&','a'];$('#rhythm-grid').innerHTML=labels.map((x,i)=>`<span class="rhythm-cell ${i%4===0?'beat':''} ${p.hit.includes(i)?'hit':p.ghost.includes(i)?'ghost':''}">${x}</span>`).join('');$('#rhythm-caption').textContent=p.text;$$('[data-pattern]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pattern===name))}
function quiz(day){return `<section class="panel quiz"><span class="eyebrow">CHECK YOUR EAR</span><h2>聴いたあとに答える</h2><details><summary>${esc(day.question)}</summary><p>曲名や奏者名を使わず、「音の長さ」「休符」「誰との関係」の3点で答える。唯一の正解はないが、録音から聞こえた根拠をひとつ添える。</p></details><details><summary>今日の曲で、一番少ない情報から曲を成立させた演奏はどれ？</summary><p>音数の少なさを数えるだけでなく、その音が無くなったとき曲の何が失われるかを想像する。</p></details></section>`}
function lessonPage(day){const tracks=day.tracks.map(id=>trackById.get(id));return `<article>
  <header class="lesson-heading"><span class="lesson-number">DAY ${String(day.id).padStart(2,'0')} / 14</span><h1>${esc(day.title)}</h1><p class="lead">${esc(day.subtitle)}</p><div class="lesson-meta"><span class="pill gold">${tracks.length} TRACKS</span>${[...new Set(tracks.flatMap(t=>t.tags))].slice(0,4).map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div></header>
  <div class="goal"><span class="eyebrow">TODAY'S GOAL</span><p>${esc(day.goal)}</p></div>
  <section class="panel lecture"><span class="eyebrow">LECTURE</span><h2>耳に入れる前の地図</h2>${day.lecture.map(x=>`<p>${esc(x)}</p>`).join('')}<div class="concept"><h3>今日の問い</h3><p>${esc(day.question)}</p></div></section>
  <div class="section-heading"><h2>今日の録音</h2><span class="line"></span></div>${tracks.map(t=>trackCard(t,day.id)).join('')}
  ${rhythmLab(day)}${quiz(day)}
  <section class="panel"><span class="eyebrow">LISTENING NOTE</span><h2>今日の言葉を残す</h2><label class="note-label" for="day-note">奏者名を使わず、聞こえたベースの働きを3〜6行で。</label><textarea class="note-field" id="day-note" data-day-note="${day.id}" placeholder="例：歌が伸びたところだけ低音が動く。キックとは全部そろわず、2拍目の後ろで補完している。">${esc(state.notes[day.id]||'')}</textarea><p class="note-help">入力内容は自動保存。上の「メモを書き出す」で全日分をテキストにできる。</p><label class="complete-check"><input type="checkbox" data-day-complete="${day.id}" ${state.days[day.id]?'checked':''}> Day ${day.id}を完了にする</label></section>
  <nav class="lesson-footer">${day.id>1?`<a href="${dayHash(day.id-1)}">← Day ${day.id-1}</a>`:'<span></span>'}<a href="#library">48曲の索引</a>${day.id<14?`<a href="${dayHash(day.id+1)}">Day ${day.id+1} →</a>`:'<a href="#compare">聴き比べへ →</a>'}</nav>
  </article>`}
function libraryPage(){return `<article><header class="lesson-heading"><span class="eyebrow">TRACK LIBRARY</span><h1>全48曲の索引</h1><p class="lead">曲名、奏者、ベーシスト、タグで絞り込み。曲を開くと、その曲を扱う日に移動する。</p></header><input id="track-search" class="search-field" type="search" placeholder="例：Pino、反復、Fusion、フレットレス" aria-label="48曲を検索"><div id="catalog">${catalogRows(COURSE.tracks)}</div></article>`}
function catalogRows(items){return items.map(t=>{const d=COURSE.days.find(d=>d.tracks.includes(t.id));return `<a class="catalog-row" href="${dayHash(d.id)}" data-open-track="${t.id}"><span class="track-index">${String(t.id).padStart(2,'0')}</span><span><span class="catalog-title">${esc(t.title)}</span><span class="catalog-meta">${esc(t.artist)} · ${esc(t.bassist)} · ${t.year}</span></span><span class="catalog-tag">${esc(t.tags[0])}</span></a>`}).join('')||'<p class="empty">該当する曲がありません。</p>'}
function bassistRows(names){return names.map(name=>{const p=COURSE.bassists[name];const tracks=COURSE.tracks.filter(t=>t.bassist===name);return `<details class="profile-card"><summary><span><b>${esc(name)}</b><small>${tracks.map(t=>esc(t.title)).join(' / ')}</small></span><span class="profile-open">人物像を見る ＋</span></summary><div class="profile-card-body">${profileGrid(p)}<h5>この教材で聴く録音</h5><div class="profile-tracks">${tracks.map(t=>{const d=COURSE.days.find(d=>d.tracks.includes(t.id));return `<a href="${dayHash(d.id)}" data-open-track="${t.id}">${String(t.id).padStart(2,'0')} ${esc(t.artist)} — ${esc(t.title)}</a>`}).join('')}</div><p class="gear-caveat">機材はキャリアを通した代表例で、対象録音の使用個体を断定するものではありません。</p></div></details>`}).join('')||'<p class="empty">該当するベーシストがいません。</p>'}
function bassistsPage(){const names=Object.keys(COURSE.bassists);return `<article><header class="lesson-heading"><span class="eyebrow">39 BASSISTS</span><h1>人物・機材・音から聴く</h1><p class="lead">略歴、代表機材、プレイスタイル、楽器の使い方、音の特徴を一人ずつ整理。機材名当てではなく、その道具をどう音楽へ変えたかを読む。</p></header><div class="comparison"><span class="eyebrow">HOW TO USE</span><h2>同じ楽器でも、仕事は違う</h2><p>Precision Bassだから太い、Jazz Bassだから鋭い、で終わらせない。弦、右手位置、ミュート、音価、アンプ、録音処理までが一つの系。人物欄を読んだら、必ず対象曲へ戻って耳で確かめる。</p></div><input id="bassist-search" class="search-field" type="search" placeholder="例：フレットレス、ピック、StingRay、Motown" aria-label="39人のベーシストを検索"><div id="bassist-catalog">${bassistRows(names)}</div></article>`}
function comparePage(){return `<article><header class="lesson-heading"><span class="eyebrow">COMPARATIVE LISTENING</span><h1>テーマで聴き比べる</h1><p class="lead">年代順をいったん外し、同じ仕事への違う答えを並べる。影響関係を断定する表ではなく、自分の耳の分類を作るための課題。</p></header>${COURSE.comparisons.map(c=>`<section class="panel"><h2>${esc(c.title)}</h2><p>${esc(c.focus)}</p><div class="table-wrap"><table class="compare-table"><thead><tr><th>録音</th><th>ベーシスト</th><th>まず聴くもの</th></tr></thead><tbody>${c.tracks.map(id=>{const t=trackById.get(id);const d=COURSE.days.find(d=>d.tracks.includes(id));return `<tr><td><a href="${dayHash(d.id)}" data-open-track="${id}">${esc(t.artist)}<br><b>${esc(t.title)}</b></a></td><td>${esc(t.bassist)}</td><td>${esc(t.listens[0])}</td></tr>`}).join('')}</tbody></table></div></section>`).join('')}<section class="comparison"><span class="eyebrow">FINAL TEST</span><h2>初めて聴く曲を説明する</h2><p>人物名を当てる前に、音価、アタック、休符、キック、スネア、歌との関係を一文ずつ書く。六つのうち三つを具体的に言えたら、この教材の耳はもう使えている。</p></section></article>`}
function foundationsPage(){return `<article><header class="lesson-heading"><span class="eyebrow">FOUNDATIONS</span><h1>基礎と用語</h1><p class="lead">エレキベースのラインを、音程の列より広く聴くための最小セット。</p></header><section class="panel"><h2>六つの観察軸</h2><div class="fundamental-list">${[['音価','いつ始まり、いつ消えるか。'],['アタック','音の頭が丸いか、硬いか、軽いか。'],['休符','誰のために空いているか。'],['キック','一致、補完、先行のどれか。'],['スネア','前後どちらに重心を感じるか。'],['歌','下支え、応答、対旋律のどれか。']].map(x=>`<article><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('')}</div></section><section class="panel"><h2>用語</h2><dl>${COURSE.glossary.map(([a,b])=>`<div class="glossary-item"><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl></section><section class="panel"><h2>コピーする8曲の選び方</h2><ol><li>旋律：BernadetteかSomethingから1曲。</li><li>余白：Dock of the BayかWalking on the Moonから1曲。</li><li>反復：I'll Take You There、Good Times、Psycho Killerから1曲。</li><li>16分：What Is Hip?、Stomp!、Forget Me Notsから1曲。</li><li>Jazz-funk：Actual ProofかCucumber Slumberから1曲。</li><li>主旋律：Teen Town、Joe Frazier、Dean Townから1曲。</li><li>歌もの職人：Rock Steady、Clouds、Chicken Greaseから1曲。</li><li>自分が説明できず、何度も戻りたくなる曲を1曲。</li></ol><p>難易度の均等化より、八つの違う役割を身体へ入れることを優先する。</p></section></article>`}
function sourcesPage(){const used=[...new Set(COURSE.tracks.flatMap(t=>t.sources))];return `<article><header class="lesson-heading"><span class="eyebrow">RECORDING NOTES & SOURCES</span><h1>録音情報と参考資料</h1><p class="lead">人物や録音の確認に使った資料。解説本文の聴感分析は、この教材の学習用の読み方であり、演奏者本人の意図を断定するものではない。</p></header><section class="panel"><h2>録音版の注意</h2><p><b>Memphis Soul Stew：</b>1967年の短いスタジオ版はTommy Cogbill。Jerry Jemmottを聴く教材では、1971年のLive at Fillmore West版を指定した。</p><p><b>Voices Inside：</b>Willie Weeksの長いソロがあるアルバムLiveの録音を対象にする。</p><p><b>Joe Frazier：</b>BrufordのGradually Going Tornado版。Jeff Berlinによる後年のRound 2／3と分ける。</p><p><b>Run for Cover：</b>David SanbornのVoyeurのオリジナル版。Marcus Miller名義のライブ版は次の比較に向く。</p></section><section class="panel"><h2>参考リンク</h2><ul>${used.map(k=>{const s=COURSE.sources[k];return s?`<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`:''}).join('')}</ul></section></article>`}
function updateSidePanel(day){if(!day){$('#today-tracks').innerHTML='';return}const tracks=day.tracks.map(id=>trackById.get(id));$('#today-tracks').innerHTML=`<h3>DAY ${day.id}の曲</h3>${tracks.map(t=>`<a href="#track-${t.id}" data-jump-track="${t.id}"><span>${String(t.id).padStart(2,'0')}</span><span>${esc(t.title)}<br><span class="muted">${esc(t.bassist)}</span></span></a>`).join('')}`}
function markActive(hash){$$('.day-link,.extra-nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===hash))}
function render(){
  const hash=location.hash||'#day-01';let day=null;let html='';
  const m=hash.match(/^#day-(\d\d)/);
  if(m){day=COURSE.days.find(d=>d.id===+m[1])||COURSE.days[0];html=lessonPage(day)}
  else if(hash==='#bassists')html=bassistsPage();else if(hash==='#library')html=libraryPage();else if(hash==='#compare')html=comparePage();else if(hash==='#foundations')html=foundationsPage();else if(hash==='#sources')html=sourcesPage();else{location.hash='#day-01';return}
  $('#main').innerHTML=html;markActive(day?dayHash(day.id):hash);updateSidePanel(day);document.title=`${day?`Day ${day.id} ${day.title}`:$('#main h1')?.textContent} — BASS LISTENING LAB`;window.scrollTo(0,0);bindPage(day);
}
function bindOpenTrackLinks(scope=document){
  $$('[data-open-track]',scope).forEach(a=>a.addEventListener('click',()=>sessionStorage.setItem('openTrack',a.dataset.openTrack)));
}
function bindPage(day){
  $$('[data-track]').forEach(x=>x.addEventListener('change',e=>{state.tracks[e.target.dataset.track]=e.target.checked;save()}));
  $$('[data-day-complete]').forEach(x=>x.addEventListener('change',e=>{state.days[e.target.dataset.dayComplete]=e.target.checked;save();renderNav();markActive(dayHash(day.id))}));
  $$('[data-day-note]').forEach(x=>x.addEventListener('input',e=>{state.notes[e.target.dataset.dayNote]=e.target.value;save()}));
  bindOpenTrackLinks();
  $$('[data-jump-track]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const d=$(`#track-${a.dataset.jumpTrack}`);if(d){d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'})}}));
  const search=$('#track-search');if(search)search.addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();const items=COURSE.tracks.filter(t=>[t.artist,t.title,t.bassist,t.album,...t.tags].join(' ').toLowerCase().includes(q));const catalog=$('#catalog');catalog.innerHTML=catalogRows(items);bindOpenTrackLinks(catalog)});
  const bassistSearch=$('#bassist-search');if(bassistSearch)bassistSearch.addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();const names=Object.entries(COURSE.bassists).filter(([name,p])=>[name,p.bio,p.gear,p.style,p.technique,p.sound].join(' ').toLowerCase().includes(q)).map(([name])=>name);const catalog=$('#bassist-catalog');catalog.innerHTML=bassistRows(names);bindOpenTrackLinks(catalog)});
  $$('[data-pattern]').forEach(b=>b.addEventListener('click',()=>setPattern(b.dataset.pattern)));if($('#rhythm-grid'))setPattern('backbeat');
  const tempo=$('#tempo');if(tempo)tempo.addEventListener('input',()=>$('#tempo-output').textContent=`${tempo.value} BPM`);
  const pending=sessionStorage.getItem('openTrack');if(day&&pending&&day.tracks.includes(+pending)){sessionStorage.removeItem('openTrack');const d=$(`#track-${pending}`);d.open=true;setTimeout(()=>d.scrollIntoView({behavior:'smooth',block:'start'}),0)}
}
function exportNotes(){const lines=['BASS LISTENING LAB — 学習メモ',''];COURSE.days.forEach(d=>{lines.push(`Day ${d.id}: ${d.title}`,`完了: ${state.days[d.id]?'はい':'いいえ'}`,state.notes[d.id]||'（メモなし）','')});const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bass-listening-lab-notes.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('メモを書き出しました')}
renderNav();updateProgress();addEventListener('hashchange',render);$('#export-notes').addEventListener('click',exportNotes);$('#print').addEventListener('click',()=>window.print());render();

const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];
const STORAGE_KEY = 'bass-listening-lab-v1';
const trackById = new Map(COURSE.tracks.map(t => [t.id, t]));
function notice(message){const el=$('#storage-notice');el.hidden=false;el.textContent=message}
function cleanState(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('学習データが不正です');
  const result={days:{},tracks:{},notes:{}};
  for(const [key,limit] of [['days',14],['tracks',48],['notes',14]]){
    const input=value[key]??{};
    if(!input||typeof input!=='object'||Array.isArray(input))throw new Error(`${key}が不正です`);
    for(const [id,item] of Object.entries(input)){
      if(!/^[1-9]\d*$/.test(id)||+id>limit)continue;
      if(key==='notes'){if(typeof item==='string')result[key][id]=item.slice(0,20000)}
      else if(typeof item==='boolean')result[key][id]=item;
    }
  }
  return result;
}
function readState(){return cleanState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'))}
let state={days:{},tracks:{},notes:{}};
try{state=readState()}catch(_){notice('保存済みデータを読み込めませんでした。端末のデータを消さずに教材を表示しています。')}
function updateSaveStatus(message){const el=$('#save-status');if(el)el.textContent=message}
function save(kind,id,value){
  state[kind][id]=value;
  try{
    const latest=readState();
    latest[kind][id]=value;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(latest));
    state=latest;
    updateSaveStatus(`この端末に保存済み ${new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}`);
  }catch(_){notice('このブラウザに保存できません。全データを保存してください。');updateSaveStatus('保存に失敗しました')}
  updateProgress();
}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(msg){const el=$('#toast');el.textContent=msg;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,2200)}
function dayHash(n){return `#day-${String(n).padStart(2,'0')}`}
function trackHash(id){const day=COURSE.days.find(d=>d.tracks.includes(+id));return `${dayHash(day.id)}/track-${id}`}
function spotifyId(track){return COURSE.spotifyByTrack[track.id]}
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
  const id=spotifyId(track);
  if(!id)return '';
  return `<div class="track-player"><span class="eyebrow">LISTEN HERE · この曲の指定録音</span><iframe title="Spotifyで${esc(track.artist)}「${esc(track.title)}」を再生" src="https://open.spotify.com/embed/track/${id}?utm_source=generator&amp;theme=0" width="100%" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe><p>試聴のみ／再生不可の場合は下のSpotifyリンクを開く。フル再生はSpotify側のログイン・プラン・地域・ブラウザに依存します。</p></div>`;
}
function trackCard(track, dayId){
  const profile=COURSE.bassists[track.bassist];
  const version=track.version?`<div class="version-alert"><b>録音を確認：</b> ${esc(track.version)}</div>`:'';
  const id=spotifyId(track);
  const spotify=id?`https://open.spotify.com/track/${id}`:`https://open.spotify.com/search/${encodeURIComponent(track.artist+' '+track.title)}`;
  return `<details class="track-card" id="track-${track.id}">
  <summary><span class="track-index">${String(track.id).padStart(2,'0')}</span><span class="track-summary"><h3>${esc(track.title)}</h3><p>${esc(track.artist)} · Bass: ${esc(track.bassist)}</p></span><span class="disclosure" aria-hidden="true">＋</span></summary>
  <div class="track-body">
    <div class="recording"><b>対象録音</b>${esc(track.album)} (${track.year}) · Bass: ${esc(track.bassist)}</div>${version}${spotifyPlayer(track)}
    <p class="track-thesis">${esc(track.thesis)}</p><p>${esc(track.background)}</p><p>${esc(track.analysis)}</p>
    ${profile?`<details class="bassist-profile"><summary><span>WHO PLAYS IT?</span><b>${esc(track.bassist)}：人物・機材・音</b></summary><div class="bassist-profile-body">${profileGrid(profile)}<p class="gear-caveat">機材はキャリアを通した代表例。対象録音で使われた個体を示す場合は本文で明記しています。</p></div></details>`:''}
    <h4 class="track-subhead">3回目までに聴くこと</h4><p class="clip-help">最初の観察区間：${esc(track.listens[0])} 版によって時刻が変わるため、歌・楽器の入りを目印に区切ります。</p><ol class="listen-steps">${track.listens.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
    <div class="exercise"><h4>ベースを持ったら</h4><p>${esc(track.exercise)}</p><a href="#foundations">始める前の4小節テンプレートと用語</a></div>
    <p class="pitfall"><b>ここは雑に覚えない：</b> ${esc(track.pitfall)}</p>
    <div class="track-actions"><a class="button-link" href="${spotify}" target="_blank" rel="noopener noreferrer">指定録音をSpotifyで開く</a><label class="track-check"><input type="checkbox" data-track="${track.id}" ${state.tracks[track.id]?'checked':''}> 3回聴いた</label></div>${sourceLinks(track)}
  </div></details>`;
}
function rhythmLab(day){
  if(![4,5,6,13].includes(day.id))return '';
  return `<section class="panel" id="rhythm-lab"><span class="eyebrow">RHYTHM LAB</span><h2>16分の重さを置いてみる</h2><p class="muted">原曲の採譜ではなく、強い音と軽い音の配置を試す道具。拍のクリックに合わせ、口や1音で再現する。</p><div class="rhythm-selector"><button data-pattern="backbeat" aria-pressed="true">2・4拍のバックビート</button><button data-pattern="one">1拍目</button><button data-pattern="space">休符の輪郭</button><button data-pattern="ghost">ゴースト</button></div><div class="legend"><span>濃色＝主要音</span><span>淡色＝軽い音</span><span>白＝鳴らさない</span></div><div class="rhythm-grid" id="rhythm-grid" aria-label="16分音符のグリッド"></div><p class="rhythm-caption" id="rhythm-caption"></p><div class="tempo-control"><label>練習テンポ <input id="tempo" type="range" min="50" max="110" value="72"></label><output id="tempo-output">72 BPM</output><button id="metronome-toggle" type="button" aria-pressed="false">クリックを鳴らす</button><span id="metronome-beat" aria-live="off">停止中</span></div><p class="muted rhythm-note">クリックは4分音符。グリッドは譜例であり、曲の再生とは同期しません。</p></section>`;
}
const patterns={
  backbeat:{hit:[4,12],ghost:[0,8],text:'2拍目・4拍目を強く、1拍目・3拍目を軽く。これはバックビートの位置を理解する練習用の例で、特定曲の採譜ではない。'},
  one:{hit:[0,7,11],ghost:[2,5,10,14],text:'最初の音が強く聞こえるよう、前の小節の終わりを想像して空ける。1拍目の音量だけを上げない。'},
  space:{hit:[0,3,8,10],ghost:[],text:'鳴っていないマスを数える。休符のあとに来る音が、どれだけ輪郭を持つかを試す。'},
  ghost:{hit:[0,6,8,14],ghost:[1,3,5,7,9,11,13,15],text:'濃いマスが主要音、薄いマスがゴースト。二種類を同じ音量へそろえない。'}
};
function setPattern(name){const p=patterns[name];const labels=['1','e','&','a','2','e','&','a','3','e','&','a','4','e','&','a'];$('#rhythm-grid').innerHTML=labels.map((x,i)=>`<span class="rhythm-cell ${i%4===0?'beat':''} ${p.hit.includes(i)?'hit':p.ghost.includes(i)?'ghost':''}">${x}</span>`).join('');$('#rhythm-caption').textContent=p.text;$$('[data-pattern]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pattern===name))}
let audioContext=null,metronomeTimer=null,metronomeBeat=0;
function stopMetronome(){if(metronomeTimer){clearInterval(metronomeTimer);metronomeTimer=null}if(audioContext){audioContext.close();audioContext=null}const button=$('#metronome-toggle');if(button){button.textContent='クリックを鳴らす';button.setAttribute('aria-pressed','false')}const beat=$('#metronome-beat');if(beat)beat.textContent='停止中'}
function tick(){if(!audioContext)return;const time=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=metronomeBeat===0?880:660;gain.gain.setValueAtTime(.12,time);gain.gain.exponentialRampToValueAtTime(.001,time+.08);osc.connect(gain);gain.connect(audioContext.destination);osc.start(time);osc.stop(time+.08);metronomeBeat=(metronomeBeat+1)%4;const beat=$('#metronome-beat');if(beat)beat.textContent=`${metronomeBeat||4}拍目`}
async function toggleMetronome(){if(metronomeTimer){stopMetronome();return}try{audioContext=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();metronomeBeat=0;tick();metronomeTimer=setInterval(tick,60000/(+$('#tempo').value));$('#metronome-toggle').textContent='クリックを止める';$('#metronome-toggle').setAttribute('aria-pressed','true')}catch(_){stopMetronome();notice('このブラウザではクリックを再生できません。')}}
const answerExamples={
  1:'Bernadette：歌の長い音の下でベースは動くが、フレーズの区切りには低い音へ戻る。まずその戻り先を歌って確かめる。',
  2:'Dock of the Bay：休符を全部埋めると、歌の終わりと他の楽器の発音が目立ちにくくなる、という仮説を立てて比較する。',
  3:'Memphis Soul Stewのライブ版：楽器が順に加わっても、ベースのパターンを口ずさめるかを確認する。スタジオ版とは混ぜない。',
  4:'Thank You：1拍目をただ大きくするだけでなく、直前の空き方と後ろの軽い音で強さが変わるか比べる。',
  5:'What Is Hip?：16分を全部同じ強さにせず、低い主要音だけを弾いてもリズムの輪郭が残るか試す。',
  6:'Good Times：ベースの反復を残したまま、歌やギターの変化に耳を移す。反復を消した演奏と比較する。',
  7:'Actual Proof：細かい変化を全部数える前に、戻ってくる低音とドラムの位置をひとつ見つける。',
  8:'Teen Town：ベースが前景へ出るとき、他の楽器が和声や拍のどの役割を支えるかを聴き分ける。',
  9:'Joe Frazier：速い音を一音ずつではなく、休符や着地点で短いまとまりへ分けて口ずさむ。',
  10:'Run for Coverのスタジオ版：高い発音の目立ち方と、サックスの下に残る低い土台を別々に聴く。',
  11:'Something：歌の旋律とベースの動きを別々に歌って、低音だけではない対旋律の働きを確かめる。',
  12:'Walking on the Moon：ベースが鳴らない瞬間、ドラムの残響や声がどう前に出るかを聴く。',
  13:'二つのPinoの録音を、音色の同一性ではなく、音を置かない判断と歌への応答で比べる。',
  14:'Dean Town：主旋律的な動き、ゴースト、反復を分け、過去の曲のどの働きと対応するかを説明する。'
};
function quiz(day){return `<section class="panel quiz" id="quiz"><span class="eyebrow">CHECK YOUR EAR</span><h2>聴いたあとに答える</h2><p>以下は唯一の正解ではなく、録音で検証するための回答例。違う答えでも、どの区間でそう聴こえたかを添えよう。</p><details><summary>${esc(day.question)}　回答例を見る</summary><p>${esc(answerExamples[day.id])}</p></details><details><summary>今日の曲で、一番少ない情報から曲を成立させた演奏はどれ？　考え方を見る</summary><p>音数だけで決めず、主要な1音を抜いたとき、歌・拍・和声のどれが失われるか。二曲の同じ長さの区間を比べ、理由をメモに残す。</p></details></section>`}
function lessonPage(day){const tracks=day.tracks.map(id=>trackById.get(id));return `<article>
  <header class="lesson-heading"><span class="lesson-number">DAY ${String(day.id).padStart(2,'0')} / 14</span><h1>${esc(day.title)}</h1><p class="lead">${esc(day.subtitle)}</p><div class="lesson-meta"><span class="pill gold">${tracks.length} TRACKS</span>${[...new Set(tracks.flatMap(t=>t.tags))].slice(0,4).map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div></header>
  <nav class="lesson-jumps" aria-label="このレッスン内を移動"><a href="#recordings" data-section="recordings">曲へ</a><a href="#quiz" data-section="quiz">振り返りへ</a><a href="#notes" data-section="notes">メモへ</a></nav>
  <section class="quick-route"><h2>まず15分で聴くなら</h2><p>${tracks.length>2?`先に${esc(tracks[0].title)}と${esc(tracks[1].title)}の冒頭から1コーラス程度を3回。残り${tracks.length-2}曲は発展編として後で聴く。`:'各曲の冒頭から1コーラス程度を3回。全編とコピーは、時間を取れる日に進める。'} 再生版が違うと時刻がずれるため、曲中の場面を目印にする。</p></section>
  <div class="goal"><span class="eyebrow">TODAY'S GOAL</span><p>${esc(day.goal)}</p></div>
  <section class="panel lecture"><span class="eyebrow">LECTURE</span><h2>耳に入れる前の地図</h2>${day.lecture.map(x=>`<p>${esc(x)}</p>`).join('')}<div class="concept"><h3>今日の問い</h3><p>${esc(day.question)}</p></div></section>
  <div class="section-heading" id="recordings"><h2>今日の録音</h2><span class="line"></span></div>${tracks.map(t=>trackCard(t,day.id)).join('')}
  ${rhythmLab(day)}${quiz(day)}
  <section class="panel" id="notes"><span class="eyebrow">LISTENING NOTE</span><h2>今日の言葉を残す</h2><label class="note-label" for="day-note">奏者名を使わず、聞こえたベースの働きを3〜6行で。</label><textarea class="note-field" id="day-note" data-day-note="${day.id}" placeholder="例：歌が伸びたところだけ低音が動く。キックとは全部そろわず、2拍目の後ろで補完している。">${esc(state.notes[day.id]||'')}</textarea><p class="note-help">この端末に自動保存。別端末へ移すには「全データを保存」と「復元」を使用。曲のチェックも含まれます。</p><label class="complete-check"><input type="checkbox" data-day-complete="${day.id}" ${state.days[day.id]?'checked':''}> Day ${day.id}を完了にする</label></section>
  <nav class="lesson-footer">${day.id>1?`<a href="${dayHash(day.id-1)}">← Day ${day.id-1}</a>`:'<span></span>'}<a href="#library">48曲の索引</a>${day.id<14?`<a href="${dayHash(day.id+1)}">Day ${day.id+1} →</a>`:'<a href="#compare">聴き比べへ →</a>'}</nav>
  </article>`}
function libraryPage(){return `<article><header class="lesson-heading"><span class="eyebrow">TRACK LIBRARY</span><h1>全48曲の索引</h1><p class="lead">曲名、奏者、ベーシスト、タグで絞り込み。曲を開くと、その曲を扱う日に移動する。</p></header><input id="track-search" class="search-field" type="search" placeholder="例：Pino、反復、Fusion、フレットレス" aria-label="48曲を検索"><div id="catalog">${catalogRows(COURSE.tracks)}</div></article>`}
function catalogRows(items){return items.map(t=>`<a class="catalog-row" href="${trackHash(t.id)}"><span class="track-index">${String(t.id).padStart(2,'0')}</span><span><span class="catalog-title">${esc(t.title)}</span><span class="catalog-meta">${esc(t.artist)} · ${esc(t.bassist)} · ${t.year}</span></span><span class="catalog-tag">${esc(t.tags[0])}</span></a>`).join('')||'<p class="empty">該当する曲がありません。</p>'}
function bassistRows(names){return names.map(name=>{const p=COURSE.bassists[name];const tracks=COURSE.tracks.filter(t=>t.bassist===name);return `<details class="profile-card"><summary><span><b>${esc(name)}</b><small>${tracks.map(t=>esc(t.title)).join(' / ')}</small></span><span class="profile-open">人物像を見る ＋</span></summary><div class="profile-card-body">${profileGrid(p)}<h5>この教材で聴く録音</h5><div class="profile-tracks">${tracks.map(t=>`<a href="${trackHash(t.id)}">${String(t.id).padStart(2,'0')} ${esc(t.artist)} — ${esc(t.title)}</a>`).join('')}</div><p class="gear-caveat">機材欄にはキャリアを通した例と対象曲の記録が混在します。対象曲について確認できた場合は曲名を明記しています。</p></div></details>`}).join('')||'<p class="empty">該当するベーシストがいません。</p>'}
function bassistsPage(){const names=Object.keys(COURSE.bassists);return `<article><header class="lesson-heading"><span class="eyebrow">39 BASSISTS</span><h1>人物・機材・音から聴く</h1><p class="lead">略歴、代表機材、プレイスタイル、楽器の使い方、音の特徴を一人ずつ整理。機材名当てではなく、その道具をどう音楽へ変えたかを読む。</p></header><div class="comparison"><span class="eyebrow">HOW TO USE</span><h2>同じ楽器でも、仕事は違う</h2><p>Precision Bassだから太い、Jazz Bassだから鋭い、で終わらせない。弦、右手位置、ミュート、音価、アンプ、録音処理までが一つの系。人物欄を読んだら、必ず対象曲へ戻って耳で確かめる。</p></div><input id="bassist-search" class="search-field" type="search" placeholder="例：フレットレス、ピック、StingRay、Motown" aria-label="39人のベーシストを検索"><div id="bassist-catalog">${bassistRows(names)}</div></article>`}
function comparePage(){return `<article><header class="lesson-heading"><span class="eyebrow">COMPARATIVE LISTENING</span><h1>テーマで聴き比べる</h1><p class="lead">年代順をいったん外し、同じ仕事への違う答えを並べる。影響関係を断定する表ではなく、自分の耳の分類を作るための課題。</p></header>${COURSE.comparisons.map(c=>`<section class="panel"><h2>${esc(c.title)}</h2><p>${esc(c.focus)}</p><div class="table-wrap"><table class="compare-table"><thead><tr><th>録音</th><th>ベーシスト</th><th>まず聴くもの</th></tr></thead><tbody>${c.tracks.map(id=>{const t=trackById.get(id);return `<tr><td><a href="${trackHash(id)}">${esc(t.artist)}<br><b>${esc(t.title)}</b></a></td><td>${esc(t.bassist)}</td><td>${esc(t.listens[0])}</td></tr>`}).join('')}</tbody></table></div></section>`).join('')}<section class="comparison"><span class="eyebrow">FINAL TEST</span><h2>初めて聴く曲を説明する</h2><p>人物名を当てる前に、音価、アタック、休符、キック、スネア、歌との関係を一文ずつ書く。六つのうち三つを具体的に言えたら、この教材の耳はもう使えている。</p></section></article>`}
function foundationsPage(){return `<article><header class="lesson-heading"><span class="eyebrow">FOUNDATIONS</span><h1>基礎と用語</h1><p class="lead">エレキベースのラインを、音程の列より広く聴くための最小セット。</p></header><section class="panel"><h2>六つの観察軸</h2><div class="fundamental-list">${[['音価','いつ始まり、いつ消えるか。'],['アタック','音の頭が丸いか、硬いか、軽いか。'],['休符','誰のために空いているか。'],['キック','一致、補完、先行のどれか。'],['スネア','前後どちらに重心を感じるか。'],['歌','下支え、応答、対旋律のどれか。']].map(x=>`<article><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('')}</div></section><section class="panel"><h2>用語</h2><dl>${COURSE.glossary.map(([a,b])=>`<div class="glossary-item"><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl></section><section class="panel"><h2>コピーする8曲の選び方</h2><ol><li>旋律：BernadetteかSomethingから1曲。</li><li>余白：Dock of the BayかWalking on the Moonから1曲。</li><li>反復：I'll Take You There、Good Times、Psycho Killerから1曲。</li><li>16分：What Is Hip?、Stomp!、Forget Me Notsから1曲。</li><li>Jazz-funk：Actual ProofかCucumber Slumberから1曲。</li><li>主旋律：Teen Town、Joe Frazier、Dean Townから1曲。</li><li>歌もの職人：Rock Steady、Clouds、Chicken Greaseから1曲。</li><li>自分が説明できず、何度も戻りたくなる曲を1曲。</li></ol><p>難易度の均等化より、八つの違う役割を身体へ入れることを優先する。</p></section></article>`}
function practiceTemplate(){return `<section class="panel"><span class="eyebrow">START PLAYING</span><h2>最初の4小節：原曲のコピーではない練習用の例</h2><p>4/4拍子・ゆっくり72 BPM。<b>Am7｜Dm7｜G7｜Cmaj7</b>を1小節ずつ繰り返す。最初は各小節の1拍目と3拍目にルート（A、D、G、C）を1音ずつ置き、残りは休む。次は3拍目を抜いて、歌が入る余白を作る。最後に4拍目の裏へ次の小節のルートを短く足し、弾かない版と録音して比較する。</p><p class="muted">音程が難しければAの1音だけで、発音と休符の位置を再現。原曲の正しいベースラインを示す譜例ではありません。</p></section>`}
function sourcesPage(){const used=[...new Set([...COURSE.tracks.flatMap(t=>t.sources),...Object.values(COURSE.bassists).flatMap(p=>p.sources||[])])];return `<article><header class="lesson-heading"><span class="eyebrow">RECORDING NOTES & SOURCES</span><h1>録音情報と参考資料</h1><p class="lead">録音と機材の出典を示す。本文の聴感分析と練習の提案は、引用資料に書かれた演奏者本人の意図とは区別する。公式トップページなどの一般資料だけでは、特定録音の使用機材を確定できない。</p></header><section class="panel"><h2>録音版の注意</h2><p><b>Memphis Soul Stew：</b>1967年の短いスタジオ版はTommy Cogbill。Jerry Jemmottを聴く教材では、1971年のLive at Fillmore West版を指定。元のプレイリスト6曲目は別版です。</p><p><b>Voices Inside：</b>Willie Weeksの長いソロがあるアルバムLiveの録音を対象にする。</p><p><b>Joe Frazier：</b>BrufordのGradually Going Tornado版。Jeff Berlinによる後年のRound 2／3と分ける。</p><p><b>Run for Cover：</b>David SanbornのVoyeur期の約3分14秒のスタジオ録音を聴く。埋め込みは2018年の再発盤から、元のプレイリスト34曲目は1984年のライブ版。</p></section><section class="panel"><h2>参考リンク</h2><ul>${used.map(k=>{const s=COURSE.sources[k];return s?`<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`:''}).join('')}</ul></section></article>`}
function updateSidePanel(day){if(!day){$('#today-tracks').innerHTML='';return}const tracks=day.tracks.map(id=>trackById.get(id));$('#today-tracks').innerHTML=`<h3>DAY ${day.id}の曲</h3>${tracks.map(t=>`<a href="${trackHash(t.id)}" data-jump-track="${t.id}"><span>${String(t.id).padStart(2,'0')}</span><span>${esc(t.title)}<br><span class="muted">${esc(t.bassist)}</span></span></a>`).join('')}`}
function markActive(hash){$$('.day-link,.extra-nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===hash))}
function render(){
  stopMetronome();
  document.body.classList.remove('menu-open');$('#menu-toggle').setAttribute('aria-expanded','false');$('#menu-toggle').textContent='目次・資料を開く';
  const hash=location.hash||'#day-01';let day=null;let html='',openTrack=null;
  const m=hash.match(/^#day-(\d\d)(?:\/track-(\d+))?$/);
  if(m){day=COURSE.days.find(d=>d.id===+m[1])||COURSE.days[0];openTrack=m[2]&&day.tracks.includes(+m[2])?+m[2]:null;html=lessonPage(day)}
  else if(hash==='#bassists')html=bassistsPage();else if(hash==='#library')html=libraryPage();else if(hash==='#compare')html=comparePage();else if(hash==='#foundations')html=foundationsPage()+practiceTemplate();else if(hash==='#sources')html=sourcesPage();else{location.hash='#day-01';return}
  $('#main').innerHTML=html;markActive(day?dayHash(day.id):hash);updateSidePanel(day);document.title=`${day?`Day ${day.id} ${day.title}`:$('#main h1')?.textContent} — BASS LISTENING LAB`;window.scrollTo(0,0);bindPage(day);
  if(openTrack){const card=$(`#track-${openTrack}`);card.open=true;requestAnimationFrame(()=>card.scrollIntoView({block:'start'}))}
}
function bindPage(day){
  $$('[data-track]').forEach(x=>x.addEventListener('change',e=>save('tracks',e.target.dataset.track,e.target.checked)));
  $$('[data-day-complete]').forEach(x=>x.addEventListener('change',e=>{save('days',e.target.dataset.dayComplete,e.target.checked);renderNav();markActive(dayHash(day.id))}));
  $$('[data-day-note]').forEach(x=>x.addEventListener('input',e=>save('notes',e.target.dataset.dayNote,e.target.value)));
  $$('[data-section]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();$(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth',block:'start'})}));
  $$('[data-jump-track]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const d=$(`#track-${a.dataset.jumpTrack}`);if(d){d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'})}}));
  const search=$('#track-search');if(search)search.addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();const items=COURSE.tracks.filter(t=>[t.artist,t.title,t.bassist,t.album,...t.tags].join(' ').toLowerCase().includes(q));$('#catalog').innerHTML=catalogRows(items)});
  const bassistSearch=$('#bassist-search');if(bassistSearch)bassistSearch.addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();const names=Object.entries(COURSE.bassists).filter(([name,p])=>[name,p.bio,p.gear,p.style,p.technique,p.sound].join(' ').toLowerCase().includes(q)).map(([name])=>name);$('#bassist-catalog').innerHTML=bassistRows(names)});
  $$('[data-pattern]').forEach(b=>b.addEventListener('click',()=>setPattern(b.dataset.pattern)));if($('#rhythm-grid'))setPattern('backbeat');
  const tempo=$('#tempo');if(tempo)tempo.addEventListener('input',()=>{$('#tempo-output').textContent=`${tempo.value} BPM`;if(metronomeTimer){clearInterval(metronomeTimer);metronomeTimer=setInterval(tick,60000/+tempo.value)}});
  $('#metronome-toggle')?.addEventListener('click',toggleMetronome);
}
function download(name,body,type){const blob=new Blob([body],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000)}
function exportNotes(){const lines=['BASS LISTENING LAB — 学習メモ',''];COURSE.days.forEach(d=>{lines.push(`Day ${d.id}: ${d.title}`,`完了: ${state.days[d.id]?'はい':'いいえ'}`,state.notes[d.id]||'（メモなし）','')});download('bass-listening-lab-notes.txt',lines.join('\n'),'text/plain;charset=utf-8');toast('テキストのメモを書き出しました（復元にはJSONを使用）')}
function exportData(){download('bass-listening-lab-backup.json',JSON.stringify({format:'bass-listening-lab',version:1,exportedAt:new Date().toISOString(),...state},null,2),'application/json;charset=utf-8');toast('メモ・日・曲のチェックをJSONで書き出しました')}
async function importData(file){if(!file)return;try{if(file.size>2_000_000)throw new Error('ファイルが大きすぎます');const raw=JSON.parse(await file.text());if(raw.format!=='bass-listening-lab'||raw.version!==1)throw new Error('この教材のバックアップではありません');const imported=cleanState(raw);if(!window.confirm('この端末のメモとチェックを、選択したバックアップで置き換えますか？ 事前に「全データを保存」で現在の状態を保管できます。'))return;localStorage.setItem(STORAGE_KEY,JSON.stringify(imported));state=imported;renderNav();updateProgress();render();updateSaveStatus('バックアップから復元済み');toast('学習データを復元しました')}catch(e){notice(`復元できませんでした：${e.message}`)}finally{$('#import-file').value=''}}
renderNav();updateProgress();addEventListener('hashchange',render);
addEventListener('storage',e=>{if(e.key!==STORAGE_KEY)return;try{state=readState();updateProgress();renderNav();markActive(location.hash.split('/')[0]||'#day-01');$$('[data-track]').forEach(x=>x.checked=!!state.tracks[x.dataset.track]);$$('[data-day-complete]').forEach(x=>x.checked=!!state.days[x.dataset.dayComplete]);const note=$('#day-note');if(note&&document.activeElement!==note)note.value=state.notes[note.dataset.dayNote]||'';updateSaveStatus('別タブの更新を反映しました')}catch(_){notice('別タブの保存データを読み込めませんでした')}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMetronome()});
$('.skip').addEventListener('click',e=>{e.preventDefault();$('#main').focus();$('#main').scrollIntoView({block:'start'})});
$('#menu-toggle').addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');$('#menu-toggle').setAttribute('aria-expanded',String(open));$('#menu-toggle').textContent=open?'目次・資料を閉じる':'目次・資料を開く'});
$('#export-notes').addEventListener('click',exportNotes);$('#export-data').addEventListener('click',exportData);$('#import-data').addEventListener('click',()=>$('#import-file').click());$('#import-file').addEventListener('change',e=>importData(e.target.files[0]));$('#print').addEventListener('click',()=>window.print());render();

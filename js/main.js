(function(){
  'use strict';
  var doc=document.documentElement;
  doc.classList.add('js');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $(s,r){return (r||document).querySelector(s)}
  function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function f(n){return n.toFixed(1)}

  /* ---------- header, scroll progress, active nav ---------- */
  var bar=$('#progress'),top=$('#top-bar'),ticking=false;
  function onScroll(){
    var h=doc.scrollHeight-innerHeight;
    bar.style.transform='scaleX('+(h>0?scrollY/h:0)+')';
    top.classList.toggle('scrolled',scrollY>12);
    ticking=false;
  }
  addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
  onScroll();

  var navLinks=$$('#nav a');
  if('IntersectionObserver' in window){
    var secObs=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting)return;
        navLinks.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)});
      });
    },{rootMargin:'-45% 0px -50% 0px'});
    navLinks.forEach(function(a){var s=$(a.getAttribute('href'));if(s)secObs.observe(s)});
  }

  /* ---------- mobile menu ---------- */
  var menuBtn=$('#menu-btn'),nav=$('#nav');
  function setMenu(open){menuBtn.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)}
  menuBtn.addEventListener('click',function(){setMenu(menuBtn.getAttribute('aria-expanded')!=='true')});
  navLinks.forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});

  /* ---------- reveal on scroll ---------- */
  var reveals=$$('.reveal');
  function markReady(el){
    if(el.hasAttribute('data-tilt'))el.classList.add('ready');
  }
  if('IntersectionObserver' in window&&!reduce){
    var rObs=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting)return;
        var el=e.target;el.classList.add('in');rObs.unobserve(el);
        var d=parseFloat(getComputedStyle(el).getPropertyValue('--d'))||0;
        setTimeout(function(){markReady(el)},1000+d*1000);
      });
    },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    reveals.forEach(function(el){rObs.observe(el)});
  }else{
    reveals.forEach(function(el){el.classList.add('in');markReady(el)});
  }
  $$('[data-tilt]').forEach(function(el){if(!el.classList.contains('reveal'))el.classList.add('ready')});

  /* ---------- 3D tilt with glare ---------- */
  if(finePointer&&!reduce){
    $$('[data-tilt]').forEach(function(el){
      var g=document.createElement('i');g.className='glare';g.setAttribute('aria-hidden','true');el.appendChild(g);
      var max=el.classList.contains('tc-3d')?10:9,raf=0;
      el.addEventListener('pointermove',function(e){
        if(!el.classList.contains('ready'))return;
        var r=el.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
        cancelAnimationFrame(raf);
        raf=requestAnimationFrame(function(){
          el.classList.add('tilting');
          el.style.transform='perspective(1000px) rotateX('+f((.5-py)*max)+'deg) rotateY('+f((px-.5)*max)+'deg) translateZ(10px)';
          el.style.setProperty('--gx',(px*100)+'%');el.style.setProperty('--gy',(py*100)+'%');
        });
      });
      el.addEventListener('pointerleave',function(){
        cancelAnimationFrame(raf);el.classList.remove('tilting');el.style.transform='';
      });
    });
  }

  /* ---------- hero parallax scene ---------- */
  var hero=$('#hero'),scene=$('#scene');
  if(hero&&scene&&finePointer&&!reduce){
    hero.addEventListener('pointermove',function(e){
      var r=hero.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
      scene.style.setProperty('--ry',f(-10+px*22)+'deg');
      scene.style.setProperty('--rx',f(6-py*16)+'deg');
    });
    hero.addEventListener('pointerleave',function(){scene.style.removeProperty('--ry');scene.style.removeProperty('--rx')});
  }

  /* ---------- route chart ---------- */
  var W=520,H=340,m={l:48,r:28,t:30,b:44},Y0=-0.05,Y1=1.15;
  function x(w){return m.l+w/12*(W-m.l-m.r)}
  function y(p){return H-m.b-(p-Y0)/(Y1-Y0)*(H-m.t-m.b)}
  function line(pts){return pts.map(function(p,i){return (i?'L':'M')+f(x(p[0]))+' '+f(y(p[1]))}).join(' ')}
  var fast=[[0,0],[3,.45],[6,.8],[9,1]];
  var slow=[[0,0],[3,.1],[5,.15],[8,.6],[10,.85],[12,1]];
  var chart=$('#chart');
  function series(cls,pts,label,anchor){
    var e=pts[pts.length-1],g='<g class="series draw '+cls+'"><path d="'+line(pts)+'"/>';
    pts.forEach(function(p){g+='<circle cx="'+f(x(p[0]))+'" cy="'+f(y(p[1]))+'" r="5.5"/>'});
    g+='<text x="'+f(x(e[0]))+'" y="'+f(y(e[1])-13)+'" text-anchor="'+anchor+'">'+label+'</text></g>';
    return g;
  }
  function drawChart(curL,tgtL){
    var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Biểu đồ minh họa: hai học viên cùng bắt đầu ở band '+curL+' với mục tiêu '+tgtL+'. Học viên tiến bộ nhanh về đích sau bài test thứ ba. Học viên hụt nhịp chững lại sau bài test đầu tiên rồi về đích đúng hạn.">';
    s+='<defs><linearGradient id="g-fast" x1="0" x2="1"><stop offset="0" stop-color="#FFF3B8"/><stop offset="1" stop-color="#FFC928"/></linearGradient>'+
       '<linearGradient id="g-slow" x1="0" x2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFB4A0"/></linearGradient></defs>';
    [0,.5,1].forEach(function(p){s+='<path class="'+(p===1?'goalline':'grid')+'" d="M'+m.l+' '+f(y(p))+'H'+(W-m.r)+'"/>'});
    s+='<text x="'+(m.l-8)+'" y="'+f(y(0)+4)+'" text-anchor="end">'+curL+'</text>';
    s+='<text x="'+(m.l-8)+'" y="'+f(y(1)+4)+'" text-anchor="end">'+tgtL+'</text>';
    s+='<text class="goal-t" x="'+(m.l+6)+'" y="'+f(y(1)-9)+'">Mục tiêu '+tgtL+'</text>';
    s+='<text x="'+f(x(0))+'" y="'+(H-m.b+22)+'" text-anchor="start">Bắt đầu</text>';
    s+='<text x="'+f(x(12))+'" y="'+(H-m.b+22)+'" text-anchor="end">Hạn thi</text>';
    [3,6,9].forEach(function(w,i){
      s+='<path class="check" d="M'+f(x(w))+' '+m.t+'V'+(H-m.b)+'"/>';
      s+='<text x="'+f(x(w))+'" y="'+(H-m.b+22)+'" text-anchor="middle">Test '+(i+1)+'</text>';
    });
    s+='<path class="planline" d="'+line([[0,0],[12,1]])+'"/>';
    s+=series('s-slow',slow,'Đúng hạn','end');
    s+=series('s-fast',fast,'Về đích sớm','middle');
    chart.innerHTML=s+'</svg>';
    if(reduce){$$('.draw',chart).forEach(function(g){g.classList.remove('draw')});return}
    $$('.draw path',chart).forEach(function(p){p.style.setProperty('--len',Math.ceil(p.getTotalLength()))});
  }

  var sw=$('.switch'),picks=$$('[data-pick]');
  function pick(k){
    chart.setAttribute('data-sel',k);sw.setAttribute('data-sel',k);
    picks.forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-pick')===k))});
    $('#story-fast').hidden=k!=='fast';
    $('#story-slow').hidden=k!=='slow';
  }
  picks.forEach(function(b){b.addEventListener('click',function(){pick(b.getAttribute('data-pick'))})});

  /* ---------- band picker: drives ladder, ruler, chart labels ---------- */
  var CUR=[{v:3,t:'Mới bắt đầu',s:'Mới'},{v:4,t:'4.0'},{v:4.5,t:'4.5'},{v:5,t:'5.0'},{v:5.5,t:'5.5'},{v:6,t:'6.0'},{v:6.5,t:'6.5'},{v:7,t:'7.0'}];
  var TGT=[{v:4,t:'4.0'},{v:4.5,t:'4.5'},{v:5,t:'5.0'},{v:5.5,t:'5.5'},{v:6,t:'6.0'},{v:6.5,t:'6.5'},{v:7,t:'7.0'},{v:7.5,t:'7.5+'}];
  var cur=5,tgt=6.5;
  function find(list,v){for(var i=0;i<list.length;i++){if(list[i].v===v)return list[i]}return list[0]}
  function build(id,list,which){
    var box=document.getElementById(id);
    list.forEach(function(o){
      var b=document.createElement('button');
      b.type='button';b.textContent=o.t;b.setAttribute('data-v',o.v);
      b.addEventListener('click',function(){setBands(which==='cur'?o.v:cur,which==='tgt'?o.v:tgt,which)});
      box.appendChild(b);
    });
  }
  function rx(b){return 22+(b-3)/5*216}
  var firstRun=true;
  function setBands(c,t,changed){
    if(t<=c){
      if(changed==='cur'){for(var i=0;i<TGT.length;i++){if(TGT[i].v>c){t=TGT[i].v;break}}}
      else{for(var j=CUR.length-1;j>=0;j--){if(CUR[j].v<t){c=CUR[j].v;break}}}
    }
    cur=c;tgt=t;
    var C=find(CUR,cur),T=find(TGT,tgt);
    $$('#opts-cur button').forEach(function(b){b.setAttribute('aria-pressed',String(+b.getAttribute('data-v')===cur))});
    $$('#opts-tgt button').forEach(function(b){b.setAttribute('aria-pressed',String(+b.getAttribute('data-v')===tgt))});
    var n=0;
    $$('#ladder li').forEach(function(li){
      var on=cur<+li.getAttribute('data-b')&&tgt>+li.getAttribute('data-a');
      li.classList.toggle('on',on);if(on)n++;
    });
    $('#out-cur').textContent=C.t;
    $('#out-tgt').textContent=T.t;
    $('#out-sub').textContent='Bạn đi qua '+n+' chặng, được tô đậm bên dưới.';
    $('#out-cta').textContent='Nhận lộ trình cho mốc '+(C.s||C.t)+' → '+T.t;
    $('#ex-range').textContent=C.t.toLowerCase()+' lên '+T.t;
    var xa=rx(cur),xb=rx(tgt),mid=Math.min(184,Math.max(76,(xa+xb)/2));
    $('#rl-seg').setAttribute('d','M'+f(xa)+' 56H'+f(xb));
    $('#rl-a').setAttribute('cx',f(xa));
    $('#rl-b').setAttribute('cx',f(xb));
    $('#rl-pill').setAttribute('transform','translate('+f(mid)+' 0)');
    drawChart(C.s||C.t,T.t);
    if(!firstRun){
      [['opts-cur','button[aria-pressed="true"]'],['opts-tgt','button[aria-pressed="true"]'],['ladder','li.on']].forEach(function(q){
        var box=document.getElementById(q[0]),el=box.querySelector(q[1]);
        if(el&&box.scrollWidth>box.clientWidth){box.scrollTo({left:Math.max(0,el.offsetLeft-box.offsetLeft-(q[0]==='ladder'?24:box.clientWidth/2-el.offsetWidth/2)),behavior:reduce?'auto':'smooth'})}
      });
    }
    firstRun=false;
  }
  build('opts-cur',CUR,'cur');build('opts-tgt',TGT,'tgt');
  setBands(cur,tgt,null);
  // replay the line-draw when the chart first scrolls into view
  if('IntersectionObserver' in window&&!reduce){
    var cObs=new IntersectionObserver(function(es){
      if(es[0].isIntersecting){var C=find(CUR,cur),T=find(TGT,tgt);drawChart(C.s||C.t,T.t);cObs.disconnect()}
    },{threshold:.4});
    cObs.observe(chart);
  }

  /* ---------- teacher flip cards ---------- */
  $$('.tc-card').forEach(function(card){
    function flip(){card.setAttribute('aria-pressed',String(card.getAttribute('aria-pressed')!=='true'))}
    card.addEventListener('click',flip);
    card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}});
  });

  /* ---------- gallery data ---------- */
  var GROUPS={
    teachers:[
      {src:'assets/teachers/ngoc-diep.jpg',cap:'Giảng viên Lê Trần Ngọc Diệp · IELTS 8.5'},
      {src:'assets/teachers/hong-duyen.jpg',cap:'Thạc sĩ Vũ Thị Hồng Duyên · IELTS 8.5'},
      {src:'assets/teachers/thuy-anh.jpg',cap:'Giảng viên Trần Thùy Anh · IELTS 8.0'},
      {src:'assets/teachers/thien-trang.jpg',cap:'Giảng viên Trần Thiên Trang · IELTS 8.0'}
    ],
    results:[
      {src:'assets/results/kq-01.jpg',tag:'Overall 8.0',title:'Listening 9.0 · Reading 9.0',quote:'“Em cảm ơn chị thời gian qua đã giúp đỡ em ạaa”',alt:'Ảnh kết quả IELTS Overall 8.0, Listening 9.0, Reading 9.0, Writing 7.5, Speaking 7.0'},
      {src:'assets/results/kq-03.jpg',tag:'Overall 7.0',title:'Trần Việt Anh đạt aim',quote:'“Em đạt aim rồi các chị ạ. Em cảm ơn các chị vì thời gian qua đã luôn sát sao và dạy bảo em ạ”',alt:'Ảnh kết quả IELTS on Computer của Trần Việt Anh, Overall 7.0, Listening 8.5'},
      {src:'assets/results/kq-05.jpg',tag:'Retake Writing 7.0',title:'Phương Thuỳ kéo Overall lên 7.0',quote:'“Bạn thi lại kỹ năng Viết được 7.0, kéo Overall lên 7.0. Kết quả rất xứng đáng với sự chăm chỉ ạ”',alt:'Ảnh kết quả thi lại Writing 7, Overall sau retake 7'},
      {src:'assets/results/kq-06.jpg',tag:'Overall 8.0',title:'“Very Good User”',quote:'“Hihi chị ơi 8 chấm của chị đây”',alt:'Ảnh kết quả IELTS overall band score 8, Very Good User'},
      {src:'assets/results/kq-04.jpg',tag:'Phụ huynh',title:'Chúc mừng Minh Châu · Overall 8.0',quote:'“Em chúc mừng chị và Châu nhé, quá tuyệt vời luôn”',alt:'Tin nhắn với phụ huynh bạn Bùi Minh Châu kèm ảnh kết quả IELTS 8.0'},
      {src:'assets/results/kq-07.jpg',tag:'Retake thành công',title:'Lê Ngọc Minh đạt aim',quote:'“Em cảm ơn chị thời gian qua luôn động viên, tận tâm, chịu khó dành thời gian speak với em ạ”',alt:'Tin nhắn của học viên Lê Ngọc Minh báo retake thành công, đạt aim'},
      {src:'assets/results/kq-08.jpg',tag:'Học bổng UK',title:'Bình · từ Fulbright đến Chevening',quote:'“Em cám ơn cô đã ship em thành công đến UK ạ. Gặp cô đúng là sự kiện đặc biệt thay đổi đời em”',alt:'Tin nhắn cảm ơn của học viên Bình sau khi thành công du học UK'},
      {src:'assets/results/kq-02.jpg',tag:'Phụ huynh chia sẻ',title:'“Học IELTS đúng là sáng suốt”',quote:'“Đến lúc xét Đại học 0,25 điểm quý lắm em ạ.”',alt:'Tin nhắn phụ huynh chia sẻ về giá trị của chứng chỉ IELTS khi xét tuyển đại học'}
    ]
  };

  /* ---------- lightbox ---------- */
  var lb=$('#lb'),lbImg=$('#lb-img'),lbCap=$('#lb-cap'),lbGroup=null,lbIdx=0,lastFocus=null;
  function lbShow(){
    var it=GROUPS[lbGroup][lbIdx];
    lbImg.src=it.src;lbImg.alt=it.alt||it.cap||'';
    lbCap.textContent=it.cap||(it.title+' · '+it.tag);
    var fig=lbImg.parentNode;fig.style.animation='none';void fig.offsetWidth;fig.style.animation='';
  }
  function lbOpen(group,i){
    lbGroup=group;lbIdx=i;lastFocus=document.activeElement;
    lb.hidden=false;document.body.style.overflow='hidden';lbShow();$('#lb-close').focus();
    if(cfTimer)stopAuto();
  }
  function lbClose(){lb.hidden=true;document.body.style.overflow='';if(lastFocus)lastFocus.focus();startAuto()}
  function lbStep(d){var n=GROUPS[lbGroup].length;lbIdx=(lbIdx+d+n)%n;lbShow()}
  $('#lb-close').addEventListener('click',lbClose);
  $('#lb-prev').addEventListener('click',function(){lbStep(-1)});
  $('#lb-next').addEventListener('click',function(){lbStep(1)});
  lb.addEventListener('click',function(e){if(e.target===lb)lbClose()});
  document.addEventListener('keydown',function(e){
    if(lb.hidden)return;
    if(e.key==='Escape')lbClose();
    else if(e.key==='ArrowLeft')lbStep(-1);
    else if(e.key==='ArrowRight')lbStep(1);
    else if(e.key==='Tab'){ // keep focus inside
      var fs=$$('button',lb),a=fs[0],z=fs[fs.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
      else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
    }
  });
  $$('.zoom').forEach(function(b){
    b.addEventListener('click',function(){lbOpen(b.getAttribute('data-group'),+b.getAttribute('data-index'))});
  });

  /* ---------- 3D coverflow of results ---------- */
  var R=GROUPS.results,stage=$('#cf-stage'),dots=$('#cf-dots'),cap=$('#cf-cap'),cf=$('#cf');
  var active=0,slides=[],dotBtns=[],cfTimer=null,cfVisible=false,cfHover=false;
  R.forEach(function(it,i){
    var s=document.createElement('div');
    s.className='cf-slide';s.setAttribute('role','group');s.setAttribute('aria-roledescription','slide');
    s.setAttribute('aria-label',(i+1)+' / '+R.length);
    s.innerHTML='<img src="'+it.src+'" alt="'+it.alt.replace(/"/g,'&quot;')+'" loading="lazy" draggable="false">';
    s.addEventListener('click',function(){if(moved)return;if(i===active)lbOpen('results',i);else go(i)});
    stage.appendChild(s);slides.push(s);
    var d=document.createElement('button');
    d.type='button';d.setAttribute('aria-label','Ảnh '+(i+1));
    d.addEventListener('click',function(){go(i)});
    dots.appendChild(d);dotBtns.push(d);
  });
  function layout(){
    var n=R.length,narrow=innerWidth<640;
    slides.forEach(function(s,i){
      var d=i-active;
      if(d>n/2)d-=n; if(d<-n/2)d+=n;
      var a=Math.abs(d);
      var tx=d*(narrow?62:58),tz=-a*(narrow?160:200),ry=d*-32,sc=a?.9:1;
      s.style.transform='translateX('+tx+'%) translateZ('+tz+'px) rotateY('+ry+'deg) scale('+sc+')';
      s.style.opacity=a>(narrow?1:2)?0:(a?.82-a*.12:1);
      s.style.filter=a?'brightness(.78) saturate(.9)':'none';
      s.style.zIndex=20-a;
      s.style.pointerEvents=a>(narrow?1:2)?'none':'auto';
      s.classList.toggle('active',a===0);
      s.setAttribute('aria-hidden',String(a!==0));
    });
    dotBtns.forEach(function(b,i){b.setAttribute('aria-current',String(i===active))});
    var it=R[active];
    $('.tag',cap).textContent=it.tag;$('h3',cap).textContent=it.title;$('p',cap).textContent=it.quote;
    cap.classList.remove('swap');void cap.offsetWidth;cap.classList.add('swap');
  }
  function go(i){var n=R.length;active=(i+n)%n;layout();restartAuto()}
  $('#cf-prev').addEventListener('click',function(){go(active-1)});
  $('#cf-next').addEventListener('click',function(){go(active+1)});
  cf.setAttribute('tabindex','0');
  cf.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft'){e.preventDefault();go(active-1)}
    if(e.key==='ArrowRight'){e.preventDefault();go(active+1)}
  });
  // swipe / drag
  var sx=0,sy=0,down=false,moved=false;
  cf.addEventListener('pointerdown',function(e){if(e.target.closest('.cf-nav'))return;down=true;moved=false;sx=e.clientX;sy=e.clientY});
  cf.addEventListener('pointermove',function(e){if(down&&Math.abs(e.clientX-sx)>8&&Math.abs(e.clientX-sx)>Math.abs(e.clientY-sy))moved=true});
  addEventListener('pointerup',function(e){
    if(!down)return;down=false;
    var dx=e.clientX-sx;
    if(moved&&Math.abs(dx)>40)go(active+(dx<0?1:-1));
    setTimeout(function(){moved=false},0);
  });
  // autoplay only while visible and not hovered
  function startAuto(){if(reduce||cfTimer||!cfVisible||cfHover||!lb.hidden)return;cfTimer=setInterval(function(){active=(active+1)%R.length;layout()},4200)}
  function stopAuto(){clearInterval(cfTimer);cfTimer=null}
  function restartAuto(){stopAuto();startAuto()}
  cf.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse'){cfHover=true;stopAuto()}});
  cf.addEventListener('pointerleave',function(){cfHover=false;startAuto()});
  cf.addEventListener('focusin',function(){cfHover=true;stopAuto()});
  cf.addEventListener('focusout',function(){cfHover=false;startAuto()});
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){cfVisible=es[0].isIntersecting;if(cfVisible)startAuto();else stopAuto()},{threshold:.3}).observe(cf);
  }
  var rT;addEventListener('resize',function(){clearTimeout(rT);rT=setTimeout(layout,120)});
  layout();

  /* ---------- count-up stats ---------- */
  var counters=$$('[data-count]');
  if('IntersectionObserver' in window&&!reduce){
    var kObs=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting)return;kObs.unobserve(e.target);
        var el=e.target,to=parseFloat(el.getAttribute('data-count')),t0=performance.now(),dur=1600;
        (function tick(t){
          var p=Math.min(1,(t-t0)/dur),v=to*(1-Math.pow(1-p,3));
          el.textContent=v.toFixed(1);if(p<1)requestAnimationFrame(tick);
        })(t0);
      });
    },{threshold:.6});
    counters.forEach(function(c){c.textContent='0.0';kObs.observe(c)});
  }

  /* ---------- smooth FAQ open/close ---------- */
  $$('.faq details').forEach(function(d){
    var sum=$('summary',d),ans=$('.ans',d),anim=null;
    sum.addEventListener('click',function(e){
      if(reduce||!ans.animate)return;
      e.preventDefault();
      if(anim)anim.cancel();
      if(d.open){
        anim=ans.animate([{height:ans.offsetHeight+'px',opacity:1},{height:'0px',opacity:0}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});
        d.classList.add('closing');
        anim.onfinish=function(){d.open=false;d.classList.remove('closing');anim=null};
      }else{
        d.open=true;
        var h=ans.offsetHeight;
        anim=ans.animate([{height:'0px',opacity:0},{height:h+'px',opacity:1}],{duration:460,easing:'cubic-bezier(.2,.8,.2,1)'});
        anim.onfinish=function(){anim=null};
      }
    });
  });

  /* ---------- phone dock hides over the contact block ---------- */
  var dock=$('#dock');
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){dock.classList.toggle('off',es[0].isIntersecting)},{threshold:.15}).observe($('#lien-he'));
  }
})();

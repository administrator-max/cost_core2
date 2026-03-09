// ═══ CLOUD AUTH SYSTEM (JWT to Backend) ═══
var AUTH={
  getToken: function(){ return localStorage.getItem("cc_jwt"); },
  getLevel: function(){ return localStorage.getItem("cc_level") || "A"; },
  setToken: function(token, level){ localStorage.setItem("cc_jwt", token); localStorage.setItem("cc_level", level); },
  logout: function(){ localStorage.removeItem("cc_jwt"); localStorage.removeItem("cc_level"); },
  checkExpiry: async function(){
    const token = this.getToken();
    if(!token) return {ok: false};
    try {
        const res = await fetch('/api/auth/verify', { headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok) {
            const data = await res.json();
            return {ok: true, level: data.level};
        }
    } catch(e) {}
    this.logout();
    return {ok: false};
  },
  login: async function(pw){
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({password: pw})
        });
        if(!res.ok) return {ok: false};
        const data = await res.json();
        this.setToken(data.token, data.level);
        return {ok: true, level: data.level};
    } catch(e) { return {ok: false}; }
  },
  changePw: async function(currB, newA, newB){
    try {
        const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${this.getToken()}`},
            body: JSON.stringify({currentAdmin: currB, newUser: newA, newAdmin: newB})
        });
        const data = await res.json();
        return {ok: res.ok, msg: data.message};
    } catch(e) { return {ok: false, msg: "Server Connection Error"}; }
  }
};

var _unlocked=false;
async function authCheck(){
  var r=await AUTH.checkExpiry();
  if(r.ok){_unlocked=true;showApp();render();return}
  showLock();
}
function showLock(){
  _unlocked=false;
  document.getElementById("lockScreen").style.display="flex";
  document.getElementById("app").style.display="none";
  document.getElementById("lockErr").style.display="none";
  document.getElementById("lockMsg").textContent="Enter password to access cloud DB";
  setTimeout(function(){var el=document.getElementById("lockPw");if(el)el.focus()},100);
}
function showApp(){
  document.getElementById("lockScreen").style.display="none";
  document.getElementById("app").style.display="block";
}
async function authLogin(){
  var pw=document.getElementById("lockPw").value;
  if(!pw){document.getElementById("lockErr").style.display="block";document.getElementById("lockErr").textContent="Please enter a password";return}
  var r=await AUTH.login(pw);
  if(r.ok){_unlocked=true;document.getElementById("lockPw").value="";showApp();render()}
  else{document.getElementById("lockErr").style.display="block";document.getElementById("lockErr").textContent="Incorrect password. Try again.";document.getElementById("lockPw").value="";document.getElementById("lockPw").focus()}
}
function openPwModal(){document.getElementById("changePwModal").style.display="flex";document.getElementById("pwCurr").value="";document.getElementById("pwNewA").value="";document.getElementById("pwNewB").value="";var m=document.getElementById("pwChMsg");m.style.display="none"}
function closePwModal(){document.getElementById("changePwModal").style.display="none"}
async function changePasswords(){
  var curr=document.getElementById("pwCurr").value;
  var nA=document.getElementById("pwNewA").value;
  var nB=document.getElementById("pwNewB").value;
  var m=document.getElementById("pwChMsg");
  if(!curr){m.style.display="block";m.style.background="rgba(224,62,62,.06)";m.style.border="1px solid rgba(224,62,62,.15)";m.style.color="#e03e3e";m.textContent="Enter current admin password (B)";return}
  if(!nA&&!nB){m.style.display="block";m.style.background="rgba(224,62,62,.06)";m.style.border="1px solid rgba(224,62,62,.15)";m.style.color="#e03e3e";m.textContent="Enter at least one new password";return}
  var r=await AUTH.changePw(curr,nA,nB);
  m.style.display="block";
  if(r.ok){m.style.background="rgba(13,159,110,.06)";m.style.border="1px solid rgba(13,159,110,.2)";m.style.color="#0d9f6e";m.textContent=r.msg;setTimeout(closePwModal,1500)}
  else{m.style.background="rgba(224,62,62,.06)";m.style.border="1px solid rgba(224,62,62,.15)";m.style.color="#e03e3e";m.textContent=r.msg}
}

// Check Authentication immediately on load
authCheck();

// ═══ APPLICATION STATE ═══
var G={page:"import"};
var I={shipType:"breakbulk",customer:"",kurs:17050,importDuty:0,wht:.025,portCharges:370,hedgeRate:1,hedgeDays:60,tujuan:"Cakung",isPipa:false,stripping:0,addCost:0,commission:0,commUnit:"idr",marginType:"fixed",margin:900,payTerms:PAY_OPTS[0],items:[_mi(),_mi(),_mi()],paramsOpen:true,bdOpen:true,showUpload:false,upTab:"excel",uping:false,upPreview:null,upErr:"",pasteTxt:"",showPL:false};
var D={customer:"",whtRate:.003,margins:[{name:"A",val:1000},{name:"B",val:800},{name:"C",val:600}],trkCost:0,trkFrom:"",trkTo:"",payTerms:PAY_OPTS[0],items:[_md(),_md(),_md()],showUpload:false,upTab:"excel",uping:false,upPreview:null,upErr:"",pasteTxt:"",showPL:false};

function _mi(){return{id:Date.now()+Math.random(),name:"",qty:"",cif:"",remark:""}}
function _md(){return{id:Date.now()+Math.random(),name:"",qtyKg:"",buyPrice:"",marginIdx:0,remark:""}}
function fI(v){if(isNaN(v)||v==null)return"-";return new Intl.NumberFormat("id-ID").format(Math.round(v))}
function fD(v,d){d=d||2;if(isNaN(v)||v==null)return"-";return new Intl.NumberFormat("id-ID",{minimumFractionDigits:d,maximumFractionDigits:d}).format(v)}
function esc(s){var d=document.createElement("div");d.textContent=s||"";return d.innerHTML}
function r25(v){return Math.ceil(v/25)*25}

// ═══ CALCULATIONS ═══
function iKSO(t){if(t<=0)return 0;if(I.shipType==="breakbulk"){if(t<=180)return(315*I.kurs)/(t*1000);if(t<=1428)return(1.75*I.kurs)/1000;return(2500*I.kurs)/(t*1000)}var n=Math.ceil(t/20);if(n<=3)return(315*I.kurs)/(t*1000);if(n<=26)return(95*n*I.kurs)/(t*1000);return(2500*I.kurs)/(t*1000)}
function iTrk(t){if(t<=0)return 0;if(I.shipType==="breakbulk"){var d=TRK_BB[I.tujuan];if(!d)return 0;if(I.isPipa)return(Math.ceil(t/25)*d.rt)/(t*1000);var f=Math.floor(t/50),s=t-(f*50);var c=f*50*d.r;if(s>0)c+=s<45?d.rt:s*d.r;return c/(t*1000)}var d=TRK_CT[I.tujuan];if(!d)return 0;var n=Math.ceil(t/20);if(I.shipType==="container20")return(Math.floor(n/2)*d.cb+(n%2)*d.f20)/(t*1000);return(n*d.f40)/(t*1000)}
function iCalc(it,kso,trk){var cfr=Number(it.cif)||0,qty=Number(it.qty)||0,qk=qty*1000;var du=cfr*I.importDuty,wh=(cfr+du)*I.wht;var bU=cfr+du+wh,bI=bU*I.kurs/1000;var ins=1.1*bU*0.0005*I.kurs/1000;var hd=I.hedgeRate*cfr*I.hedgeDays/1000;var st=I.isPipa?120:I.stripping;var pc=I.portCharges,pb=PBM_MAP[I.shipType]||230;var cm=I.commUnit==="usd"?(I.commission*I.kurs/1000):I.commission;var ddp=bI+ins+pc+pb+kso+hd+trk+st+I.addCost+cm;var mV=0,sell=0;if(I.marginType==="percent"){var p=(I.margin||0)/100;mV=ddp/(1-p)-ddp;sell=ddp+mV}else{mV=I.margin||0;sell=ddp+mV}sell=r25(sell);mV=sell-ddp;var sp=r25(sell*1.11);return{qty:qty,qk:qk,du:du,wh:wh,bU:bU,bI:bI,ins:ins,pc:pc,pb:pb,kso:kso,hd:hd,trk:trk,st:st,ac:I.addCost,cm:cm,ddp:ddp,mV:mV,sell:sell,sp:sp,tM:mV*qk,tP:sell*qk,tPP:sp*qk}}
function iAll(){var tT=I.items.reduce(function(s,i){return s+(Number(i.qty)||0)},0);var kso=iKSO(tT),trk=iTrk(tT);var R=I.items.map(function(i){return{item:i,c:iCalc(i,kso,trk)}});return{R:R,tT:R.reduce(function(s,r){return s+r.c.qty},0),tP:R.reduce(function(s,r){return s+r.c.tP},0),tM:R.reduce(function(s,r){return s+r.c.tM},0),tPP:R.reduce(function(s,r){return s+r.c.tPP},0),kso:kso,trk:trk}}

function dTrk(totalKg){return D.trkCost||0}
function dCalc(it,tk){var q=Number(it.qtyKg)||0,bp=Number(it.buyPrice)||0;var wh=bp*D.whtRate,tb=bp+wh;var mg=D.margins[it.marginIdx]?D.margins[it.marginIdx].val:0;var raw=tb+tk+mg;var sell=r25(raw);return{q:q,bp:bp,wh:wh,tb:tb,tk:tk,mg:mg,raw:raw,sell:sell,tM:mg*q,tP:sell*q}}
function dAll(){var tQ=D.items.reduce(function(s,i){return s+(Number(i.qtyKg)||0)},0);var tk=dTrk(tQ);var R=D.items.map(function(i){return{item:i,c:dCalc(i,tk)}});return{R:R,tQ:R.reduce(function(s,r){return s+r.c.q},0),tP:R.reduce(function(s,r){return s+r.c.tP},0),tM:R.reduce(function(s,r){return s+r.c.tM},0),tk:tk}}

// ═══ CLOUD DATA SYNC ═══
async function saveCosting() {
  var type = G.page;
  var data = type === 'import' ? I : D;
  if (!data.customer) { alert("Please provide a customer name to save."); return; }
  
  try {
      var res = await fetch('/api/costings', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${AUTH.getToken()}`},
          body: JSON.stringify({ type: type, customer: data.customer, data: data })
      });
      if(res.ok) alert("✅ Saved to Cloud Successfully!");
      else alert("Failed to save.");
  } catch(e) { alert("Error saving to Cloud"); }
}

async function loadCloudModalOpen() {
  document.getElementById("loadCloudModal").style.display="flex";
  var type = G.page;
  var cl = document.getElementById("cloudList");
  cl.innerHTML = "<i>Loading saved costings...</i>";
  
  try {
      var res = await fetch('/api/costings/' + type, { headers: { 'Authorization': `Bearer ${AUTH.getToken()}` } });
      if(!res.ok) throw new Error();
      var rows = await res.json();
      if(rows.length === 0) cl.innerHTML = "No costings found.";
      else {
          cl.innerHTML = rows.map(function(r){
              var d = new Date(r.created_at).toLocaleDateString();
              return `<div style="display:flex;justify-content:space-between;padding:.5rem;border-bottom:1px solid #ddd;align-items:center;">
                        <div><b>${esc(r.customer)}</b> <span style="font-size:12px;color:#777">${d}</span></div>
                        <button class="btn btn-bl btn-sm" onclick="loadSingleCosting('${r.id}')">Load</button>
                      </div>`;
          }).join("");
      }
  } catch(e) { cl.innerHTML = "Error loading from cloud."; }
}

function closeLoadModal() { document.getElementById("loadCloudModal").style.display="none"; }

async function loadSingleCosting(id) {
  try {
      var res = await fetch('/api/costings/load/' + id, { headers: { 'Authorization': `Bearer ${AUTH.getToken()}` } });
      if(res.ok) {
          var payload = await res.json();
          if(G.page === 'import') I = payload;
          else D = payload;
          closeLoadModal();
          render();
      } else alert("Failed to load costing");
  } catch(e) { alert("Error retrieving costing data."); }
}

// ═══ EXPORTS ═══
function xPDF(id,fn,ori){var el=document.getElementById(id);if(!el)return;el.style.display="block";html2pdf().set({margin:ori==="portrait"?12:8,filename:fn,html2canvas:{scale:2},jsPDF:{unit:"mm",format:"a4",orientation:ori}}).from(el).save().then(function(){el.style.display="none"})}

function iExpXLS(){
  var a=iAll(),R=a.R,tT=a.tT;
  var sl=I.shipType==="breakbulk"?"Break Bulk":I.shipType==="container20"?"Container 20ft":"Container 40ft";
  var kurs=I.kurs,dutyPct=I.importDuty,whtPct=I.wht,hedgeR=I.hedgeRate,hedgeD=I.hedgeDays;
  var hdr=[["Import Costing — "+(I.customer||"Project")],
  ["Type",sl,"Kurs",kurs,"Dest",I.tujuan,"Duty%",dutyPct,"WHT%",whtPct,"HedgeRate",hedgeR,"HedgeDays",hedgeD],
  [],
  ["No","Item","QTY(T)","CFR(USD/T)","Duty(USD/T)","WHT(USD/T)","Based USD/T","Based IDR/kg","Insurance","Port","PBM","KSO","Hedge","Truck","Strip","Comm","Add Cost","DDP","Margin","Sell Price","Sell+VAT","Margin Tot","Project Tot"]];
  var ws=XLSX.utils.aoa_to_sheet(hdr);
  var dataRows=[];var row=5;
  R.forEach(function(rr,idx){
    var it=rr.item,c=rr.c;if(!it.cif||!it.qty)return;
    var n=row;
    XLSX.utils.sheet_add_aoa(ws,[[idx+1,it.name,c.qty,Number(it.cif)]],{origin:"A"+n});
    ws["E"+n]={f:"D"+n+"*"+dutyPct}; ws["F"+n]={f:"(D"+n+"+E"+n+")*"+whtPct}; ws["G"+n]={f:"D"+n+"+E"+n+"+F"+n}; ws["H"+n]={f:"G"+n+"*"+kurs+"/1000"}; ws["I"+n]={f:"1.1*G"+n+"*0.0005*"+kurs+"/1000"}; ws["J"+n]={v:c.pc,t:"n"}; ws["K"+n]={v:c.pb,t:"n"}; ws["L"+n]={v:Math.round(c.kso),t:"n"}; ws["M"+n]={f:hedgeR+"*D"+n+"*"+hedgeD+"/1000"}; ws["N"+n]={v:Math.round(c.trk),t:"n"}; ws["O"+n]={v:c.st,t:"n"}; ws["P"+n]={v:Math.round(c.cm),t:"n"}; ws["Q"+n]={v:c.ac,t:"n"}; ws["R"+n]={f:"H"+n+"+I"+n+"+J"+n+"+K"+n+"+L"+n+"+M"+n+"+N"+n+"+O"+n+"+P"+n+"+Q"+n};
    if(I.marginType==="percent"){ ws["T"+n]={f:"CEILING(R"+n+"/(1-"+(I.margin/100)+"),25)"}; ws["S"+n]={f:"T"+n+"-R"+n}; }
    else{ ws["T"+n]={f:"CEILING(R"+n+"+"+I.margin+",25)"}; ws["S"+n]={f:"T"+n+"-R"+n}; }
    ws["U"+n]={f:"CEILING(T"+n+"*1.11,25)"}; ws["V"+n]={f:"S"+n+"*C"+n+"*1000"}; ws["W"+n]={f:"T"+n+"*C"+n+"*1000"};
    dataRows.push(n); row++;
  });
  row++;var tn=row; ws["A"+tn]={v:"",t:"s"};ws["B"+tn]={v:"TOTAL",t:"s"};
  if(dataRows.length){ var f=dataRows[0],l=dataRows[dataRows.length-1]; ws["C"+tn]={f:"SUM(C"+f+":C"+l+")"}; ws["V"+tn]={f:"SUM(V"+f+":V"+l+")"}; ws["W"+tn]={f:"SUM(W"+f+":W"+l+")"}; }
  ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:row,c:22}});
  ws["!cols"]=[{wch:4},{wch:28},{wch:8},{wch:9},{wch:9},{wch:9},{wch:10},{wch:11},{wch:9},{wch:6},{wch:6},{wch:7},{wch:7},{wch:7},{wch:6},{wch:6},{wch:7},{wch:10},{wch:9},{wch:10},{wch:10},{wch:13},{wch:14}];
  var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Costing");XLSX.writeFile(wb,"Costing_Import_"+(I.customer||"Project")+"_"+new Date().toISOString().slice(0,10)+".xlsx");
}

function dExpXLS(){
  var a=dAll(),R=a.R,tQ=a.tQ,tk=a.tk;
  var whtR=D.whtRate;
  var hdr=[["Domestic Costing — "+(D.customer||"Project")], ["WHT%",whtR,"Trucking IDR/kg",tk], [], ["No","Item","QTY(KG)","Buy Price","WHT","Total Buy","Trucking","Margin","Sell Price","Margin Tot","Project Tot","Remark"]];
  var ws=XLSX.utils.aoa_to_sheet(hdr);
  var dataRows=[];var row=5;
  R.forEach(function(rr,idx){
    var it=rr.item,c=rr.c;if(!it.buyPrice||!it.qtyKg)return;
    var n=row;
    XLSX.utils.sheet_add_aoa(ws,[[idx+1,it.name,Number(it.qtyKg),Number(it.buyPrice)]],{origin:"A"+n});
    ws["E"+n]={f:"D"+n+"*"+whtR}; ws["F"+n]={f:"D"+n+"+E"+n}; ws["G"+n]={v:+c.tk.toFixed(2),t:"n"}; ws["H"+n]={v:c.mg,t:"n"}; ws["I"+n]={f:"CEILING(F"+n+"+G"+n+"+H"+n+",25)"}; ws["J"+n]={f:"H"+n+"*C"+n}; ws["K"+n]={f:"I"+n+"*C"+n}; ws["L"+n]={v:it.remark||"",t:"s"};
    dataRows.push(n); row++;
  });
  row++;var tn=row; ws["A"+tn]={v:"",t:"s"};ws["B"+tn]={v:"TOTAL",t:"s"};
  if(dataRows.length){ var f=dataRows[0],l=dataRows[dataRows.length-1]; ws["C"+tn]={f:"SUM(C"+f+":C"+l+")"}; ws["J"+tn]={f:"SUM(J"+f+":J"+l+")"}; ws["K"+tn]={f:"SUM(K"+f+":K"+l+")"}; }
  ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:row,c:11}});
  ws["!cols"]=[{wch:4},{wch:28},{wch:10},{wch:11},{wch:9},{wch:11},{wch:9},{wch:9},{wch:11},{wch:13},{wch:14},{wch:14}];
  var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Costing");XLSX.writeFile(wb,"Costing_Domestic_"+(D.customer||"Project")+"_"+new Date().toISOString().slice(0,10)+".xlsx");
}

// ═══ UPLOAD & PARSING ═══
function parseXL(f,st){st.uping=true;st.upErr="";st.upPreview=null;render();var r=new FileReader();r.onload=function(e){try{var wb=XLSX.read(e.target.result,{type:"array"}),ws=wb.Sheets[wb.SheetNames[0]],j=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});var h=(j[0]||[]).map(function(x){return String(x).toLowerCase()});var nc=-1,tc=-1,cc=-1;for(var i=0;i<h.length;i++){if(nc<0&&(h[i].includes("nama")||h[i].includes("name")||h[i].includes("item")||h[i].includes("type")||h[i].includes("desc")))nc=i;if(tc<0&&(h[i].includes("ton")||h[i].includes("qty")||h[i].includes("kg")||h[i].includes("weight")))tc=i;if(cc<0&&(h[i].includes("cfr")||h[i].includes("cif")||h[i].includes("price")||h[i].includes("harga")||h[i].includes("usd")||h[i].includes("buy")))cc=i}if(nc<0&&h.length>=2){nc=0;tc=1;if(h.length>=3)cc=2}var rows=j.slice(1).filter(function(r){return r.some(function(c){return c!==""})}).map(function(r){return{name:nc>=0?String(r[nc]||""):"",qty:tc>=0?parseFloat(r[tc])||"":"",price:cc>=0?parseFloat(r[cc])||"":""}}).filter(function(r){return r.name||r.qty||r.price});if(!rows.length){st.upErr="No data found.";st.uping=false;render();return}st.upPreview={rows:rows,info:"Detected "+rows.length+" items"}}catch(er){st.upErr="Error: "+er.message}st.uping=false;render()};r.readAsArrayBuffer(f)}
function parsePaste(st){var raw=st.pasteTxt.trim();if(!raw){st.upErr="Empty text.";render();return}st.upErr="";st.upPreview=null;var lines=raw.split(/\n/).map(function(l){return l.trim()}).filter(function(l){return l}),rows=[];for(var li=0;li<lines.length;li++){var ln=lines[li];var p;if(ln.indexOf("\t")>=0)p=ln.split("\t");else if(ln.indexOf(",")>=0)p=ln.split(",");else p=ln.split(/\s{2,}/);p=p.map(function(s){return s.trim()});var nums=[],txts=[];for(var pi=0;pi<p.length;pi++){var x=p[pi];var n=parseFloat(x.replace(/[^\d.\-]/g,""));if(!isNaN(n)&&/\d/.test(x))nums.push(n);else txts.push(x)}var nm=txts.join(" "),q="",pr="";if(nums.length>=2){q=nums[0];pr=nums[1]}else if(nums.length===1){nums[0]>500?pr=nums[0]:q=nums[0]}var lw=ln.toLowerCase();if(lw.indexOf("nama")>=0&&lw.indexOf("ton")>=0)continue;if(lw.indexOf("no")>=0&&lw.indexOf("item")>=0)continue;if(nm||q||pr)rows.push({name:nm,qty:q,price:pr})}if(!rows.length){st.upErr="No data detected.";render();return}st.upPreview={rows:rows,info:"Parsed "+rows.length+" items"};render()}
function handleFile(f,st){if(!f)return;st.upPreview=null;st.upErr="";var ext=f.name.split(".").pop().toLowerCase();if(["xlsx","xls","csv"].indexOf(ext)>=0){st.upTab="excel";parseXL(f,st)}else{st.upErr="Unsupported format.";render()}}
function closeM(st){st.showUpload=false;st.upPreview=null;st.upErr="";st.uping=false;st.pasteTxt="";render()}

function confirmImpI(){if(!I.upPreview)return;var ni=I.upPreview.rows.map(function(r){return{id:Date.now()+Math.random(),name:r.name||"",qty:r.qty||"",cif:r.price||""}});I.items=I.items.filter(function(i){return i.name||i.qty||i.cif}).concat(ni);closeM(I)}
function confirmImpD(){if(!D.upPreview)return;var ni=D.upPreview.rows.map(function(r){return{id:Date.now()+Math.random(),name:r.name||"",qtyKg:r.qty||"",buyPrice:r.price||"",marginIdx:0,remark:""}});D.items=D.items.filter(function(i){return i.name||i.qtyKg||i.buyPrice}).concat(ni);closeM(D)}

function resetAll(){
  if(!confirm("Reset all form values? This cannot be undone."))return;
  if(G.page==="import"){
    I.customer="";I.items=[_mi(),_mi(),_mi()];I.commission=0;I.addCost=0;I.stripping=0;I.margin=0;I.isPipa=false;I.importDuty=0;I.kurs=17050;
  }else{
    D.customer="";D.items=[_md(),_md(),_md()];D.trkCost=0;D.trkFrom="";D.trkTo="";
  }
  render();
}

function showTujDD(){var dd=document.getElementById("tujDD");if(dd)dd.classList.add("show");document.addEventListener("click",hideTujDD)}
function hideTujDD(e){var w=document.querySelector(".srch-wrap");if(w&&!w.contains(e.target)){var dd=document.getElementById("tujDD");if(dd)dd.classList.remove("show");document.removeEventListener("click",hideTujDD)}}
function filterTujDD(val){var dd=document.getElementById("tujDD");if(!dd)return;dd.classList.add("show");var items=dd.querySelectorAll("div");var lv=val.toLowerCase();items.forEach(function(d){d.style.display=d.textContent.toLowerCase().indexOf(lv)>=0?"":"none"})}
function pickTuj(v){I.tujuan=v;var dd=document.getElementById("tujDD");if(dd)dd.classList.remove("show");render()}


// ═══ HTML RENDERING LOGIC ═══
function render(){
    var h="";
    var today=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});

    h+='<div class="hdr"><div class="wrap"><div class="hdr-in"><div style="display:flex;align-items:center;gap:.5rem"><div style="width:36px;height:36px;border-radius:9px;background:#1a73e8;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem;font-weight:bold;">CC</div><div><h1 style="font-size:1.05rem;font-weight:700">Cost Core Cloud</h1><p style="font-size:.64rem;color:var(--t4)">Steel Product Cost System &bull; '+(AUTH.getLevel()==="B"?"Admin Access":"User Access")+'</p></div></div><div class="hdr-btns">';

    // Cloud Actions
    h+='<button class="btn btn-bl" onclick="saveCosting()">☁️ Save Cloud</button>';
    h+='<button class="btn btn-o" onclick="loadCloudModalOpen()">📥 Load Cloud</button>';
    h+='<span style="width:1px;height:22px;background:var(--bdr);margin:0 .15rem"></span>';

    if(G.page==="import"){
      var st=I;
      h+='<button class="btn btn-gn" onclick="xPDF(\'pArea\',\'Costing_Import_'+(I.customer||'Project')+'_'+new Date().toISOString().slice(0,10)+'.pdf\',\'landscape\')">\uD83D\uDCC4 Costing PDF</button>';
      h+='<button class="btn btn-bl" onclick="xPDF(\'qArea\',\'Quotation_'+(I.customer||'Client')+'_'+new Date().toISOString().slice(0,10)+'.pdf\',\'portrait\')">\uD83D\uDCCB Quotation</button>';
    }else{
      h+='<button class="btn btn-gn" onclick="xPDF(\'dpArea\',\'Costing_Domestic_'+(D.customer||'Project')+'_'+new Date().toISOString().slice(0,10)+'.pdf\',\'landscape\')">\uD83D\uDCC4 Costing PDF</button>';
      h+='<button class="btn btn-bl" onclick="xPDF(\'dqArea\',\'Quotation_Domestic_'+(D.customer||'Client')+'_'+new Date().toISOString().slice(0,10)+'.pdf\',\'portrait\')">\uD83D\uDCCB Quotation</button>';
    }

    h+='<span style="width:1px;height:22px;background:var(--bdr);margin:0 .15rem"></span>';
    h+='<button class="btn btn-o btn-sm" onclick="openPwModal()" title="Change Passwords">\uD83D\uDD11 PW</button>';
    h+='<button class="btn btn-o btn-sm" onclick="AUTH.logout();showLock()" title="Lock & Logout">\uD83D\uDD12 Lock</button>';
    h+='<button class="btn btn-sm" onclick="resetAll()" title="Clear Form" style="background:#e03e3e;color:#fff;font-weight:700;margin-left:auto">\u21BA Reset</button>';
    h+='</div></div></div></div>';

    h+='<div class="ptab"><button class="'+(G.page==="import"?"on":"")+'" onclick="G.page=\'import\';render()">\uD83D\uDEA2 Import Costing</button><button class="'+(G.page==="domestic"?"on":"")+'" onclick="G.page=\'domestic\';render()">\uD83C\uDFE0 Domestic Costing</button></div>';

    h+='<div class="wrap" style="padding:.9rem 1rem 1.2rem">';
    if(G.page==="import") h+=renderImport(today); else h+=renderDomestic(today);
    h+='<div class="footer">Cost Core Cloud v4.2 &bull; Postgres Connected</div></div>';

    if(G.page==="import") h+=renderImportPDFs(today); else h+=renderDomesticPDFs(today);
    var st=G.page==="import"?I:D;
    h+=renderUploadModal(st);

    document.getElementById("app").innerHTML=h;
    
    // Drag/Drop Listeners for File uploads
    var dz=document.getElementById("dz");
    if(dz){
        dz.ondragover=function(e){e.preventDefault();dz.classList.add("ov")};
        dz.ondragleave=function(){dz.classList.remove("ov")};
        dz.ondrop=function(e){e.preventDefault();dz.classList.remove("ov");handleFile(e.dataTransfer.files[0],st)}
    }
}

function renderUploadModal(st){
    var isImp=G.page==="import";
    var h='<div class="mo '+(st.showUpload?"":"hide")+'" onclick="closeM('+(isImp?"I":"D")+')"><div class="mo-c" onclick="event.stopPropagation()"><div class="mo-h"><h2>Import Data</h2><button class="mo-x" onclick="closeM('+(isImp?"I":"D")+')">&times;</button></div><div class="mo-tabs"><button class="mo-tab '+(st.upTab==="excel"?"on":"")+'" onclick="'+(isImp?"I":"D")+'.upTab=\'excel\';'+(isImp?"I":"D")+'.upPreview=null;'+(isImp?"I":"D")+'.upErr=\'\';render()">Upload Excel</button><button class="mo-tab '+(st.upTab==="paste"?"on":"")+'" onclick="'+(isImp?"I":"D")+'.upTab=\'paste\';'+(isImp?"I":"D")+'.upPreview=null;'+(isImp?"I":"D")+'.upErr=\'\';render()">Paste Text</button></div><div class="mo-bd">';
    if(st.upTab==="excel"&&!st.upPreview&&!st.uping&&!st.upErr)h+='<div class="dz" id="dz" onclick="document.getElementById(\'fu\').click()"><input type="file" id="fu" style="display:none" accept=".xlsx,.xls,.csv" onchange="handleFile(this.files[0],'+(isImp?"I":"D")+')"><div style="font-size:2rem;margin-bottom:.5rem">\uD83D\uDCCA</div><div style="color:var(--t2);font-weight:500;margin-bottom:.2rem">Drop Excel/CSV file here</div><div style="color:var(--t4);font-size:.76rem">or click to browse</div></div>';
    if(st.uping)h+='<div style="padding:2rem;text-align:center"><div class="spinner"></div><div style="color:var(--t2)">Reading file...</div></div>';
    if(st.upTab==="paste"&&!st.upPreview)h+='<div class="hint"><b>How to use</b><p>Copy from <strong>Excel, WhatsApp, email</strong> and paste below.<br>Tab: <code>Item [tab] Qty [tab] Price</code></p></div><textarea class="pa" placeholder="Paste data here..." oninput="'+(isImp?"I":"D")+'.pasteTxt=this.value">'+esc(st.pasteTxt)+'</textarea><div class="tar mt"><button class="btn btn-pr" onclick="parsePaste('+(isImp?"I":"D")+')">\uD83D\uDD0D Parse</button></div>';
    if(st.upErr)h+='<div class="al-er mt">'+st.upErr+'</div>';
    if(st.upPreview){var p=st.upPreview;h+='<div class="al-ok mt mb">\u2713 '+p.rows.length+' items \u2014 '+p.info+'</div><div class="ptbl"><table><thead><tr><th style="text-align:left">#</th><th style="text-align:left">Name</th><th>Qty</th><th>Price</th></tr></thead><tbody>';p.rows.forEach(function(r,i){h+='<tr><td style="text-align:left" class="tm">'+(i+1)+'</td><td style="text-align:left">'+(esc(r.name)||"-")+'</td><td>'+(r.qty||"-")+'</td><td class="tp tb">'+(r.price||"-")+'</td></tr>'});h+='</tbody></table></div>'}
    h+='</div>';
    if(st.upPreview){
      h+='<div class="mo-ft"><button class="btn btn-o" onclick="'+(isImp?"I":"D")+'.upPreview=null;'+(isImp?"I":"D")+'.upErr=\'\';render()">\u2190 Back</button><button class="btn btn-pr" onclick="confirmImp'+(isImp?"I":"D")+'()">Import '+st.upPreview.rows.length+' Items</button></div>';
    }
    h+='</div></div>';
    return h;
}

function renderImport(today){
    var a=iAll(),R=a.R,tT=a.tT,tP=a.tP,tM=a.tM,tPP=a.tPP,kso=a.kso,trk=a.trk;
    var pbm=PBM_MAP[I.shipType]||230;
    var tujList=I.shipType==="breakbulk"?Object.keys(TRK_BB):Object.keys(TRK_CT);
    if(tujList.indexOf(I.tujuan)<0)I.tujuan=tujList[0]||"Cakung";
    var sl=I.shipType==="breakbulk"?"Break Bulk":I.shipType==="container20"?"Container 20ft":"Container 40ft";
    var h="";
    h+='<div class="top-g">';
    h+='<div class="pnl"><div class="pnl-h"><h3>\uD83D\uDCE6 Shipment</h3></div><div class="pnl-b"><div class="fg mb"><label class="fl">Shipment Type</label><select class="fi" onchange="I.shipType=this.value;render()"><option value="breakbulk" '+(I.shipType==="breakbulk"?"selected":"")+'>Break Bulk</option><option value="container20" '+(I.shipType==="container20"?"selected":"")+'>Container 20ft</option><option value="container40" '+(I.shipType==="container40"?"selected":"")+'>Container 40ft</option></select></div><div class="fg mb"><label class="fl">Trucking Destination</label><div class="srch-wrap"><input type="text" class="fi" id="tujSearch" value="'+esc(I.tujuan)+'" onfocus="showTujDD()" oninput="filterTujDD(this.value)" placeholder="Type to search..."><div class="srch-dd" id="tujDD">'+tujList.map(function(k){return'<div onclick="pickTuj(\''+k+'\')">'+k+'</div>'}).join("")+'</div></div></div><label class="cb-label"><input type="checkbox" '+(I.isPipa?"checked":"")+' onchange="I.isPipa=this.checked;render()"> Stripping Options</label><div class="info-box mt"><b>KSO:</b> '+fD(kso,2)+' IDR/kg <span class="tm">('+(tT<=0?"-":I.shipType==="breakbulk"?(tT<=180?"USD 315 total / "+fD(tT)+" MT":tT<=1428?"USD 1.75/MT":"USD 2500 total / "+fD(tT)+" MT"):(function(){var n=Math.ceil(tT/20);return n<=3?"USD 315 total / "+n+" cnt":n<=26?"USD 95 x "+n+" cnt":"USD 2500 total / "+n+" cnt"})())+')</span><br><b>Trucking:</b> '+fD(trk,2)+' IDR/kg <span class="tm">('+esc(I.tujuan)+(I.isPipa?", pipe":", non-pipe")+')</span></div></div></div>';
    h+='<div class="pnl"><div class="pnl-h"><h3>\uD83D\uDCB1 Exchange Rate</h3></div><div class="pnl-b"><div class="fg mb"><label class="fl">Rate IDR/USD</label><input type="number" class="fi" value="'+I.kurs+'" onchange="I.kurs=Number(this.value);render()"></div><div class="fg mb"><label class="fl">Customer</label><input type="text" class="fi" value="'+esc(I.customer)+'" placeholder="Customer name" onchange="I.customer=this.value;render()"></div><div class="fg"><label class="fl">Hedging Days</label><select class="fi" onchange="I.hedgeDays=Number(this.value);render()"><option value="60" '+(I.hedgeDays===60?"selected":"")+'>60 days</option><option value="90" '+(I.hedgeDays===90?"selected":"")+'>90 days</option></select></div></div></div>';
    h+='<div class="pnl"><div class="pnl-h"><h3>\uD83D\uDCC8 Margin & Costs</h3></div><div class="pnl-b"><div class="fg mb"><label class="fl">Margin Type</label><select class="fi" onchange="I.marginType=this.value;render()"><option value="fixed" '+(I.marginType==="fixed"?"selected":"")+'>Fixed (IDR/kg)</option><option value="percent" '+(I.marginType==="percent"?"selected":"")+'>Percentage (%)</option></select></div><div class="fg mb"><label class="fl">'+(I.marginType==="fixed"?"Margin (IDR/kg)":"Margin (%)")+'</label><div class="fi-w"><input type="number" class="fi suf" value="'+I.margin+'" onchange="I.margin=Number(this.value);render()"><span class="fi-s">'+(I.marginType==="fixed"?"IDR/kg":"%")+'</span></div></div><div class="fg mb"><label class="fl">Commission</label><div style="display:flex;gap:.35rem"><div class="fi-w" style="flex:1"><input type="number" class="fi suf" value="'+I.commission+'" onchange="I.commission=Number(this.value);render()" style="padding-right:3rem"><span class="fi-s">'+(I.commUnit==="idr"?"IDR/kg":"USD/MT")+'</span></div><select class="fi" style="width:5.2rem;flex-shrink:0" onchange="I.commUnit=this.value;render()"><option value="idr" '+(I.commUnit==="idr"?"selected":"")+'>IDR/kg</option><option value="usd" '+(I.commUnit==="usd"?"selected":"")+'>USD/MT</option></select></div></div><div class="fg mb"><label class="fl">Payment Terms</label><select class="fi" onchange="I.payTerms=this.value;render()">'+PAY_OPTS.map(function(o){return'<option value="'+o+'" '+(o===I.payTerms?"selected":"")+'>'+o+'</option>'}).join("")+'</select></div><div class="fg"><label class="fl">Additional Cost</label><div class="fi-w"><input type="number" class="fi suf" value="'+I.addCost+'" onchange="I.addCost=Number(this.value);render()"><span class="fi-s">IDR/kg</span></div></div></div></div>';
    h+='</div>';
    var po=I.paramsOpen;
    h+='<div class="pnl"><div class="pnl-h clk" onclick="I.paramsOpen=!I.paramsOpen;render()"><h3>\u2699\uFE0F Cost Parameters (auto)</h3><span class="chv '+(po?"open":"")+'">&#x25BE;</span></div>';
    if(po){h+='<div class="pnl-b"><div class="g4"><div class="fg"><label class="fl">Import Duty</label><div class="fi-w"><input type="number" class="fi suf" value="'+(I.importDuty*100)+'" onchange="I.importDuty=Number(this.value)/100;render()" step="0.1"><span class="fi-s">%</span></div></div><div class="fg"><label class="fl">WHT</label><div class="fi-w"><input type="number" class="fi suf" value="'+(I.wht*100)+'" onchange="I.wht=Number(this.value)/100;render()" step="0.1"><span class="fi-s">%</span></div></div><div class="fg"><label class="fl">Port Charges</label><div class="fi-w"><input type="number" class="fi suf" value="'+I.portCharges+'" disabled><span class="fi-s">IDR/kg</span></div></div><div class="fg"><label class="fl">PBM ('+sl+')</label><div class="fi-w"><input type="number" class="fi suf" value="'+pbm+'" disabled><span class="fi-s">IDR/kg</span></div></div><div class="fg"><label class="fl">KSO (auto)</label><div class="fi-w"><input type="number" class="fi suf" value="'+fD(kso,1)+'" disabled><span class="fi-s">IDR/kg</span></div></div><div class="fg"><label class="fl">Hedge Rate</label><div class="fi-w"><input type="number" class="fi suf" value="'+I.hedgeRate+'" onchange="I.hedgeRate=Number(this.value);render()" step="0.1"><span class="fi-s"></span></div></div><div class="fg"><label class="fl">Trucking (auto)</label><div class="fi-w"><input type="number" class="fi suf" value="'+fD(trk,1)+'" disabled><span class="fi-s">IDR/kg</span></div></div><div class="fg"><label class="fl">Stripping</label><div class="fi-w"><input type="number" class="fi suf" value="'+(I.isPipa?120:I.stripping)+'" '+(I.isPipa?"disabled":"")+' onchange="I.stripping=Number(this.value);render()"><span class="fi-s">IDR/kg</span></div></div></div></div>'}
    h+='</div>';
    h+='<div class="pnl"><div class="pnl-h"><h3>\uD83D\uDD29 Items</h3><button class="btn btn-o btn-sm" onclick="I.showUpload=true;render()">\u2B06 Upload</button></div><div class="pnl-b">';
    I.items.forEach(function(it,i){h+='<div class="itm"><span class="itm-n">'+(i+1)+'</span><input type="text" class="ii nm" value="'+esc(it.name)+'" placeholder="Item detail & spec" onchange="I.items['+i+'].name=this.value;render()"><div class="fi-w"><input type="number" class="ii nu suf" value="'+it.qty+'" placeholder="0" onchange="I.items['+i+'].qty=this.value;render()" style="padding-right:2.1rem"><span class="fi-s">TON</span></div><div class="fi-w"><input type="number" class="ii ci suf" value="'+it.cif+'" placeholder="0" onchange="I.items['+i+'].cif=this.value;render()" style="padding-right:2.4rem"><span class="fi-s">USD/T</span></div><input type="text" class="ii rm" value="'+esc(it.remark)+'" placeholder="Remark" onchange="I.items['+i+'].remark=this.value;render()"><button class="itm-x" onclick="I.items.splice('+i+',1);if(!I.items.length)I.items=[_mi()];render()">\u00D7</button></div>'});
    h+='<div class="gap mt"><button class="btn btn-o btn-sm" onclick="I.items.push(_mi());render()">+ Add</button><button class="btn btn-o btn-sm" onclick="I.items=I.items.filter(function(i){return i.name||i.qty||i.cif});if(!I.items.length)I.items=[_mi()];render()">Remove Empty</button></div></div></div>';
    h+='<div class="pnl"><div class="pnl-h"><h3>\uD83D\uDCCA Results</h3><span style="font-size:.6rem;color:var(--t4)">Selling price rounded up to nearest IDR 25</span></div><div class="pnl-b"><div class="tw"><table class="mono"><thead><tr><th style="text-align:left">#</th><th style="text-align:left">Item</th><th>QTY<br><span class="tm">TON</span></th><th>CFR<br><span class="tm">USD/T</span></th><th>Based<br><span class="tm">IDR/kg</span></th><th>DDP<br><span class="tm">IDR/kg</span></th><th class="tp">Margin<br><span style="color:var(--pr2)">IDR/kg</span></th><th class="tp tb">Sell Price<br><span style="color:var(--pr2)">IDR/kg</span></th><th class="tg">+VAT<br><span style="color:var(--gn)">IDR/kg</span></th><th>Margin<br><span class="tm">Total</span></th><th>Project<br><span class="tm">Total</span></th></tr></thead><tbody>';
    R.forEach(function(r,i){var it=r.item,c=r.c,ok=it.cif&&it.qty;h+='<tr><td style="text-align:left" class="tm">'+(i+1)+'</td><td style="text-align:left">'+(esc(it.name)||"-")+'</td><td>'+(ok?fD(c.qty):"-")+'</td><td>'+(ok?fI(it.cif):"-")+'</td><td>'+(ok?fI(c.bI):"-")+'</td><td>'+(ok?fI(c.ddp):"-")+'</td><td class="tp">'+(ok?fI(Math.round(c.mV)):"-")+'</td><td class="tp tb">'+(ok?fI(c.sell):"-")+'</td><td class="tg">'+(ok?fI(c.sp):"-")+'</td><td>'+(ok?fI(c.tM):"-")+'</td><td>'+(ok?fI(c.tP):"-")+'</td></tr>'});
    h+='</tbody><tfoot><tr class="t-tot"><td colspan="2" style="text-align:left;color:var(--pr2);font-size:.64rem;text-transform:uppercase" class="tb">Total</td><td class="tb">'+fD(tT)+'</td><td colspan="6"></td><td class="tp tb">'+fI(tM)+'</td><td class="tb">'+fI(tP)+'</td></tr></tfoot></table></div>';
    h+='<div class="sg"><div class="sc"><div class="sc-l">Total Tonnage</div><div class="sc-v">'+fD(tT)+' <span style="font-size:.7rem;color:var(--t4)">MT</span></div></div><div class="sc pr"><div class="sc-l">Total Margin</div><div class="sc-v tp">Rp '+fI(tM)+'</div></div><div class="sc"><div class="sc-l">Project (Ex VAT)</div><div class="sc-v">Rp '+fI(tP)+'</div></div><div class="sc gn"><div class="sc-l">Project (Incl VAT 11%)</div><div class="sc-v tg">Rp '+fI(tPP)+'</div></div></div></div></div>';
    var bdi=I.bdOpen;
    h+='<div class="pnl"><div class="pnl-h clk" onclick="I.bdOpen=!I.bdOpen;render()"><h3>\uD83D\uDCCB Cost Breakdown (per item)</h3><span class="chv '+(bdi?"open":"")+'">&#x25BE;</span></div>';
    if(bdi){
    R.forEach(function(rr,idx){
      var it=rr.item,c=rr.c;
      if(!it.cif||!it.qty)return;
      var cfr=Number(it.cif)||0;
      h+='<div class="pnl-b" style="'+(idx>0?"border-top:1px solid var(--bdr2)":"")+'"><div style="font-size:.78rem;font-weight:700;color:var(--pr);margin-bottom:.4rem">'+(idx+1)+'. '+(esc(it.name)||"Item "+(idx+1))+' <span style="font-weight:400;color:var(--t4)">('+fD(c.qty)+' MT / CFR $'+fI(cfr)+'/T)</span></div>';
      h+='<div class="bd"><span class="bd-l">CFR Price</span><span class="bd-v">$ '+fD(cfr,2)+' /MT</span></div>';
      h+='<div class="bd"><span class="bd-l">+ Import Duty ('+fD(I.importDuty*100,1)+'%)</span><span class="bd-v">$ '+fD(c.du,2)+'</span><span class="bd-n">= CFR × '+fD(I.importDuty*100,1)+'%</span></div>';
      h+='<div class="bd"><span class="bd-l">+ WHT ('+fD(I.wht*100,1)+'%)</span><span class="bd-v">$ '+fD(c.wh,2)+'</span><span class="bd-n">= (CFR+Duty) × '+fD(I.wht*100,1)+'%</span></div>';
      h+='<div class="bd sep"><span class="bd-l">Based Price (USD/T)</span><span class="bd-v">$ '+fD(c.bU,2)+'</span><span class="bd-n">= CFR + Duty + WHT</span></div>';
      h+='<div class="bd"><span class="bd-l">Based Price (IDR/kg)</span><span class="bd-v">Rp '+fD(c.bI,2)+'</span><span class="bd-n">= Based × '+fI(I.kurs)+' / 1000</span></div>';
      h+='<div class="bd"><span class="bd-l">+ Insurance</span><span class="bd-v">Rp '+fD(c.ins,2)+'</span><span class="bd-n">= 1.1 × Based × 0.05% × Kurs / 1000</span></div>';
      h+='<div class="bd"><span class="bd-l">+ Port Charges</span><span class="bd-v">Rp '+fI(c.pc)+'</span></div>';
      h+='<div class="bd"><span class="bd-l">+ PBM ('+sl+')</span><span class="bd-v">Rp '+fI(c.pb)+'</span></div>';
      h+='<div class="bd"><span class="bd-l">+ KSO</span><span class="bd-v">Rp '+fD(c.kso,2)+'</span></div>';
      h+='<div class="bd"><span class="bd-l">+ Hedging ('+I.hedgeDays+'d)</span><span class="bd-v">Rp '+fD(c.hd,2)+'</span><span class="bd-n">= '+I.hedgeRate+' × CFR × '+I.hedgeDays+' / 1000</span></div>';
      h+='<div class="bd"><span class="bd-l">+ Trucking ('+esc(I.tujuan)+')</span><span class="bd-v">Rp '+fD(c.trk,2)+'</span></div>';
      h+='<div class="bd"><span class="bd-l">+ Stripping</span><span class="bd-v">Rp '+fI(c.st)+'</span></div>';
      if(c.cm>0) h+='<div class="bd"><span class="bd-l">+ Commission</span><span class="bd-v">Rp '+fD(c.cm,2)+'</span></div>';
      if(c.ac>0) h+='<div class="bd"><span class="bd-l">+ Additional Cost</span><span class="bd-v">Rp '+fI(c.ac)+'</span></div>';
      h+='<div class="bd sep hl"><span class="bd-l">DDP (Landed Cost)</span><span class="bd-v">Rp '+fI(Math.round(c.ddp))+'</span></div>';
      h+='<div class="bd"><span class="bd-l">+ Margin'+(I.marginType==="percent"?" ("+I.margin+"%)":"")+'</span><span class="bd-v">Rp '+fI(Math.round(c.mV))+'</span></div>';
      h+='<div class="bd sep hl"><span class="bd-l">\u2192 Selling Price</span><span class="bd-v" style="color:var(--pr)">Rp '+fI(c.sell)+'</span><span class="bd-n">rounded \u2191 25</span></div>';
      h+='<div class="bd"><span class="bd-l">\u2192 + VAT 11%</span><span class="bd-v" style="color:var(--gn)">Rp '+fI(c.sp)+'</span></div>';
      h+='</div>';
    });
    }
    h+='</div>';
    return h;
}

function renderDomestic(today){
    var a=dAll(),R=a.R,tQ=a.tQ,tP=a.tP,tM=a.tM,tk=a.tk;
    var h="";
    h+='<div class="top-g"><div class="pnl"><div class="pnl-h"><h3>\uD83D\uDE9A Trucking</h3></div><div class="pnl-b"><div class="fg mb"><label class="fl">Trucking Cost (IDR/kg)</label><div class="fi-w"><input type="number" class="fi suf" value="'+D.trkCost+'" onchange="D.trkCost=Number(this.value);render()"><span class="fi-s">IDR/kg</span></div></div><div class="g2"><div class="fg"><label class="fl">Pickup Location</label><input type="text" class="fi" value="'+esc(D.trkFrom)+'" placeholder="e.g. Marunda" onchange="D.trkFrom=this.value;render()"></div><div class="fg"><label class="fl">Delivery Destination</label><input type="text" class="fi" value="'+esc(D.trkTo)+'" placeholder="e.g. Cikarang" onchange="D.trkTo=this.value;render()"></div></div></div></div>';
    h+='<div class="pnl"><div class="pnl-h"><h3>\uD83C\uDFE2 Customer & Terms</h3></div><div class="pnl-b"><div class="fg mb"><label class="fl">Customer</label><input type="text" class="fi" value="'+esc(D.customer)+'" placeholder="Customer name" onchange="D.customer=this.value;render()"></div><div class="fg mb"><label class="fl">WHT Rate</label><div class="fi-w"><input type="number" class="fi suf" value="'+(D.whtRate*100)+'" onchange="D.whtRate=Number(this.value)/100;render()" step="0.01"><span class="fi-s">%</span></div></div><div class="fg"><label class="fl">Payment Terms</label><select class="fi" onchange="D.payTerms=this.value;render()">'+PAY_OPTS.map(function(o){return'<option value="'+o+'" '+(o===D.payTerms?"selected":"")+'>'+o+'</option>'}).join("")+'</select></div></div></div>';
    h+='<div class="pnl"><div class="pnl-h"><h3>\uD83D\uDCB0 Margin Types (IDR/kg)</h3></div><div class="pnl-b">';
    D.margins.forEach(function(m,i){h+='<div class="mg-row"><span class="fl" style="width:2.5rem;font-weight:700;color:var(--pr)">'+esc(m.name)+'</span><input type="text" class="fi" style="width:4rem" value="'+esc(m.name)+'" onchange="D.margins['+i+'].name=this.value;render()" placeholder="Name"><input type="number" class="fi" style="width:7rem" value="'+m.val+'" onchange="D.margins['+i+'].val=Number(this.value);render()"><button class="itm-x" onclick="D.margins.splice('+i+',1);render()">\u00D7</button></div>'});
    h+='<button class="btn btn-o btn-sm mt" onclick="D.margins.push({name:String.fromCharCode(65+D.margins.length),val:500});render()">+ Add Margin Type</button>';
    h+='</div></div></div>';
    h+='<div class="pnl"><div class="pnl-h"><h3>\uD83D\uDD29 Items</h3><button class="btn btn-o btn-sm" onclick="D.showUpload=true;render()">\u2B06 Upload</button></div><div class="pnl-b">';
    D.items.forEach(function(it,i){
      var mgOpts=D.margins.map(function(m,mi){return'<option value="'+mi+'" '+(it.marginIdx===mi?"selected":"")+'>'+esc(m.name)+' ('+fI(m.val)+')</option>'}).join("");
      h+='<div class="itm"><span class="itm-n">'+(i+1)+'</span><input type="text" class="ii nm" value="'+esc(it.name)+'" placeholder="Item name / spec" onchange="D.items['+i+'].name=this.value;render()"><div class="fi-w"><input type="number" class="ii nu suf" value="'+it.qtyKg+'" placeholder="0" onchange="D.items['+i+'].qtyKg=this.value;render()" style="padding-right:1.8rem"><span class="fi-s">KG</span></div><div class="fi-w"><input type="number" class="ii ci suf" value="'+it.buyPrice+'" placeholder="0" onchange="D.items['+i+'].buyPrice=this.value;render()" style="padding-right:2.8rem"><span class="fi-s">IDR/kg</span></div><select class="fi" style="width:6rem;padding:.34rem .3rem;font-size:.7rem" onchange="D.items['+i+'].marginIdx=Number(this.value);render()">'+mgOpts+'</select><input type="text" class="ii rm" value="'+esc(it.remark)+'" placeholder="Remark" onchange="D.items['+i+'].remark=this.value;render()"><button class="itm-x" onclick="D.items.splice('+i+',1);if(!D.items.length)D.items=[_md()];render()">\u00D7</button></div>'});
    h+='<div class="gap mt"><button class="btn btn-o btn-sm" onclick="D.items.push(_md());render()">+ Add</button><button class="btn btn-o btn-sm" onclick="D.items=D.items.filter(function(i){return i.name||i.qtyKg||i.buyPrice});if(!D.items.length)D.items=[_md()];render()">Remove Empty</button></div></div></div>';
    h+='<div class="pnl"><div class="pnl-h"><h3>\uD83D\uDCCA Results</h3><span style="font-size:.6rem;color:var(--t4)">Trucking: '+fD(tk,1)+' IDR/kg</span></div><div class="pnl-b"><div class="tw"><table class="mono"><thead><tr><th style="text-align:left">#</th><th style="text-align:left">Item</th><th>QTY<br><span class="tm">KG</span></th><th>Buy Price<br><span class="tm">IDR/kg</span></th><th>WHT</th><th>Total Buy</th><th>Truck</th><th>Margin</th><th class="tp tb">Sell Price<br><span style="color:var(--pr2)">IDR/kg</span></th><th>Margin<br><span class="tm">Total</span></th><th>Project<br><span class="tm">Total</span></th><th>Remark</th></tr></thead><tbody>';
    R.forEach(function(r,i){var it=r.item,c=r.c,ok=it.buyPrice&&it.qtyKg;var mgName=D.margins[it.marginIdx]?D.margins[it.marginIdx].name:"";h+='<tr><td style="text-align:left" class="tm">'+(i+1)+'</td><td style="text-align:left">'+(esc(it.name)||"-")+'</td><td>'+(ok?fI(c.q):"-")+'</td><td>'+(ok?fI(c.bp):"-")+'</td><td>'+(ok?fD(c.wh,1):"-")+'</td><td>'+(ok?fI(c.tb):"-")+'</td><td>'+(ok?fD(c.tk,1):"-")+'</td><td>'+(ok?fI(c.mg)+" <span class=tm>("+esc(mgName)+")</span>":"-")+'</td><td class="tp tb">'+(ok?fI(c.sell):"-")+'</td><td>'+(ok?fI(c.tM):"-")+'</td><td>'+(ok?fI(c.tP):"-")+'</td><td class="tm" style="font-size:.68rem">'+(esc(it.remark)||"")+'</td></tr>'});
    h+='</tbody><tfoot><tr class="t-tot"><td colspan="2" style="text-align:left;color:var(--pr2);font-size:.64rem;text-transform:uppercase" class="tb">Total</td><td class="tb">'+fI(tQ)+'</td><td colspan="6"></td><td class="tp tb">'+fI(tM)+'</td><td class="tb">'+fI(tP)+'</td><td></td></tr></tfoot></table></div>';
    h+='<div class="sg"><div class="sc"><div class="sc-l">Total Quantity</div><div class="sc-v">'+fI(tQ)+' <span style="font-size:.7rem;color:var(--t4)">KG</span></div></div><div class="sc pr"><div class="sc-l">Total Margin</div><div class="sc-v tp">Rp '+fI(tM)+'</div></div><div class="sc"><div class="sc-l">Project Total</div><div class="sc-v">Rp '+fI(tP)+'</div></div><div class="sc gn"><div class="sc-l">Incl VAT 11%</div><div class="sc-v tg">Rp '+fI(Math.round(tP*1.11))+'</div></div></div></div></div>';
    return h;
}

function renderImportPDFs(today){
    var a=iAll(),R=a.R,tT=a.tT,tP=a.tP,tM=a.tM,tPP=a.tPP;
    var sl=I.shipType==="breakbulk"?"Break Bulk":I.shipType==="container20"?"Container 20ft":"Container 40ft";
    var h="";
    h+='<div id="pArea" style="display:none;padding:16px;background:#fff;color:#1a2744;font-family:DM Sans,sans-serif;font-size:10px"><h2 style="margin:0 0 2px;font-size:14px;color:#1a2744">Import Costing \u2014 '+(esc(I.customer)||"Project")+'</h2><p style="color:#4e6382;font-size:9px;margin-bottom:8px">'+today+' \u2022 '+sl+' \u2192 '+I.tujuan+' \u2022 Rate: Rp '+fI(I.kurs)+' \u2022 Hedge: '+I.hedgeDays+'d</p><table style="width:100%;border-collapse:collapse;font-size:9px"><thead><tr style="background:#e8eef6"><th style="border:1px solid #b8c7db;padding:3px;text-align:left;color:#4e6382">No</th><th style="border:1px solid #b8c7db;padding:3px;text-align:left;color:#4e6382">Item</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">QTY</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">CFR</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">Based</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">DDP</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#1a73e8;font-weight:700">Sell Price</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#0d9f6e">+VAT</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">Margin Tot</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">Project Tot</th></tr></thead><tbody>';
    R.forEach(function(r,i){var it=r.item,c=r.c;if(!it.cif||!it.qty)return;h+='<tr><td style="border:1px solid #b8c7db;padding:2px 3px">'+(i+1)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px">'+esc(it.name)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fD(c.qty)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(it.cif)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(c.bI)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(c.ddp)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right;font-weight:700;color:#1a73e8">'+fI(c.sell)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right;color:#0d9f6e">'+fI(c.sp)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(c.tM)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(c.tP)+'</td></tr>'});
    h+='<tr style="background:#e8eef6;font-weight:700"><td colspan="2" style="border:1px solid #b8c7db;padding:2px 3px">TOTAL</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fD(tT)+'</td><td colspan="5"></td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(tM)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(tP)+'</td></tr></tbody></table></div>';
    h+='<div id="qArea" style="display:none;padding:28px 34px;background:#fff;color:#1a2744;font-family:DM Sans,sans-serif;font-size:11px;line-height:1.5"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;border-bottom:2px solid #1a73e8;padding-bottom:14px"><div><h1 style="font-size:18px;font-weight:700;color:#1a2744;margin:0 0 3px">QUOTATION</h1><p style="font-size:10px;color:#4e6382;margin:0">Date: '+today+'</p></div></div><div style="margin-bottom:16px"><p style="font-size:10px;color:#7b8fa8;margin:0 0 2px">Customer:</p><p style="font-size:13px;font-weight:700;margin:0;color:#1a2744">'+(esc(I.customer)||"[Customer Name]")+'</p></div><table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:16px"><thead><tr style="background:#e8eef6"><th style="border:1px solid #b8c7db;padding:5px 7px;text-align:left;font-size:9px;color:#4e6382">No</th><th style="border:1px solid #b8c7db;padding:5px 7px;text-align:left;font-size:9px;color:#4e6382">Item Description</th><th style="border:1px solid #b8c7db;padding:5px 7px;text-align:right;font-size:9px;color:#4e6382">Qty (MT)</th><th style="border:1px solid #b8c7db;padding:5px 7px;text-align:right;font-size:9px;color:#4e6382">Unit Price (IDR/kg)</th><th style="border:1px solid #b8c7db;padding:5px 7px;text-align:right;font-size:9px;color:#4e6382">Amount (IDR)</th><th style="border:1px solid #b8c7db;padding:5px 7px;text-align:left;font-size:9px;color:#4e6382">Remarks</th></tr></thead><tbody>';
    var qn=0;R.forEach(function(r){var it=r.item,c=r.c;if(!it.cif||!it.qty)return;qn++;h+='<tr><td style="border:1px solid #b8c7db;padding:4px 7px">'+qn+'</td><td style="border:1px solid #b8c7db;padding:4px 7px">'+esc(it.name)+'</td><td style="border:1px solid #b8c7db;padding:4px 7px;text-align:right">'+fD(c.qty)+'</td><td style="border:1px solid #b8c7db;padding:4px 7px;text-align:right;font-weight:600">Rp '+fI(c.sell)+'</td><td style="border:1px solid #b8c7db;padding:4px 7px;text-align:right">Rp '+fI(c.tP)+'</td><td style="border:1px solid #b8c7db;padding:4px 7px;font-size:9px;color:#4e6382">'+(esc(it.remark)||"")+'</td></tr>'});
    h+='<tr style="background:#e8eef6"><td colspan="2" style="border:1px solid #b8c7db;padding:4px 7px;font-weight:700">Subtotal</td><td style="border:1px solid #b8c7db;padding:4px 7px;text-align:right;font-weight:700">'+fD(tT)+' MT</td><td></td><td style="border:1px solid #b8c7db;padding:4px 7px;text-align:right;font-weight:700">Rp '+fI(tP)+'</td><td></td></tr><tr><td colspan="4" style="border:1px solid #b8c7db;padding:4px 7px;text-align:right;color:#4e6382">VAT 11%</td><td style="border:1px solid #b8c7db;padding:4px 7px;text-align:right">Rp '+fI(tP*0.11)+'</td><td></td></tr><tr style="background:rgba(26,115,232,.06)"><td colspan="4" style="border:1px solid #b8c7db;padding:5px 7px;text-align:right;font-weight:700;font-size:12px;color:#1557b0">GRAND TOTAL</td><td style="border:1px solid #b8c7db;padding:5px 7px;text-align:right;font-weight:700;font-size:12px;color:#1557b0">Rp '+fI(tPP)+'</td><td></td></tr></tbody></table>';
    h+='<div style="margin-top:18px;padding:12px 16px;background:#e8eef6;border:1px solid #b8c7db;border-radius:8px;font-size:10px;color:#2e4063"><p style="font-weight:700;font-size:11px;margin:0 0 6px;color:#1a2744">Terms & Conditions</p><table style="font-size:10px;line-height:1.6;border:none;width:100%"><tr><td style="padding:1px 0;vertical-align:top;width:4px;border:none">\u2022</td><td style="padding:1px 0 1px 6px;border:none"><strong>Franco:</strong> '+esc(I.tujuan)+'</td></tr><tr><td style="padding:1px 0;vertical-align:top;border:none">\u2022</td><td style="padding:1px 0 1px 6px;border:none">All prices exclude VAT</td></tr><tr><td style="padding:1px 0;vertical-align:top;border:none">\u2022</td><td style="padding:1px 0 1px 6px;border:none"><strong>Payment Terms:</strong> '+esc(I.payTerms)+'</td></tr><tr><td style="padding:1px 0;vertical-align:top;border:none">\u2022</td><td style="padding:1px 0 1px 6px;border:none">Prices are subject to change without prior notice</td></tr><tr><td style="padding:1px 0;vertical-align:top;border:none">\u2022</td><td style="padding:1px 0 1px 6px;border:none">Product availability and stock must be confirmed at the time of order</td></tr></table></div><div style="margin-top:32px;display:flex;justify-content:space-between"><div style="text-align:center;width:180px"><div style="border-top:1px solid #b8c7db;padding-top:5px;font-size:10px;color:#4e6382">Authorized Signature</div></div><div style="text-align:center;width:180px"><div style="border-top:1px solid #b8c7db;padding-top:5px;font-size:10px;color:#4e6382">Customer Approval</div></div></div></div>';
    return h;
}

function renderDomesticPDFs(today){
    var a=dAll(),R=a.R,tQ=a.tQ,tP=a.tP,tM=a.tM;
    var h="";
    h+='<div id="dpArea" style="display:none;padding:16px;background:#fff;color:#1a2744;font-family:DM Sans,sans-serif;font-size:10px"><h2 style="margin:0 0 2px;font-size:14px;color:#1a2744">Domestic Costing \u2014 '+(esc(D.customer)||"Project")+'</h2><p style="color:#4e6382;font-size:9px;margin-bottom:8px">'+today+' \u2022 WHT: '+(D.whtRate*100)+'%'+(D.trkFrom||D.trkTo?' \u2022 Route: '+(esc(D.trkFrom)||"-")+' \u2192 '+(esc(D.trkTo)||"-"):'')+'</p><table style="width:100%;border-collapse:collapse;font-size:9px"><thead><tr style="background:#e8eef6"><th style="border:1px solid #b8c7db;padding:3px;text-align:left;color:#4e6382">No</th><th style="border:1px solid #b8c7db;padding:3px;text-align:left;color:#4e6382">Item</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">QTY(KG)</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">Buy Price</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">WHT</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">Total Buy</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">Truck</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">Margin</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#1a73e8;font-weight:700">Sell Price</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">Margin Tot</th><th style="border:1px solid #b8c7db;padding:3px;text-align:right;color:#4e6382">Project Tot</th></tr></thead><tbody>';
    R.forEach(function(r,i){var it=r.item,c=r.c;if(!it.buyPrice||!it.qtyKg)return;h+='<tr><td style="border:1px solid #b8c7db;padding:2px 3px">'+(i+1)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px">'+esc(it.name)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(c.q)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(c.bp)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fD(c.wh,1)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(c.tb)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fD(c.tk,1)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(c.mg)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right;font-weight:700;color:#1a73e8">'+fI(c.sell)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(c.tM)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(c.tP)+'</td></tr>'});
    h+='<tr style="background:#e8eef6;font-weight:700"><td colspan="2" style="border:1px solid #b8c7db;padding:2px 3px">TOTAL</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(tQ)+'</td><td colspan="6"></td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(tM)+'</td><td style="border:1px solid #b8c7db;padding:2px 3px;text-align:right">'+fI(tP)+'</td></tr></tbody></table></div>';
    h+='<div id="dqArea" style="display:none;padding:28px 34px;background:#fff;color:#1a2744;font-family:DM Sans,sans-serif;font-size:11px;line-height:1.5"><div style="margin-bottom:22px;border-bottom:2px solid #1a73e8;padding-bottom:14px"><h1 style="font-size:18px;font-weight:700;color:#1a2744;margin:0 0 3px">QUOTATION</h1><p style="font-size:10px;color:#4e6382;margin:0">Date: '+today+'</p></div><div style="margin-bottom:16px"><p style="font-size:10px;color:#7b8fa8;margin:0 0 2px">Customer:</p><p style="font-size:13px;font-weight:700;margin:0;color:#1a2744">'+(esc(D.customer)||"[Customer Name]")+'</p></div><table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:16px"><thead><tr style="background:#e8eef6"><th style="border:1px solid #b8c7db;padding:5px 7px;text-align:left;font-size:9px;color:#4e6382">No</th><th style="border:1px solid #b8c7db;padding:5px 7px;text-align:left;font-size:9px;color:#4e6382">Item Description</th><th style="border:1px solid #b8c7db;padding:5px 7px;text-align:right;font-size:9px;color:#4e6382">Qty (KG)</th><th style="border:1px solid #b8c7db;padding:5px 7px;text-align:right;font-size:9px;color:#4e6382">Unit Price (IDR/kg)</th><th style="border:1px solid #b8c7db;padding:5px 7px;text-align:right;font-size:9px;color:#4e6382">Amount (IDR)</th><th style="border:1px solid #b8c7db;padding:5px 7px;text-align:left;font-size:9px;color:#4e6382">Remarks</th></tr></thead><tbody>';
    var qn=0;R.forEach(function(r){var it=r.item,c=r.c;if(!it.buyPrice||!it.qtyKg)return;qn++;h+='<tr><td style="border:1px solid #b8c7db;padding:4px 7px">'+qn+'</td><td style="border:1px solid #b8c7db;padding:4px 7px">'+esc(it.name)+'</td><td style="border:1px solid #b8c7db;padding:4px 7px;text-align:right">'+fI(c.q)+'</td><td style="border:1px solid #b8c7db;padding:4px 7px;text-align:right;font-weight:600">Rp '+fI(c.sell)+'</td><td style="border:1px solid #b8c7db;padding:4px 7px;text-align:right">Rp '+fI(c.tP)+'</td><td style="border:1px solid #b8c7db;padding:4px 7px;font-size:9px;color:#4e6382">'+(esc(it.remark)||"")+'</td></tr>'});
    h+='<tr style="background:#e8eef6"><td colspan="2" style="border:1px solid #b8c7db;padding:4px 7px;font-weight:700">Subtotal</td><td style="border:1px solid #b8c7db;padding:4px 7px;text-align:right;font-weight:700">'+fI(tQ)+' KG</td><td></td><td style="border:1px solid #b8c7db;padding:4px 7px;text-align:right;font-weight:700">Rp '+fI(tP)+'</td><td></td></tr><tr><td colspan="4" style="border:1px solid #b8c7db;padding:4px 7px;text-align:right;color:#4e6382">VAT 11%</td><td style="border:1px solid #b8c7db;padding:4px 7px;text-align:right">Rp '+fI(tP*0.11)+'</td><td></td></tr><tr style="background:rgba(26,115,232,.06)"><td colspan="4" style="border:1px solid #b8c7db;padding:5px 7px;text-align:right;font-weight:700;font-size:12px;color:#1557b0">GRAND TOTAL</td><td style="border:1px solid #b8c7db;padding:5px 7px;text-align:right;font-weight:700;font-size:12px;color:#1557b0">Rp '+fI(Math.round(tP*1.11))+'</td><td></td></tr></tbody></table>';
    h+='<div style="margin-top:18px;padding:12px 16px;background:#e8eef6;border:1px solid #b8c7db;border-radius:8px;font-size:10px;color:#2e4063"><p style="font-weight:700;font-size:11px;margin:0 0 6px;color:#1a2744">Terms & Conditions</p><table style="font-size:10px;line-height:1.6;border:none;width:100%"><tr><td style="padding:1px 0;vertical-align:top;width:4px;border:none">\u2022</td><td style="padding:1px 0 1px 6px;border:none"><strong>Franco:</strong> '+(esc(D.trkTo)||"TBD")+'</td></tr><tr><td style="padding:1px 0;vertical-align:top;border:none">\u2022</td><td style="padding:1px 0 1px 6px;border:none">All prices exclude VAT</td></tr><tr><td style="padding:1px 0;vertical-align:top;border:none">\u2022</td><td style="padding:1px 0 1px 6px;border:none"><strong>Payment Terms:</strong> '+esc(D.payTerms)+'</td></tr><tr><td style="padding:1px 0;vertical-align:top;border:none">\u2022</td><td style="padding:1px 0 1px 6px;border:none">Prices are subject to change without prior notice</td></tr><tr><td style="padding:1px 0;vertical-align:top;border:none">\u2022</td><td style="padding:1px 0 1px 6px;border:none">Product availability and stock must be confirmed at the time of order</td></tr></table></div><div style="margin-top:32px;display:flex;justify-content:space-between"><div style="text-align:center;width:180px"><div style="border-top:1px solid #b8c7db;padding-top:5px;font-size:10px;color:#4e6382">Authorized Signature</div></div><div style="text-align:center;width:180px"><div style="border-top:1px solid #b8c7db;padding-top:5px;font-size:10px;color:#4e6382">Customer Approval</div></div></div></div>';
    return h;
}
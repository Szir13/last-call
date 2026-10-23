/* ---- upgrade trees show only the next nodes; the rest is tucked into one line ---- */
var NXT={};
function updNext(key,tr,labels){
  if(!tr||!tr.nodes||!tr.grid)return;
  var box=NXT[key];
  if(!box){
    box=NXT[key]={el:el("div","pxnextw"),sig:"",fixed:false};
    var lb=tr.grid.parentNode.querySelector(".tlabels");if(lb)lb.style.display="none";
    tr.grid.style.display="none";tr.grid.parentNode.insertBefore(box.el,tr.grid);
  }
  var nx=[],own=[];
  tr.nodes.forEach(function(n){var l=nLevel(n),mx=nMax(n);if(l>=mx)own.push(n.n);else if(nReqMet(n))nx.push({n:n,l:l,mx:mx})});
  if(nx.length&&!nx.some(function(o){return o.n.id===tr.sel})){tr.sel=nx[0].n.id;updateTree(tr)}
  var sig=nx.map(function(o){return o.n.id+":"+o.l+":"+(canPay(o.n,o.l)?1:0)+":"+(tr.sel===o.n.id?1:0)}).join("|")+"#"+own.length;
  if(sig===box.sig)return;
  box.sig=sig;box.el.innerHTML="";
  if(!nx.length){box.el.appendChild(el("p","gnote","Everything here is unlocked."))}
  else{
    var grid=el("div","pxnext");
    nx.forEach(function(o){
      var n=o.n,b=el("button",(canPay(n,o.l)?"can":"")+(tr.sel===n.id?" sel":""));b.type="button";
      if(labels&&labels[n.col])b.appendChild(el("span","br",labels[n.col]));
      b.appendChild(el("span","tn",n.n));
      b.appendChild(el("span","ts",(o.mx>1?o.l+"/"+o.mx+" · ":"")+costText(n,o.l)));
      b.onclick=function(){tr.sel=n.id;updateTree(tr);box.sig="";updNext(key,tr,labels)};
      grid.appendChild(b);
    });
    box.el.appendChild(grid);
  }
  if(own.length)box.el.appendChild(el("div","pxown","Unlocked: "+own.join(", ")));
}
setInterval(function(){try{updNext("bar",ref.tr.bar,["Team","Service","Stock","Customers"]);updNext("train",ref.tr.train,null)}catch(e){}},500);


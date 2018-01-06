/* PurchS2S Copyright 2017 Purch, Inc.*/
var PURCHS2S_VERSION="1.0.9";
var purchs2s=purchs2s||{};
purchs2s.timing={};
purchs2s.timing.adunits={};
purchs2s.timing.start=new Date().getTime();
purchs2sutils={};
purchs2sutils.status={};
(function(funcName) {
  baseObj = window;
  var readyList = [];
  var readyFired = false;
  var readyEventHandlersInstalled = false;
  function ready() {
    if (!readyFired) {
      readyFired = true;
      for (var i = 0; i < readyList.length; i++) {
        readyList[i].fn.call(window, readyList[i].ctx);
      }
      readyList = [];
    }
  }

  function readyStateChange() {
    if (document.readyState === "complete") {
      ready();
    }
  }

  baseObj[funcName] = function(callback, context) {
    if (readyFired) {
      setTimeout(function() { callback(context); }, 1);
      return;
    } else {
      readyList.push({fn: callback, ctx: context});
    }
    if (document.readyState === "complete" || (!document.attachEvent && document.readyState === "interactive")) {
      setTimeout(ready, 1);
    } else if (!readyEventHandlersInstalled) {
      if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", ready, false);
        window.addEventListener("load", ready, false);
      } else {
        document.attachEvent("onreadystatechange", readyStateChange);
        window.attachEvent("onload", ready);
      }
      readyEventHandlersInstalled = true;
    }
  }
})("tmntag_ready");
purchs2sutils.processBidResponseTimeout=function(refresh, divids){
  if (purchs2s.bidResponseProcessed) return;
  purchs2s.bidResponseProcessed = true;
  purchs2sutils.status.bidRequestTimeout=true;
  if (!refresh) {
    googletag.cmd.push(function() { googletag.pubads().refresh(); });
  } else {
    var slots = googletag.pubads().getSlots();
    if (typeof divids!='undefined' && divids && slots) {
      var refreshedSlots = [];
      for (var i=0; i<divids.length; i++) {
        for (var j=0; j<slots.length; j++) {
          var slot = slots[j];
          var divid = slot.getSlotElementId();
          if (divid===divids[i]) refreshedSlots.push(slot);
        }
      }
      if (refreshedSlots.length>0) googletag.pubads().refresh(refreshedSlots);
    } else if (typeof divids=='undefined' || !divids) {
      googletag.pubads().refresh();
    }
  }

  if (purchs2s.timeoutHandler) {
    purchs2sutils.log("Timeout after "+purchs2sutils.timeout()+" ms");
    purchs2s.timeoutHandler();
  }
}
purchs2sutils.timeout=function(){
  return (purchs2s.timeout)?purchs2s.timeout:500;
}
purchs2sutils.log=function(msg){
}
purchs2sutils.setup=function(refresh, divids){
  var serializeState=function (refresh, divIds) {
    var filterAdUnitsByIds = function(divIds, adUnits){
      var filtered = [];
      if (!divIds || !divIds.length) {
        filtered = adUnits;
      } else if (adUnits) {
        var a = [];
        if (!(divIds instanceof Array)) a.push(divIds);
        else a = divIds;
        for (var i = 0, l = adUnits.length; i < l; i++) {
          var adUnit = adUnits[i];
          if (adUnit && adUnit.d && (a.indexOf(adUnit.d) > -1)) {
            filtered.push(adUnit);
          }
        }
      }
      return filtered;
    }
    var state = {};
    if (refresh) purchs2s.f = 1;
    state["f"]  = purchs2s.f;
    state["p"]  = (refresh)?"":purchs2s["p"];
    state["s"]  = purchs2s["s"];
    state["g"]  = purchs2s["g"];
    state["l"]  = purchs2s["l"];
    state["tt"] = purchs2s["tt"];
    state["tt"] = state["tt"].replace(/'|;|quot;|39;|&amp;|&|#|\r\n|\r|\n|\t|\f|\%0A|\"|\%22|\%5C|\%23|\%26|\%26|\%09/gm, "");
    state["fs"] = purchs2s["fs"];
    state["rtb"] = purchs2s["rtb"];
    state["a"]  = filterAdUnitsByIds(divIds, purchs2s.a || []);
    state["t"]  = purchs2sutils.timestamp();
    state["tz"] = Math.round(new Date().getTimezoneOffset());
    state["r"]  = purchs2sutils.clientDim();
    return JSON.stringify(state).replace(/'|&|#/g, "");
  };
  var findURL=function(){
    for (var i=0; i<document.scripts.length; i++) {
      var script = document.scripts[i];
      var idx = script.src.indexOf('purchs2s.js');
      if (idx>0) {
        return(script.src.substring(0, idx));
      }
    }
    return 'http://ads.servebom.com/';
  }
  /* DISCOVER SLOTS */
  var slots = googletag.pubads().getSlots();
  for (var i=0; slots && i<slots.length; i++) {
    var slot = slots[i];
    var sizes = slot.getSizes();
    var sz = [];
    for (var j=0; sizes && j<sizes.length; j++) {
      sz.push([sizes[j].getWidth(), sizes[j].getHeight()]);
    }
    purchs2s.adunit({account:slot.getAdUnitPath(), div:slot.getSlotElementId(), sizes:sz});
  }

  var i, r = Math.floor(Math.random() * 11000);
  var host = findURL();
  var qs = "r="+r+"&o="+serializeState(refresh, divids)+"&fmt=jsonp";
  var call = host+"purchs2stag.js?v=s2s&"+qs;
  purchs2s.timing.bidRequestSent=new Date().getTime();
  purchs2s.bidResponseProcessed = false;
  setTimeout(purchs2sutils.processBidResponseTimeout, purchs2sutils.timeout()+500, refresh, divids);

  purchs2sutils.loadScript(call);
}
purchs2sutils.processBidResponse=function(response){
  purchs2s.timing.bidResponseReady=new Date().getTime()-purchs2s.timing.bidRequestSent;
  purchs2sutils.log("purchs2s.timing.bidResponseReady "+purchs2s.timing.bidResponseReady);
  var processExperiments=function(response){
    var exp = response.exp;
    if (typeof exp!='undefined' && exp) {
      googletag.pubads().setTargeting("_ex", serializeExperiments(exp));
    }
  }
  var processBids=function(response){
    var slots = googletag.pubads().getSlots();
    var refreshedSlots = [];
    for (var i=0; typeof response!='undefined' && response && slots && i<slots.length; i++) {
      var slot = slots[i];
      var divid = slot.getSlotElementId();

      var bids = response.bids;
      var isBid = false;
      if (typeof bids!='undefined' && bids) {
        for (var j=0; j<bids.length; j++) {
          var bid = bids[j];
          if (bid.divid===divid) {
            refreshedSlots.push(slot);
            if ("1"===bid.brdid || "1"===bid.bdrid) continue;
            purchs2s.timing.adunits[divid]={};
            purchs2s.timing.adunits[divid]['received_bid']=new Date().getTime()-purchs2s.timing.bidRequestSent;
            slot.setTargeting("adunit", bid.divid);
            slot.setTargeting("_bd", "bid");
            slot.setTargeting("_cp", bid.price);
            slot.setTargeting("_pl", bid.bucket);
            slot.setTargeting("_br", bid.bidder);
            slot.setTargeting("_wb", bid.id);
            slot.setTargeting("_sz", bid.size_code);
            if (bid.dealid) {
              slot.setTargeting("_pdid", bid.dealid);
            }
            isBid = true;
            break;
          }
        }
      }
      if (!isBid) {
        if (purchs2s.passbackHandler) {
          purchs2sutils.log("Passback for adunit "+divid);
          purchs2s.passbackHandler(divid);
        }
      } else {
        if (purchs2s.fillHandler) {
          purchs2sutils.log("Bid available for adunit "+divid);
          purchs2s.fillHandler(divid);
        }
      }
    }
    return refreshedSlots;
  }
  var serializeExperiments=function(exp){
    var ret = "";
    if (typeof exp!='undefined' && exp) for (var i=0; i<exp.length; i++) {
      if (i==0) ret += "|";
      ret+=exp[i]+"|";
    }
    return ret;
  }
  var processPixels=function(response){
    if (!response.refresh && typeof response.pixels!='undefined' && response.pixels) {
      for (var i in response.pixels) {
        var pixel = response.pixels[i];
        if (pixel && !pixel.donotrender && pixel.content) {
          purchs2sutils.evalJSON(pixel.content);
          if (purchs2s.pixelHandler) {
            purchs2sutils.log("Pixel rendered index:"+i+", campaign:"+pixel.campaign);
            purchs2s.pixelHandler(i, pixel.campaign);
          }
        }
      }
    }
    purchs2sutils.status.pixelsProcessed=true;
  }
  if (purchs2s.bidResponseProcessed) return;
  purchs2s.bidResponseProcessed = true;
  purchs2sutils.status.bidRequestTimeout=false;
  purchs2s.bidResponse = response;
  if (typeof response=='undefined' || !response) {
    googletag.cmd.push(function() { googletag.pubads().refresh(); });
    if (purchs2s.timeoutHandler) {
      purchs2sutils.log("Timeout");
      purchs2s.timeoutHandler();
    }
    return;
  }
  processPixels(response);
  processExperiments(response);
  var refreshedSlots = processBids(response);

  if (!response.refresh) {
    googletag.cmd.push(function() { googletag.pubads().refresh(); });
  } else {
    googletag.pubads().refresh(refreshedSlots);
  }

  purchs2sutils.status.bidRequestProcessed=true;
}
purchs2sutils.evalJSON=function(theJSON) {
  try{
    eval(theJSON);
  } catch (e) {
    console && console.error && console.error(e);
  }
}
purchs2sutils.getAdUnit=function(divid) {
  for(var i = 0; i < purchs2s.a.length; i++) {
    if (purchs2s.a[i].d === divid) {
      return purchs2s.a[i];
    }
  }
  return false;
}
purchs2sutils.supportsFlash=function(){
  var supportsFlash = 1;
  try {
    if (navigator.mimeTypes && navigator.mimeTypes.length > 0) {
      // Firefox, Google Chrome, Safari, Opera
      var mime = navigator.mimeTypes['application/x-shockwave-flash'];
      if (mime && mime.enabledPlugin) {
        supportsFlash = 1;
      }
    } else {
      if (typeof (ActiveXObject) != "undefined") {
        // Internet Explorer
        try {
          var flash = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.1");
          supportsFlash = 1;
        }
        catch (e) {
        }
      }
    }
  } catch (e) {
    console && console.error && console.error(exception);
  }
  return supportsFlash;
}
purchs2sutils.clientDim=function(){
  try {
    w = document.documentElement.clientWidth || document.body.clientWidth || window.innerWidth;
    h = document.documentElement.clientHeight || document.body.clientHeight || window.innerHeight;
    return w+"x"+h;
  }catch(e){
    console.error(e);
  }
}
purchs2sutils.topLocation=function(){
  return (window.context && window.context.location && window.context.location.href)?window.context.location.href:window.top.document.location.href;
}
purchs2sutils.timestamp=function() {
  var date = new Date();
  /*zero-pad a single zero if needed*/
  var zp = function (val) {
    return (val <= 9 ? '0' + val : '' + val);
  }

  /*zero-pad up to two zeroes if needed*/
  var zp2 = function(val) {
    return val <= 99? (val <=9? '00' + val : '0' + val) : ('' + val ) ;
  }

  var d = date.getDate();
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  var h = date.getHours();
  var min = date.getMinutes();
  var s = date.getSeconds();
  var ms = date.getMilliseconds();
  return '' + y + '-' + zp(m) + '-' + zp(d) + ' ' + zp(h) + ':' + zp(min) + ':' + zp(s);
}
purchs2s.a=[];
purchs2s.l=encodeURIComponent(purchs2sutils.topLocation().replace('%',''));
purchs2s.tt=encodeURIComponent(document.title);
purchs2s.t=purchs2sutils.timestamp();
purchs2s.tz=Math.round(new Date().getTimezoneOffset());
purchs2s.r=purchs2sutils.clientDim();
purchs2s.fs=purchs2sutils.supportsFlash();
purchs2sutils.loadScript = function (src) {
  var s = document.createElement('script');
  s.async = true; s.src = src;
  var h = document.getElementsByTagName('script')[0];
  h.parentNode.insertBefore(s, h);
}
purchs2s.location=function(location){
  purchs2sutils.log("Location set to "+location);
  purchs2s.l=encodeURIComponent(location);
}
purchs2s.adunit = function (adunitObject) {
  var removeByAttrValue=function(array, attribute, value) {
    for (var i = array.length - 1; i >= 0; i--) {
      var entry = array[i];
      if (entry[attribute] && entry[attribute] === value) {
        array.splice(i, 1);
      }
    }
  }
  var a = purchs2sutils.getAdUnit(adunitObject.div)||{};
  if (adunitObject.account) {
    a.s = adunitObject.account;
  } else if (purchs2s.s) {
    a.s = purchs2s.s;
  }
  if (adunitObject.sizes) {
    a.z = adunitObject.sizes;
  }
  if (adunitObject.div) {
    a.d = adunitObject.div;
  }
  if (adunitObject.targeting) {
    a.g = adunitObject.targeting;
  } else {
    a.g={};
  }
  if (adunitObject.companion) {
    a.c = adunitObject.companion;
  }
  if (adunitObject.div) {
    removeByAttrValue(purchs2s.a, 'd', adunitObject.div);
  }
  if (adunitObject.sizeMapping) {
    a.sm = adunitObject.sizeMapping;
  }
  /* {"BIDDER_ID":{"WxH":"TAG_ID", "WxH":"TAG_ID"}} */
  if (adunitObject.rtb) {
    a.rtb = adunitObject.rtb;
  }
  purchs2s.a.push(a);
  return a;
}

/* {"BIDDER_ID":{"seat":"SEAT_ID", "pub":"PUBLISHER_ID", "site":"SITE_ID"}} */
purchs2s.rtb = function(rtbObject) {
  purchs2s.rtb = rtbObject;
};

purchs2s.setup=function() {
  purchs2sutils.log("purchs2s.setup called");
  purchs2sutils.setup();
}
purchs2s.render=function(doc, id){
  return tmntag_render(doc, id);
}
purchs2s.sizeMapping=function(divid){
  var _sm = [];
  return {
    divid : divid,
    addSize: function(key, val){
      _sm.push([key, val]);
      return this;
    },
    build: function() {
      var ret = [];
      if (googletag) {
        var sm = googletag.sizeMapping();
        for (var i=0; i<_sm.length; i++) {
          sm.addSize(_sm[i][0], _sm[i][1]);
        }
        ret = sm.build();
        purchs2s.cmd.push(function(){
          purchs2s.adunit({div: divid, sizeMapping: ret});
        });
      }
      return ret;
    }
  };
}
tmntag_render=function(doc, id){
  purchs2sutils.log("purchs2s.render called for ad unit "+id);
  var ret = false;
  if (typeof purchs2s.bidResponse!='undefined' && purchs2s.bidResponse && typeof purchs2s.bidResponse.bids!='undefined' && purchs2s.bidResponse.bids) {
    var bids = purchs2s.bidResponse.bids;
    if (typeof bids!='undefined' && bids) {
      for (var j=0; j<bids.length; j++) {
        var bid = bids[j];
        if (bid.divid===id) {
          var markup = bid.adm;
          var width=1;
          var height=1;
          if (bid.size) { 
            if (bid.size.w) width  = bid.size.w;
            if (bid.size.h) height = bid.size.h;
          }
          if (typeof markup!='undefined' && markup!=null && markup) {
            purchs2s.timing.adunits[id]['rendered']=new Date().getTime()-purchs2s.timing.start;
            markup = markup.replace(/'\r\n|\r|\n/gm, "");
            if(typeof confiantWrap=='function' && CONFIANT_WRAPPER_ID) {
              var bdrname = purchs2sutils.bidderName(bid);
              var confiantMarkupId = 'purch_' + bdrname;
              if (!confiantWrap(doc, markup, confiantMarkupId, width+'x'+height, 'clarium.global.ssl.fastly.net', CONFIANT_WRAPPER_ID)) {
                doc.write(markup);
                doc.close();
              }
            } else {
              doc.write(markup);
              doc.close();
            }
            
            ret = true;
            var slots = googletag.pubads().getSlots();
            for (var i=0; slots && i<slots.length; i++) {
              slot = slots[i];
              if (slot && id===slot.getSlotElementId()) {
                slot.setTargeting("_bd", "none");
                break;
              }
            }
            if (doc.defaultView && doc.defaultView.frameElement) {
              var widthpx = width+"px";
              var heightpx = height+"px";
              doc.defaultView.frameElement.width = widthpx;
              doc.defaultView.frameElement.height = heightpx;
              if ((top!==self) && self && self.frameElement) {
                self.frameElement['width'] = widthpx;
                self.frameElement['height'] = heightpx;
              }
            }
          }
          break;
        }
      }
    }
  }
  if (ret) if (purchs2s.renderHandler) {
    purchs2sutils.log("Ad Rendered for ad unit "+id);
    purchs2s.renderHandler(id);
  }
  return ret;
}
tmntag_triggerEvent=function(eventType, params){
  var qs = "";
  if (params) for (var k in params) {
    if (qs!="") qs+="&";
    qs+=k+"="+params[k];
  }
  var r = Math.floor(Math.random() * 11000);
  qs="t="+eventType+"&r="+r+"&"+qs;
  var e = document.createElement("script");
  e.src = "//ads.servebom.com/event.js?"+qs;
  var scripts = document.getElementsByTagName("script")[0];
  scripts.parentNode.insertBefore(e, scripts);
}
purchs2s.refresh=function(divids){
  purchs2sutils.log("purchs2s.refresh called for ad unit(s) "+divids);
  purchs2sutils.setup(true, divids);
}
purchs2s.cmd.executeCommands = function() {
  while (i = purchs2s.cmd.shift()) {
    if (typeof i==='function') {i();}
  }
}
purchs2s.cmd.push = function(item) {
  purchs2s.cmd.executeCommands();
  if (typeof item==='function') {item();}
}
purchs2s.cmd.pushDefined = true;
var purchs2s_checkCommands = function() {
  if (!purchs2s.cmd.pushDefined) {
    setTimeout(purchs2s_checkCommands, 100);
  } else {
    purchs2s.cmd.executeCommands();
  }
}
purchs2s_checkCommands();
purchs2s.apiReady=true;
purchs2s.debug=function() {
  console.log("--------------------- PURCH S2S DEBUG ---------------------");
  var all={};
  all.bidResponse=purchs2s.bidResponse;
  all.timing=purchs2s.timing;
  all.googletag=(typeof googletag!='undefined')?googletag:'none';
  all.purchs2s=purchs2s;
  all.googleSlots=(typeof googletag!='undefined')?googletag.pubads().getSlots():'none';
  all.pageLoation=purchs2sutils.topLocation();
  all.bidResponseProcessed=purchs2s.bidResponseProcessed;
  all.bidRequestTimeout=purchs2sutils.status.bidRequestTimeout;
  all.status=purchs2sutils.status;
  if (googletag) {
    var slots = googletag.pubads().getSlots();
    var tagchecks = slots.map(function(slot) {
      var div = slot.getSlotElementId();
      var elm = document.getElementById(div);
      var rt = {};
      if (!elm) {
        ret = {Message: "Ad Slot declared in GPT, but NO DIV found on page", DIV: div, Type: "BAD !"};
      } else {
        ret = {Message: "Checked", DIV: div, Type: "GOOD"};
      }
      return ret;
    });
    if (console.table) {
      console.log("TAGS CHECK:");
      console.table(tagchecks)
    };
    all.tagchecks = tagchecks;
  }
  if (all.bidRequestTimeout) console.log("BID REQUEST TIMED OUT");
  console.log("BIDS:");
  if (purchs2s.bidResponse && purchs2s.bidResponse.bids) console.table(purchs2s.bidResponse.bids);
  console.log("-----------------------------------------------------------");
  return all;
};
purchs2sutils.bidderName=function(bid){
  var ret="NA";
  if (bid) {
    if (bid.bidderName) ret=bid.bidderName;
    else {
      var purch_bidder_id_map = {'CAXS':'Index-Simulator', '15108529':'Index', '60822169':'Pubmatic', '14481529':'Amazon', '84300529':'Yieldbot', '87260329':'Sonobi', '85099489':'Yellowhammer', '95587969':'Bidtellect', '103230529':'Triplelift', '103229929':'Nativeads', '103229809':'Distroscale', '103230049':'Appnexus', '103229569':'AOL', '103229089':'C1X', '103229449':'Rubicon', '103229329':'Searchlinks', '103229689':'Pulsepoint', '103229209':'Purch', '131060089':'OpenX', '131059969':'Sovrn', '131059849':'BRealtime', '103228969':'Districtm', '131059129':'Powerlinks', '131059369':'Facebook', '167403649':'Tremor', '167403889':'Defymedia', '103230649':'Wideorbit', '131059609':'Adblade', '167404249':'Inneractive', '131059489':'Sekindo', '167405209':'Mediamath'};
      ret = purch_bidder_id_map[bid.bidder] || bid.bidder;
    }
  }
  return ret;
}
/* /PurchS2S Copyright 2017 Purch, Inc.*/try {
tmntag_ready(function() {

function _tmnSyncAPX() {
try {
   if (document.body) {
      var pid = "23,25,26,29,33";
      var s = document.createElement('iframe');
      var r = Math.floor(Math.random() * 11000);
      s.style.display = 'none';
      var p=(document.location.protocol=='http:')?"http":"https";
      s.defer = true;
      s.src = p+"://ib.adnxs.com/getuid?"+p+":%2F%2Fads.servebom.com%2Fpartner%3Fcb%3D"+r+"%26svc%3Dus%26id%3D23%2C25%2C26%2C29%2C33%26uid%3D$UID";
     /*if (typeof tmntag !== 'undefined' && typeof tmntag.monitorElementLoadTime === 'function') {
         tmntag.monitorElementLoadTime(s, 'app_nexus');
      }*/
      document.body.appendChild(s);
   } else {
      setTimeout(_tmnSyncAPX, 1000);
   }
} catch(e) {
   console.error(e);
}
}
_tmnSyncAPX();

});
} catch (e) {
console.error(e);
}
try {
tmntag_ready(function() {

(function(){try{var a="${PAGE_DOMAIN:OPENX_1X1_ID}";if(a==""||a.indexOf("$")==0)a="538535676";var b=document.createElement("span"),c=Math.floor(Math.random()*11E3);b.style.display="none";var d=document.location.protocol;b.innerHTML="<iframe id='4451dc03ec' name='4451dc03ec' src='"+d+"//tmn-d.openx.net/w/1.0/afr?auid="+a+"&cb="+c+"' frameBorder='0' frameSpacing='0' scrolling='no' width='1' height='1'></iframe>";document.body.appendChild(b)}catch(e){console.error(e)}})();

});
} catch (e) {
console.error(e);
}
try {
tmntag_ready(function() {

!function(){try{if(document.location.protocol!="http:")return;var b=document.getElementsByTagName("script")[0],a=document.createElement("script");a.src="//sync.go.sonobi.com/uc.js";b.parentNode.insertBefore(a,b)}catch(c){console.error(c)}}();!function(){try{var b=Math.floor(Math.random()*11E3),a=document.createElement("img"),c=document.location.protocol=="https:"?"https":"http";a.src=c+"://purch-sync.go.sonobi.com/us?"+c+"://ads.servebom.com/partner?cb="+b+"&svc=us&id=9&uid=[UID]";document.body.appendChild(a)}catch(d){console.error(d)}}();

});
} catch (e) {
console.error(e);
}
try {
tmntag_ready(function() {

(function(){try{var a=document.createElement("span"),b=Math.floor(Math.random()*11E3);a.style.display="none";var c=document.location.protocol=="https:"?"https":"http";a.innerHTML='<iframe style="display:none" src="//sync.aralego.com/idSync/?ucf_nid=par-2EE948B3EA8B6A90994284DE3BE42B&ucf_user_id=6D701C3DDADC4BC1812D7604D9632EE6&redirect='+c+"%3A%2F%2Fads.servebom.com%2Fpartner%3Fcd%3D"+b+'%26svc%3Dus%26id%3D31%26uid%3DUCFUID"></iframe>';document.body.appendChild(a)}catch(d){console.error(d)}})();

});
} catch (e) {
console.error(e);
}
try {
tmntag_ready(function() {

(function(){try{var a=document.createElement("span"),b=Math.floor(Math.random()*11E3);a.style.display="none";var c=document.location.protocol=="https:"?"https":"http";a.innerHTML='<iframe style="display:none" src="//ads.pubmatic.com/AdServer/js/user_sync.html?r='+b+"&p=46338&predirect="+c+"%3A%2F%2Fads.servebom.com%2Fpartner%3Fcd%3D"+b+'%26svc%3Dus%26id%3D5%26uid%3D"></iframe>';document.body.appendChild(a)}catch(d){console.error(d)}})();

});
} catch (e) {
console.error(e);
}
try {
tmntag_ready(function() {

/* Sovrn User Sync */
function _tmnSyncSovrn() {
try {
   if (document.body) {
      var pid = "24";
      var s = document.createElement('iframe');
      var r = Math.floor(Math.random() * 11000);
      s.style.display = 'none';
      var p=(document.location.protocol=='http:')?"http":"https";
      s.defer = true;
      s.src = p+"://ap.lijit.com/pixel?redir="+p+":%2F%2Fads.servebom.com%2Fpartner%3Fcb%3D"+r+"%26svc%3Dus%26id%3D24%26uid%3D$UID";
      document.body.appendChild(s);
   } else {
      setTimeout(_tmnSyncSovrn, 1000);
   }
} catch(e) {
   console.error(e);
}
}
_tmnSyncSovrn();
/* Sovrn User Sync */


});
} catch (e) {
console.error(e);
}
try {
tmntag_ready(function() {

!function(){try{var b=document.location.protocol=="https:"?"https":"http",a=document.createElement("span"),c=Math.floor(Math.random()*11E3);a.style.display="none";a.innerHTML="<iframe style='display:none' src='"+b+"://bh.contextweb.com/bh/rtset?pid=558527&cb="+c+"&ev=1&rurl="+b+"%3A%2F%2Fads.servebom.com%2Fpartner%3Fsvc%3Dus%26id%3D17%26cb%3D"+c+"%26uid%3D%25%25VGUID%25%25'></iframe>";document.body.appendChild(a)}catch(d){console.error(d)}}();

});
} catch (e) {
console.error(e);
}
try {
tmntag_ready(function() {

!function(){try{var a=document.createElement("span"),b=Math.floor(Math.random()*11E3);a.style.display="none";a.innerHTML='<iframe style="display:none" src="//eb2.3lift.com/getuid?redir=%2F%2Fads.servebom.com%2Fpartner%3Fcb%3D'+b+'%26svc%3Dus%26id%3D14%26uid%3D%24UID"></iframe>';document.body.appendChild(a)}catch(c){console.error(c)}}();

});
} catch (e) {
console.error(e);
}
try {
function _tmnSyncRBX(){try{if(document.body){var a=document.createElement("script");a.style.display="none";var c=document.location.protocol;a.defer=true;var b="assets.rubiconproject.com";if(document.location.protocol=="https:")b="secure-assets.rubiconproject.com";a.src=c+"//"+b+"/utils/xapi/multi-sync.js";a.dataset.partner="11868";a.dataset.region="na";a.dataset.country="us";a.dataset.endpoint="us-east";document.body.appendChild(a)}else setTimeout(_tmnSyncRBX,1E3)}catch(d){console.error(d)}}_tmnSyncRBX();
} catch (e) {
console.error(e);
}
try {
tmntag_ready(function() {

(function(){try{var a=document.createElement("span"),b=Math.floor(Math.random()*11E3);a.style.display="none";var c=document.location.protocol=="https:"?"https":"http";a.innerHTML='<iframe style="display:none" src="//ads.pubmatic.com/AdServer/js/user_sync.html?r='+b+"&p=46338&predirect="+c+"%3A%2F%2Fads.servebom.com%2Fpartner%3Fcd%3D"+b+'%26svc%3Dus%26id%3D45%26uid%3D"></iframe>';document.body.appendChild(a)}catch(d){console.error(d)}})();

});
} catch (e) {
console.error(e);
}
try {
tmntag_ready(function() {

function _tmnSyncCAX(){try{if(document.body){var a=document.createElement("iframe"),b=Math.floor(Math.random()*11E3);a.style.display="none";var c=document.location.protocol;a.defer=true;var d="ssum.casalemedia.com";if(document.location.protocol=="https:")d="ssum-sec.casalemedia.com";a.src=c+"//"+d+"/usermatch?r="+b+"&s=181869&cb="+c+"%2F%2Fads.servebom.com%2Fpartner%3Fcb%3D"+b+"%26svc%3Dus%26id%3D2%26uid%3D";document.body.appendChild(a)}else setTimeout(_tmnSyncCAX,1E3)}catch(e){console.error(e)}}
_tmnSyncCAX();

});
} catch (e) {
console.error(e);
}
try {
tmntag_ready(function() {

(function(){try{var a=document.createElement("span"),b=Math.floor(Math.random()*11E3);a.style.display="none";var c=document.location.protocol=="https:"?"https":"http";a.innerHTML='<iframe style="display:none" src="//ads.pubmatic.com/AdServer/js/user_sync.html?r='+b+"&p=46338&predirect="+c+"%3A%2F%2Fads.servebom.com%2Fpartner%3Fcd%3D"+b+'%26svc%3Dus%26id%3D46%26uid%3D"></iframe>';document.body.appendChild(a)}catch(d){console.error(d)}})();

});
} catch (e) {
console.error(e);
}

// define placement, sitewide
var network = 8691100,
	bsa_debug = false,
	bsa_targeting = [
		['bsas2s', 'true'],
		['bsas2spub', 'coingecko']
	],
	placements = {
		"bsa-zone_1509402283990-0_123456": 
		{
			"id": "bsa-zone_1509402283990-0_123456",
			"name": "CoinGecko_leaderboard_728x90_atf_ROS",
			"sizes": [[320, 50], [728, 90]],
			"options": {
				"sizemap": [
					[
						[0, 0],
						[
							[320, 50]
						]
					],
					[
						[640, 480],
						[
							[728, 90]
						]
					]
				]
			}
		},
		"bsa-zone_1509402283990-1_123456": 
		{
			"id": "bsa-zone_1509402283990-1_123456",
			"name": "CoinGecko_medium-rectangle_300x250_atf_ROS",
			"sizes": [[300, 250],[336, 280]],
			"options": {
				"sizemap": [
					[
						[0, 0],
						[[300, 250],[336, 280]]
					],
					[
						[0, 0],
						[[300, 250],[336, 280]]
					]
				]
			}
		},
		"bsa-zone_1513111948755-1_123456": 
		{
			"id": "bsa-zone_1513111948755-1_123456",
			"name": "CoinGecko_S2S_NativeButton",
			"sizes": [[1, 1]],
			"options": {
				"sizemap": [
					[
						[0, 0],
						[[1, 1]]
					],
					[
						[0, 0],
						[[1, 1]]
					]
				]
			}
		}
	};

// setup purch & gpt
var purchs2s = purchs2s || {};
	purchs2s.cmd = purchs2s.cmd || [];
	purchs2s.timeout = 1000;
var googletag = googletag || {};
	googletag.cmd = googletag.cmd || [];
(
	function() {
		//purch
		var ps2s = document.createElement('script');
			ps2s.async = true;
			ps2s.type = 'text/javascript';
			ps2s.src = '//ads.servebom.com/purchs2s.js';
		document.getElementsByTagName('head')[0].appendChild(ps2s);
		
		// gpt
		var gads = document.createElement('script');
			gads.async = true;
			gads.type = 'text/javascript';
			gads.src = '//www.googletagservices.com/tag/js/gpt.js';
		document.getElementsByTagName('head')[0].appendChild(gads);
	}
)();

/*!
  * domready (c) Dustin Diaz 2012 - License MIT
  */
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()
}('domready', function (ready) {

  var fns = [], fn, f = false
    , doc = document
    , testEl = doc.documentElement
    , hack = testEl.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , addEventListener = 'addEventListener'
    , onreadystatechange = 'onreadystatechange'
    , readyState = 'readyState'
    , loadedRgx = hack ? /^loaded|^c/ : /^loaded|c/
    , loaded = loadedRgx.test(doc[readyState])

  function flush(f) {
    loaded = 1
    while (f = fns.shift()) f()
  }

  doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
    doc.removeEventListener(domContentLoaded, fn, f)
    flush()
  }, f)


  hack && doc.attachEvent(onreadystatechange, fn = function () {
    if (/^c/.test(doc[readyState])) {
      doc.detachEvent(onreadystatechange, fn)
      flush()
    }
  })

  return (ready = hack ?
    function (fn) {
      self != top ?
        loaded ? fn() : fns.push(fn) :
        function () {
          try {
            testEl.doScroll('left')
          } catch (e) {
            return setTimeout(function() { ready(fn) }, 50)
          }
          fn()
        }()
    } :
    function (fn) {
      loaded ? fn() : fns.push(fn)
    })
});

domready(
	function () {

		window.googletag.cmd.push(
			function() {
				window.purchs2s.cmd.push(
					function() {
						var ps = document.querySelectorAll('[id^=bsa-zone_]');
						for (var i = 0; i < ps.length; i++)
							if(typeof placements[ps[i].id] != 'undefined')
							{
								window.googletag.defineSlot('/' + network + '/' + placements[ps[i].id].name, placements[ps[i].id].sizes, ps[i].id)
									.defineSizeMapping(
										window.purchs2s.sizeMapping(placements[ps[i].id].id)
											.addSize(placements[ps[i].id].options.sizemap[0][0], placements[ps[i].id].options.sizemap[0][1])
											.addSize(placements[ps[i].id].options.sizemap[1][0], placements[ps[i].id].options.sizemap[1][1])
											.build()
									)
									.addService(window.googletag.pubads());
								window.googletag.display(ps[i].id);
							}
						
						for (var i = 0; i < bsa_targeting.length; i++)
							window.googletag.pubads().setTargeting(bsa_targeting[i][0], bsa_targeting[i][1]);
						
						window.googletag.pubads().enableSingleRequest();
						
						if(!bsa_debug)
							window.googletag.pubads().collapseEmptyDivs();
						
						window.googletag.pubads().disableInitialLoad();
						window.googletag.enableServices();
						window.purchs2s.setup();
					}
				);
		 	}
		);
		
		// debug / friendly output for console for now
		if(bsa_debug)
			window.googletag.cmd.push(
				function() {
					var output = [];
				    window.googletag.pubads().getSlots().forEach(function (slot) {
				        var s = slot.getSizes();
				        var sizeArray = [];
				        var s2 = "";
				        for ( var i = 0; i < s.length; i++){
				            s2 += s[i].l+"x"+s[i].j+",";
				        }
				        output.push({
				            'adunitPath' : slot.getName(),
				            'TargetingMap': JSON.stringify(slot.getTargetingMap()),
				            'div' : slot.getSlotElementId(),
				            "size" : s2,
				        });
				    });
				    if (output.length) {
				        if (console.table) {
				            console.table(output);
				        } else {
				            for (var j = 0; j < output.length; j++) {
				                console.log(output[j]);
				            }
				        }
				    } else {
				        console.warn('No defined slots');
				    }
			    }
		    );

	}
);
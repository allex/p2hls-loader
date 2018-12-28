let demoConfig = getURLParam('cfg', null);
if (demoConfig) {
  demoConfig = JSON.parse(atob(demoConfig));
} else {
  demoConfig = {
    fullScr: true,
    enableDebug: false
  };
}

const DEFAULT_STREAM_URL = 'http://10.1.172.163/st/x36xhzz/url_4/193039199_mp4_h264_aac_7.m3u8'

let sourceURL = decodeURIComponent(getURLParam('u', DEFAULT_STREAM_URL));
let hls, engine

$('#streamURL')
  .val(sourceURL)
  .click(function () {
    this.select()
  })
  .change(() => {
    loadSelectedStream();
  });

;[ 'enableDebug' ].forEach(k => {
  $(`#${k}`)
    .prop('checked', !!demoConfig[k])
    .click(function () {
      demoConfig[k] = this.checked;
      loadSelectedStream();
    });
});

$(`#fullScr`)
  .prop('checked', !!demoConfig.fullScr)
  .click(function () {
    demoConfig.fullScr = this.checked;
    toggleFullScreen()
    onDemoConfigChanged()
  });

// init states
toggleFullScreen()
loadSelectedStream()

function toggleFullScreen() {
  $('body').toggleClass('full', !!demoConfig.fullScr)
}
function appendLog(type, message) {
  console.log(type, message)
}
function logStatus(message) {
  appendLog('statusOut', message);
}
function logError(message) {
  appendLog('errorOut', message);
}
function getDemoConfigPropOrDefault(propName, defaultVal) {
  return typeof demoConfig[propName] !== 'undefined' ? demoConfig[propName] : defaultVal;
}

function getURLParam(sParam, defaultValue) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] == sParam) {
      return 'undefined' == sParameterName[1] ? undefined : 'false' == sParameterName[1] ? false : sParameterName[1];
    }
  }
  return defaultValue;
}

function getDemoConfigQs() {
  var url = $('#streamURL').val();
  var serializedDemoConfig = btoa(JSON.stringify(demoConfig));
  return ("?u=" + encodeURIComponent(url) + "&cfg=" + serializedDemoConfig)
}

function onDemoConfigChanged() {
  var baseURL = document.URL.split('?')[0];
  var permalinkURL = baseURL + getDemoConfigQs();
  $('#streamPermalink').html('<a href="' + permalinkURL + '">' + permalinkURL + '</a>');
  history.pushState(demoConfig, document.title, permalinkURL);
}

function loadSelectedStream() {
  if (!Hls.isSupported()) {
    handleUnsupported();
    return;
  }

  url = $('#streamURL').val();

  if (!url) {
    logError('stream url empty')
    return
  }

  if (hls) {
    hls.destroy();
    if (hls.bufferTimer) {
      clearInterval(hls.bufferTimer);
      hls.bufferTimer = undefined;
    }
    hls = null;
  }

  var hlsConfig = {
    debug: demoConfig.enableDebug,
    enableWorker: true
  }

  if (Hls.isSupported()) {
    if (P2Hls.isSupported()) {
      let downloadStats = []
      let downloadTotals = []
      let uploadStats = []
      let uploadTotal = 0;

      if (engine) {
        engine.destroy();
      }

      engine = new P2Hls.Engine({
        xhrLoader: Hls.DefaultConfig.loader,
        loader: {
          trackerAnnounce: ["ws://ws.hitv.com"],
          rtcConfig: {
            iceServers: [
              { urls: 'stun:stun.hitv.com' }
            ]
          },
          cacheSize: '1gb',
          maxPeersNum: 2
        },
        segments: {
          swarmId: (playlistUrl) => {
            const url = playlistUrl.split('?')[0];
            const path = url.replace(/^https?:\/\/[^/]*/, '')
            return path;
          }
        }
      });

      $('.info').text(
      `HLS.js: v${Hls.version}
P2P Client: v${P2Hls.version}
Peer Id: ${engine.peerId}
  `);

      const peers = new Map
      const updatePeersUI = () => {
        $('.peers').html(Array.from(peers.values()).map(p => `<li>${p.id}${p.remoteAddress ? '@' + p.remoteAddress + ':' + p.remotePort : ''}</li>`))
      };

      const Events = P2Hls.Events;
      engine.on(Events.PeerConnect, peer => {
        peers.set(peer.id, peer)
        updatePeersUI()
      });
      engine.on(Events.PeerClose, id => {
        peers.delete(id)
        updatePeersUI()
      });
      engine.on(Events.PieceBytesLoaded, (method, size) => {
        downloadStats.push({method: method, size: size, timestamp: performance.now()});
        downloadTotals[method] = (downloadTotals[method] || 0) + size;
      });
      engine.on(Events.PieceBytesUploaded, (method, size) => {
        uploadStats.push({size: size, timestamp: performance.now()});
        uploadTotal += size;
      });

      hlsConfig.loader = engine.loaderCreator();
    }

    console.log('Using Hls.js config:', hlsConfig);
    window.hls = hls = new Hls(hlsConfig);
    logStatus('Loading manifest and attaching video element...');

    hls.loadSource(url);

    if (engine) {
      engine.attach(hls);
    }

    let video = document.getElementById("video");

    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => video.play());
  }

  onDemoConfigChanged()
}

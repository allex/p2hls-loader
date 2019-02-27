/**
 * p2hls-loader v0.0.3 - A simple demo for m3u8 accelerator integrated with p2p stream.
 *
 * @author Allex Wang <allex.wxn@gmail.com>
 * Released under the MIT license.
 */
(function () {
  'use strict';

  var demoConfig = getURLParam('cfg', null);

  if (demoConfig) {
    demoConfig = JSON.parse(atob(demoConfig));
  } else {
    demoConfig = {
      fullScr: true,
      enableDebug: false
    };
  }

  var DEFAULT_STREAM_URL = 'https://bitdash-a.akamaihd.net/content/sintel/hls/video/1500kbit.m3u8';
  var sourceURL = decodeURIComponent(getURLParam('u', DEFAULT_STREAM_URL));
  var hls, engine;
  $('#streamURL').val(sourceURL).click(function () {
    this.select();
  }).change(function () {
    loadSelectedStream();
  });
  ['enableDebug'].forEach(function (k) {
    $("#" + k).prop('checked', !!demoConfig[k]).click(function () {
      demoConfig[k] = this.checked;
      loadSelectedStream();
    });
  });
  $("#fullScr").prop('checked', !!demoConfig.fullScr).click(function () {
    demoConfig.fullScr = this.checked;
    toggleFullScreen();
    onDemoConfigChanged();
  });
  toggleFullScreen();
  loadSelectedStream();

  function toggleFullScreen() {
    $('body').toggleClass('full', !!demoConfig.fullScr);
  }

  function appendLog(type, message) {
    console.log(type, message);
  }

  function logStatus(message) {
    appendLog('statusOut', message);
  }

  function logError(message) {
    appendLog('errorOut', message);
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

  function truncate(s, length) {
    var sb = [],
        l = s.length;
    var suffix = suffix === undefined ? '...' : suffix;
    length = l > length ? length - suffix.length : length;

    for (var i = 0, n = 0, step; i <= length; i++) {
      if (i >= l) break;
      step = s.charCodeAt(i) < 0x80 ? 1 : 2;

      if (n + step > length) {
        sb.push(suffix);
        break;
      }

      n += step;
      sb.push(s.charAt(i));
    }

    return sb.join('');
  }

  function getDemoConfigQs() {
    var url = $('#streamURL').val();
    var serializedDemoConfig = btoa(JSON.stringify(demoConfig));
    return "?u=" + encodeURIComponent(url) + "&cfg=" + serializedDemoConfig;
  }

  function onDemoConfigChanged() {
    var baseURL = document.URL.split('?')[0];
    var permalinkURL = baseURL + getDemoConfigQs();
    $('#streamPermalink').html('<a href="' + permalinkURL + '">' + truncate(permalinkURL, 52) + '</a>');
    history.pushState(demoConfig, document.title, permalinkURL);
  }

  function handleUnsupported() {
    alert('Browser not supported, use lateast chrome or safari!');
  }

  function loadSelectedStream() {
    if (!Hls.isSupported()) {
      handleUnsupported();
      return;
    }

    var url = $('#streamURL').val();

    if (!url) {
      logError('stream url empty');
      return;
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
    };

    if (Hls.isSupported()) {
      if (P2Hls.isSupported()) {
        var downloadStats = [];
        var downloadTotals = [];
        var uploadStats = [];

        if (engine) {
          engine.destroy();
        }

        engine = new P2Hls.Engine({
          xhrLoader: Hls.DefaultConfig.loader,
          loader: {
            trackerAnnounce: [location.protocol.replace('http', 'ws') + "//signal.hitv.com"],
            rtcConfig: {
              iceServers: [{
                urls: 'stun:stun.hitv.com'
              }]
            },
            cacheSize: '1gb',
            maxPeerNumber: 2
          },
          segments: {
            swarmId: function (playlistUrl) {
              var url = playlistUrl.split('?')[0];
              var path = url.replace(/^https?:\/\/[^/]*/, '');
              return path;
            }
          }
        });
        $('.info').text("HLS.js: v" + Hls.version + "\nP2P Client: v" + P2Hls.version + "\nPeer Id: " + engine.peerId + "\n  ");
        var peers = new Map();

        var updatePeersUI = function () {
          $('.peers').html(Array.from(peers.values()).map(function (p) {
            return "<li>" + p.id + (p.remoteAddress ? '@' + p.remoteAddress + ':' + p.remotePort : '') + "</li>";
          }));
        };

        var Events = P2Hls.Events;
        engine.on(Events.PeerConnect, function (peer) {
          peers.set(peer.id, peer);
          updatePeersUI();
        });
        engine.on(Events.PeerClose, function (id) {
          peers.delete(id);
          updatePeersUI();
        });
        engine.on(Events.PieceBytesLoaded, function (method, size) {
          downloadStats.push({
            method: method,
            size: size,
            timestamp: performance.now()
          });
          downloadTotals[method] = (downloadTotals[method] || 0) + size;
        });
        engine.on(Events.PieceBytesUploaded, function (method, size) {
          uploadStats.push({
            size: size,
            timestamp: performance.now()
          });
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

      var video = document.getElementById("video");
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
        return video.play();
      });
    }

    onDemoConfigChanged();
  }

}());

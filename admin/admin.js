
// ═══════════════════════════════════════════════════════════════
// HAPS INLINE ADMIN - loaded on notices.html and gallery.html
// ═══════════════════════════════════════════════════════════════

var ADMIN = (function() {
  var GH_USER   = 'kumarprium';
  var GH_REPO   = 'haps-website';
  var GH_BRANCH = 'main';
  var DATA_PATH = '_data/site-data.json';
  var FN        = '/.netlify/functions/github';
  var PIN_KEY   = 'haps_admin_pin';
  var SESSION   = 'haps_admin_session';
  var DEFAULT   = 'haps2026';

  var state = { notices:[], gallery:[], downloads:[], settings:{} };
  var dataSha = null;

  // ── Auth ────────────────────────────────────────────────────
  function isLoggedIn() { return sessionStorage.getItem(SESSION) === '1'; }
  function getPin() { return localStorage.getItem(PIN_KEY) || DEFAULT; }
  function login(pin) {
    if (pin === getPin()) { sessionStorage.setItem(SESSION,'1'); return true; }
    return false;
  }
  function logout() { sessionStorage.removeItem(SESSION); location.reload(); }

  // ── GitHub API via function ─────────────────────────────────
  function ghCall(method, path, payload) {
    return fetch(FN, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({method:method, path:path, payload:payload})
    }).then(function(r){ return r.json(); });
  }

  function getFileSha(fp) {
    return ghCall('GET','/repos/'+GH_USER+'/'+GH_REPO+'/contents/'+fp+'?ref='+GH_BRANCH)
      .then(function(d){ return d.sha||null; }).catch(function(){ return null; });
  }

  function writeFile(fp, content, msg) {
    return getFileSha(fp).then(function(sha){
      var body = { message:msg, content:btoa(unescape(encodeURIComponent(content))), branch:GH_BRANCH };
      if(sha) body.sha = sha;
      return ghCall('PUT','/repos/'+GH_USER+'/'+GH_REPO+'/contents/'+fp, body);
    });
  }

  function writeBinary(fp, b64data, msg) {
    return getFileSha(fp).then(function(sha){
      var b64 = b64data.indexOf(',')>-1 ? b64data.split(',')[1] : b64data;
      var body = { message:msg, content:b64, branch:GH_BRANCH };
      if(sha) body.sha = sha;
      return ghCall('PUT','/repos/'+GH_USER+'/'+GH_REPO+'/contents/'+fp, body);
    });
  }

  // ── Load data ───────────────────────────────────────────────
  function loadData() {
    return ghCall('GET','/repos/'+GH_USER+'/'+GH_REPO+'/contents/'+DATA_PATH+'?ref='+GH_BRANCH)
      .then(function(d){
        if(d.content){
          try {
            dataSha = d.sha;
            var json = decodeURIComponent(escape(atob(d.content.replace(/\n/g,''))));
            var p = JSON.parse(json);
            state.notices   = p.notices   || [];
            state.gallery   = p.gallery   || [];
            state.downloads = p.downloads || [];
            state.settings  = p.settings  || {};
          } catch(e){ console.warn('Data parse error',e); }
        }
        return state;
      })
      .catch(function(){ return state; });
  }

  function saveData(msg) {
    return writeFile(DATA_PATH, JSON.stringify(state,null,2), msg||'Update site data');
  }

  // ── Public API ──────────────────────────────────────────────
  return {
    isLoggedIn:isLoggedIn, login:login, logout:logout,
    getPin:getPin, setPin:function(p){ localStorage.setItem(PIN_KEY,p); },
    loadData:loadData, saveData:saveData,
    state:state,
    writeFile:writeFile, writeBinary:writeBinary
  };
})();

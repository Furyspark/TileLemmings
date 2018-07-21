function AudioManager() {}

AudioManager._bgm = null;
AudioManager._sounds = [];

AudioManager.playBgm = function(key) {
  if(this._bgm && this._bgm.key === key) return this._bgm;
  this.stopBgm();
  var snd = Cache.getAudio(key);
  if(snd) {
    this._bgm = { audio: snd, id: 0, channel: "bgm", paused: false, key: key };
    this._bgm.id = this._bgm.audio.play();
    this._bgm.audio.volume(Options.data.audio.volume.bgm, this._bgm.id);
    this._bgm.audio.loop(true, this._bgm.id);
    this._sounds.push(this._bgm);
    return this._bgm;
  }
  return null;
}

AudioManager.stopBgm = function() {
  if(this._bgm) this._bgm.audio.stop(this._bgm.id);
  this.clearAudio(this._bgm);
  this._bgm = null;
}

AudioManager.pauseBgm = function() {
  if(this._bgm) {
    this._bgm.audio.pause(this._bgm.id);
    this._bgm.paused = true;
  }
}

AudioManager.resumeBgm = function() {
  if(this._bgm && this._bgm.paused) {
    this._bgm.audio.play(this._bgm.audio.id);
    this._bgm.paused = false;
  }
}

AudioManager.playSound = function(key) {
  var snd = Cache.getAudio(key);
  if(snd) {
    var sndObj = { audio: snd, id: snd.play(), channel: "snd", key: key };
    snd.volume(Options.data.audio.volume.snd, sndObj.id);
    this._sounds.push(sndObj);
    return sndObj;
  }
  return null;
}

AudioManager.baseDir = function(type) {
  if(type.toUpperCase() === "BGM") return "assets/audio/bgm/";
  return "assets/audio/sfx/";
}

AudioManager.setVolume = function(channel, volume) {
  volume = Math.max(0, Math.min(1, volume));
  Options.data.audio.volume[channel] = volume;
  for(var a = 0;a < this._sounds.length;a++) {
    var snd = this._sounds[a];
    if(snd.channel === channel) snd.audio.volume(volume, snd.id);
  }
}

AudioManager._onSoundEnd = function(id) {
  let sndObj = this._sounds.filter((obj) => { return obj.id === id; })[0];
  if(sndObj == null) return;
  this.clearAudio(sndObj);
}

AudioManager.clearAudio = function(sndObj) {
  let a = this._sounds.indexOf(sndObj);
  if(a !== -1) {
    if(sndObj.audio.playing(sndObj.id)) snd.audio.stop(sndObj.id);
    this._sounds.splice(a, 1);
  }
};

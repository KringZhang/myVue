function Dep() {
  this.subs = [];
}

Dep.prototype = {
  addSub: function(sub) {
    this.subs.push(sub);
  },
  notify: function() {
    this.subs.forEach(function(sub) {
      sub.update();
    });
  }
}

function Watcher(data, key, cb) {
  this.data = data;
  this.key = key;
  this.cb = cb;
  Dep.target = this;
  this.value = data[key];
  Dep.target = null;
}

Watcher.prototype = {
  update: function() {
    var newVal = this.data[this.key];
    this.cb(newVal);
  }
}
function observe(data) {
  if (!data || typeof data !== 'object') return;
  Object.keys(data).forEach(function(key) {
    defineReactive(data, key, data[key]);
  })
}

function defineReactive(data, key, val) {
  observe(data[key]);
  var dep = new Dep();
  Object.defineProperty(data, key, {
    configurable: true,
    enumerable: true,
    get: function() {
      console.log('访问属性：', key, val);
      Dep.target && dep.addSub(Dep.target);
      return val;
    },
    set: function(newVal) {
      console.log('试图改变属性：', key, val, newVal);
      val = newVal;
      dep.notify();
    }
  });
}
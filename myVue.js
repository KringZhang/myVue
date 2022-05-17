var reg = /{{(.*)}}/;
function MyVue(options) {
  this.el = options.el;
  this.element = document.querySelector(this.el);
  this.data = options.data;
  proxyData(this, options.data);
  this.methods = options.methods;
  observe(this.data);
  compileElement(this.element.childNodes, this.data, this.methods);
  options.mounted();
  return this;
}

function proxyData(self, data) {
  Object.keys(data).forEach(function(key) {
    Object.defineProperty(self, key, {
      configurable: true,
      enumerable: true,
      get: function() {
        return data[key];
      },
      set: function(newVal) {
        data[key] = newVal;
      }
    });
  });
}

function compileElement(childNodes, data, methods) {
  if (!childNodes || !childNodes.length) return;
  childNodes.forEach(function (x) {
    if (x.nodeType == 1) { // 元素节点
      compileDir(x, data, methods);
      compileElement(x.childNodes, data, methods);
    } else if (x.nodeType == 3 && reg.test(x.textContent)) { // 文本节点
      // 把{{name}}模板替换成具体的变量(name)对应的值
      var name = reg.exec(x.textContent)[1];
      var val = data[name];
      var keys = name.split('.');
      if (keys.length) {
        var val = data;
        keys.forEach(function(key) {
          val = val[key];
        })
      }
      x.textContent = x.textContent.replace(reg, val);
      new Watcher(data, name, function(newVal) {
        x.textContent = newVal;
      });
    }
  })
}

function compileDir(node, data, methods) {
  var attrs = node.attributes;
  // 缓存一下需要添加的属性
  var attrsToAdd = [];
  // 缓存一下需要删除的属性
  var attrsToRemove = [];
  [].forEach.call(attrs, function (attr) {
    var dirName = attr.name;
    var attrValue
    try {
      attrValue = JSON.parse(attr.value);
    } catch(err) {
      attrValue = data[attr.value] === void 0 ? '' : data[attr.value];
    }
    // 事件
    if (dirName.includes('@') || dirName.includes('v-on:')) {
      // 这里先添加进数组，防止后面被改名了
      attrsToRemove.push(dirName);
      dirName = dirName.replace('v-on:', '@');
      var eventName = dirName.substring(dirName.lastIndexOf('@') + 1);
      var isMethod = false;
      var methodName = attr.value;
      if (attr.value.includes('(')) {
        methodName = attr.value.substring(0, attr.value.indexOf('('))
      }
      // 先判断绑定的内容是否在methods里面存在对应的方法名，如果存在，直接绑定该方法
      Object.keys(methods || {}).forEach(function(x) {
        x == methodName && (isMethod = true);
      })
      // 如果是方法
      if (isMethod) {
        // TODO 传参时怎么带过来
        node['on' + eventName] = function() { methods[methodName]() };
      } else {
        try { // 直接执行
          node['on' + eventName] = function(){ eval(attr.value) };
        } catch (err) {}
      }
    } else {
      if(dirName.indexOf(':') != -1) {
        var attrName = dirName.substring(dirName.lastIndexOf(':') + 1);
        // 不能在此处删除属性和添加属性，不然循环的下次数据可能会错乱
        // node.setAttribute(attrName, attrValue);
        // node.removeAttribute(dirName);
        attrsToAdd.push({ name: attrName, value: attrValue });
        attrsToRemove.push(dirName);
        new Watcher(data, attr.value, function(newVal) {
          setAttr(node, [{ name: attrName, value: newVal }]);
        });
      } else if (dirName.indexOf('v-model') != -1) {
        node['oninput'] = function(e) {
          console.log(e.target.value);
          data[attr.value] = e.target.value;
        }
        attrsToAdd.push({ name: 'value', value: attrValue });
        attrsToRemove.push('v-model');
        new Watcher(data, attr.value, function(newVal) {
          setAttr(node, [{ name: 'value', value: newVal }]);
        });
      } else if (dirName.indexOf('v-if') != -1) {
        !attrValue && attrsToAdd.push({ name: 'style', value: 'display: none;' });
        attrsToRemove.push('v-if');
      } else if (dirName.indexOf('v-show') != -1) {
        !attrValue && attrsToAdd.push({ name: 'style', value: 'visibility: hidden;' });
        attrsToRemove.push('v-show');
      }
    }
  });
  attrsToRemove.forEach(function(name) {
    node.removeAttribute(name);
  });
  setAttr(node, attrsToAdd);
}

function setAttr(node, arr) {
  arr.forEach(function(obj) {
    var attr = node.getAttribute(obj.name);
    // handleArr里面的属性是直接追加而不是替换的
    var handleArr = ['class', 'style'];
    var val = handleArr.includes(obj.name) && attr ? attr + ' ' + obj.value : obj.value;
    node.setAttribute(obj.name, val);
  })
}
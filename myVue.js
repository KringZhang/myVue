var reg = /{{(.*)}}/;
function MyVue(options) {
  var el = options.el;
  var element = document.querySelector(el);
  var data = options.data;
  compileElement(element.childNodes, data)
}

function compileElement(childNodes, data) {
  if (!childNodes || !childNodes.length) return;
  childNodes.forEach(function (x) {
    if (x.nodeType == 1) { // 元素节点
      compileDir(x, data);
      compileElement(x.childNodes, data);
    } else if (x.nodeType == 3 && reg.test(x.textContent)) { // 文本节点
      // 把{{name}}模板替换成具体的变量(name)对应的值
      x.textContent = x.textContent.replace(reg, data[reg.exec(x.textContent)[1]]);
    }
  })
}

function compileDir(node, data) {
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
    if(dirName.indexOf(':') != -1) {
      var attrName = dirName.substring(dirName.lastIndexOf(':') + 1);
      // 不能在此处删除属性和添加属性，不然循环的下次数据可能会错乱
      // node.setAttribute(attrName, attrValue);
      // node.removeAttribute(dirName);
      attrsToAdd.push({ name: attrName, value: attrValue });
      attrsToRemove.push(dirName);
    } else if (dirName.indexOf('v-model') != -1) {
      attrsToAdd.push({ name: 'value', value: attrValue });
      attrsToRemove.push('v-model');
    } else if (dirName.indexOf('v-if') != -1) {
      !attrValue && attrsToAdd.push({ name: 'style', value: 'display: none;' });
      attrsToRemove.push('v-if');
    } else if (dirName.indexOf('v-show') != -1) {
      !attrValue && attrsToAdd.push({ name: 'style', value: 'visibility: hidden;' });
      attrsToRemove.push('v-show');
    }
  });
  attrsToRemove.forEach(function(name) {
    node.removeAttribute(name);
  });
  attrsToAdd.forEach(function(obj) {
    var attr = node.getAttribute(obj.name);
    // arr里面的属性是直接追加而不是替换的
    var arr = ['class', 'style'];
    var val = arr.includes(obj.name) && attr ? attr + ' ' + obj.value : obj.value;
    node.setAttribute(obj.name, val);
  })
}
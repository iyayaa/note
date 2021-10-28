var Watcher = require('./watcher')

function Compile(el, vm) {
    this.vm = vm; //传入的vm 实例
    this.el = document.querySelector(el);  // dom元素
    this.fragment = null;
    this.init();
}

Compile.prototype = {
    init: function () {
        if (this.el) {
            this.fragment = this.nodeToFragment(this.el); // 包含el dom内所有节点的文档片段
            this.compileElement(this.fragment);
            this.el.appendChild(this.fragment);
        } else {
            console.log('Dom元素不存在');
        }
    },
    nodeToFragment: function (el) {
        var fragment = document.createDocumentFragment();
        var child = el.firstChild;
        while (child) {
            // 将Dom元素移入fragment中
            fragment.appendChild(child);
            child = el.firstChild
        }
        return fragment;
    },
    compileElement: function (el) {   // el-> 文档片段
        var childNodes = el.childNodes;
        var self = this;     // compile 实例
        [].slice.call(childNodes).forEach(function(node) {
            //()标记一个子表达式的开始和结束位置。 . 匹配除换行符\n之外的任何单字符   *匹配前面的子表达式零次或多次
            var reg = /\{\{(.*)\}\}/;  
            var text = node.textContent;

            if (self.isElementNode(node)) {    //如果是元素节点，如<p>
                self.compile(node);   //编译节点，处理v-属性
            } else if (self.isTextNode(node) && reg.test(text)) {   //文本节点
                self.compileText(node, reg.exec(text)[1]);
            }

            if (node.childNodes && node.childNodes.length) {
                self.compileElement(node);
            }
        });
    },
    compile: function(node) {
        var nodeAttrs = node.attributes;  //返回元素所有属性集合
        var self = this;
        Array.prototype.forEach.call(nodeAttrs, function(attr) {
            var attrName = attr.name;     //v-model v-on:click
            if (self.isDirective(attrName)) { //属性名称是指令
                var exp = attr.value;         // 属性值
                var dir = attrName.substring(2);  //v-后的字符串
                if (self.isEventDirective(dir)) {  // 事件指令
                    self.compileEvent(node, self.vm, exp, dir);  //(当前节点，vm实例,属性值(回调)，事件名)
                } else {  // v-model 指令
                    self.compileModel(node, self.vm, exp, dir);  //(当前节点，vm实例,指令绑定的参数，指令参数对应值)
                }
                node.removeAttribute(attrName);   //移除属性
            }
        });
    },
    compileText: function(node, exp) {
        var self = this;
        var initText = this.vm[exp];
        this.updateText(node, initText);
        new Watcher(this.vm, exp, function (value) {
            self.updateText(node, value);
        });
    },
    compileEvent: function (node, vm, exp, dir) {  //(当前节点，vm实例,属性值(回调)，事件名)
        var eventType = dir.split(':')[1];
        var cb = vm.methods && vm.methods[exp];

        if (eventType && cb) {
            node.addEventListener(eventType, cb.bind(vm), false);  //给节点绑定事件
        }
    },
    //编译model指令
    compileModel: function (node, vm, exp, dir) {   //(当前节点，vm实例,指令绑定的参数，指令参数对应值)
        var self = this;
        var val = this.vm[exp];
        this.modelUpdater(node, val);   //  将指令参数对应的值绑到节点(<input>)上  

        new Watcher(this.vm, exp, function (value) {  //(vm实例,指令绑定的参数，回调)
            self.modelUpdater(node, value);
        });

        node.addEventListener('input', function(e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }
            self.vm[exp] = newValue;
            val = newValue;
        });
    },
    updateText: function (node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    modelUpdater: function(node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    },
    isDirective: function(attr) {
        return attr.indexOf('v-') == 0;
    },
    isEventDirective: function(dir) {
        return dir.indexOf('on:') === 0;
    },
    isElementNode: function (node) {
        return node.nodeType == 1;
    },
    isTextNode: function(node) {
        return node.nodeType == 3;
    }
}
module.exports = Compile;
var Compile = require('./compile')
var {observe} = require('./observer')
function MVVM (options) {
    var self = this;
    this.data = options.data; // 将选项中的data 赋给 vm实例的data
    this.methods = options.methods; // 将选项中的methods 赋给 vm实例的methods

    //通过 definProperty 对VM.data 中的每个data数据(属性) 劫持。
    Object.keys(this.data).forEach(function(key) {
        self.proxyKeys(key);
    });

    observe(this.data);
    
    new Compile(options.el, this);
}

MVVM.prototype = {
    proxyKeys: function (key) {
        var self = this; // 上面通过self（new mvvm 实例）.proxyKeys 调用本方法，所以这里的this 是new出来的mvvm 实例
        Object.defineProperty(this, key, {
            enumerable: false,
            configurable: true,
            get: function getter () {
                return self.data[key];
            },
            set: function setter (newVal) {
                self.data[key] = newVal;
            }
        });
    }
}
module.exports = MVVM;
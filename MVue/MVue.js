const compileUtil = {
    // 解析 v-text="msg" v-text="person.fav" 两种情况
    getVal(expr, vm) {
        return expr.split('.').reduce((data, currentVal) => {
            // console.log('dada[currentVal]', [currentVal]);
            return data[currentVal]
        }, vm.$data)
    },
    text(node, expr, vm) {
        // expr ==> msg
        // 对expr进行处理
        let value;
        if (expr.indexOf('{{') !== -1) {
            value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                // console.log(args);
                return this.getVal(args[1], vm)
            })
        } else {
            value = this.getVal(expr, vm)
        }
        this.updater.textUpdater(node, value)
    },
    html(node, expr, vm) {
        const value = this.getVal(expr, vm)
        this.updater.htmlUpdater(node, value)
    },
    model(node, expr, vm) {
        const value = this.getVal(expr, vm)
        this.updater.modelUpdater(node, value)
    },
    on(node, expr, vm, eventName) {

    },
    updater: {
        textUpdater(node, value) {
            node.textContent = value
        },
        modelUpdater(node, value) {
            node.value = value
        },
        htmlUpdater(node, value) {
            node.innerHTML = value
        }
    }
}
class MVue {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data
        this.options = options
        if (this.$el) {
            // 1.实现一个数据的观察者
            // 2.实现一个指令的解析器
            new Compile(this.$el, this)
        }
    }
}
// 编译 解析器
class Compile {
    constructor(el, vm) {
        // 判断el是否是一个元素节点 
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        this.vm = vm
            // 1. 获取文档碎片对象 放入内存当中 减少页面的回流和重绘
        const fragment = this.node2Fragment(this.el)
            // 2. 编译模板
        this.compiler(fragment)
            // 3. 把所有fragment的元素节点都追加到根元素
        this.el.appendChild(fragment)
    }
    compiler(fragment) {
            // 1). 获取到fragment里的所有节点
            // fragment.childNodes 这个方法就是获取到下面的所有子节点
            [...fragment.childNodes].forEach(child => {
                // 之后就看他为什么节点 然后根据不同的节点进行编译
                if (this.isElementNode(child)) {
                    // 元素节点 编译
                    // console.log('元素节点', child);
                    this.compilerElement(child)
                } else {
                    // 文本节点 编译
                    // console.log('文本节点', child);
                    this.compilerText(child)
                }
                if (child.childNodes && child.childNodes.length) {
                    this.compiler(child)
                }
            })
        }
        // 编译元素
    compilerElement(node) {
            // node.attributes 取到所有元素节点上面的属性  比如 v-text  v-html  v-model这些 取到的数据类型是nodemap
            [...node.attributes].forEach(attr => {
                // console.log(attr);
                // 得到的attr  ===> v-text="msg" 拥有name value 
                // name => v-text
                // value=> msg 
                const { name, value } = attr
                // 如果他是一个指令 也就是说 他是 v-text  v-html  v-model
                if (this.isDirective(name)) {
                    const [, dirctive] = name.split('-') // 第一个不要 要第二个 也就是取到 text html model on:click 
                        // 继续分割 on:click这些
                    const [dirName, eventName] = dirctive.split(':')
                        // dirName ==> on   eventName ==> click  根据不同的处理不同的事情
                        // 更新数据 数据驱动视图
                    compileUtil[dirName](node, value, this.vm, eventName)
                        // 删除有指令的标签属性
                    node.removeAttribute('v-' + dirctive)
                }
            })
        }
        //
    isDirective(attrName) {
            return attrName.startsWith('v-')
        }
        // 编译文本
    compilerText(node) {
            // node.textContent 
            if (/\{\{.+?}\}/.test(node.textContent)) {
                // 取到的是 {{person.name}} 这类
                // console.log(node.textContent);
                compileUtil['text'](node, node.textContent, this.vm)
            }
        }
        // 确定元素节点的方法
    isElementNode(node) {
            return node.nodeType === 1 // 元素节点对象
        }
        // 把#app下所有的子节点都放入到内存中
    node2Fragment(node) {
        const f = document.createDocumentFragment()
        while (node.firstChild) {
            f.appendChild(node.firstChild)
        }
        return f
    }
}
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
                    console.log('元素节点', child);
                } else {
                    // 文本节点 编译
                    console.log('文本节点', child);
                }
                if (child.childNodes && child.childNodes.length) {
                    this.compiler(child)
                }
            })
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
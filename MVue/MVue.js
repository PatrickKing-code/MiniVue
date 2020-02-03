class MVue {
  constructor($options) {
    this.$options = $options
    this.$data = $options.data()
    this.$el = $options.el
    this.$methods = $options.methods
    if (this.$el) {
      // 1. 观察者 observer()
      new Observer(this.$data)
      // 2. 指令解析器
      new Compile(this.$el, this)
      // 3. 实现代理的方法 this.xxx直接访问到 vm.$data.xxx
      this.proxyData(this.$data)
    }
  }
  proxyData(data) {
    for (const key in data) {
      Object.defineProperty(this, key, {
        get() {
          return data[key]
        },
        set(newValue) {
          data[key] = newValue
        }
      })
    }
  }
}

class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm
    // 1. 获取文档碎片对象
    const fragment = this.node2fragment(this.el)
    // console.log("fragment", fragment)
    // 2. 编译模板
    this.compile(fragment)
    // 3. fragment追加到根节点 el上
    this.el.appendChild(fragment)
  }
  // 元素节点
  isElementNode(node) {
    return node.nodeType === 1
  }
  // 创建文档碎片
  node2fragment(node) {
    // 创建文档碎片
    let fragment = document.createDocumentFragment()
    let firstChild
    while ((firstChild = node.firstChild)) {
      fragment.appendChild(firstChild)
    }
    return fragment
  }
  isElementNode(node) {
    return node.nodeType === 1
  }
  // 看属性是否为指令 也就是以 v-开头的
  isDirective(attrName) {
    return attrName.startsWith("v-")
  }

  // 看是否@
  isEventName(attrName) {
    return attrName.startsWith("@")
  }
  // 编译元素节点
  compileElement(node) {
    const attrs = node.attributes
    Array.from(attrs).forEach(attr => {
      const { name, value } = attr
      // attr ===>  v-text="msg"  v-model="msg"  type="text"
      if (this.isDirective(name)) {
        // console.log("指令", name)  v-text    v-model   v-html
        const [, directive] = name.split("-") // html  model  html
        // v-on="fn"
        const [dirName, eventName] = directive.split(":") //
        // 数据驱动视图 更新数据
        compileUtil[dirName](node, value, this.vm, eventName)
        // 删除有指令标签的属性
        node.removeAttribute("v-" + directive)
      } else if (this.isEventName(name)) {
        // @click="fn"
        let [, eventName] = name.split("@")
        compileUtil["on"](node, value, this.vm, eventName)
      }
    })
  }
  compileText(node) {
    //
    const content = node.textContent
    if (/\{\{(.+?)\}\}/.test(content)) {
      // console.log(content)
      compileUtil["text"](node, content, this.vm)
    }
  }
  // 编译文本节点
  compile(fragment) {
    // 获取子节点
    const childNodes = fragment.childNodes
    Array.from(childNodes).forEach(child => {
      if (this.isElementNode(child)) {
        // console.log("元素节点", child)
        // 编译元素节点
        this.compileElement(child)
      } else {
        // console.log("文本节点", child)
        // 编译文本节点
        this.compileText(child)
      }

      // 深层次递归 防止有子元素
      if (child.childNodes && child.childNodes.length) {
        this.compile(child)
      }
    })
  }
}

const compileUtil = {
  getValue(expr, vm) {
    return expr.split(".").reduce((data, current) => {
      return data[current]
    }, vm.$data)
  },
  setValue(expr, vm, inputValue) {
    return expr.split(".").reduce((data, current) => {
      data[current] = inputValue
    }, vm.$data)
  },
  getContentVal(expr, vm) {
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getValue(args[1], vm)
    })
  },
  text(node, expr, vm) {
    //   <div v-text="msg"></div>  ===> expr : msg
    // 如果 msg是person.name 的话就不好用了
    let value
    if (expr.indexOf("{{") !== -1) {
      // {{person.name}}  -- {{person.age}}
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        new Watcher(vm, args[1], newValue => {
          this.updater.textUpdater(node, this.getContentVal(expr, vm))
        })
        // console.log(args[1]) // 取到的是 person.name   person.fav    msg
        return this.getValue(args[1], vm)
      })
    } else {
      value = this.getValue(expr, vm)
    }
    this.updater.textUpdater(node, value)
  },
  model(node, expr, vm) {
    const value = this.getValue(expr, vm)
    // 绑定观察者 更新函数 数据驱动视图
    new Watcher(vm, expr, newValue => {
      this.updater.modelUpdater(node, newValue)
    })
    // 绑定监听事件  视图驱动数据
    node.addEventListener("input", e => {
      this.setValue(expr, vm, e.target.value)
    })
    this.updater.modelUpdater(node, value)
  },
  html(node, expr, vm) {
    const value = this.getValue(expr, vm)
    new Watcher(vm, expr, newValue => {
      this.updater.htmlUpdater(node, value)
    })
    this.updater.htmlUpdater(node, value)
  },
  on(node, expr, vm, eventName) {
    let fn = vm.$options.methods && vm.$options.methods[expr]
    node.addEventListener(eventName, fn.bind(vm), false)
  },
  updater: {
    textUpdater(node, value) {
      node.textContent = value
    },
    htmlUpdater(node, value) {
      node.innerHTML = value
    },
    modelUpdater(node, value) {
      node.value = value
    }
  }
}

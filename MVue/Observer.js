class Observer {
  constructor(data) {
    this.observe(data)
  }
  observe(data) {
    if (data && typeof data == "object") {
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key])
      })
    }
  }
  defineReactive(data, key, value) {
    this.observe(value)
    const dep = new Dep()
    Object.defineProperty(data, key, {
      get() {
        // 订阅数据变化时 往Dep中添加观察者
        Dep.target && dep.addSub(Dep.target)
        return value
      },
      set: newValue => {
        this.observe(newValue)
        if (newValue != value) {
          value = newValue
        }
        // 告诉dep通知变化
        dep.notify()
      }
    })
  }
}

// 订阅器 存储观察者 1. 通知变化(更新方法) 2. 收集依赖 (收集watcher)
class Dep {
  constructor() {
    this.subs = []
  }
  // 1. 收集观察者 wathcer
  addSub(watcher) {
    this.subs.push(watcher)
  }
  // 2. 通知观察者更新
  notify() {
    console.log("通知观察者更新了", this.subs)
    this.subs.forEach(w => w.update())
  }
}

// 观察者  观察数据的变化
class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm
    this.expr = expr
    this.cb = cb
    this.oldValue = this.getOldValue()
  }
  // 原来的值
  getOldValue() {
    Dep.target = this
    const oldValue = compileUtil.getValue(this.expr, this.vm)
    Dep.target = null // 清除上一个watcher
    return oldValue
  }
  update() {
    const newValue = compileUtil.getValue(this.expr, this.vm)
    if (newValue != this.oldValue) {
      this.cb(newValue)
    }
  }
}

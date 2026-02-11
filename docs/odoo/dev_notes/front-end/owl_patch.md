---
title: OWL - Patch
description: 在Qweb中使用Patch打一些补丁
sidebar_label: Patch
keywords:
- odoo
- odoo development
tags: [odoo]
last_update:
  date: 2025/6/15
  author: Lucas
---

# OWL - Patch

:::info[Note]
阐述一下odoo各版本对patch的用法及差别。
:::

## Odoo17 Patch

引用patch：
`import { patch } from "@web/core/utils/patch";`

**`patch(objToPatch, extension)`**

:::tip[参数]
- `objobjToPatch (object())` – 需要patch的对象
- `extension (object())` – 将每个键映射到扩展的对象

return: 用于删除补丁的函数

tips: 在Odoo16中删除补丁是通过`unpatch`, 在17的版本中是使用在`patch`时返回的函数。
:::

在patch function时，可以通过super来访问父级的功能。

但需要注意，super只能在method中使用，不能在function中使用。

```javascript
patch(object, {
  fn() {
    super.fn(...arguments);
    // do other things
  },
});

const obj = {
  a: function () {
    // Throws: "Uncaught SyntaxError: 'super' keyword unexpected here"
    super.a();
  },
  b: () => {
    // Throws: "Uncaught SyntaxError: 'super' keyword unexpected here"
    super.b();
  },
};
```

### Patching a javascript class

```javascript
class MyClass {
  static myStaticFn() {...}
  myPrototypeFn() {...}
}

// this will patch static properties!!!
patch(MyClass, {
  myStaticFn() {...},
});

// this is probably the usual case: patching a class method
patch(MyClass.prototype, {
  myPrototypeFn() {...},
});
```

### Patching a component

```javascript
patch(MyComponent.prototype, {
  setup() {
    useMyHook();
  },
});
```

### Removing a patch

```javascript
const unpatch = patch(object, { ... });
// test stuff here
unpatch();
```

### Applying the same patch to multiple objects

将相同的补丁应用到多个对象

```javascript

class Component1{
    method() {
        doSomething();
    },
}

class Component2{
    method() {
        doThings();
    },
}

patchFunc = ()=>{
    method(){
        super.method();
        doCommonThings();

    }
}

function createExtensionObj() {
  return {
    method() {
      super.method();
      doCommonThings();
    },
  };
}

patch(Component1.prototype, patchFunc());
patch(Component2.prototype, patchFunc());
// patch时的第二个参数使用()=>{} 与 function func1(){ return {} }都可以
```

:::warning[与Odoo16的区别]
在Odoo16中，在patch的第三个参数是patch的值的Object，并且直接使用Object对象而不是一个function的调用。
例如：

```javascript
patchObj = {}
patch(XXXComponent.prototype, "xxx.patch", patchObj);
```

:::


## Odoo16 Patch

引用patch：
`import { patch } from "@web/core/utils/patch";`

**`patch(obj, patchName, patchValue, options)`**

:::tip[参数]
- `obj(Object())` - 需要patch的对象
- `patchName (string())` – 描述补丁的唯一字符串
- `patchValue (Object())` – 将每个键映射到 patch 值的对象
- `options (Object())` – option object (see below)
:::

### Patching a javascript class

```javascript
class MyClass {
  static myStaticFn() {...}
  myPrototypeFn() {...}
}

// this will patch static properties!!!
patch(MyClass, "static patch", {
  myStaticFn() {...},
});

// this is probably the usual case: patching a class method
patch(MyClass.prototype, "prototype patch", {
  myPrototypeFn() {...},
});
```

### Patching a component

```javascript
patch(MyComponent.prototype, "my patch", {
  setup() {
    useMyHook();
  },
});
```

### Removing a patch

`import { unpatch } from @web/core/utils/patch;`

**`unpatch(obj, patchName)`**

:::info[参数]
- obj (Object()) – 取消取消patch的对象
- patchName (string()) – 描述应删除的补丁的字符串
:::

```javascript
patch(object, "patch name", { ... });
// test stuff here
unpatch(object, "patch name");
```

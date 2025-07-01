

# Python设计模式

## builder

> 以下代码来源于[Github-faif/python-patterns](https://github.com/faif/python-patterns/blob/master/patterns/creational/builder.py)

```python
"""
*What is this pattern about?
It decouples the creation of a complex object and its representation,
so that the same process can be reused to build objects from the same
family.
This is useful when you must separate the specification of an object
from its actual representation (generally for abstraction).

*What does this example do?

The first example achieves this by using an abstract base
class for a building, where the initializer (__init__ method) specifies the
steps needed, and the concrete subclasses implement these steps.

In other programming languages, a more complex arrangement is sometimes
necessary. In particular, you cannot have polymorphic behaviour in a constructor in C++ -
see https://stackoverflow.com/questions/1453131/how-can-i-get-polymorphic-behavior-in-a-c-constructor
- which means this Python technique will not work. The polymorphism
required has to be provided by an external, already constructed
instance of a different class.

In general, in Python this won't be necessary, but a second example showing
this kind of arrangement is also included.

*Where is the pattern used practically?

*References:
https://sourcemaking.com/design_patterns/builder

*TL;DR
Decouples the creation of a complex object and its representation.
"""


# Abstract Building
class Building:
    def __init__(self) -> None:
        self.build_floor()
        self.build_size()

    def build_floor(self):
        raise NotImplementedError

    def build_size(self):
        raise NotImplementedError

    def __repr__(self) -> str:
        return "Floor: {0.floor} | Size: {0.size}".format(self)


# Concrete Buildings
class House(Building):
    def build_floor(self) -> None:
        self.floor = "One"

    def build_size(self) -> None:
        self.size = "Big"


class Flat(Building):
    def build_floor(self) -> None:
        self.floor = "More than One"

    def build_size(self) -> None:
        self.size = "Small"


# In some very complex cases, it might be desirable to pull out the building
# logic into another function (or a method on another class), rather than being
# in the base class '__init__'. (This leaves you in the strange situation where
# a concrete class does not have a useful constructor)


class ComplexBuilding:
    def __repr__(self) -> str:
        return "Floor: {0.floor} | Size: {0.size}".format(self)


class ComplexHouse(ComplexBuilding):
    def build_floor(self) -> None:
        self.floor = "One"

    def build_size(self) -> None:
        self.size = "Big and fancy"


def construct_building(cls) -> Building:
    building = cls()
    building.build_floor()
    building.build_size()
    return building


def main():
    """
    >>> house = House()
    >>> house
    Floor: One | Size: Big

    >>> flat = Flat()
    >>> flat
    Floor: More than One | Size: Small

    # Using an external constructor function:
    >>> complex_house = construct_building(ComplexHouse)
    >>> complex_house
    Floor: One | Size: Big and fancy
    """


if __name__ == "__main__":
    import doctest

    doctest.testmod()
```

深入解析这段实现建造者模式(Builder Pattern)的Python代码，重点分析其两种不同实现方式及其适用场景。

### 建造者模式核心思想

建造者模式分离了复杂对象的构建过程和表示形式，使得：
- 同样的构建过程可以创建不同表示
- 隐藏产品的内部组成结构
- 对构造过程进行更精细控制

#### 第一种实现：基类控制构建流程

```python
class Building:
    def __init__(self) -> None:
        self.build_floor()
        self.build_size()

    def build_floor(self):
        raise NotImplementedError

    def build_size(self):
        raise NotImplementedError
```

**特点:**

1. 模板方法模式组合使用：
- 基类的`__init__`定义了固定构建顺序
- 子类实现具体构建步骤

2. 具体产品实现:
   
```python
class House(Building):
    def build_floor(self) -> None:
        self.floor = "One"

    def build_size(self) -> None:
        self.size = "Big"
```

- 所有具体建筑类型必须实现构建方法
- 构建逻辑内聚在类内部

优势：
- 构建流程由基类严格把控
- 新增产品类型只需继承并实现方法
- 适合构建步骤固定的场景

#### 第二种实现：外部构造器控制

```python
def construct_building(cls) -> Building:
    building = cls()
    building.build_floor()
    building.build_size()
    return building

class ComplexHouse(ComplexBuilding):
    def build_floor(self) -> None:
        self.floor = "One"
    
    def build_size(self) -> None:
        self.size = "Big and fancy"
```

特点：

1. 构造逻辑外置：
- 构建流程由外部函数控制
- 产品类只需实现构建方法

2. 适用场景：
- 需要动态调整构建顺序时
- 构建过程需要跨类复用时
- 类似C++等无法在构造函数中实现多态的语言

**优势对比**

| 特性                | 基类控制版              | 外部构造器版            |
|---------------------|-----------------------|-----------------------|
| 构建流程控制         | 在基类`__init__`中     | 在外部函数中           |
| 多态支持             | 依赖Python构造器多态   | 显式调用构建方法       |
| 构建顺序灵活性       | 固定                  | 可动态调整            |
| 跨语言适应性         | 仅限Python等动态语言  | 适合C++等静态类型语言  |

### 实际应用场景

1. 文档转换器：
```python
class PDFConverter:
    def build_header(self): ...
    def build_body(self): ...
    def build_footer(self): ...

# 可以支持HTML/DOCX等不同格式输出
```
2. UI组件构建：
```python
class DialogBuilder:
    def add_button(self): ...
    def add_textfield(self): ...
    def get_result(self): -> Dialog
```
3. 游戏角色创建：
```python
class CharacterDirector:
    def construct_character(self, builder):
        builder.build_appearance()
        builder.build_skills()
        return builder.get_character()
```

### 完整建造者模式实现对比

经典建造者模式通常包含四个角色：
1. Director（指挥者）
2. Builder（抽象建造者）
3. ConcreteBuilder（具体建造者）
4. Product（产品）

本文示例的简化体现在：
- 将Director和Builder合并（第一种实现）
- 或将Director实现为外部函数（第二种实现）

完整的Python实现示例：
```python
from abc import ABC, abstractmethod

class Computer:
    def __init__(self):
        self.parts = []
    
    def add(self, part):
        self.parts.append(part)
    
    def __str__(self):
        return f"Computer with: {', '.join(self.parts)}"

class ComputerBuilder(ABC):
    @abstractmethod
    def build_cpu(self): pass
    
    @abstractmethod
    def build_ram(self): pass

class GamingComputerBuilder(ComputerBuilder):
    def __init__(self):
        self.computer = Computer()
    
    def build_cpu(self):
        self.computer.add("i9 CPU")
    
    def build_ram(self):
        self.computer.add("32GB RAM")

class Director:
    def __init__(self, builder):
        self._builder = builder
    
    def construct(self):
        self._builder.build_cpu()
        self._builder.build_ram()
        return self._builder.computer

```

**模式选择建议**

1. 选择基类控制版当：

  - 构建流程固定不变
  - 希望保持高内聚
  - 产品类型较少且稳定

2. 选择外部构造器版当：

  - 需要灵活调整构建顺序
  - 构建逻辑需要复用
  - 要考虑跨语言兼容性

3. 选择完整建造者模式当：

  - 产品构建非常复杂
  - 需要支持多种配置方式
  - 需要严格分离构建步骤

这个例子展示了Python实现设计模式的灵活性，既可以采用经典实现，也可以根据需求简化。理解这些变体有助于在实际开发中选择最合适的实现方式。


## Borg (Monostate)

**实例间共享状态的单例**

> 以下代码来源于[Github-faif/python-patterns](https://github.com/faif/python-patterns/blob/master/patterns/creational/borg.py)

```python
"""
*What is this pattern about?
The Borg pattern (also known as the Monostate pattern) is a way to
implement singleton behavior, but instead of having only one instance
of a class, there are multiple instances that share the same state. In
other words, the focus is on sharing state instead of sharing instance
identity.

*What does this example do?
To understand the implementation of this pattern in Python, it is
important to know that, in Python, instance attributes are stored in a
attribute dictionary called __dict__. Usually, each instance will have
its own dictionary, but the Borg pattern modifies this so that all
instances have the same dictionary.
In this example, the __shared_state attribute will be the dictionary
shared between all instances, and this is ensured by assigning
__shared_state to the __dict__ variable when initializing a new
instance (i.e., in the __init__ method). Other attributes are usually
added to the instance's attribute dictionary, but, since the attribute
dictionary itself is shared (which is __shared_state), all other
attributes will also be shared.

*Where is the pattern used practically?
Sharing state is useful in applications like managing database connections:
https://github.com/onetwopunch/pythonDbTemplate/blob/master/database.py

*References:
- https://fkromer.github.io/python-pattern-references/design/#singleton
- https://learning.oreilly.com/library/view/python-cookbook/0596001673/ch05s23.html
- http://www.aleax.it/5ep.html

*TL;DR
Provides singleton-like behavior sharing state between instances.
"""

from typing import Dict


class Borg:
    _shared_state: Dict[str, str] = {}

    def __init__(self) -> None:
        self.__dict__ = self._shared_state


class YourBorg(Borg):
    def __init__(self, state: str = None) -> None:
        super().__init__()
        if state:
            self.state = state
        else:
            # initiate the first instance with default state
            if not hasattr(self, "state"):
                self.state = "Init"

    def __str__(self) -> str:
        return self.state


def main():
    """
    >>> rm1 = YourBorg()
    >>> rm2 = YourBorg()

    >>> rm1.state = 'Idle'
    >>> rm2.state = 'Running'

    >>> print('rm1: {0}'.format(rm1))
    rm1: Running
    >>> print('rm2: {0}'.format(rm2))
    rm2: Running

    # When the `state` attribute is modified from instance `rm2`,
    # the value of `state` in instance `rm1` also changes
    >>> rm2.state = 'Zombie'

    >>> print('rm1: {0}'.format(rm1))
    rm1: Zombie
    >>> print('rm2: {0}'.format(rm2))
    rm2: Zombie

    # Even though `rm1` and `rm2` share attributes, the instances are not the same
    >>> rm1 is rm2
    False

    # New instances also get the same shared state
    >>> rm3 = YourBorg()

    >>> print('rm1: {0}'.format(rm1))
    rm1: Zombie
    >>> print('rm2: {0}'.format(rm2))
    rm2: Zombie
    >>> print('rm3: {0}'.format(rm3))
    rm3: Zombie

    # A new instance can explicitly change the state during creation
    >>> rm4 = YourBorg('Running')

    >>> print('rm4: {0}'.format(rm4))
    rm4: Running

    # Existing instances reflect that change as well
    >>> print('rm3: {0}'.format(rm3))
    rm3: Running
    """


if __name__ == "__main__":
    import doctest

    doctest.testmod()
```

深入解析这段实现Borg模式（也称为Monostate模式）的Python代码，这是一种特殊的共享状态模式，与单例模式有相似效果但实现方式不同。

### Borg模式核心思想

1. 多实例共享状态：允许创建多个实例，但这些实例共享相同的状态
2. 与单例模式区别：
- 单例：确保类只有一个实例
- Borg：允许多个实例，但共享`__dict__`属性字典
3. Python特性利用：通过操作实例的`__dict__`属性实现共享

### 代码逐层解析

**1. 基类实现：**
   
```python
class Borg:
    _shared_state: Dict[str, str] = {}  # 类变量存储共享状态

    def __init__(self) -> None:
        self.__dict__ = self._shared_state  # 关键：所有实例共享同一个字典

```

- `_shared_state`是所有实例共享的数据存储中心
- 通过将实例的`__dict__`指向类变量实现状态共享
- 这是Borg模式的核心技巧

**2. 子类扩展：**

```python
class YourBorg(Borg):
    def __init__(self, state: str = None) -> None:
        super().__init__()  # 继承共享状态机制
        if state:
            self.state = state  # 修改共享状态
        else:
            if not hasattr(self, "state"):  # 首次初始化设置默认值
                self.state = "Init"

    def __str__(self) -> str:
        return self.state

```

- 添加具体的状态管理逻辑
- 提供字符串表示方法
- 演示了如何在共享状态下进行条件初始化

3. 测试案例展示的特性：
```python
>>> rm1 = YourBorg()
>>> rm2 = YourBorg()
>>> rm1.state = 'Idle'
>>> rm2.state = 'Running'
>>> print(rm1)  # 输出 Running
>>> print(rm2)  # 输出 Running

```

- 修改任一实例的状态会影响所有实例
- 实例不同(`rm1 is rm2`为False)但状态同步更新
- 新创建的实例自动获得当前共享状态

### 关键技术点详解

**1. `__dict__`魔法：**

- 在Python中，实例属性存储在`__dict__`中
- 通过将`__dict__`指向同一个字典实现状态共享
- 比传统单例模式更灵活，保持实例独立性

**2. 线程安全考虑：**

- 原始实现不是线程安全的
- 实际使用中应添加锁机制

```python
from threading import Lock

class ThreadSafeBorg(Borg):
    _lock = Lock()
    
    def __init__(self):
        with self._lock:
            super().__init__()
```

### 与单例模式对比

| 特性         | Borg模式               | 单例模式               |
|--------------|------------------------|------------------------|
| 实例数量     | 多个                   | 严格一个               |
| 状态存储     | 共享`__dict__`         | 单个实例属性           |
| 实例身份     | `is`比较返回False      | `is`比较返回True       |
| 继承         | 子类可扩展             | 需要特殊处理继承       |
| 使用场景     | 需要多实例但共享状态   | 严格限制单个实例       |

### 实际应用场景

1. 数据库连接池：
```python
class ConnectionPool(Borg):
    def __init__(self):
        super().__init__()
        if not hasattr(self, "connections"):
            self.connections = []
            self._init_connections()
    
    def _init_connections(self):
        # 初始化连接池
        pass
```

2. 全局配置管理：
```python
class AppConfig(Borg):
    def __init__(self):
        super().__init__()
        if not hasattr(self, "settings"):
            self._load_default_settings()
```

3. 多窗口共享数据（GUI应用）：
```python
class SharedDocument(Borg):
    def __init__(self):
        super().__init__()
        if not hasattr(self, "content"):
            self.content = ""
```

### 模式优缺点

**优点：**

- 比传统单例更符合Python风格
- 允许创建多个实例但保持状态一致
- 子类化更方便，不破坏共享机制

**缺点：**

- 共享所有属性，可能造成意外副作用
- 需要特别注意可变对象的修改
- 原始实现线程不安全，需额外处理

### 进阶扩展建议

**1. 状态版本控制：**
```python
class VersionedBorg(Borg):
    def __init__(self):
        super().__init__()
        if not hasattr(self, "_version"):
            self._version = 0
        self._version += 1
```

**2. 选择性共享属性：**
```python
class SelectiveBorg(Borg):
    _private_attrs = set()
    
    def __setattr__(self, name, value):
        if name in self._private_attrs:
            object.__setattr__(self, name, value)
        else:
            super().__setattr__(name, value)
```

## lazy_evaluation

**Python 中的惰性求值属性模式**

> 以下代码来源于[Github-faif/python-patterns](https://github.com/faif/python-patterns/blob/master/patterns/creational/lazy_evaluation.py)

```python
"""
Lazily-evaluated property pattern in Python.

https://en.wikipedia.org/wiki/Lazy_evaluation

*References:
bottle
https://github.com/bottlepy/bottle/blob/cafc15419cbb4a6cb748e6ecdccf92893bb25ce5/bottle.py#L270
django
https://github.com/django/django/blob/ffd18732f3ee9e6f0374aff9ccf350d85187fac2/django/utils/functional.py#L19
pip
https://github.com/pypa/pip/blob/cb75cca785629e15efb46c35903827b3eae13481/pip/utils/__init__.py#L821
pyramid
https://github.com/Pylons/pyramid/blob/7909e9503cdfc6f6e84d2c7ace1d3c03ca1d8b73/pyramid/decorator.py#L4
werkzeug
https://github.com/pallets/werkzeug/blob/5a2bf35441006d832ab1ed5a31963cbc366c99ac/werkzeug/utils.py#L35

*TL;DR
Delays the eval of an expr until its value is needed and avoids repeated evals.
"""

import functools


class lazy_property:
    def __init__(self, function):
        self.function = function
        functools.update_wrapper(self, function)

    def __get__(self, obj, type_):
        if obj is None:
            return self
        val = self.function(obj)
        obj.__dict__[self.function.__name__] = val
        return val


def lazy_property2(fn):
    """
    A lazy property decorator.

    The function decorated is called the first time to retrieve the result and
    then that calculated result is used the next time you access the value.
    """
    attr = "_lazy__" + fn.__name__

    @property
    def _lazy_property(self):
        if not hasattr(self, attr):
            setattr(self, attr, fn(self))
        return getattr(self, attr)

    return _lazy_property


class Person:
    def __init__(self, name, occupation):
        self.name = name
        self.occupation = occupation
        self.call_count2 = 0

    @lazy_property
    def relatives(self):
        # Get all relatives, let's assume that it costs much time.
        relatives = "Many relatives."
        return relatives

    @lazy_property2
    def parents(self):
        self.call_count2 += 1
        return "Father and mother"


def main():
    """
    >>> Jhon = Person('Jhon', 'Coder')

    >>> Jhon.name
    'Jhon'
    >>> Jhon.occupation
    'Coder'

    # Before we access `relatives`
    >>> sorted(Jhon.__dict__.items())
    [('call_count2', 0), ('name', 'Jhon'), ('occupation', 'Coder')]

    >>> Jhon.relatives
    'Many relatives.'

    # After we've accessed `relatives`
    >>> sorted(Jhon.__dict__.items())
    [('call_count2', 0), ..., ('relatives', 'Many relatives.')]

    >>> Jhon.parents
    'Father and mother'

    >>> sorted(Jhon.__dict__.items())
    [('_lazy__parents', 'Father and mother'), ('call_count2', 1), ..., ('relatives', 'Many relatives.')]

    >>> Jhon.parents
    'Father and mother'

    >>> Jhon.call_count2
    1
    """


if __name__ == "__main__":
    import doctest

    doctest.testmod(optionflags=doctest.ELLIPSIS)
```

详细分析 Python 中实现惰性求值属性的两种方法，这是提高程序性能的重要模式。

### 惰性求值核心概念

惰性求值（Lazy Evaluation）具有以下特点：
- 延迟计算：只在第一次访问时计算值
- 缓存结果：后续访问直接返回缓存值
- 性能优化：避免重复计算开销大的属性

### 两种实现方式对比

#### 1. 描述符实现 (lazy_property)
```python
class lazy_property:
    def __init__(self, function):
        self.function = function  # 存储原始函数
        functools.update_wrapper(self, function)  # 保留原函数属性

    def __get__(self, obj, type_):
        if obj is None:
            return self
        val = self.function(obj)  # 首次访问时计算
        obj.__dict__[self.function.__name__] = val  # 缓存到实例字典
        return val
```

**实现原理：**

- 利用 Python 的描述符协议（`__get__` 方法）
- 当属性被访问时触发计算
- 计算结果存储在实例的 `__dict__` 中，替代描述符

**特点：**

计算结果存储在属性同名键下（如 `relatives`）
计算后描述符被替换为普通属性
不可重新计算（除非手动删除属性）

#### 2. 装饰器+property实现 (lazy_property2)

```python
def lazy_property2(fn):
    attr = "_lazy__" + fn.__name__  # 生成私有属性名

    @property
    def _lazy_property(self):
        if not hasattr(self, attr):
            setattr(self, attr, fn(self))  # 计算并缓存
        return getattr(self, attr)

    return _lazy_property
```

**实现原理：**

- 使用 @property 装饰器创建属性
- 采用命名约定 (_lazy__name) 存储缓存值
- 每次访问都经过 getter 方法检查

**特点：**

- 缓存值存储在带前缀的属性中
- 维持 property 的特性
- 更易于识别惰性属性

### 关键差异分析

| 特性                | `lazy_property`              | `lazy_property2`             |
|---------------------|-----------------------------|------------------------------|
| **实现机制**         | 描述符协议                  | Property + 闭包              |
| **存储位置**         | 同名属性                   | 带 `_lazy__` 前缀的属性       |
| **后续访问路径**      | 直接访问实例字典           | 仍然经过 getter 方法         |
| **重新计算能力**      | 需要手动删除属性           | 可修改 getter 逻辑实现       |
| **代码复杂度**        | 较低                       | 略高                        |

### 实际应用场景

1. 数据库连接管理：
```python
class DatabaseWrapper:
    @lazy_property
    def connection(self):
        print("Establishing database connection...")
        return create_engine(DB_URL)
```
2. 复杂计算属性：
```python
class Statistics:
    @lazy_property2
    def regression_coefficients(self):
        # 耗时的统计计算
        return self._calculate_regression()
```
3. 大型资源加载：
```python
class ImageProcessor:
    @lazy_property
    def high_res_image(self):
        print("Loading high-res image...")
        return load_image(self.path)
```

### 进阶用法与注意事项(Deepseek输出)

**线程安全改进**

基本实现不是线程安全的，可通过锁机制增强：

```python
from threading import Lock

class ThreadSafeLazyProperty:
    def __init__(self, func):
        self.func = func
        self.lock = Lock()
    
    def __get__(self, instance, owner):
        if instance is None:
            return self
        with self.lock:
            if self.func.__name__ not in instance.__dict__:
                instance.__dict__[self.func.__name__] = self.func(instance)
        return instance.__dict__[self.func.__name__]
```

**属性验证**

```python
class ValidatingLazyProperty(lazy_property):
    def __get__(self, obj, owner):
        val = super().__get__(obj, owner)
        if not self.validate(val):
            raise ValueError("Invalid property value")
        return val
```

### 最佳实践建议

1. 明确命名：使用 lazy_ 前缀或注释标明惰性属性
2. 线程安全：在多线程环境下使用加锁版本
3. 文档说明：注明属性的计算代价
4. 避免副作用：惰性属性应该是幂等的
5. 考虑内存：大对象缓存需谨慎，可添加清理机制

此模式广泛应用于 Django、SQLAlchemy 等大型框架，是优化 Python 程序性能的有效手段。

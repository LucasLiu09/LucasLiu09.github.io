

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
- 基类的__init__定义了固定构建顺序
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

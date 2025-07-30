---
title: Python的一些常用方法
description: 记录Python的一些常用方法的代码片段及其解析。
sidebar_label: Python常用方法
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2025/5/19
  author: Lucas
---

# Python的一些常用方法

:::info[Note]
记录Python的一些常用方法的代码片段及其解析。
:::

## 字符串基于UTF-8字节数切片

```python
@staticmethod
def utf8_slice_safe(text, start_byte=0, end_byte=None):
    """安全地基于 UTF-8 字节数切片字符串"""
    if not isinstance(text, str):
        return text
    utf8_bytes = text.encode('utf-8')
    if end_byte is None:
        end_byte = len(utf8_bytes)

    # 确保不切分多字节字符
    # 查找 start_byte 之前的完整字符边界
    while start_byte > 0 and (utf8_bytes[start_byte] & 0xC0) == 0x80:
        start_byte -= 1

    # 查找 end_byte 之前的完整字符边界
    while end_byte < len(utf8_bytes) and (utf8_bytes[end_byte] & 0xC0) == 0x80:
        end_byte += 1

    sliced_bytes = utf8_bytes[start_byte:end_byte]
    return sliced_bytes.decode('utf-8', errors='ignore')
```

---

## 字典排序

```python
# 原字典
d = {'b': 2, 'a': 1, 'c': 3}

# 按键排序（返回新字典）
sorted_dict = dict(sorted(d.items()))
# 结果: {'a': 1, 'b': 2, 'c': 3}

# 按键逆序
sorted_dict = dict(sorted(d.items(), reverse=True))
# 结果: {'c': 3, 'b': 2, 'a': 1}

2. 按值排序

# 按值排序
sorted_dict = dict(sorted(d.items(), key=lambda x: x[1]))
# 结果: {'a': 1, 'b': 2, 'c': 3}

# 按值逆序
sorted_dict = dict(sorted(d.items(), key=lambda x: x[1], reverse=True))
# 结果: {'c': 3, 'b': 2, 'a': 1}

# 使用operator.itemgetter
from operator import itemgetter
sorted_dict = dict(sorted(d.items(), key=itemgetter(1)))

# 对键进行处理之后排序，以下例子先按字符串再按数字排序
def parse_key(key):
    parts = key.split('-')
    return (parts[0], int(parts[1]))

sorted_dict = dict(sorted(d.items(), key=lambda x: parse_key(x[0])))
```

- 高级排序用法

1. 多级排序

```python
# 复杂数据结构排序
students = {
  'alice': {'grade': 85, 'age': 20},
  'bob': {'grade': 90, 'age': 19},
  'charlie': {'grade': 85, 'age': 21}
}

# 先按成绩降序，再按年龄升序
sorted_dict = dict(sorted(students.items(), key=lambda x: (-x[1]['grade'], x[1]['age'])))
```

2. 自定义排序类

```python
from functools import total_ordering

@total_ordering
class CustomKey:
    def __init__(self, key):
        self.parts = key.split('-')
        self.name = self.parts[0]
        self.num = int(self.parts[1]) if len(self.parts) > 1 else 0

    def __lt__(self, other):
        return (self.name, self.num) < (other.name, other.num)

    def __eq__(self, other):
        return (self.name, self.num) == (other.name, other.num)

d = {'b-2': 1, 'a-3': 2, 'b-1': 3}
sorted_dict = dict(sorted(d.items(), key=lambda x: CustomKey(x[0])))
```

3. 使用heapq进行部分排序

```python
import heapq

# 只需要前N个最小/最大值
d = {'a': 10, 'b': 5, 'c': 20, 'd': 1, 'e': 15}

# 获取值最小的3个
smallest_3 = dict(heapq.nsmallest(3, d.items(), key=lambda x: x[1]))

# 获取值最大的3个
largest_3 = dict(heapq.nlargest(3, d.items(), key=lambda x: x[1]))
```

4. 稳定排序与不稳定排序

```python
 # 稳定排序：相同值保持原有顺序
from collections import OrderedDict

d = OrderedDict([('a', 1), ('b', 2), ('c', 1), ('d', 2)])
stable_sorted = OrderedDict(sorted(d.items(), key=lambda x: x[1]))
```

5. 条件排序

```python
def conditional_sort(d, condition_func, sort_func):
    """根据条件选择性排序"""
    to_sort = {k: v for k, v in d.items() if condition_func(k, v)}
    not_sort = {k: v for k, v in d.items() if not condition_func(k, v)}
    
    sorted_part = dict(sorted(to_sort.items(), key=sort_func))
    return {**sorted_part, **not_sort}

d = {'apple-1': 10, 'banana-2': 5, 'cherry': 20}
result = conditional_sort(d,
   lambda k, v: '-' in k,  # 条件：键包含'-'
   lambda x: int(x[0].split('-')[1]))  # 排序函数
```

6. 链式排序

```python
from operator import itemgetter

# 多个排序条件链式应用
data = {'item1': (85, 'A'), 'item2': (90, 'B'), 'item3': (85, 'C')}

# 先按第一个元素降序，再按第二个元素升序
sorted_dict = dict(sorted(data.items(),
                       key=lambda x: (-x[1][0], x[1][1])))
```

7. 性能优化排序

```python
# 使用__slots__减少内存开销
class SortKey:
    __slots__ = ['primary', 'secondary']
    
    def __init__(self, key):
        parts = key.split('-')
        self.primary = parts[0]
        self.secondary = int(parts[1]) if len(parts) > 1 else 0

# 预计算排序键避免重复计算
keys_cache = {k: SortKey(k) for k in d.keys()}
sorted_dict = dict(sorted(d.items(),
                       key=lambda x: (keys_cache[x[0]].primary,
                                     keys_cache[x[0]].secondary)))
```

8. 自然排序（处理数字字符串）

```python
import re

def natural_sort_key(key):
    """自然排序：正确处理数字序列"""
    return [int(text) if text.isdigit() else text.lower()
          for text in re.split(r'(\d+)', key)]

d = {'item1': 1, 'item10': 2, 'item2': 3, 'item20': 4}
sorted_dict = dict(sorted(d.items(), key=lambda x: natural_sort_key(x[0])))
# 结果: item1, item2, item10, item20 (而不是 item1, item10, item2, item20)
```

---

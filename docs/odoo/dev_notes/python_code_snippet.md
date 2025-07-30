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

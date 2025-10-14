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

## 封装xlsxwriter方便写入excel

```python
"""
封装 xlsxwriter 功能
支持单元格数据写入、样式设置、合并单元格等操作

xlsxwriter Format Class: https://xlsxwriter.readthedocs.io/format.html
"""
import base64
import xlsxwriter
from io import BytesIO
from typing import Union, Dict, Any, Optional, List, Tuple


class ExcelWriter:
    """Excel 写入器类，提供便捷的 Excel 文件生成功能"""

    def __init__(self, bytes_data: BytesIO = None,
                 paper=9, mt=0, mb=0, print_scale=58,
                 margins: Union[None, dict] = None):
        """
        初始化 Excel 写入器

        Args:
            filename: Excel 文件名（包含路径）
        """
        self.file_data = bytes_data if bytes_data else BytesIO()
        self.workbook = xlsxwriter.Workbook(self.file_data)
        self.worksheets = {}
        self.formats = {}
        self.current_sheet = None
        if margins is None:
            margins = {'left': 0.2, 'right': 0.2, 'top': 0.8, 'bottom': 0.2}
        self.paper = paper
        self.mt = mt
        self.mb = mb
        self.print_scale = print_scale
        self.margins = margins

    def add_sheet(self, sheet_name: str = 'Sheet1') -> 'ExcelWriter':
        """
        添加工作表

        Args:
            sheet_name: 工作表名称

        Returns:
            self，支持链式调用
        """
        if sheet_name not in self.worksheets:
            self.worksheets[sheet_name] = self.workbook.add_worksheet(sheet_name)
        self.worksheets[sheet_name].set_paper(self.paper)
        self.worksheets[sheet_name].set_paper(self.paper)
        self.worksheets[sheet_name].set_header(margin=self.mt)
        self.worksheets[sheet_name].set_footer(margin=self.mb)
        self.worksheets[sheet_name].set_margins(**self.margins)
        self.worksheets[sheet_name].set_print_scale(self.print_scale)
        self.current_sheet = self.worksheets[sheet_name]
        return self

    def select_sheet(self, sheet_name: str) -> 'ExcelWriter':
        """
        切换到指定的工作表

        Args:
            sheet_name: 工作表名称

        Returns:
            self，支持链式调用
        """
        if sheet_name in self.worksheets:
            self.current_sheet = self.worksheets[sheet_name]
        else:
            raise ValueError(f"工作表 '{sheet_name}' 不存在")
        return self

    def create_format(self, format_name: str, **properties) -> 'ExcelWriter':
        """
        创建并保存格式样式

        Args:
            format_name: 格式名称
            **properties: 格式属性，支持所有 xlsxwriter 的格式属性

        常用属性示例:
            - bold: 粗体 (True/False)
            - italic: 斜体 (True/False)
            - font_size: 字体大小
            - font_color: 字体颜色
            - bg_color: 背景颜色
            - align: 水平对齐 ('left', 'center', 'right')
            - valign: 垂直对齐 ('top', 'vcenter', 'bottom')
            - border: 边框样式 (0-13)
            - num_format: 数字格式

        Returns:
            self，支持链式调用
        """
        self.formats[format_name] = self.workbook.add_format(properties)
        return self

    def write_cell(self, row: int, col: int, data: Any,
                   format_name: Optional[str] = None) -> 'ExcelWriter':
        """
        写入单个单元格

        Args:
            row: 行号（从0开始）
            col: 列号（从0开始）
            data: 要写入的数据
            format_name: 格式名称（可选）

        Returns:
            self，支持链式调用
        """
        if self.current_sheet is None:
            self.add_sheet()

        fmt = self.formats.get(format_name) if format_name else None
        self.current_sheet.write(row, col, data, fmt)
        return self

    def write_row(self, row: int, start_col: int, data: List[Any],
                  format_name: Optional[str] = None) -> 'ExcelWriter':
        """
        写入一行数据

        Args:
            row: 行号（从0开始）
            start_col: 起始列号（从0开始）
            data: 数据列表
            format_name: 格式名称（可选）

        Returns:
            self，支持链式调用
        """
        if self.current_sheet is None:
            self.add_sheet()

        fmt = self.formats.get(format_name) if format_name else None
        self.current_sheet.write_row(row, start_col, data, fmt)
        return self

    def write_column(self, col: int, start_row: int, data: List[Any],
                     format_name: Optional[str] = None) -> 'ExcelWriter':
        """
        写入一列数据

        Args:
            col: 列号（从0开始）
            start_row: 起始行号（从0开始）
            data: 数据列表
            format_name: 格式名称（可选）

        Returns:
            self，支持链式调用
        """
        if self.current_sheet is None:
            self.add_sheet()

        fmt = self.formats.get(format_name) if format_name else None
        self.current_sheet.write_column(start_row, col, data, fmt)
        return self

    def merge_range(self, first_row: int, first_col: int,
                    last_row: int, last_col: int, data: Any = '',
                    format_name: Optional[str] = None) -> 'ExcelWriter':
        """
        合并单元格并写入数据

        Args:
            first_row: 起始行号（从0开始）
            first_col: 起始列号（从0开始）
            last_row: 结束行号（从0开始）
            last_col: 结束列号（从0开始）
            data: 要写入的数据
            format_name: 格式名称（可选）

        Returns:
            self，支持链式调用
        """
        if self.current_sheet is None:
            self.add_sheet()

        fmt = self.formats.get(format_name) if format_name else None
        self.current_sheet.merge_range(first_row, first_col, last_row, last_col, data, fmt)
        return self

    def merge_range_string(self, range_string: str, data: Any = '',
                          format_name: Optional[str] = None) -> 'ExcelWriter':
        """
        使用 Excel 范围字符串合并单元格

        Args:
            range_string: Excel 范围字符串（如 'A1:C3'）
            data: 要写入的数据
            format_name: 格式名称（可选）

        Returns:
            self，支持链式调用
        """
        if self.current_sheet is None:
            self.add_sheet()

        fmt = self.formats.get(format_name) if format_name else None
        self.current_sheet.merge_range(range_string, data, fmt)
        return self

    def set_column_width(self, first_col: int, last_col: int, width: float) -> 'ExcelWriter':
        """
        设置列宽

        Args:
            first_col: 起始列号（从0开始）
            last_col: 结束列号（从0开始）
            width: 列宽

        Returns:
            self，支持链式调用
        """
        if self.current_sheet is None:
            self.add_sheet()

        self.current_sheet.set_column(first_col, last_col, width)
        return self

    def set_row_height(self, row: int, height: float) -> 'ExcelWriter':
        """
        设置行高

        Args:
            row: 行号（从0开始）
            height: 行高

        Returns:
            self，支持链式调用
        """
        if self.current_sheet is None:
            self.add_sheet()

        self.current_sheet.set_row(row, height)
        return self

    def write_formula(self, row: int, col: int, formula: str,
                     format_name: Optional[str] = None) -> 'ExcelWriter':
        """
        写入公式

        Args:
            row: 行号（从0开始）
            col: 列号（从0开始）
            formula: Excel 公式（如 '=SUM(A1:A10)'）
            format_name: 格式名称（可选）

        Returns:
            self，支持链式调用
        """
        if self.current_sheet is None:
            self.add_sheet()

        fmt = self.formats.get(format_name) if format_name else None
        self.current_sheet.write_formula(row, col, formula, fmt)
        return self

    def write_table(self, start_row: int, start_col: int,
                   data: List[List[Any]], headers: Optional[List[str]] = None,
                   header_format: Optional[str] = None,
                   data_format: Optional[str] = None) -> 'ExcelWriter':
        """
        写入表格数据（带标题行）

        Args:
            start_row: 起始行号（从0开始）
            start_col: 起始列号（从0开始）
            data: 二维数据列表
            headers: 表头列表（可选）
            header_format: 表头格式名称（可选）
            data_format: 数据格式名称（可选）

        Returns:
            self，支持链式调用
        """
        if self.current_sheet is None:
            self.add_sheet()

        current_row = start_row

        # 写入表头
        if headers:
            self.write_row(current_row, start_col, headers, header_format)
            current_row += 1

        # 写入数据
        for row_data in data:
            self.write_row(current_row, start_col, row_data, data_format)
            current_row += 1

        return self

    def insert_image(self, row: int, col: int, image_path: str,
                    options: Optional[Dict[str, Any]] = None) -> 'ExcelWriter':
        """
        插入图片

        Args:
            row: 行号（从0开始）
            col: 列号（从0开始）
            image_path: 图片文件路径
            options: 图片选项（可选），如 {'x_scale': 0.5, 'y_scale': 0.5}

        Returns:
            self，支持链式调用
        """
        if self.current_sheet is None:
            self.add_sheet()

        if options:
            self.current_sheet.insert_image(row, col, image_path, options)
        else:
            self.current_sheet.insert_image(row, col, image_path)
        return self

    def freeze_panes(self, row: int, col: int) -> 'ExcelWriter':
        """
        冻结窗格

        Args:
            row: 冻结的行数（从0开始）
            col: 冻结的列数（从0开始）

        Returns:
            self，支持链式调用
        """
        if self.current_sheet is None:
            self.add_sheet()

        self.current_sheet.freeze_panes(row, col)
        return self

    def autofilter(self, first_row: int, first_col: int,
                  last_row: int, last_col: int) -> 'ExcelWriter':
        """
        设置自动筛选

        Args:
            first_row: 起始行号（从0开始）
            first_col: 起始列号（从0开始）
            last_row: 结束行号（从0开始）
            last_col: 结束列号（从0开始）

        Returns:
            self，支持链式调用
        """
        if self.current_sheet is None:
            self.add_sheet()

        self.current_sheet.autofilter(first_row, first_col, last_row, last_col)
        return self

    def read(self):
        """
        读取 Excel 文件的字节数据

        注意：此方法会自动关闭 workbook（如果还未关闭）

        Returns:
            bytes: Excel 文件的字节数据
        """
        # 步骤1：必须先关闭 workbook，数据才会真正写入到 BytesIO
        self.workbook.close()

        # 步骤2：重置文件指针到开头（close 后指针在末尾）
        self.file_data.seek(0)

        # 步骤3：读取所有数据
        return self.file_data.read()

    def read_base64(self):
        # 步骤1：必须先关闭 workbook，数据才会真正写入到 BytesIO
        self.workbook.close()

        # 步骤2：重置文件指针到开头（close 后指针在末尾）
        self.file_data.seek(0)

        # 步骤3：读取所有数据
        return base64.b64encode(self.file_data.read())

    def close(self):
        """
        关闭并保存 Excel 文件
        """
        self.workbook.close()

    def __enter__(self):
        """上下文管理器入口"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器退出，自动关闭文件"""
        self.close()


# 使用示例
# if __name__ == '__main__':
#     # 使用上下文管理器，自动关闭文件
#     b_data = BytesIO()
#
#     excel = ExcelWriter(bytes_data=b_data)
#     # 创建格式样式
#     excel.create_format('header', bold=True, bg_color='#4472C4',
#                        font_color='white', align='center', valign='vcenter', border=1)
#     excel.create_format('data', align='left', valign='vcenter', border=1)
#     excel.create_format('number', num_format='#,##0.00', align='right', border=1)
#     excel.create_format('title', bold=True, font_size=16, align='center', valign='vcenter')
#
#     # 添加工作表
#     excel.add_sheet('销售数据')
#
#     # 合并单元格作为标题
#     excel.merge_range(0, 0, 0, 4, '2024年销售报表', 'title')
#
#     # 设置行高
#     excel.set_row_height(0, 30)
#     excel.set_row_height(2, 25)
#
#     # 写入表头
#     headers = ['产品名称', '销售数量', '单价', '总价', '备注']
#     excel.write_row(2, 0, headers, 'header')
#
#     # 写入数据
#     data = [
#         ['产品A', 100, 50.5, '=B3*C3', '热销产品'],
#         ['产品B', 200, 30.8, '=B4*C4', '新品'],
#         ['产品C', 150, 45.0, '=B5*C5', '促销中'],
#         ['产品D', 80, 60.0, '=B6*C6', '']
#     ]
#
#     for i, row_data in enumerate(data):
#         row_num = 3 + i
#         excel.write_cell(row_num, 0, row_data[0], 'data')
#         excel.write_cell(row_num, 1, row_data[1], 'number')
#         excel.write_cell(row_num, 2, row_data[2], 'number')
#         excel.write_formula(row_num, 3, row_data[3], 'number')
#         excel.write_cell(row_num, 4, row_data[4], 'data')
#
#     # 写入合计行
#     excel.write_cell(7, 0, '合计', 'header')
#     excel.write_formula(7, 1, '=SUM(B3:B6)', 'number')
#     excel.write_formula(7, 3, '=SUM(D3:D6)', 'number')
#
#     # 设置列宽
#     excel.set_column_width(0, 0, 15)  # 产品名称
#     excel.set_column_width(1, 3, 12)  # 数量、单价、总价
#     excel.set_column_width(4, 4, 20)  # 备注
#
#     # 冻结首行和首列
#     excel.freeze_panes(3, 1)
#
#     # 添加自动筛选
#     excel.autofilter(2, 0, 7, 4)
#
#     # 添加另一个工作表
#     excel.add_sheet('统计图表').write_cell(0, 0, '图表数据', 'title')
#
#
#     print('Excel 文件已生成')
#     result = base64.b64encode(excel.read())
#     print(result)
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


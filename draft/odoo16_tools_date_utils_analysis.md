# Odoo 16 tools/date_utils.py 日期工具函数分析文档

## 概述

`odoo/tools/date_utils.py` 是Odoo框架中专门处理日期和时间相关操作的工具模块。该模块提供了一系列实用函数，用于日期计算、时间周期处理、财务年度计算等常见的日期时间操作。

**文件位置**: `odoo/tools/date_utils.py`  
**代码行数**: 259行  
**主要依赖**: `datetime`, `calendar`, `pytz`, `dateutil.relativedelta`

## 目录

1. [导入和依赖](#导入和依赖)
2. [类型检测函数](#类型检测函数)
3. [时间周期计算函数](#时间周期计算函数)
4. [时间段起止点函数](#时间段起止点函数)
5. [日期运算函数](#日期运算函数)
6. [序列化函数](#序列化函数)
7. [日期范围生成器](#日期范围生成器)
8. [使用示例](#使用示例)
9. [最佳实践](#最佳实践)

---

## 导入和依赖

```python
import math
import calendar
from datetime import date, datetime, time
import pytz
from dateutil.relativedelta import relativedelta

from .func import lazy
from odoo.loglevels import ustr
```

### 核心依赖说明
- **datetime**: Python标准日期时间模块
- **calendar**: 日历相关操作
- **pytz**: 时区处理
- **dateutil.relativedelta**: 相对日期计算
- **odoo.tools.func.lazy**: 延迟计算装饰器
- **odoo.loglevels.ustr**: 字符串转换工具

---

## 类型检测函数

### `date_type(value)`
**功能**: 确定日期值的具体类型（date或datetime）

- **参数**: 
  - `value`: datetime.datetime 或 datetime.date 对象
- **返回**: datetime.datetime 类或 datetime.date 类
- **用途**: 用于保持输入输出类型一致性

**示例**:
```python
from datetime import date, datetime

# 对于 datetime 对象返回 datetime 类
dt = datetime(2024, 1, 15, 10, 30)
print(date_type(dt))  # <class 'datetime.datetime'>

# 对于 date 对象返回 date 类
d = date(2024, 1, 15)
print(date_type(d))   # <class 'datetime.date'>
```

**应用场景**:
- 在需要保持输入输出类型一致的函数中使用
- 动态创建与输入相同类型的日期对象

---

## 时间周期计算函数

### `get_month(date)`
**功能**: 计算给定日期所属月份的起止日期

- **参数**: 
  - `date`: datetime.datetime 或 datetime.date 对象
- **返回**: 元组 (date_from, date_to)，类型与输入相同
- **逻辑**: 
  - date_from: 当月第一天
  - date_to: 当月最后一天

**示例**:
```python
from datetime import date, datetime

# 使用 date 对象
d = date(2024, 2, 15)
start, end = get_month(d)
print(f"月份范围: {start} 到 {end}")
# 输出: 月份范围: 2024-02-01 到 2024-02-29

# 使用 datetime 对象
dt = datetime(2024, 2, 15, 14, 30)
start, end = get_month(dt)
print(f"月份范围: {start} 到 {end}")
# 输出: 月份范围: 2024-02-01 00:00:00 到 2024-02-29 00:00:00
```

### `get_quarter_number(date)`
**功能**: 获取给定日期所属的季度编号

- **参数**: 
  - `date`: datetime.datetime 或 datetime.date 对象
- **返回**: 整数 [1-4]，表示季度编号
- **计算方式**: `math.ceil(date.month / 3)`

**季度划分**:
- Q1: 1-3月
- Q2: 4-6月  
- Q3: 7-9月
- Q4: 10-12月

**示例**:
```python
from datetime import date

print(get_quarter_number(date(2024, 1, 15)))   # 1 (Q1)
print(get_quarter_number(date(2024, 4, 15)))   # 2 (Q2)
print(get_quarter_number(date(2024, 7, 15)))   # 3 (Q3)
print(get_quarter_number(date(2024, 10, 15)))  # 4 (Q4)
```

### `get_quarter(date)`
**功能**: 计算给定日期所属季度的起止日期

- **参数**: 
  - `date`: datetime.datetime 或 datetime.date 对象
- **返回**: 元组 (date_from, date_to)，类型与输入相同
- **逻辑**:
  - 先获取季度编号
  - 计算季度第一个月的第一天作为起始日期
  - 计算季度最后一个月的最后一天作为结束日期

**示例**:
```python
from datetime import date

# Q2 季度示例
d = date(2024, 5, 15)
start, end = get_quarter(d)
print(f"Q2季度范围: {start} 到 {end}")
# 输出: Q2季度范围: 2024-04-01 到 2024-06-30
```

### `get_fiscal_year(date, day=31, month=12)`
**功能**: 计算给定日期所属财务年度的起止日期

- **参数**:
  - `date`: datetime.datetime 或 datetime.date 对象
  - `day`: 财务年度结束日（默认31）
  - `month`: 财务年度结束月（默认12）
- **返回**: 元组 (date_from, date_to)，类型与输入相同
- **特性**:
  - 默认参数下等同于日历年度（1月1日到12月31日）
  - 支持自定义财务年度结束日期
  - 自动处理闰年等特殊情况

**内部辅助函数 `fix_day`**:
- 处理月份天数不一致的情况
- 特别处理2月28/29日的闰年问题

**示例**:
```python
from datetime import date

# 标准日历年度
d = date(2024, 6, 15)
start, end = get_fiscal_year(d)
print(f"财务年度: {start} 到 {end}")
# 输出: 财务年度: 2024-01-01 到 2024-12-31

# 自定义财务年度（4月开始）
start, end = get_fiscal_year(d, day=31, month=3)
print(f"财务年度: {start} 到 {end}")
# 输出: 财务年度: 2024-04-01 到 2025-03-31

# 处理边界情况
d = date(2024, 1, 15)  # 1月属于上一财务年度
start, end = get_fiscal_year(d, day=31, month=3)
print(f"财务年度: {start} 到 {end}")
# 输出: 财务年度: 2023-04-01 到 2024-03-31
```

### `get_timedelta(qty, granularity)`
**功能**: 根据数量和时间单位创建relativedelta对象

- **参数**:
  - `qty`: 数量（整数）
  - `granularity`: 时间粒度字符串
- **返回**: relativedelta对象
- **支持的粒度**:
  - `'hour'`: 小时
  - `'day'`: 天
  - `'week'`: 周
  - `'month'`: 月
  - `'year'`: 年

**示例**:
```python
from datetime import date

base_date = date(2024, 1, 15)

# 添加不同时间单位
print(base_date + get_timedelta(3, 'month'))  # 2024-04-15
print(base_date + get_timedelta(2, 'year'))   # 2026-01-15
print(base_date + get_timedelta(1, 'week'))   # 2024-01-22
```

---

## 时间段起止点函数

### `start_of(value, granularity)`
**功能**: 获取指定时间粒度的起始时间点

- **参数**:
  - `value`: datetime.datetime 或 datetime.date 对象
  - `granularity`: 时间粒度字符串
- **返回**: 对应时间段起始点的日期/时间对象
- **支持的粒度**:
  - `'year'`: 年初（1月1日）
  - `'quarter'`: 季度初
  - `'month'`: 月初（1日）
  - `'week'`: 周初（周一，基于ISO8601标准）
  - `'day'`: 当日
  - `'hour'`: 当前小时开始（仅datetime）

**周处理说明**:
- 使用ISO8601标准，周一为一周开始
- 使用`calendar.weekday()`计算偏移量

**示例**:
```python
from datetime import date, datetime

# 日期示例
d = date(2024, 5, 15)  # 2024年5月15日（周三）

print(start_of(d, 'year'))     # 2024-01-01
print(start_of(d, 'quarter'))  # 2024-04-01 (Q2开始)
print(start_of(d, 'month'))    # 2024-05-01
print(start_of(d, 'week'))     # 2024-05-13 (周一)
print(start_of(d, 'day'))      # 2024-05-15

# 时间示例
dt = datetime(2024, 5, 15, 14, 30, 45)

print(start_of(dt, 'day'))     # 2024-05-15 00:00:00
print(start_of(dt, 'hour'))    # 2024-05-15 14:00:00
```

### `end_of(value, granularity)`
**功能**: 获取指定时间粒度的结束时间点

- **参数**:
  - `value`: datetime.datetime 或 datetime.date 对象
  - `granularity`: 时间粒度字符串
- **返回**: 对应时间段结束点的日期/时间对象
- **支持的粒度**: 与`start_of`相同

**逻辑说明**:
- `'year'`: 年末（12月31日）
- `'quarter'`: 季度末
- `'month'`: 月末（最后一天）
- `'week'`: 周末（周日）
- `'day'`: 当日
- `'hour'`: 当前小时结束（仅datetime）

**示例**:
```python
from datetime import date, datetime

# 日期示例
d = date(2024, 5, 15)  # 2024年5月15日（周三）

print(end_of(d, 'year'))     # 2024-12-31
print(end_of(d, 'quarter'))  # 2024-06-30 (Q2结束)
print(end_of(d, 'month'))    # 2024-05-31
print(end_of(d, 'week'))     # 2024-05-19 (周日)
print(end_of(d, 'day'))      # 2024-05-15

# 时间示例
dt = datetime(2024, 5, 15, 14, 30, 45)

print(end_of(dt, 'day'))     # 2024-05-15 23:59:59.999999
print(end_of(dt, 'hour'))    # 2024-05-15 14:59:59.999999
```

---

## 日期运算函数

### `add(value, *args, **kwargs)`
**功能**: 日期加法运算的便捷函数

- **参数**:
  - `value`: 初始日期/时间对象
  - `*args`, `**kwargs`: 传递给relativedelta的参数
- **返回**: 计算后的日期/时间对象
- **本质**: `value + relativedelta(*args, **kwargs)`的简化写法

**示例**:
```python
from datetime import date

base_date = date(2024, 1, 15)

# 各种加法操作
print(add(base_date, months=3))          # 2024-04-15
print(add(base_date, years=1, days=10))  # 2025-01-25
print(add(base_date, weeks=2))           # 2024-01-29
```

### `subtract(value, *args, **kwargs)`
**功能**: 日期减法运算的便捷函数

- **参数**:
  - `value`: 初始日期/时间对象
  - `*args`, `**kwargs`: 传递给relativedelta的参数
- **返回**: 计算后的日期/时间对象
- **本质**: `value - relativedelta(*args, **kwargs)`的简化写法

**示例**:
```python
from datetime import date

base_date = date(2024, 1, 15)

# 各种减法操作
print(subtract(base_date, months=3))          # 2023-10-15
print(subtract(base_date, years=1, days=10))  # 2023-01-05
print(subtract(base_date, weeks=2))           # 2024-01-01
```

---

## 序列化函数

### `json_default(obj)`
**功能**: 日期时间对象的JSON序列化处理

- **参数**: 
  - `obj`: 要序列化的对象
- **返回**: 序列化后的字符串表示
- **支持的类型**:
  - `datetime`: 转换为Odoo标准时间字符串格式
  - `date`: 转换为Odoo标准日期字符串格式
  - `lazy`: 返回其内部值
  - 其他类型: 使用`ustr()`转换

**内部实现**:
```python
from odoo import fields

if isinstance(obj, datetime):
    return fields.Datetime.to_string(obj)
if isinstance(obj, date):
    return fields.Date.to_string(obj)
if isinstance(obj, lazy):
    return obj._value
return ustr(obj)
```

**使用场景**:
- JSON序列化时作为`default`参数
- API响应中的日期时间格式化
- 数据导出功能

**示例**:
```python
import json
from datetime import date, datetime

# 使用示例
data = {
    'date': date(2024, 1, 15),
    'datetime': datetime(2024, 1, 15, 10, 30),
    'other': 'text'
}

json_str = json.dumps(data, default=json_default)
print(json_str)
# 输出: {"date": "2024-01-15", "datetime": "2024-01-15 10:30:00", "other": "text"}
```

---

## 日期范围生成器

### `date_range(start, end, step=relativedelta(months=1))`
**功能**: 生成指定范围和步长的日期序列

- **参数**:
  - `start`: 开始日期时间（datetime对象）
  - `end`: 结束日期时间（datetime对象）
  - `step`: 步长（relativedelta对象，默认1个月）
- **返回**: datetime对象的迭代器
- **支持的时区类型**:
  - 同为naive datetime（无时区信息）
  - 同为UTC时区
  - 同为其他时区（必须是相同时区）

**验证逻辑**:
1. **时区一致性检查**: 确保start和end的时区设置一致
2. **时间顺序检查**: start必须早于或等于end
3. **步长有效性检查**: step不能为零
4. **时区兼容性**: 不允许混合不同类型的时区

**DST处理**:
- 对于非UTC时区，会正确处理夏令时转换
- 通过临时去除时区信息进行计算，然后重新本地化

**示例**:
```python
from datetime import datetime
from dateutil.relativedelta import relativedelta
import pytz

# 基本使用 - 按月生成
start = datetime(2024, 1, 1)
end = datetime(2024, 6, 1)

monthly_dates = list(date_range(start, end))
for dt in monthly_dates:
    print(dt.strftime('%Y-%m-%d'))
# 输出:
# 2024-01-01
# 2024-02-01
# 2024-03-01
# 2024-04-01
# 2024-05-01
# 2024-06-01

# 自定义步长 - 按周生成
start = datetime(2024, 1, 1)
end = datetime(2024, 2, 1)
step = relativedelta(weeks=1)

weekly_dates = list(date_range(start, end, step))
for dt in weekly_dates:
    print(dt.strftime('%Y-%m-%d'))

# 时区支持 - UTC时区
utc = pytz.UTC
start_utc = utc.localize(datetime(2024, 1, 1))
end_utc = utc.localize(datetime(2024, 4, 1))

utc_dates = list(date_range(start_utc, end_utc))
for dt in utc_dates:
    print(dt.strftime('%Y-%m-%d %Z'))

# 其他时区支持
eastern = pytz.timezone('US/Eastern')
start_et = eastern.localize(datetime(2024, 1, 1))
end_et = eastern.localize(datetime(2024, 4, 1))

et_dates = list(date_range(start_et, end_et))
for dt in et_dates:
    print(dt.strftime('%Y-%m-%d %Z'))
```

**错误处理示例**:
```python
# 时区不匹配错误
start_utc = pytz.UTC.localize(datetime(2024, 1, 1))
end_naive = datetime(2024, 6, 1)
# 这会抛出 ValueError: Timezones of start argument and end argument mismatch

# 不同时区错误
start_utc = pytz.UTC.localize(datetime(2024, 1, 1))
end_et = pytz.timezone('US/Eastern').localize(datetime(2024, 6, 1))
# 这会抛出 ValueError: Timezones of start argument and end argument seem inconsistent

# 时间顺序错误
start = datetime(2024, 6, 1)
end = datetime(2024, 1, 1)
# 这会抛出 ValueError: start > end, start date must be before end

# 零步长错误
step = relativedelta(days=0)
# 这会抛出 ValueError: Looks like step is null
```

---

## 使用示例

### 财务报表日期范围
```python
from datetime import date

def get_financial_periods(year):
    """获取财务年度的各个周期"""
    base_date = date(year, 6, 1)  # 年中任意日期
    
    # 财务年度
    fy_start, fy_end = get_fiscal_year(base_date)
    
    # 各季度
    quarters = []
    for quarter in range(1, 5):
        q_date = date(year, quarter * 3, 1)
        quarters.append(get_quarter(q_date))
    
    # 各月份
    months = []
    for month in range(1, 13):
        m_date = date(year, month, 1)
        months.append(get_month(m_date))
    
    return {
        'fiscal_year': (fy_start, fy_end),
        'quarters': quarters,
        'months': months
    }

periods = get_financial_periods(2024)
print(f"财务年度: {periods['fiscal_year']}")
```

### 工作日计算
```python
from datetime import date, datetime

def get_business_period(date_val, period_type='month'):
    """获取业务周期的工作日范围"""
    if period_type == 'month':
        start, end = get_month(date_val)
    elif period_type == 'quarter':
        start, end = get_quarter(date_val)
    elif period_type == 'week':
        start = start_of(date_val, 'week')
        end = end_of(date_val, 'week')
    
    return start, end

# 获取当前月份的业务周期
today = date.today()
month_start, month_end = get_business_period(today, 'month')
print(f"本月业务周期: {month_start} 到 {month_end}")
```

### 批量日期处理
```python
from datetime import datetime
from dateutil.relativedelta import relativedelta

def generate_report_dates(start_year, end_year):
    """生成多年的季度报告日期"""
    dates = []
    
    for year in range(start_year, end_year + 1):
        for quarter in range(1, 5):
            # 每季度第一个月的第一天
            q_start = date(year, (quarter - 1) * 3 + 1, 1)
            quarter_start, quarter_end = get_quarter(q_start)
            dates.append({
                'year': year,
                'quarter': quarter,
                'start': quarter_start,
                'end': quarter_end,
                'label': f'{year}-Q{quarter}'
            })
    
    return dates

# 生成2020-2024年的季度报告日期
report_dates = generate_report_dates(2020, 2024)
for item in report_dates[-4:]:  # 显示最后4个季度
    print(f"{item['label']}: {item['start']} 到 {item['end']}")
```

---

## 最佳实践

### 1. 类型一致性
```python
# 推荐：保持输入输出类型一致
def process_date_range(input_date):
    # 使用相同类型的函数
    start, end = get_month(input_date)
    return start, end

# 不推荐：混合使用不同类型
def mixed_types(input_date):
    start = date(input_date.year, input_date.month, 1)  # 强制使用date
    end = get_month(input_date)[1]  # 可能返回datetime
    return start, end
```

### 2. 时区处理
```python
# 推荐：明确时区处理
def safe_date_range(start, end):
    # 检查时区兼容性
    if start.tzinfo != end.tzinfo:
        raise ValueError("时区不匹配")
    
    return list(date_range(start, end))

# 推荐：统一时区
def normalize_timezone(dt, target_tz='UTC'):
    if dt.tzinfo is None:
        # naive datetime，假设为UTC
        dt = pytz.UTC.localize(dt)
    
    if target_tz == 'UTC':
        return dt.astimezone(pytz.UTC)
    else:
        return dt.astimezone(pytz.timezone(target_tz))
```

### 3. 错误处理
```python
# 推荐：完善的错误处理
def safe_get_quarter(date_val):
    try:
        return get_quarter(date_val)
    except AttributeError:
        raise TypeError(f"期望 date 或 datetime 对象，得到 {type(date_val)}")
    except Exception as e:
        raise ValueError(f"无法计算季度: {e}")

# 推荐：参数验证
def validate_granularity(granularity, is_datetime=True):
    valid_date = {'year', 'quarter', 'month', 'week', 'day'}
    valid_datetime = valid_date | {'hour'}
    
    valid_set = valid_datetime if is_datetime else valid_date
    
    if granularity not in valid_set:
        type_name = 'datetime' if is_datetime else 'date'
        raise ValueError(
            f"对于 {type_name} 对象，granularity 必须是 {valid_set} 之一"
        )
```

### 4. 性能优化
```python
# 推荐：批量处理
def batch_process_dates(dates, operation='start_of', granularity='month'):
    """批量处理日期，提高性能"""
    results = []
    
    if operation == 'start_of':
        func = start_of
    elif operation == 'end_of':
        func = end_of
    else:
        raise ValueError("不支持的操作")
    
    for date_val in dates:
        results.append(func(date_val, granularity))
    
    return results

# 推荐：缓存重复计算
from functools import lru_cache

@lru_cache(maxsize=128)
def cached_get_quarter(year, month, day):
    """缓存季度计算结果"""
    return get_quarter(date(year, month, day))
```

### 5. 文档和测试
```python
def business_date_range(start_date, end_date, exclude_weekends=True):
    """
    生成业务日期范围
    
    Args:
        start_date (date): 开始日期
        end_date (date): 结束日期
        exclude_weekends (bool): 是否排除周末
    
    Returns:
        List[date]: 业务日期列表
    
    Raises:
        ValueError: 当开始日期晚于结束日期时
    
    Example:
        >>> start = date(2024, 1, 1)
        >>> end = date(2024, 1, 7)
        >>> dates = business_date_range(start, end)
        >>> len(dates)
        5  # 排除周末后的工作日数量
    """
    if start_date > end_date:
        raise ValueError("开始日期不能晚于结束日期")
    
    # 实现逻辑...
    pass
```

---

## 总结

`odoo/tools/date_utils.py` 提供了一套完整的日期时间处理工具，主要特点包括：

### 核心功能
1. **时间周期计算**: 月份、季度、财务年度的起止日期
2. **时间点定位**: 获取各种时间粒度的起始和结束点
3. **日期运算**: 简化的加减法操作
4. **序列化支持**: JSON兼容的日期时间格式化
5. **范围生成**: 灵活的日期序列生成器

### 设计优点
1. **类型保持**: 输入输出类型一致性
2. **时区友好**: 完善的时区处理机制
3. **错误处理**: 详细的参数验证和异常信息
4. **标准兼容**: 使用ISO8601等国际标准
5. **性能考虑**: 合理的算法复杂度

### 应用场景
- 财务报表周期计算
- 业务日期范围确定
- 数据分析时间分组
- 定时任务调度
- API日期参数处理

该模块是Odoo框架中处理日期时间逻辑的基础工具，为各种业务模块提供了可靠的日期计算能力。开发者在使用时应注意时区处理、类型一致性和错误处理等最佳实践。
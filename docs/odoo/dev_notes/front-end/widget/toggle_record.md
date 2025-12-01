---
title: FormView切换单据
description: FormView切换单据
sidebar_label: FormView切换单据
keyword:
  - odoo
  - odoo development
tags:
  - odoo
last_update:
  date: 2025/12/1
  author: Lucas
---
# FormView切换单据

> [Github-toggle_record_widget](https://github.com/LucasLiu09/odoo-module-lucas/tree/16.0/Non_module/toggle_record_widget)

FormView中切换上一条、下一条记录。支持设置是否自动保存，如果否，修改了数据时先弹窗提示是否保存并继续。

![toggle_record_widget1](../../_images/toggle_record_widget1.png)

代码示例：
```xml
<form> 
	<widget name="toggle_record" autoSave="false"/> 
</form>
```

在后端的function返回前一项/后一项记录的id。

```python
def get_previous_record_id(self):
    res_id = None
    result = self.search_read([('co_code', '=', self.co_code), ('so_num', '<', self.so_num)],
                              ['id', 'display_name'], order='so_num desc', limit=1)
    if result:
        res_id = result[0]['id']
    return res_id

def get_next_record_id(self):
    res_id = None
    result = self.search_read([('co_code', '=', self.co_code), ('so_num', '>', self.so_num)],
                              ['id', 'display_name'], order='so_num asc', limit=1)
    if result:
        res_id = result[0]['id']
    return res_id
```


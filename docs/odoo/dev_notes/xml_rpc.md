---
title: xmlrpc
description: xmlrpc
sidebar_label: xmlrpc
keywords:
- odoo
- odoo development
tags: [odoo]
last_update:
  date: 2025/5/18
  author: Lucas
---

# xmlrpc

## 密钥管理

获取API秘钥：

我的账户 - 首选项 - 账户安全 - Developer API Keys

![](./_images/xml_rpc_1.png "User Setting")

单击“生成密钥”，然后复制提供的密钥。请小心存储此密钥：它等同于您的密码，就像您的密码一样，系统以后将无法再次检索或显示该密钥。如果您丢失了此密钥，则必须创建一个新密钥（并可能删除丢失的密钥）。

![](./_images/xml_rpc_2.png "User Setting")

![](./_images/xml_rpc_3.png "User Setting")

## API

- xmlrpc/2/common
- xmlrpc/2/object

### xmlrpc/2/common

`xmlrpc/2/common`端点提供了一些不需要身份验证的元调用，例如身份验证本身或获取版本信息。在尝试进行身份验证之前，为了验证连接信息是否正确，最简单的调用是请求服务器的版本。身份验证本身是通过`authenticate`函数完成的，并返回一个用户标识符（`uid`），用于代替登录信息进行身份验证调用。

```python
import xmlrpc.client
url = "http://localhost:8069/"
common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(url))
```

登录账户

```python
uid = common.authenticate(db, username, password, {})
```


### xmlrpc/2/object

该端点通过`execute_kw`RPC函数调用odoo模型的方法。
```python
models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(url))
models.execute_kw(db, uid, password, model, method, [], {})
```

**execute_kw**
:::info
- `db(str)`: 数据库名
- `uid(int)` : 用户id（可指定或通过authenticate 返回）
- `password(str)`: 用户密码或API Key
- `model(str)`: 模型名称
- `method(str)`: 方法名称
- 按位置传递的参数数组/列表
- 要按关键字传递的参数的映射/字典（可选）
:::

## 使用实例及说明

```python
import xmlrpc.client
url = "http://localhost:8017/"
common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(url))
common.version()
"""
{'server_version': '17.0',
 'server_version_info': [17, 0, 0, 'final', 0, ''],
 'server_serie': '17.0',
 'protocol_version': 1}
"""

db = "odoo"
username = "admin"
password = "admin"
api_password = "980def31e270b825857f98fc3fed9e0f03e65594"
# uid = common.authenticate(db, username, password , {})
uid = common.authenticate(db, username, api_password, {})
print('user id :' + str(uid))
models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(url))

def execute(model, method, *args, **kwargs):
    return models.execute_kw(db, uid, password, model, method, *args, **kwargs)

def search(model, domain, **kwags):
    return execute(model, 'search', [domain], **kwags)
# e.g. start

# Search / Search count
models.execute_kw(db, uid, password, 'res.partner', 'search', [[['is_company', '=', True]]], {'offset': 10, 'limit': 5})

models.execute_kw(db, uid, password, 'res.partner', 'search_count', [[['is_company', '=', True]]])

# 需要读取记录一般都需要使用search与read搭配使用。或者直接使用search_read
# read 默认情况下返回当前用户可以读取的所有字段。

# Search / Read
ids = models.execute_kw(db, uid, password, 'res.partner', 'search', [[['is_company', '=', True]]], {'limit': 1})
[record] = models.execute_kw(db, uid, password, 'res.partner', 'read', [ids])
# count the number of fields fetched by default
len(record)
# 121

# Read
models.execute_kw(db, uid, password, 'res.partner', 'read', [ids], {'fields': ['name', 'country_id', 'comment']})
# result:
# [{"comment": false, "country_id": [21, "Belgium"], "id": 7, "name": "Agrolait"}]

# Create
id = models.execute_kw(db, uid, password, 'res.partner', 'create', [{'name': "New Partner"}])

# Write
models.execute_kw(db, uid, password, 'res.partner', 'write', [[id], {'name': "Newer partner"}])
# get record name after having changed it
models.execute_kw(db, uid, password, 'res.partner', 'read', [[id], ['display_name']])

# 也可通过xmlrpc对模型及字段进行自定义，详情见：https://www.odoo.com/documentation/17.0/developer/reference/external_api.html#inspection-and-introspection
```

## JSONRPC

:::warning
待补充
:::
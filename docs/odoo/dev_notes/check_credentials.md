---
title: 登录认证
description: 登录认证
sidebar_label: 登录认证
keywords:
- odoo
- odoo development
tags: [odoo]
last_update:
  date: 2025/5/18
  author: Lucas
---

# _check_credentials

> 如果需要使用其他的登录方式，可以修改此处实现需求。

## 说明

验证当前用户的密码。
重写此方法以插入其他身份验证方法。
重写应该：
- 调用 super 委托父类进行凭证检查 
- 捕获 AccessDenied 并执行自己的检查
- (re)如果凭据仍然无效，raise AccessDenied

根据自己的验证方法尝试检查凭据有效性时，请调用 _check_credentials。

```python
def _check_credentials(self, password):
    try:
        return super(ResUsers, self)._check_credentials(password)
    except AccessDenied:
        res = self.sudo().search([('id', '=', self.env.uid), ('oauth_access_token', '=', password)])
        if not res:
            raise

```
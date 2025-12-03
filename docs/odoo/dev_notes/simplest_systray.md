---
title: 系统托盘-最小示例
description: 系统托盘的最小产品的代码
sidebar_label: 系统托盘-最小示例
keywords:
- docs
- odoo development
tags: [odoo]

---

# 系统托盘-最小示例

官方文档：
- [Add a systray item](https://www.odoo.com/documentation/16.0/zh_CN/developer/tutorials/master_odoo_web_framework/02_miscellaneous.html#add-a-systray-item)
- [Example: Systray item](https://github.com/odoo/odoo/blob/16.0/addons/web/static/src/webclient/user_menu/user_menu.js)
- [Example: Adding some information to the “session info”](https://github.com/odoo/odoo/blob/16.0/addons/barcodes/models/ir_http.py)
- [Example: Reading the session information](https://github.com/odoo/odoo/blob/1f4e583ba20a01f4c44b0a4ada42c4d3bb074273/addons/barcodes/static/src/barcode_service.js#L5)

1. **编写Component**

```javascript
/** @odoo-module **/

import { Component } from "@odoo/owl";
import { registry } from "@web/core/registry";

export class NewSystray extends Component{

    setup(){
    }

}

NewSystray.template = 'NewSystray';

const systrayItem = {
    Component: NewSystray,
}

registry.category("systray").add("new_systray", systrayItem, {sequence: 10});
```

2. **编写模版**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<templates xml:space="preserve">

    <t t-name="NewSystray" owl="1">
        <span>New Systray</span>
    </t>

</templates>
```

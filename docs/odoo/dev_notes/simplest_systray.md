# 系统托盘-最小示例

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

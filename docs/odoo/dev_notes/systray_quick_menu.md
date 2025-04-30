# 系统托盘：快速搜索菜单

步骤说明：

1. 定义新的Component
2. 编写template
3. 注册systray
4. 通过service.menu获取菜单
5. 通过Dropdown、DropdownItem渲染菜单项
6. 插入input标签，用于搜索
7. 根据输入的搜索内容过滤菜单项
8. 支持不同命名空间来搜索不同类型的项目("@"、"/")

## 代码<!-- {docsify-ignore} -->

- Component

```javascript
/** @odoo-module **/

import { Component, onWillStart, useState, useRef } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";
import { fuzzyLookup } from "@web/core/utils/search";
import { registry } from "@web/core/registry";
import { computeAppsAndMenuItems } from "@web/webclient/menus/menu_helpers";

const NAMESPACE = ['apps', 'menu_items', 'url'];
const SUPPORTED_NAMESPACE = ['@'];

export class QuickMenu extends Component{

    setup(){
        this.user = useService("user");
        this.menuService = useService("menu");
        this.state = useState({
            menuItems: [],
            currentNameSpace: [],
        });
        this.data = useState({
            apps:  [],
            menuItems: [],
            urlItems: [],
        })
        this.composition = false;   // 组合事件，中文输入拼音时不做多余处理
        this.searchValueRef = useRef('searchValue');
        onWillStart(async () => {
            this._initMenuItems();
            // console.log(this.data.apps)
            // console.log(this.data.menuItems)
        });
    }

    /**
     * 初始化菜单项，设置根路径的apps为初始menuItems
     * @private
     */
    _initMenuItems(){
        let { apps, menuItems } = computeAppsAndMenuItems(this.menuService.getMenuAsTree("root"));
        this.data.apps = apps;
        this.data.menuItems = menuItems;
        this.data.urlItems = this._getUrlItems();
        this.setMenuItems();
    }

    _getUrlItems(){
        let urlItems = []
        // ********************************
        // 此处扩展从数据表获取url菜单项
        urlItems.push({name: 'Deepseek', url: 'https://chat.deepseek.com', category: 'url'});
        urlItems.push({name: 'ChatGPT', url: 'https://chat.openai.com/', category: 'url'});
        // ********************************
        return urlItems;
    }

    _getMenuItems(){
        return {
            apps: this.state.currentNameSpace.includes('apps') ? this.data.apps : [],
            menuItems: this.state.currentNameSpace.includes('menu_items') ? this.data.menuItems : [],
            urlItems: this.state.currentNameSpace.includes('url') ? this.data.urlItems : []
        };
    }

    /**
     * 搜索菜单项
     * @param searchValue 搜索值
     * @returns {*[]}
     */
    searchMenuItems(searchValue){
        const result = [];
        const menuService = this.menuService;
        let { apps, menuItems, urlItems } = this._getMenuItems();
        if (searchValue !== undefined && searchValue !== "") {
            apps = fuzzyLookup(searchValue, apps, (menu) => menu.label);

            urlItems = fuzzyLookup(searchValue, urlItems, (menu) => menu.name);

            fuzzyLookup(searchValue, menuItems, (menu) =>
                (menu.parents + " / " + menu.label).split("/").reverse().join("/")
            ).forEach((menu) => {
                result.push({
                    action() {
                        menuService.selectMenu(menu);
                    },
                    category: "menu_items",
                    name: menu.parents + " / " + menu.label,
                    href: menu.href || `#menu_id=${menu.id}&action_id=${menu.actionID}`,
                });
            });
        }

        apps.forEach((menu) => {
            const props = {};
            if (menu.webIconData) {
                const prefix = menu.webIconData.startsWith("P")
                    ? "data:image/svg+xml;base64,"
                    : "data:image/png;base64,";
                props.webIconData = menu.webIconData.startsWith("data:image")
                    ? menu.webIconData
                    : prefix + menu.webIconData.replace(/\s/g, "");
            } else {
                props.webIcon = menu.webIcon;
            }
            result.push({
                action() {
                    menuService.selectMenu(menu);
                },
                category: "apps",
                name: menu.label,
                href: menu.href || `#menu_id=${menu.id}&action_id=${menu.actionID}`,
                props,
            });
        });

        urlItems.forEach((menu) => {
            result.push({
                category: "url",
                name: menu.name,
                href: menu.url,
            })
        })
        return result;
    }

    switchNamespace(namespace) {
        if (namespace === '@'){
            this.state.currentNameSpace = ['url'];
        } else if(namespace === '/'){
            this.state.currentNameSpace = ['menu_items'];
        } else{
            this.state.currentNameSpace = NAMESPACE;
        }
    }

    processSearchValue(searchValue) {
        let namespace = "";
        if (typeof searchValue === 'string' && searchValue.length && SUPPORTED_NAMESPACE.includes(searchValue[0])) {
            namespace = searchValue[0];
            searchValue = searchValue.slice(1);
        }
        return { namespace, searchValue };
    }

    /**
     * 设置菜单项(先清空再更新)
     * @param searchValueOrigin
     */
    setMenuItems(searchValueOrigin){
        const { namespace, searchValue } = this.processSearchValue(searchValueOrigin);
        this.switchNamespace(namespace);
        console.log(namespace)
        console.log(searchValue)
        this.state.menuItems = [];
        this.state.menuItems = this.searchMenuItems(searchValue);
    }

    /**
     * 点击菜单项，执行菜单项的action
     * @param {object} menuItem
     * @param {function} menuItem.action 菜单项的action
     */
    onSelected(menuItem){
        menuItem.action();
    }

    onSearchInput(ev){
        if (this.composition){
            return
        }
        this.setMenuItems(ev.target.value);
    }

    onCompositionStart(){
        this.composition = true;
    }

    onCompositionEnd(){
        this.composition = false;
        this.setMenuItems(this.searchValueRef.el.value);
    }

}

QuickMenu.template = 'QuickMenu';
QuickMenu.components = { Dropdown, DropdownItem };

const systrayItem = {
    Component: QuickMenu,
}

registry.category("systray").add("quick_menu", systrayItem, {sequence: 99});
```

- template

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<templates xml:space="preserve">

    <t t-name="QuickMenu" owl="1">
        <Dropdown class="'o_add_to_board'">
            <t t-set-slot="toggler">
                <i class="fa fa-list"/>
                <span class="ms-1">Quick menu</span>
                <input name="searchValue" id="searchValue" t-ref="searchValue" t-on-input="onSearchInput"
                        t-on-compositionstart="onCompositionStart" t-on-compositionend="onCompositionEnd"
                        class="form-control form-control-sm ms-1" type="text" placeholder="search"/>
            </t>
            <t t-foreach="state.menuItems" t-as="item" t-key="item_index">
                <t t-if="item.category == 'apps'">
                    <DropdownItem class="''" onSelected="() => this.onSelected(item)">
                        <div class="position-relative d-flex align-items-center px-4 py-2 cursor-pointer">
                            <img t-if="item.props.webIconData" style="height: 1.8rem;width: 1.8rem;"
                                 class="me-2 position-relative rounded-1" t-attf-src="{{item.props.webIconData}}"/>
                            <span class="flex-shrink-0">
                                <t t-esc="item.name"/>
                          </span>
                        </div>
                    </DropdownItem>
                </t>
                <t t-elif="item.category == 'menu_items'">
                    <DropdownItem class="''" onSelected="() => this.onSelected(item)">
                        <div class="position-relative d-flex align-items-center px-4 py-2 cursor-pointer">
                            <span class="flex-shrink-0">
                                <t t-esc="item.name"/>
                          </span>
                        </div>
                    </DropdownItem>
                </t>
                <t t-elif="item.category == 'url'">
                    <DropdownItem>
                        <a class="position-relative px-4 py-2 cursor-pointer flex-shrink-0 link-dark" t-esc="item.name" t-att-href="item.href" target="_blank"/>
                    </DropdownItem>
                </t>
            </t>
        </Dropdown>
    </t>

</templates>
```

## 截图<!-- {docsify-ignore} -->

![apps](_images\quick_menu_1.png "apps")

![query menu](_images\quick_menu_2.png "query menu")

![query menu namespace](_images\quick_menu_4.png "query menu namespace")

![query menu namespace](_images\quick_menu_3.png "query menu namespace")

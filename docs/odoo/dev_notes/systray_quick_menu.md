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

## 截图<!-- {docsify-ignore} -->

![apps](_images\quick_menu_1.png "apps")

![query menu](_images\quick_menu_2.png "query menu")

![query menu namespace](_images\quick_menu_4.png "query menu namespace")

![query menu namespace](_images\quick_menu_3.png "query menu namespace")


## 代码<!-- {docsify-ignore} -->
> [github](https://github.com/LucasLiu09/odoo-module-lucas/tree/16.0/quick_menu_systray)

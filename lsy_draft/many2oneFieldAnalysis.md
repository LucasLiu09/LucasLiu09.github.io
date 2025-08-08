
# Many2OneField

Many2OneField的组件结构

Many2OneField
├── Many2XAutocomplete
│   ├── AutoComplete

- `Many2OneField`: addons/web/static/src/views/fields/many2one/many2one_field.js
- `Many2XAutocomplete`: addons/web/static/src/views/fields/relational_utils.js
- `AutoComplete`: addons/web/static/src/core/autocomplete/autocomplete.js

## Records加载机制

AutoComplete.loadSources(useInput)

 ↓

for pSource of this.props.sources

 ↓

AutoComplete.loadOptions(pSource.options, useInput ? this.inputRef.el.value.trim() : "")

中间的`props.sources`来源于getters `Many2XAutocomplete.sources()` ← `this.optionsSource()` ← `this.loadOptionsSource()`

在`loadOptionsSource`这个函数中，调用了orm.call(method="name_search")来获取记录的显示值。
(`AutoComplete`支持通过`source.optionTemplate`来设置显示的模板，来自定义展示的样式及内容。)


```javascript title="loadOptionsSource()"
    async loadOptionsSource(request) {
        if (this.lastProm) {
            this.lastProm.abort(false);
        }
        this.lastProm = this.orm.call(this.props.resModel, "name_search", [], {
            name: request,
            operator: "ilike",
            args: this.props.getDomain(),
            limit: this.props.searchLimit + 1,
            context: this.props.context,
        });
        const records = await this.lastProm;

        const options = records.map((result) => ({
            value: result[0],
            label: result[1].split("\n")[0],
        }));

        if (this.props.quickCreate && request.length) {
            options.push({
                label: sprintf(this.env._t(`Create "%s"`), request),
                classList: "o_m2o_dropdown_option o_m2o_dropdown_option_create",
                action: async (params) => {
                    try {
                        await this.props.quickCreate(request, params);
                    } catch (e) {
                        if (
                            e &&
                            e.name === "RPC_ERROR" &&
                            e.exceptionName === "odoo.exceptions.ValidationError"
                        ) {
                            const context = this.getCreationContext(request);
                            return this.openMany2X({ context });
                        }
                        // Compatibility with legacy code
                        if (
                            e &&
                            e.message &&
                            e.message.name === "RPC_ERROR" &&
                            e.message.exceptionName === "odoo.exceptions.ValidationError"
                        ) {
                            // The event.preventDefault() is necessary because we still use the legacy
                            e.event.preventDefault();
                            const context = this.getCreationContext(request);
                            return this.openMany2X({ context });
                        }
                        throw e;
                    }
                },
            });
        }

        if (!this.props.noSearchMore && this.props.searchLimit < records.length) {
            options.push({
                label: this.env._t("Search More..."),
                action: this.onSearchMore.bind(this, request),
                classList: "o_m2o_dropdown_option o_m2o_dropdown_option_search_more",
            });
        }

        const canCreateEdit =
            "createEdit" in this.activeActions
                ? this.activeActions.createEdit
                : this.activeActions.create;
        if (!request.length && !this.props.value && (this.props.quickCreate || canCreateEdit)) {
            options.push({
                label: this.env._t("Start typing..."),
                classList: "o_m2o_start_typing",
                unselectable: true,
            });
        }

        if (request.length && canCreateEdit) {
            const context = this.getCreationContext(request);
            options.push({
                label: this.env._t("Create and edit..."),
                classList: "o_m2o_dropdown_option o_m2o_dropdown_option_create_edit",
                action: () => this.openMany2X({ context }),
            });
        }

        if (!records.length && !this.activeActions.create) {
            options.push({
                label: this.env._t("No records"),
                classList: "o_m2o_no_result",
                unselectable: true,
            });
        }

        return options;
    }
```
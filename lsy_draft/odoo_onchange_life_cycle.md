
# onchange生命周期分析

## 分析过程

addons/web/static/src/legacy/js/views/basic/basic_model.js

执行/onchange rpc并应用结果。假定触发onchange的更改已经应用于记录。
`async _performOnChange(record, fields, options = {}) {`

在调用rpc接收结果之后，判断如果是warning，调用`trigger_up('warning')`. 这里的trigger进一步调用了`RelationalModel`的`_trigger_up(ev)`.

```
const result = await this._rpc({
    model: record.model,
    method: 'onchange',
    args: [idList, currentData, fields, onchangeSpec],
    context: context,
});
if (!record._changes) {
    // if the _changes key does not exist anymore, it means that
    // it was removed by discarding the changes after the rpc
    // to onchange. So, in that case, the proper response is to
    // ignore the onchange.
    return;
}
if (result.warning) {
    this.trigger_up('warning', result.warning);
    record._warning = true;
}
if (result.domain) {
    record._domains = Object.assign(record._domains, result.domain);
}
await this._applyOnChange(result.value, record, { firstOnChange });
return result;
```

addons/web/static/src/views/basic_relational_model.js

`_trigger_up(ev) {`

在`_trigger_up`中调用`dialogService`或`notificationService`. 通过debug发现此处的payload中保留的参数仅有`title`、`message`、`type`，并非`onchange`返回的所有参数，这个位置是由于后端`BaseModel`的`_onchange_eval`中有进行处理。

```javascript
_trigger_up(ev) {
    const evType = ev.name;
    const payload = ev.data;
    if (evType === "call_service") {
        let args = payload.args || [];
        if (payload.service === "ajax" && payload.method === "rpc") {
            // ajax service uses an extra 'target' argument for rpc
            args = args.concat(ev.target);
            if (owl.status(this.__component) === "destroyed") {
                console.warn("Component is destroyed");
                return payload.callback(new Promise(() => {}));
            }
            const prom = new Promise((resolve, reject) => {
                owl.Component.env.session
                    .rpc(...args)
                    .then((value) => {
                        if (owl.status(this.__component) !== "destroyed") {
                            resolve(value);
                        }
                    })
                    .guardedCatch((reason) => {
                        if (owl.status(this.__component) !== "destroyed") {
                            reject(reason);
                        }
                    });
            });
            return payload.callback(prom);
        } else if (payload.service === "notification") {
            return this.notificationService.add(payload.message, {
                className: payload.className,
                sticky: payload.sticky,
                title: payload.title,
                type: payload.type,
            });
        }
        throw new Error(`call service ${payload.service} not handled in relational model`);
    } else if (evType === "warning") {
        if (payload.type === "dialog") {
            return this.dialogService.add(WarningDialog, {
                title: payload.title,
                message: payload.message,
            });
        } else {
            return this.notificationService.add(payload.message, {
                className: payload.className,
                sticky: payload.sticky,
                title: payload.title,
                type: "warning",
            });
        }
    } else if (evType === "do_action") {
        // SAME CODE AS legacy_service_provider
        if (payload.action.context) {
            payload.action.context = new Context(payload.action.context).eval();
        }
        const legacyOptions = mapDoActionOptionAPI(payload.options);
        return this.actionService.doAction(payload.action, legacyOptions);
    } else if (evType === "reload") {
        return this.load().then(() => {
            if (ev.data.onSuccess) {
                ev.data.onSuccess();
            }
        });
    }
    throw new Error(`trigger_up(${evType}) not handled in relational model`);
}
```


odoo/models.py

onchange首先会调用`BaseModel.onchange`，在此函数中会调用`record._onchange_eval`。

```python
def _onchange_eval(self, field_name, onchange, result):
    """ Apply onchange method(s) for field ``field_name`` with spec ``onchange``
        on record ``self``. Value assignments are applied on ``self``, while
        domain and warning messages are put in dictionary ``result``.
    """
    onchange = onchange.strip()

    def process(res):
        if not res:
            return
        if res.get('value'):
            res['value'].pop('id', None)
            self.update({key: val for key, val in res['value'].items() if key in self._fields})
        if res.get('domain'):
            _logger.warning(
                "onchange method %s returned a domain, this is deprecated",
                method.__qualname__
            )
            result.setdefault('domain', {}).update(res['domain'])
        if res.get('warning'):
            result['warnings'].add((
                res['warning'].get('title') or _("Warning"),
                res['warning'].get('message') or "",
                res['warning'].get('type') or "",
            ))

    if onchange in ("1", "true"):
        for method in self._onchange_methods.get(field_name, ()):
            s = time.time()
            method_res = method(self)
            process(method_res)
            e = time.time()
            _logger.info("Calling onchange method(%s) %s"% (e - s, method.__qualname__))
        return
```

## 扩展的可能性

如果要实现在onchange函数中可以返回自定义的Dialog，考虑修改`BaseModel._onchange_eval`以接收更多的参数供前端使用，第二步修改`basic_relational_model._trigger_up`以实现调用自定义Dialog。

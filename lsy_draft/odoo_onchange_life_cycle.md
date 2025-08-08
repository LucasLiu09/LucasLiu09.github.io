
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

如果要实现在onchange函数中可以返回自定义的Dialog，考虑修改`BaseModel._onchange_eval`以接收更多的参数供前端使用，第二步修改`BaseModel.onchange`，对result插入更多的参数，第三步修改`basic_relational_model._trigger_up`以实现调用自定义Dialog。

:::tips
要继承基础模型修改原生逻辑，可以通过`_inherit = 'base'`进行重写，因为Base会被所有的模型隐式继承。
:::

### 实现onchange之后弹窗附有操作按钮

```python
import copy
import json
import itertools
import time
import logging
from collections import defaultdict, OrderedDict
from odoo import models,api, _
from odoo.fields import Command
from odoo.models import NewId
from odoo.tools import unique, OrderedSet
_logger = logging.getLogger(__name__)

class InheritBase(models.AbstractModel):
    _inherit = 'base'

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
                # ========= 重写这里 ============================================================================================
                result['warnings'].add((
                    res['warning'].get('title') or _("Warning"),
                    res['warning'].get('message') or "",
                    res['warning'].get('type') or "",
                    json.dumps(res['warning'].get('params', {}) or {}, ensure_ascii=False),
                ))
                # ========= 重写这里 ============================================================================================

        if onchange in ("1", "true"):
            for method in self._onchange_methods.get(field_name, ()):
                s = time.time()
                method_res = method(self)
                process(method_res)
                e = time.time()
                _logger.info("Calling onchange method(%s) %s"% (e - s, method.__qualname__))
            return

    def onchange(self, values, field_name, field_onchange):
        """ Perform an onchange on the given field.

            :param values: dictionary mapping field names to values, giving the
                current state of modification
            :param field_name: name of the modified field, or list of field
                names (in view order), or False
            :param field_onchange: dictionary mapping field names to their
                on_change attribute

            When ``field_name`` is falsy, the method first adds default values
            to ``values``, computes the remaining fields, applies onchange
            methods to them, and return all the fields in ``field_onchange``.
        """
        # this is for tests using `Form`
        self.env.flush_all()

        env = self.env
        if isinstance(field_name, list):
            names = field_name
        elif field_name:
            names = [field_name]
        else:
            names = []

        first_call = not names

        if any(name not in self._fields for name in names):
            return {}

        def PrefixTree(model, dotnames):
            """ Return a prefix tree for sequences of field names. """
            if not dotnames:
                return {}
            # group dotnames by prefix
            suffixes = defaultdict(list)
            for dotname in dotnames:
                # name, *names = dotname.split('.', 1)
                names = dotname.split('.', 1)
                name = names.pop(0)
                suffixes[name].extend(names)
            # fill in prefix tree in fields order
            tree = OrderedDict()
            for name, field in model._fields.items():
                if name in suffixes:
                    tree[name] = subtree = PrefixTree(model[name], suffixes[name])
                    if subtree and field.type == 'one2many':
                        subtree.pop(field.inverse_name, None)
            return tree

        class Snapshot(dict):
            """ A dict with the values of a record, following a prefix tree. """
            __slots__ = ()

            def __init__(self, record, tree, fetch=True):
                # put record in dict to include it when comparing snapshots
                super(Snapshot, self).__init__({'<record>': record, '<tree>': tree})
                if fetch:
                    for name in tree:
                        self.fetch(name)

            def fetch(self, name):
                """ Set the value of field ``name`` from the record's value. """
                record = self['<record>']
                tree = self['<tree>']
                if record._fields[name].type in ('one2many', 'many2many'):
                    # x2many fields are serialized as a list of line snapshots
                    self[name] = [Snapshot(line, tree[name]) for line in record[name]]
                else:
                    self[name] = record[name]

            def has_changed(self, name):
                """ Return whether a field on record has changed. """
                if name not in self:
                    return True
                record = self['<record>']
                subnames = self['<tree>'][name]
                if record._fields[name].type not in ('one2many', 'many2many'):
                    return self[name] != record[name]
                return (
                    len(self[name]) != len(record[name])
                    or (
                        set(line_snapshot["<record>"].id for line_snapshot in self[name])
                        != set(record[name]._ids)
                    )
                    or any(
                        line_snapshot.has_changed(subname)
                        for line_snapshot in self[name]
                        for subname in subnames
                    )
                )

            def diff(self, other, force=False):
                """ Return the values in ``self`` that differ from ``other``.
                    Requires record cache invalidation for correct output!
                """
                record = self['<record>']
                result = {}
                for name, subnames in self['<tree>'].items():
                    if name == 'id':
                        continue
                    field = record._fields[name]
                    if (field.type == 'properties' and field.definition_record in field_name
                       and other.get(name) == self[name] == []):
                        # TODO: The parent field on "record" can be False, if it was changed,
                        # (even if if was changed to a not Falsy value) because of
                        # >>> initial_values = dict(values, **dict.fromkeys(names, False))
                        # If it's the case when we will read the properties field on this record,
                        # it will return False as well (no parent == no definition)
                        # So record at the following line, will always return a empty properties
                        # because the definition record is always False if it triggered the onchange
                        # >>> snapshot0 = Snapshot(record, nametree, fetch=(not first_call))
                        # but we need "snapshot0" to have the old value to be able
                        # to compare it with the new one and trigger the onchange if necessary.
                        # In that particular case, "other.get(name)" must contains the
                        # non empty properties value.
                        result[name] = []
                        continue

                    if not force and other.get(name) == self[name]:
                        continue
                    if field.type not in ('one2many', 'many2many'):
                        result[name] = field.convert_to_onchange(self[name], record, {})
                    else:
                        # x2many fields: serialize value as commands
                        result[name] = commands = [Command.clear()]
                        # The purpose of the following line is to enable the prefetching.
                        # In the loop below, line._prefetch_ids actually depends on the
                        # value of record[name] in cache (see prefetch_ids on x2many
                        # fields).  But the cache has been invalidated before calling
                        # diff(), therefore evaluating line._prefetch_ids with an empty
                        # cache simply returns nothing, which discards the prefetching
                        # optimization!
                        record._cache[name] = tuple(
                            line_snapshot['<record>'].id for line_snapshot in self[name]
                        )
                        for line_snapshot in self[name]:
                            line = line_snapshot['<record>']
                            line = line._origin or line
                            if not line.id:
                                # new line: send diff from scratch
                                line_diff = line_snapshot.diff({})
                                commands.append((Command.CREATE, line.id.ref or 0, line_diff))
                            else:
                                # existing line: check diff from database
                                # (requires a clean record cache!)
                                line_diff = line_snapshot.diff(Snapshot(line, subnames))
                                if line_diff:
                                    # send all fields because the web client
                                    # might need them to evaluate modifiers
                                    line_diff = line_snapshot.diff({})
                                    commands.append(Command.update(line.id, line_diff))
                                else:
                                    commands.append(Command.link(line.id))
                return result

        nametree = PrefixTree(self.browse(), field_onchange)

        if first_call:
            names = [name for name in values if name != 'id']
            missing_names = [name for name in nametree if name not in values]
            defaults = self.default_get(missing_names)
            for name in missing_names:
                values[name] = defaults.get(name, False)
                if name in defaults:
                    names.append(name)

        # prefetch x2many lines: this speeds up the initial snapshot by avoiding
        # computing fields on new records as much as possible, as that can be
        # costly and is not necessary at all
        for name, subnames in nametree.items():
            if subnames and values.get(name):
                # retrieve all line ids in commands
                line_ids = set()
                for cmd in values[name]:
                    if cmd[0] in (Command.UPDATE, Command.LINK):
                        line_ids.add(cmd[1])
                    elif cmd[0] == Command.SET:
                        line_ids.update(cmd[2])
                # prefetch stored fields on lines
                lines = self[name].browse(line_ids)
                fnames = [subname
                          for subname in subnames
                          if lines._fields[subname].base_field.store]
                lines._read(fnames)
                # copy the cache of lines to their corresponding new records;
                # this avoids computing computed stored fields on new_lines
                new_lines = lines.browse(map(NewId, line_ids))
                cache = self.env.cache
                for fname in fnames:
                    field = lines._fields[fname]
                    if not field.translate:
                        cache.update(new_lines, field, [
                            field.convert_to_cache(value, new_line, validate=False)
                            for value, new_line in zip(cache.get_values(lines, field), new_lines)
                        ])
                    else:
                        cache.update_raw(
                            new_lines, field, map(copy.copy, cache.get_values(lines, field)),
                        )

        # Isolate changed values, to handle inconsistent data sent from the
        # client side: when a form view contains two one2many fields that
        # overlap, the lines that appear in both fields may be sent with
        # different data. Consider, for instance:
        #
        #   foo_ids: [line with value=1, ...]
        #   bar_ids: [line with value=1, ...]
        #
        # If value=2 is set on 'line' in 'bar_ids', the client sends
        #
        #   foo_ids: [line with value=1, ...]
        #   bar_ids: [line with value=2, ...]
        #
        # The idea is to put 'foo_ids' in cache first, so that the snapshot
        # contains value=1 for line in 'foo_ids'. The snapshot is then updated
        # with the value of `bar_ids`, which will contain value=2 on line.
        #
        # The issue also occurs with other fields. For instance, an onchange on
        # a move line has a value for the field 'move_id' that contains the
        # values of the move, among which the one2many that contains the line
        # itself, with old values!
        #
        changed_values = {name: values[name] for name in names}
        # set changed values to null in initial_values; not setting them
        # triggers default_get() on the new record when creating snapshot0
        initial_values = dict(values, **dict.fromkeys(names, False))

        # do not force delegate fields to False
        for parent_name in self._inherits.values():
            if not initial_values.get(parent_name, True):
                initial_values.pop(parent_name)

        # create a new record with values
        record = self.new(initial_values, origin=self)

        # make parent records match with the form values; this ensures that
        # computed fields on parent records have all their dependencies at
        # their expected value
        for name in initial_values:
            field = self._fields.get(name)
            if field and field.inherited:
                parent_name, name = field.related.split('.', 1)
                record[parent_name]._update_cache({name: record[name]})

        # make a snapshot based on the initial values of record
        snapshot0 = Snapshot(record, nametree, fetch=(not first_call))

        # store changed values in cache; also trigger recomputations based on
        # subfields (e.g., line.a has been modified, line.b is computed stored
        # and depends on line.a, but line.b is not in the form view)
        record._update_cache(changed_values, validate=False)

        # update snapshot0 with changed values
        for name in names:
            snapshot0.fetch(name)

        # Determine which field(s) should be triggered an onchange. On the first
        # call, 'names' only contains fields with a default. If 'self' is a new
        # line in a one2many field, 'names' also contains the one2many's inverse
        # field, and that field may not be in nametree.
        todo = list(unique(itertools.chain(names, nametree))) if first_call else list(names)
        done = set()

        # mark fields to do as modified to trigger recomputations
        protected = [self._fields[name] for name in names]
        with self.env.protecting(protected, record):
            record.modified(todo)
            for name in todo:
                field = self._fields[name]
                if field.inherited:
                    # modifying an inherited field should modify the parent
                    # record accordingly; because we don't actually assign the
                    # modified field on the record, the modification on the
                    # parent record has to be done explicitly
                    parent = record[field.related.split('.')[0]]
                    parent[name] = record[name]

        result = {'warnings': OrderedSet()}

        # process names in order
        while todo:
            # apply field-specific onchange methods
            for name in todo:
                if field_onchange.get(name):
                    record._onchange_eval(name, field_onchange[name], result)
                done.add(name)

            if not env.context.get('recursive_onchanges', True):
                break

            # determine which fields to process for the next pass
            todo = [
                name
                for name in nametree
                if name not in done and snapshot0.has_changed(name)
            ]

        # make the snapshot with the final values of record
        snapshot1 = Snapshot(record, nametree)

        # determine values that have changed by comparing snapshots
        self.env.invalidate_all()
        result['value'] = snapshot1.diff(snapshot0, force=first_call)

        # format warnings
        warnings = result.pop('warnings')
        # ========= 重写这里 ============================================================================================
        if len(warnings) == 1:
            title, message, type, params = warnings.pop()
            if not type:
                type = 'dialog'
            result['warning'] = dict(title=title, message=message, type=type, params=json.loads(params))
        # ========= 重写这里 ============================================================================================
        elif len(warnings) > 1:
            # concatenate warning titles and messages
            title = _("Warnings")
            message = '\n\n'.join([warn_title + '\n\n' + warn_message for warn_title, warn_message, warn_type, params in warnings])
            result['warning'] = dict(title=title, message=message, type='dialog')

        return result
```

JavaScript需要通过patch来处理，下面仅展示源码(addons/web/static/src/views/basic_relational_model.js)处修改。

```javascript
export class RelationalModel extends Model{
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
            }
            // ========= 重写这里 ============================================================================================
            else if(payload.type === "confirm_dialog"){
                console.log('calling onchange to open confirm_dialog', payload)
                return this.dialogService.add(ConfirmationDialogWithInput, payload.params);
            }
            // ========= 重写这里 ============================================================================================
            else {
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
}
```

使用示例
```python

@api.onchange('field_a')
def _onchange_field_a(self):
    return {
            'warning': {'title': '%s Error' % self.curr_id.curr_code,
                        'message': '这是测试message。',
                        'type': 'confirm_dialog',
                        'sticky': True,
                        'extra_params': {'a': 123, 'b': 'string B'},
                        "params": {
                            "body": _("Are you sure you want to approve？"),
                            "title": _("Approval Dialog"),
                            "alertMessage": _(
                                "Please input the reject reason when you want to reject."),
                            "inputList": [
                                {"name": "reject_reason", "label": _("Reject Reason"), "type": "text"}
                            ],
                            "nextCall": {
                                "mode": "function",
                                "model": "hh_approval.approve_config",
                                "method": "confirm_method",
                                "resIds": self.ids,
                                "kwargs": {
                                    "context": {},
                                },
                            },
                            "extraButtons": [
                                {
                                    "btnText": "Reject",
                                    "btnClass": "btn-danger",
                                    "nextCall": {
                                        "mode": "function",
                                        "model": "hh_approval.approve_config",
                                        "method": "reject_method",
                                        "resIds": self.ids,
                                        "kwargs": {
                                            "context": {},
                                        },
                                    }
                                },
                            ]
                        },
                        }
        }
```

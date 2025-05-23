---
title: utils search - fuzzyLookup
description: 列表查询
sidebar_label: utils search - fuzzyLookup
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2025/5/23
  author: Lucas
---

# utils search - fuzzyLookup

:::info[Note]
Return a list of things that matches a pattern, ordered by their 'score' (higher score first). 
An higher score means that the match is better. 
For example, consecutive letters are considered a better match.
:::

## import

```javascript
import { fuzzyLookup } from "@web/core/utils/search";
```

## 参数说明：
`fuzzyLookup(pattern, list, fn)`
- `pattern`: The pattern to match.
- `list`: The list of things to match.
- `fn`: A function that takes an element of the list and returns a string to match.

传入`pattern`作为搜索值，`list`为待搜索的列表，`fn`是一个`function`，`fn`的入参是`list`中的每一个元素，返回一个**字符串**用于匹配搜索值。

`fuzzyLookup`返回入参的list满足匹配条件且按分数从高到低排序的列表。

## 用法示例

```javascript
// 遍历apps，搜索apps->label与searchValue匹配的项。
match_apps = fuzzyLookup(searchValue, apps, (app) => app.label);
```


## 源码

```javascript title="addons/web/static/src/core/utils/search.js"
/** @odoo-module */

import { unaccent } from "./strings";

/**
 * This private function computes a score that represent the fact that the
 * string contains the pattern, or not
 *
 * - If the score is 0, the string does not contain the letters of the pattern in
 *   the correct order.
 * - if the score is > 0, it actually contains the letters.
 *
 * Better matches will get a higher score: consecutive letters are better,
 * and a match closer to the beginning of the string is also scored higher.
 */
function match(pattern, str) {
    let totalScore = 0;
    let currentScore = 0;
    const len = str.length;
    let patternIndex = 0;

    pattern = unaccent(pattern, false);
    str = unaccent(str, false);

    for (let i = 0; i < len; i++) {
        if (str[i] === pattern[patternIndex]) {
            patternIndex++;
            currentScore += 100 + currentScore - i / 200;
        } else {
            currentScore = 0;
        }
        totalScore = totalScore + currentScore;
    }

    return patternIndex === pattern.length ? totalScore : 0;
}

/**
 * Return a list of things that matches a pattern, ordered by their 'score' (
 * higher score first). An higher score means that the match is better. For
 * example, consecutive letters are considered a better match.
 */
export function fuzzyLookup(pattern, list, fn) {
    const results = [];
    list.forEach((data) => {
        const score = match(pattern, fn(data));
        if (score > 0) {
            results.push({ score, elem: data });
        }
    });

    // we want better matches first
    results.sort((a, b) => b.score - a.score);

    return results.map((r) => r.elem);
}

// Does `pattern` fuzzy match `string`?
export function fuzzyTest(pattern, string) {
    return match(pattern, string) !== 0;
}

```
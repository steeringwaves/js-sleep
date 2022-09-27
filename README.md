# @steeringwaves/sleep

![workflow](https://github.com/github/docs/actions/workflows/test.yml/badge.svg)

A typescript async sleep utility.

## Example

### Promises

```js
const Sleep = require("@steeringwaves/sleep").default;

Sleep(500).then(() => console.log("500ms sleep finished")); // sleep 500ms
await Sleep(1000); // sleep 1s
console.log("1s sleep finished");
```

### Using contexts

```js
const Context = require("@steeringwaves/context").default;
const Sleep = require("@steeringwaves/sleep").default;

const ctx = new Context();

Sleep(2000)
	.setContext(ctx)
	.onCancel(() => {
		console.log("sleep canceled");
	})
	.then(() => console.log("sleep completed"))
	.catch((e) => console.log(e));

ctx.Done();
```

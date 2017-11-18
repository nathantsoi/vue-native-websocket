# Changelog

This package is [semantic versioned](http://semver.org/)

## 2.0.5

- [bugfix]: fixed context for events callback. thx [@n5leon](https://github.com/n5leon)

## 2.0.4

- [feature]: namespace actions. thx [@ThomasKlessen](https://github.com/ThomasKlessen) and double thx for tests / test updates!
- [feature]: reconnect. thx [@weglov](https://github.com/weglov)

## 2.0.3

- [bugfix]: handle json responses that do not include a `.mutation` value
- note that the 2.0.2 npm publish did not include built library and is identical to 2.0.1, 2.0.3 fixes and includes the change above

## 2.0.1, 2.0.3

- [bugfix]: call `new WebSocket` constructor without an empty sub-protocol string (throws on Chrome w/o this fix)
- [docs]: update action `json` `action` documentation

## 2.0.0

- [api change]: move `store` and `protocol` options from arguments to the  opts` hash

e.g. for an instantiation in 1.0.0 like:

```
Vue.use(VueNativeSock, 'ws://localhost:9090', 'my-protocol', store, { format: 'json' })
```

is now, in 2.0.0:

```
Vue.use(VueNativeSock, 'ws://localhost:9090', { protocol: 'my-protocol', store: store, format: 'json' })
```

- [bugfix]: allow json message passing without a namespace

## 1.0.0

First release

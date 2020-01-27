# Changelog

This package is [semantic versioned](http://semver.org/)

## 2.0.14
- [feature]: Bug fixes. tnx [@dennisreimann ](https://github.com/dennisreimann)

## 2.0.13
- [feature]: Bug fixes.

## 2.0.12
- [feature]: Manual connect can supports options and diferent url. tnx [@pmarais](https://github.com/pmarais)


## 2.0.11
- [bugfix]: custom mutation name. tnx [@sharkykh](https://github.com/sharkykh)

## 2.0.10
- [bugfix]: check Proxy for old browsers. tnx [@mikhailian](https://github.com/mikhailian)
- [feature]: Handle skip scheme ws url. tnx [@denzow](https://github.com/denzow)
- [feature]: Support for custom mutation name. thx [@OmgImAlexis](https://github.com/OmgImAlexis)

## 2.0.9
- [bugfix]: fixed reconnection

## 2.0.8
- [feature]: custom pass to store logic. Defaults to original passToStore code if no custom logic provided

## 2.0.7
- [feature]: manual connect/disconnect

## 2.0.6

- [bugfix]: reconnection thx [@weglov](https://github.com/weglov)

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

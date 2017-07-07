# Changelog

This package is [semantic versioned](http://semver.org/)

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

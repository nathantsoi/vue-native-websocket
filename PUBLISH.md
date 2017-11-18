## Steps to publish a new version

- make changes

- run `yarn test` and make sure all tests pass

- run `yarn build` and commit new build file

- bump version in package.json according to semver.org rules

- update changelog

- commit and push

- make a github release with head on master, named `v[SEM_VERSION]` e.g. `v2.0.5`

- run `npm publish` to push the latest version to https://www.npmjs.com/package/vue-native-websocket

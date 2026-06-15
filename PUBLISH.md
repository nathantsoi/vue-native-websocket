## Steps to publish a new version

- make changes

- run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`

- verify `npm audit` reports no vulnerabilities

- run `npm pack --dry-run` to verify package contents

- bump version in package.json according to semver.org rules

- update changelog

- commit and push

- make a github release with head on master, named `v[SEM_VERSION]` e.g. `v2.0.5`

- run `npm publish` to build and push the latest version to https://www.npmjs.com/package/vue-native-websocket

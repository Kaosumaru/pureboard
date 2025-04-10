# pureboard

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]
[![Code Coverage][codecov-img]][codecov-url]
[![Commitizen Friendly][commitizen-img]][commitizen-url]
[![Semantic Release][semantic-release-img]][semantic-release-url]

> A library for creating multiplayer boardgames

[Overview][overview-url]

## Install

```bash
npm install pureboard
```

## Usage

pureboard is a library that allows for easy implementation of multiplayer games, by replicating actions on a state. It's designed for boardgame-like games, but can be used for other projects. It uses zustand for state management, so replicated state on client can be easily used in a React project.

[Usage][usage-url]

## API

[Link][documentation-url]

## Example

See `example` directory for example of a online multiplayer connect4 game.

1. Run `npm install` in root directory
2. Run `npm install` in the `example` directory
3. Run `npm run dev` in the `example` directory
4. Open http://localhost:3000 in your browser

[build-img]: https://github.com/Kaosumaru/pureboard/actions/workflows/release.yml/badge.svg
[build-url]: https://github.com/Kaosumaru/pureboard/actions/workflows/release.yml
[downloads-img]: https://img.shields.io/npm/dt/pureboard
[downloads-url]: https://www.npmtrends.com/pureboard
[npm-img]: https://img.shields.io/npm/v/pureboard
[npm-url]: https://www.npmjs.com/package/pureboard
[issues-img]: https://img.shields.io/github/issues/Kaosumaru/pureboard
[issues-url]: https://github.com/Kaosumaru/pureboard/issues
[codecov-img]: https://codecov.io/gh/Kaosumaru/pureboard/branch/main/graph/badge.svg
[codecov-url]: https://codecov.io/gh/Kaosumaru/pureboard
[semantic-release-img]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release
[commitizen-img]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]: http://commitizen.github.io/cz-cli/
[documentation-url]: https://kaosumaru.github.io/pureboard/
[overview-url]: https://kaosumaru.github.io/pureboard/documents/overview.html
[usage-url]: https://kaosumaru.github.io/pureboard/documents/usage.html

# Nimiq Browser Warnings

Javascipt, CSS and a html snippet to display a warning in case of unsupported browsers, private mode or disabled Javascript.

## Installation

```
yarn add @nimiq/browser-warning
```

## Usage

This is no modular package you can import. Instead:
* Use e.g. CopyWebpackPlugin to copy files from dist folder to your app's root folder
* Use e.g. HtmlWebpackPlugin to inject the HTML snippet into your app's index.html
* In your index.html head section, place `<script type="text/javascript" src="browser-warning.js" defer></script>` in
  front of all other scripts which may execute, especially your app's main entry point. If your other scripts are not
  deferred, also remove the `defer` attribute on `browser-warning.js`.
* In your app's main entry point logic, check for `window.hasBrowserWarning === true` and stop execution in that case.
* If you're using typescript, add `@nimiq/browser-warning` to
  [`compilerOptions.types`](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#types-typeroots-and-types)
  in your `tsconfig.json`.

## Configuration

You can define a callback `window.onBrowserWarning` that gets called in case of a browser warning with the warning type
and a config object:

|Parameter|Type|
|---------|----|
|warningType|'web-view' / 'browser-outdated' / 'no-local-storage' / 'private-mode'|
|warningConfig.headline|string|
|warningConfig.message|string|
|warningConfig.hasShareButton|boolean|
|warningConfig.shareUrl|string|
|warningConfig.useNativeShare|boolean|
|warningConfig.shareInstructions|string|

It can then optionally return a configuration object that overwrites a subset or all of the configuration properties.

Note that `window.onBrowserWarning` needs to be defined before `browser-warning.js` is executed. This is therefore an
exception to the rule stated in the previous section.

Note that the script that defines `window.onBrowserWarning` **must be written in old-fashioned Javascript** to not fail
with syntax errors in old browsers which would prevent us from being able to display a warning in old browsers.

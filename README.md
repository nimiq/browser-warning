# Nimiq Browser Warnings

Javascipt, CSS and a html snippet to display a warning in case of unsupported browsers, private modes or deactivated Javascript.

This is no modular package you can import. Instead:
* Use e.g. CopyWebpackPlugin to copy files from dist folder to your app's root folder
* Use e.g. HtmlWebpackPlugin to inject the HTML snippet into your app's index.html
* In your index.html head section, place `<script type="text/javascript" src="/browser-warning.js" defer></script>
` in front of all other scripts which may execute, especially your app's main entry point.
* In your app's main entry point logic, check for `window.hasBrowserWarning === true` and stop execution in that case.

Note: Your app needs to be located at root level of the domain, otherwise the paths are incorrect.

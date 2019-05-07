# Nimiq Browser Warnings

Javascipt, CSS and a html snippet to display a warning in case of unsupported browsers, private modes or deactivated Javascript.

This is no modular package you can import. Instead:
* Use e.g. CopyWebpackPlugin to copy files from dist folder to your app's root folder
* Use e.g. HtmlWebpackPlugin to inject the HTML snippet into your app's index.html

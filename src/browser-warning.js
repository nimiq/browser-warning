// written in old fashioned JavaScript to be able to run in old browsers

(function () {

    function isWebApp() {
        var isIOSWebApp = (window.navigator.standalone === true);
        var isChromeWebApp = (window.matchMedia('(display-mode: standalone)').matches);

        return isIOSWebApp || isChromeWebApp;
    }

    function isWebView() {
        if (isWebApp()) {
            return false;
        }

        var userAgent = navigator.userAgent;

        if ((typeof navigator.mediaDevices === 'undefined'
            || typeof navigator.mediaDevices.getUserMedia === 'undefined')
            // Avoid false positives on pages served over http where mediaDevices are disabled
            && (location.protocol === 'https:' || location.hostname === 'localhost')
            // iOS Chrome is a Web View (or at least doesn't support media devices), but still a browser
            && !/CriOS/i.test(userAgent)
            // Outdated browsers don't have mediaDevices even though they're not web views
            && !isBrowserOutdated()
        ) return true;

        var inAppBrowsers = ['FB_IAB', 'Instagram'];

        for (var i = 0; i < inAppBrowsers.length; i++) {
            if (userAgent.indexOf(inAppBrowsers[i]) > -1) {
                return true;
            }
        }

        return false;
    }

    function isBrowserOutdated() {
        if (typeof Symbol === "undefined") return true;
        try {
            eval("class Foo {}");
            eval("var bar = async (x) => x+1");
        } catch (e) {
            return true;
        }
        return isOutdatedIos() || isOutdatedEdge();
    }

    function isOutdatedIos() {
        if (!/iP(hone|od|ad)/.test(navigator.platform)) return false;
        var version = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
        version = [parseInt(version[1], 10), parseInt(version[2], 10), parseInt(version[3] || 0, 10)];
        return version[0] < 11 || (version[0] === 11 && (version[1] <= 2));
    }

    function isOutdatedEdge() {
        // Note that webkit based Edge versions that are compatible have a user agent of Edg instead of Edge
        return navigator.userAgent.indexOf('Edge') !== -1;
    }

    function isChrome() {
        return navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    }

    function isSafari() {
        return (
            /Constructor/.test(window.HTMLElement) ||
            (function (root) {
                return (!root || root.pushNotification).toString() === '[object SafariRemoteNotification]';
            })(window.safari)
        );
    }

    /**
     * Detect if the browser is running in Private Browsing mode
     *
     * @returns {Promise}
     */
    function isPrivateMode() {
        return new Promise(function (resolve) {
            var on = function () { resolve(true) }; // is in private mode
            var off = function () { resolve(false) }; // not private mode
            // Chrome & Opera
            if (window.webkitRequestFileSystem) {
                return void window.webkitRequestFileSystem(0, 0, off, on);
            }
            // Firefox
            if ('MozAppearance' in document.documentElement.style) {
                var db = indexedDB.open(null);
                db.onerror = on;
                db.onsuccess = off;
                return void 0;
            }
            // Safari
            if (isSafari()) {
                try {
                    window.openDatabase(null, null, null, null);
                } catch (_) {
                    return on();
                }
            }
            // IE10+ & Edge
            if (!window.indexedDB && (window.PointerEvent || window.MSPointerEvent)) {
                return on();
            }
            // others
            return off();
        });
    }

    function hasLocalStorage() {
        // taken from MDN
        var storage;
        try {
            storage = window['localStorage'];
            var x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            // return false if the error is a QuotaExceededError and the storage length is 0.
            // If the length is > 0 then we really just exceed the storage limit.
            // If another exception is thrown then probably localStorage is undefined.
            return e instanceof DOMException && (
                    // everything except Firefox
                    e.code === 22 ||
                    // Firefox
                    e.code === 1014 ||
                    // test name field too, because code might not be present
                    // everything except Firefox
                    e.name === 'QuotaExceededError' ||
                    // Firefox
                    e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
                ) &&
                // acknowledge QuotaExceededError only if there's something already stored
                storage.length !== 0;
        }
    }

    function showWarning(warningType) {
        var browserWarningId = 'browser-warning-container';

        // replace the noscript as container by a div
        var $warningNoscript = document.getElementById(browserWarningId);
        var $warningContainer = document.createElement('div');
        $warningContainer.id = browserWarningId;
        $warningContainer.innerHTML = $warningNoscript.textContent;
        $warningNoscript.insertAdjacentElement('beforebegin', $warningContainer);
        $warningNoscript.parentNode.removeChild($warningNoscript);

        // configure warning
        var warning = {
            hasShareButton: true,
            useNativeShare: !!navigator.share,
            shareUrl: location.href
        };
        var hasAlternativeCallToAction = false;
        var shareTarget = 'Chrome, Firefox, Safari or another browser';
        if (warningType === 'web-view') {
            warning.headline = 'Please open the page in your browser';
            warning.message = 'You\'re currently in a so-called in-app browser. '
                + 'They have restricted functionality.';
        } else if (warningType === 'no-local-storage' || warningType === 'private-mode') {
            warning.headline = warningType === 'no-local-storage'
                ? 'Local storage not available'
                : 'Incompatible private browsing mode';
            warning.message = warningType === 'no-local-storage'
                ? 'Local storage is not available. You might be in private browsing mode.'
                : 'This browser does not support opening this page in private browsing mode.';
            warning.useNativeShare = false; // don't want to share to other app, just paste link in non private tab
            shareTarget = 'a normal tab';
        } else {
            warning.headline = 'Unsupported browser';
            warning.message = 'Your browser is not able to run Nimiq. Please update your browser.';
            hasAlternativeCallToAction = true;
        }
        warning.shareInstructions = getShareInstructions(warning.useNativeShare, hasAlternativeCallToAction,
            shareTarget);

        // invoke callback
        if (window.onBrowserWarning) {
            var overwrites = window.onBrowserWarning(warningType, warning);
            if (overwrites) {
                // Simplified Object.assign polyfill
                for (var key in overwrites) {
                    warning[key] = overwrites[key];
                }
            }
        }

        // render warning
        document.getElementById('browser-warning-headline').textContent = warning.headline;
        var $warningMessage = document.getElementById('browser-warning-message');
        $warningMessage.textContent = (warning.message ? warning.message : '')
            + ' ' + (warning.hasShareButton && warning.shareInstructions ? warning.shareInstructions : '');
        if (warning.hasShareButton) {
            $warningMessage.appendChild(createShareButton(warning.shareUrl, warning.useNativeShare));
        }

        // set css class and global variable, so the app can react
        document.body.setAttribute('data-browser-warning', warningType);
        window.hasBrowserWarning = true;
    }

    function getShareInstructions(useNativeShare, hasAlternativeCallToAction, shareTarget) {
        var prefix = hasAlternativeCallToAction
            ? 'Alternatively, '
            : 'Please ';
        var instructions = useNativeShare
            ? 'use the button below and choose to open in '
            : 'copy the link and open it in ';
        return prefix + instructions + shareTarget + '.';
    }

    function createShareButton(shareUrl, useNativeShare) {
        useNativeShare = useNativeShare && !!navigator.share;
        var $button = document.createElement('button');
        $button.className = 'nq-button';
        $button.style.display = 'block'; // declare style here to avoid flash of unstyled content
        $button.style.margin = '5rem auto 2rem';
        $button.textContent = useNativeShare? 'Open in browser' : 'Copy link';
        $button.onclick = function() {
            if (useNativeShare) {
                navigator.share({ url: shareUrl });
            } else {
                $button.className = 'nq-button green';
                setTimeout(function() { $button.className = 'nq-button'; }, 1500);
                if (!copy(shareUrl)) {
                    alert('Copy failed. '
                        + (shareUrl === location.href
                            ? 'Please copy this page\'s URL manually from the address bar.'
                            : 'Please input the following manually in another browser: ' + shareUrl)
                    );
                }
            }
        };
        return $button;
    }

    function copy(text) {
        var element = document.createElement('textarea');
        element.value = text;
        element.setAttribute('readonly', '');
        element.style.contain = 'strict';
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        element.style.fontSize = '12pt'; // Prevent zooming on iOS

        document.body.appendChild(element);
        element.select();
        element.selectionStart = 0; // for iOS
        element.selectionEnd = text.length;

        var isSuccess = false;
        try {
            isSuccess = document.execCommand('copy');
        } catch (e) {}

        element.parentNode.removeChild(element);

        return isSuccess;
    }

    if (isBrowserOutdated()) {
        showWarning('browser-outdated');
    } else if (isWebView()) {
        showWarning('web-view');
    } else if (!hasLocalStorage()) {
        showWarning('no-local-storage');
    } else {
        // detect private browsing
        isPrivateMode().then(function (isPrivate) {
            // Chrome is supported. All other browsers not.
            if (isPrivate && !isChrome()) {
                showWarning('private-mode');
            }
        });
    }

})();

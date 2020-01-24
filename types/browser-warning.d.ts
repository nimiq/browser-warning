declare type BrowserWarningType = 'web-view' | 'browser-outdated' | 'no-local-storage' | 'private-mode';

declare type BrowserWarningConfig = {
    headline: string,
    message: string,
    hasShareButton: boolean,
    shareUrl: string,
    useNativeShare: boolean,
    shareInstructions: string,
};

declare interface Window {
    hasBrowserWarning?: boolean;
    onBrowserWarning?: (type: BrowserWarningType, warning: BrowserWarningConfig) => Partial<BrowserWarningConfig> | void;
}

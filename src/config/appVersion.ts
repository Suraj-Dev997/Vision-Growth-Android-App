/**
 * Keep in sync with native version numbers:
 *   Android → android/app/build.gradle  versionCode / versionName
 *   iOS     → Xcode CURRENT_PROJECT_VERSION / MARKETING_VERSION
 *
 * Server gates:
 *   Android → app_config.android_min_version_code / android_latest_version_code
 *   iOS     → app_config.ios_min_version_code / ios_latest_version_code
 */
export const APP_VERSION_CODE = 1;
export const APP_VERSION_NAME = '1.0';

/** iOS build number (CFBundleVersion). Bump with each App Store / TestFlight upload. */
export const IOS_BUILD_NUMBER = 1;
export const IOS_VERSION_NAME = '1.0';

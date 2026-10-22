import { useWindowDimensions } from 'react-native';
import {
  TABLET_CONTENT_MAX,
  contentWidth,
  isTabletSize,
} from '../utils/layout';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const tablet = isTabletSize(width, height);
  const colW = contentWidth(width, height);
  return {
    windowWidth: width,
    windowHeight: height,
    isTablet: tablet,
    contentWidth: colW,
    /** Style for the centered tablet column — no-op on phones. */
    shellStyle: tablet
      ? ({
          flex: 1,
          width: '100%' as const,
          maxWidth: TABLET_CONTENT_MAX,
          alignSelf: 'center' as const,
        } as const)
      : ({ flex: 1 } as const),
  };
}

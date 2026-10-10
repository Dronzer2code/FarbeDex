import { pickLargestPictureSize } from '../src/capture/pictureSize';

describe('max picture size', () => {
  it('picks the largest WxH by pixel count', () => {
    expect(pickLargestPictureSize(['1920x1080', '4000x3000', '3840x2160', 'Photo'])).toBe('4000x3000');
  });
  it('returns undefined when nothing parses', () => {
    expect(pickLargestPictureSize(['Photo', 'High'])).toBeUndefined();
    expect(pickLargestPictureSize([])).toBeUndefined();
  });
});

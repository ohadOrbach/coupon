import { toIls } from './currency';

describe('toIls', () => {
  it('keeps ILS unchanged', () => {
    expect(toIls(100, 'ILS')).toBe(100);
  });

  it('converts EUR to ILS', () => {
    expect(toIls(50, 'EUR')).toBe(200); // 50 * 4.0
  });

  it('converts USD to ILS', () => {
    expect(toIls(10, 'USD')).toBeCloseTo(37); // 10 * 3.7
  });

  it('treats an unknown currency as ILS (rate 1)', () => {
    expect(toIls(80, 'XYZ')).toBe(80);
  });
});

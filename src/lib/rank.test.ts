import { rankForTotal } from './rank';

describe('rankForTotal', () => {
  it('puppy at zero', () => {
    expect(rankForTotal(0).level).toBe(1);
    expect(rankForTotal(0).name).toBe('גור הקופונים');
  });

  it('puppy just below 300', () => {
    expect(rankForTotal(299).level).toBe(1);
  });

  it('piglet exactly at 300', () => {
    expect(rankForTotal(300).level).toBe(2);
    expect(rankForTotal(300).name).toBe('חזרזירת ההנחות');
  });

  it('piglet just below 1000', () => {
    expect(rankForTotal(999).level).toBe(2);
  });

  it('dragon exactly at 1000', () => {
    expect(rankForTotal(1000).level).toBe(3);
    expect(rankForTotal(1000).name).toBe('הורסת המשפחות');
  });

  it('dragon for large totals', () => {
    expect(rankForTotal(5000).level).toBe(3);
  });
});

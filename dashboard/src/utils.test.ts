import { formatDate, formatPercent, trialDaysLeft } from './utils';

describe('utils', () => {
  it('returns placeholder for missing or invalid dates', () => {
    expect(formatDate()).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('formats percent values', () => {
    expect(formatPercent(0.1234)).toBe('12.3%');
  });

  it('computes remaining trial days from now', () => {
    const now = new Date('2026-05-27T00:00:00.000Z').getTime();
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);

    expect(trialDaysLeft('2026-05-29T00:00:00.000Z')).toBe(2);
    expect(trialDaysLeft('2026-05-26T00:00:00.000Z')).toBe(0);
    expect(trialDaysLeft(null)).toBeNull();
    expect(trialDaysLeft('invalid')).toBeNull();

    dateNowSpy.mockRestore();
  });
});

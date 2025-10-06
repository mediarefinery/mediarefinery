import { isWithinSchedule, overridesDisableAdaptive } from '../../../src/lib/scheduling/scheduler';

describe('scheduler evaluator', () => {
  test('isWithinSchedule returns true when no schedule configured', () => {
    expect(isWithinSchedule({})).toBe(true);
  });

  test('overridesDisableAdaptive respects config value', () => {
    expect(overridesDisableAdaptive({ disableAdaptive: true })).toBe(true);
    expect(overridesDisableAdaptive({ disableAdaptive: false })).toBe(false);
  });
});

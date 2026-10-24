import { describe, it, expect } from 'vitest';
import { hasPermission } from './index';

describe('Role Authorization Logic', () => {
  it('identifies municipal officials as holding administrative privileges', () => {
    expect(hasPermission(['municipal_official'], 'sanitation_worker')).toBe(true);
    expect(hasPermission(['municipal_official'], 'citizen')).toBe(true);
  });

  it('prevents standard citizens from accessing elevated roles', () => {
    expect(hasPermission(['citizen'], 'municipal_official')).toBe(false);
    expect(hasPermission(['citizen'], 'sanitation_worker')).toBe(false);
  });

  it('permits sanitation worker role matches', () => {
    expect(hasPermission(['sanitation_worker'], 'sanitation_worker')).toBe(true);
    expect(hasPermission(['sanitation_worker'], 'municipal_official')).toBe(false);
  });
});

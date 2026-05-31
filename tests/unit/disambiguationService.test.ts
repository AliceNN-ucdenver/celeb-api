import { expect } from 'chai';
import {
  resolveIdentityStatus,
  scoreIdentityConfidence
} from '../../src/services/disambiguationService';

describe('disambiguationService', () => {
  it('returns resolved when confidence is safely above threshold', () => {
    process.env.CELEB_CONFIDENCE_REVIEW_THRESHOLD = '0.72';
    expect(resolveIdentityStatus(0.9)).to.equal('resolved');
  });

  it('returns manual_review_required when confidence is below threshold', () => {
    process.env.CELEB_CONFIDENCE_REVIEW_THRESHOLD = '0.72';
    expect(resolveIdentityStatus(0.5)).to.equal('manual_review_required');
  });

  it('scores identities within 0..1', () => {
    const score = scoreIdentityConfidence('Leonardo', 5, true);
    expect(score).to.be.greaterThanOrEqual(0);
    expect(score).to.be.lessThanOrEqual(1);
  });
});

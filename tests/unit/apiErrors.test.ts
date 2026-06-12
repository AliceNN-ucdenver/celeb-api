import { expect } from 'chai';
import {
  ApiError,
  CelebrityNotFoundError,
  LicenseBlockedError,
  UpstreamDependencyError
} from '../../src/errors/apiErrors';

describe('ApiError subclasses', () => {
  describe('CelebrityNotFoundError', () => {
    it('has statusCode 404, code celebrity_not_found, and message containing the id', () => {
      const err = new CelebrityNotFoundError('nm0000001');
      expect(err.statusCode).to.equal(404);
      expect(err.code).to.equal('celebrity_not_found');
      expect(err.message).to.include('nm0000001');
    });

    it('is an instance of ApiError', () => {
      const err = new CelebrityNotFoundError('nm0000002');
      expect(err).to.be.instanceof(ApiError);
    });
  });

  describe('LicenseBlockedError', () => {
    it('has statusCode 451 and code license_blocked', () => {
      const err = new LicenseBlockedError();
      expect(err.statusCode).to.equal(451);
      expect(err.code).to.equal('license_blocked');
    });

    it('is an instance of ApiError', () => {
      const err = new LicenseBlockedError();
      expect(err).to.be.instanceof(ApiError);
    });
  });

  describe('UpstreamDependencyError', () => {
    it('uses the default message when no argument is supplied', () => {
      const err = new UpstreamDependencyError();
      expect(err.statusCode).to.equal(503);
      expect(err.code).to.equal('upstream_unavailable');
      expect(err.message).to.equal('Upstream dependency unavailable');
    });

    it('uses a custom message when one is provided', () => {
      const err = new UpstreamDependencyError('IMDB service down');
      expect(err.statusCode).to.equal(503);
      expect(err.code).to.equal('upstream_unavailable');
      expect(err.message).to.equal('IMDB service down');
    });

    it('is an instance of ApiError', () => {
      const err = new UpstreamDependencyError();
      expect(err).to.be.instanceof(ApiError);
    });
  });
});

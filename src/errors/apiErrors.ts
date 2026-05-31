export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class CelebrityNotFoundError extends ApiError {
  constructor(id: string) {
    super(404, 'celebrity_not_found', `Celebrity ${id} was not found`);
  }
}

export class LicenseBlockedError extends ApiError {
  constructor() {
    super(451, 'license_blocked', 'Policy denied field release');
  }
}

export class UpstreamDependencyError extends ApiError {
  constructor(message = 'Upstream dependency unavailable') {
    super(503, 'upstream_unavailable', message);
  }
}

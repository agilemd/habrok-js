/* global describe, it, beforeEach, afterEach */
/* eslint-disable global-require, strict */

'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');
const uuid = require('uuid-with-v6');

describe('Habrok#request', () => {
  const body = { x: uuid.v4() };
  const res = { statusCode: 200, headers: { z: uuid.v4() } };

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(null, res, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')();
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('invokes requestjs with a valid method and uri', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.method).to.equal(method);
      expect(req.uri).to.equal(uri);
    });
  });

  it('sets default timeout', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.timeout).to.equal(30000);
    });
  });

  it('overrides default timeout', () => {
    const timeout = Date.now();
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri, timeout }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.timeout).to.equal(timeout);
    });
  });

  it('invokes requestjs with default headers', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.headers['User-Agent']).to.match(/^habrok/);
      expect(req.headers).to.have.property('X-Node-Platform');
      expect(req.headers).to.have.property('X-Node-Version');
    });
  });

  it('invokes requestjs with default json parameter', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.json).to.equal(true);
    });
  });

  it('resolves to the expected response format', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri }).then((out) => {
      expect(out).to.deep.equal(Object.assign({}, res, { body }));
    });
  });
});

describe('Habrok#request with disabled custom headers', () => {
  const body = { x: uuid.v4() };
  const res = { statusCode: 200, headers: { z: uuid.v4() } };

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(null, res, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')({ disableCustomHeaders: true });
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('invokes requestjs without default headers', () => {
    const headers = { z: uuid.v4() };
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ headers, method, uri }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.headers).to.not.have.property('User-Agent');
      expect(req.headers).to.not.have.property('X-Node-Platform');
      expect(req.headers).to.not.have.property('X-Node-Version');
    });
  });

  it('invokes requestjs with invocation headers', () => {
    const headers = { z: uuid.v4() };
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ headers, method, uri }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.headers).to.deep.equal(headers);
    });
  });
});

describe('Habrok#request with disabled JSON parsing', () => {
  const body = `<x>${uuid.v4()}</x>`;
  const res = { statusCode: 200, headers: { z: uuid.v4() } };

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(null, res, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')({ disableAutomaticJson: true });
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('invokes requestjs without json parameter', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.json).to.equal(undefined);
    });
  });

  it('resolves to the expected response format', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri }).then((out) => {
      expect(out).to.deep.equal(Object.assign({}, res, { body }));
    });
  });
});

describe('Habrok#request with a retried HTTP error (429)', () => {
  const body = { x: uuid.v4() };
  const res = { statusCode: 429, headers: { z: uuid.v4() } };

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(null, res, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')({ retryMinDelay: 0 });
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('retries request up to retry limit', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      expect(request.callCount).to.equal(habrok.RETRIES);
    });
  });
  it('onRetry is called for every retry', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;
    const onRetry = sinon.stub();

    return habrok.request({ method, uri }, { onRetry })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      expect(onRetry.callCount).to.equal(habrok.RETRIES - 1);
    });
  });


  it('onRetry is called for every retry', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;
    const onRetry = sinon.stub();

    return habrok.request({ method, uri }, { onRetry })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      expect(onRetry.callCount).to.equal(habrok.RETRIES - 1);
    });
  });

  it('rejects with a Boom#tooManyRequests error', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch((err) => {
      expect(err).to.match(/Too Many Requests/);
      expect(err.isBoom).to.equal(true);
      expect(err.output.statusCode).to.equal(429);
    });
  });

  it('rejected Boom#tooManyRequests contains response body', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch((err) => {
      expect(err.data).to.deep.equal(body);
    });
  });

  it('rejects within expected elapsed time', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    const start = Date.now();

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      // [KE] rough heuristic; empirically the observed elapsed time is between 9-10ms;
      //      this test is sufficient to demonstrate elapsed time is substantially below default
      const observed = Date.now() - start;

      expect(observed).to.be.below(20);
    });
  });
});

describe('Habrok#request with a retried HTTP error (429) and max wait', () => {
  const body = { x: uuid.v4() };
  const res = { statusCode: 429, headers: { z: uuid.v4() } };

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(null, res, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')({ retryMaxDelay: 0 });
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('retries request up to retry limit', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      expect(request.callCount).to.equal(habrok.RETRIES);
    });
  });

  it('calls debugRequest when provided with correct parameters', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;
    const debugRequest = sinon.stub();

    return habrok.request({ method, uri }, { debugRequest })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      expect(debugRequest.callCount).to.equal(1);

      const args = debugRequest.getCall(0).args;
      expect(args[0].attempts).to.equal(habrok.RETRIES);
    });
  });

  it('rejects within expected elapsed time', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    const start = Date.now();

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      // [KE] rough heuristic; empirically the observed elapsed time is between 9-10ms;
      //      this test is sufficient to demonstrate elapsed time is substantially below default
      const observed = Date.now() - start;

      expect(observed).to.be.below(20);
    });
  });
});

describe('Habrok#request with a non-retried HTTP error (500)', () => {
  const body = { x: uuid.v4() };
  const res = { statusCode: 500, headers: { z: uuid.v4() } };

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(null, res, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')({ retryMinDelay: 1 });
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('does not retry request', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      expect(request.callCount).to.equal(1);
    });
  });

  it('rejects with a Boom#badImplementation error', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch((err) => {
      expect(err).to.match(/Internal Server Error/);
      expect(err.isBoom).to.equal(true);
      expect(err.output.statusCode).to.equal(500);
    });
  });

  it('rejected Boom#badImplementation contains response body', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch((err) => {
      expect(err.data).to.deep.equal(body);
    });
  });
});

describe('Habrok#request with a retried ECONNRESET error', () => {
  const body = { x: uuid.v4() };
  const requestError = new Error('ECONNRESET');
  const res = {};

  requestError.code = 'ECONNRESET';

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(requestError, res, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')({ retryMinDelay: 0 });
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('retries request up to retry limit', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      expect(request.callCount).to.equal(habrok.RETRIES);
    });
  });

  it('rejects with the request error', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch((err) => {
      expect(err).to.match(/ECONNRESET/);
      expect(err.isBoom).to.equal(undefined);
    });
  });

  it('rejects within expected elapsed time', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    const start = Date.now();

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      // [KE] rough heuristic; empirically the observed elapsed time is between 9-10ms;
      //      this test is sufficient to demonstrate elapsed time is substantially below default
      const observed = Date.now() - start;

      expect(observed).to.be.below(20);
    });
  });
});

describe('Habrok#request with request.js error', () => {
  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(new Error('invalid input'), {}, {});
    mockery.registerMock('request', request);

    habrok = require('../../index')();
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('does not retry request', () => {
    const method = undefined;
    const uri = undefined;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      expect(request.callCount).to.equal(1);
    });
  });

  it('rejects with a generic error', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch((err) => {
      expect(err).to.match(/invalid input/);
      expect(err.isBoom).to.equal(undefined);
    });
  });
});

describe('Habrok#request with 2 failed requests, then success', () => {
  const body = { x: uuid.v4() };
  const firstErrorResponse = { statusCode: 502, headers: { z: uuid.v4() } };
  const secondErrorResponse = { statusCode: 503, headers: { z: uuid.v4() } };
  const goodResponse = { statusCode: 200, headers: { z: uuid.v4() } };

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub();
    request.onFirstCall().yields(null, firstErrorResponse, body)
      .onSecondCall().yields(null, secondErrorResponse, body)
      .onThirdCall().yields(null, goodResponse, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')({ retryMinDelay: 0 });
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('stop retrying after success', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => {
      expect(request.callCount).to.equal(3);
    });
  });

  it('debugRequest returns 3 attempts', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;
    const debugRequest = sinon.stub();

    return habrok.request({ method, uri }, { debugRequest })
    .then(() => {
      expect(debugRequest.callCount).to.equal(1);
      const args = debugRequest.getCall(0).args;
      expect(args[0].attempts).to.equal(3);
    });
  });

  it('onRetry is passed the correct args', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;
    const onRetry = sinon.stub();

    return habrok.request({ method, uri }, { onRetry })
    .then(() => {
      expect(onRetry.callCount).to.equal(2);

      const firstCallArgs = onRetry.getCall(0).args;
      expect(firstCallArgs[0]).to.equal(firstErrorResponse.statusCode);
      const secondCallArgs = onRetry.getCall(1).args;
      expect(secondCallArgs[0]).to.equal(secondErrorResponse.statusCode);
    });
  });
});

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  safeLogger,
  Logger
} from '../../src';

chai.use(chaiAsPromised);
let expect = chai.expect;

describe('safeLogger', () => {
  describe('logOrNothing', () => {

    it('should execute logger function', () => {
      let called = false;
      const logger = {
        info: () => {
          called = true;
        }
      } as any as Logger;

      const result = () => safeLogger(logger).info('foo');
      expect(result).not.to.throw();
      return expect(called).to.be.true;
    });

    it('should execute logger function with this bounded correctly', () => {
      let called = false;
      const logger: any = {
        _test: () => {
          called = true;
        },
        info: function () {
          this._test();
        }
      } as any as Logger;

      const result = () => safeLogger(logger).info('foo');
      expect(result).not.to.throw();
      return expect(called).to.be.true;
    });

    it('should not throw, if logger undefined', () => {
      const result = () => safeLogger(undefined).info('foo');
      return expect(result).not.to.throw();
    });

    it('should not throw, if logger does not fulfill Logger interface', () => {
      const result = () => safeLogger({} as Logger).info('foo');
      return expect(result).not.to.throw();
    });
  });
});

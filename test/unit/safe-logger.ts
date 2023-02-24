import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  safeLogger,
  Logger
} from '../../src';

chai.use(chaiAsPromised);
const expect = chai.expect;

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
      const logger: Logger & {test: () => void, called: boolean } = {
        called: false,

        test() {
          this.called = true;
        },
        info() {
          this.test();
        },
        debug: () => undefined,
        error: () => undefined,
        fatal: () => undefined,
        trace: () => undefined,
        warn: () => undefined
      };

      const result = () => safeLogger(logger).info('foo');
      expect(result).not.to.throw();
      return expect(logger.called).to.be.true;
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

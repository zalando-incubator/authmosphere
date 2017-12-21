import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { logOrNothing } from '../../src';
import { Logger } from '../../src/types';

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
      };

      const result = () => logOrNothing.info('foo', logger);
      expect(result).not.to.throw();
      return expect(called).to.be.true;
    });

    it('should not throw, if logger undefined', () => {
      const result = () => logOrNothing.info('foo', undefined);
      return expect(result).not.to.throw();
    });

    it('should not throw, if logger does not fulfill Logger interface', () => {
      const result = () => logOrNothing.info('foo', {} as Logger);
      return expect(result).not.to.throw();
    });
  });
});

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { getFileData } from '../../src/utils';

chai.use(chaiAsPromised);
const expect = chai.expect;

  describe('getFileData', () => {
    it('should ignore tailing / in filepath', () => {
      const promise = Promise.all([
        getFileData('test/unit/credentials', 'user.json'),
        getFileData('test/unit/credentials/', 'user.json')
      ])
      .then((credentials) => {
        return credentials[0] === credentials[1];
        });
      return expect(promise).to.become(true);
    });

    it('should ignore tailing / in filepath', () => {
      const promise = getFileData('test/unit/credentials', 'foo.json');
      return expect(promise).to.be.rejected;
    });
  });

import { strictEqual as equal } from 'node:assert';
import { describe, it } from 'node:test';

import { MuhitService } from '../muhit';
import { IProcessEnv } from '../types';
import { catchErrMsg } from './utils';

describe('MuhitService', () => {

  interface EnvType1 extends IProcessEnv {
    KEY_STR_1    ?: string;
    KEY_STR_NIL_1?: string;
    KEY_STR_NIL_2?: string;

    KEY_INT_1    ?: string;
    KEY_INT_NIL_1?: string;
    KEY_INT_NIL_2?: string;

    KEY_FLOAT_1    ?: string;
    KEY_FLOAT_NIL_1?: string;
    KEY_FLOAT_NIL_2?: string;

    KEY_BOOL_TRUE_1     ?: string;
    KEY_BOOL_TRUE_2     ?: string;
    KEY_BOOL_TRUE_3     ?: string;
    KEY_BOOL_TRUE_4     ?: string;
    KEY_BOOL_FALSE_1    ?: string;
    KEY_BOOL_FALSE_NIL_1?: string;
    KEY_BOOL_FALSE_NIL_2?: string;

    KEY_URL_HTTPS  ?: string;
    KEY_URL_INVALID?: string;
    KEY_URL_NIL_1  ?: string;
    KEY_URL_NIL_2  ?: string;

    KEY_PORT_1        ?: string;
    KEY_PORT_INVALID_1?: string;
    KEY_PORT_INVALID_2?: string;

    KEY_CSV_1          ?: string;
    KEY_CSV_2_SEMICOLON?: string;
  }

  const penv: EnvType1 = {
    KEY_STR_1           : 'abc',
    KEY_STR_NIL_1       : '',
    //KEY_STR_NIL_2       : undefined,
    KEY_INT_1           : '1',
    KEY_INT_NIL_1       : '',
    //KEY_INT_NIL_2       : undefined,
    KEY_FLOAT_1         : '3.14',
    KEY_FLOAT_INVALID_1 : '',
    KEY_FLOAT_INVALID_2 : 'invalid',
    KEY_FLOAT_INVALID_3 : 'a123',
    KEY_BOOL_TRUE_1     : 'true',
    KEY_BOOL_TRUE_2     : 'on',
    KEY_BOOL_TRUE_3     : 'yes',
    KEY_BOOL_TRUE_4     : '1',
    KEY_BOOL_FALSE_1    : 'false',
    KEY_BOOL_FALSE_NIL_1: '',
    //KEY_BOOL_FALSE_NIL_2: undefined,
    KEY_URL_HTTPS       : 'https://example.com:8080/path1?param1=value1',
    KEY_URL_INVALID     : 'http',
    KEY_URL_NIL_1       : '',
    //KEY_URL_NIL_2       : undefined,
    KEY_PORT_1        : '8080',
    KEY_PORT_INVALID_1: 'invalid',
    KEY_PORT_INVALID_2: '98765',
    KEY_CSV_1          : 'a,b,c',
    KEY_CSV_2_SEMICOLON: 'a,b;c',
  };

  const ENV_KEY_COUNT = 22;

  describe('default usage', () => {
    const env = new MuhitService<EnvType1>(penv);

    it('should return string of existing key correctly', () => {
      equal(env.str('KEY_STR_1', ''), penv.KEY_STR_1);
      equal(env.strRequired('KEY_STR_1'), penv.KEY_STR_1);
    });

    it('should return string of nonexisting key NOT using default', () => {
      equal(env.str('KEY_STR_NIL_1', 'def'), '');
      equal(env.str('KEY_STR_NIL_2', 'ghi'), 'ghi');
    });

    it('should throw error for nonexisting key', () => {
      equal(catchErrMsg(() => env.strRequired('KEY_STR_999')), 'Env key "KEY_STR_999" is missing or empty');
      equal(catchErrMsg(() => env.intRequired('KEY_INT_999')), 'Env key "KEY_INT_999" is missing or empty');
      equal(catchErrMsg(() => env.floatRequired('KEY_FLOAT_999')), 'Env key "KEY_FLOAT_999" is missing or empty');
      equal(catchErrMsg(() => env.boolRequired('KEY_BOOL_999')), 'Env key "KEY_BOOL_999" is missing or empty');
      equal(catchErrMsg(() => env.urlRequired('KEY_URL_999')), 'Env key "KEY_URL_999" is missing or empty');
      equal(catchErrMsg(() => env.portRequired('KEY_PORT_999')), 'Env key "KEY_PORT_999" is missing or empty');
    });

    it('should return integer of existing key correctly', () => {
      equal(env.int('KEY_INT_1', 0), 1);
      equal(env.intRequired('KEY_INT_1'), 1);
    });

    it('should return integer of empty key using default', () => {
      equal(env.int('KEY_INT_MISSING_999', 999), 999);
    });

    it('should return float of existing key correctly', () => {
      equal(env.float('KEY_FLOAT_1', 0), 3.14);
      equal(env.floatRequired('KEY_FLOAT_1'), 3.14);
    });

    it('should return float of missing key using default', () => {
      equal(env.float('KEY_FLOAT_MISSING_999', 0), 0);
    });

    it('should throw error for invalid or missing float settings', () => {
      equal(catchErrMsg(() => env.float('KEY_FLOAT_INVALID_1', 0)), 'Env key "KEY_FLOAT_INVALID_1" is not a valid float: ""');
      equal(catchErrMsg(() => env.float('KEY_FLOAT_INVALID_2', 0)), 'Env key "KEY_FLOAT_INVALID_2" is not a valid float: "invalid"');
      equal(catchErrMsg(() => env.float('KEY_FLOAT_INVALID_3', 0)), 'Env key "KEY_FLOAT_INVALID_3" is not a valid float: "a123"');
    });

    it('should return boolean of existing key correctly', () => {
      equal(env.bool('KEY_BOOL_TRUE_1', false), true);
      equal(env.bool('KEY_BOOL_TRUE_2', false), true);
      equal(env.bool('KEY_BOOL_TRUE_3', false), true);
      equal(env.bool('KEY_BOOL_TRUE_4', false), true);
      equal(env.bool('KEY_BOOL_FALSE_1', true), false);
    });

    it('should return boolean of empty key NOT using default', () => {
      equal(env.bool('KEY_BOOL_FALSE_NIL_1', true), false);
      equal(env.bool('KEY_BOOL_FALSE_NIL_2', false), false);
    });

    it('should return URL of existing key correctly', () => {
      const url = env.url('KEY_URL_HTTPS', 'http://example.com');
      equal(url instanceof URL, true);
      if (url) {
        equal(url.protocol, 'https:');
        equal(url.host, 'example.com:8080');
        equal(url.hostname, 'example.com');
        equal(url.port, '8080');
        equal(url.pathname, '/path1');
      }
    });

    it('should return null for invalid URL key', () => {
      const url = env.url('KEY_URL_INVALID', '');
      equal(url, null);
    });

    it('should return URL of empty key NOT using default', () => {
      const url = env.url('KEY_URL_NIL_1', 'http://example.com');
      equal(url, null);
    });

    it('should return port', () => {
      const port = env.port('KEY_PORT_1', 0);
      equal(port, 8080);
    });

    it('should throw error for missing port key', () => {
      equal(catchErrMsg(() => env.port('KEY_PORT_MISSING_999', 0)), 'Env key "KEY_PORT_MISSING_999" is not a valid port number: "0"');
    });

    it('should throw error for invalid port keys', () => {
      equal(catchErrMsg(() => env.port('KEY_PORT_INVALID_1', -1)), 'Env key "KEY_PORT_INVALID_1" is not a valid integer: "invalid"');
      equal(catchErrMsg(() => env.port('KEY_PORT_INVALID_2', -1)), 'Env key "KEY_PORT_INVALID_2" is not a valid port number: "98765"');
    });

    it('should return CSV array of existing key correctly', () => {
      const csv = env.csv('KEY_CSV_1', '');
      equal(Array.isArray(csv), true);
      equal(csv.length, 3);
      equal(csv[0], 'a');
      equal(csv[1], 'b');
      equal(csv[2], 'c');
  });

    it('should return CSV array of existing key with custom separator', () => {
      const csv = env.csv('KEY_CSV_2_SEMICOLON', '', ';');
      equal(Array.isArray(csv), true);
      equal(csv.length, 2);
      equal(csv[0], 'a,b');
      equal(csv[1], 'c');
    });

    it('should throw error for missing CSV key', () => {
      equal(catchErrMsg(() => env.csvRequired('KEY_CSV_MISSING_999', '')), 'Env key "KEY_CSV_MISSING_999" is missing or empty');
    });
  });

  describe('keyPrefix KEY_', () => {
    const env = new MuhitService<EnvType1>(penv, { keyPrefix: 'KEY_' });
    
    it('should use a smaller env settings object', () => {
      equal(Object.keys(env.penv).length, ENV_KEY_COUNT);
    });

    it('should return string of existing key correctly', () => {
      equal(env.str('STR_1', ''), penv.KEY_STR_1);
    });

    it('should return new env service with additional prefix BOOL_', () => {
      const env2 = env.usePrefix('BOOL_');
      equal(env2.str('TRUE_1', ''), penv.KEY_BOOL_TRUE_1);
      equal(Object.keys(env2.penv).length, 6);
    });
  });

  describe('proxy utility property', () => {
    const env = new MuhitService<EnvType1>(penv);

    it('should return string of existing key correctly', () => {
      equal(env.str('KEY_STR_1', ''), penv.KEY_STR_1);
    });

    it('should return string of existing key correctly', () => {
      equal(env.proxy.KEY_STR_1, penv.KEY_STR_1);
    });

    it('should return empty string of nonexisting key', () => {
      equal(env.proxy.SOMETHING, '');
    });

  });

  describe('filterEnv utility function', () => {
    const env = new MuhitService<EnvType1>(penv);
    it('should return a new env object with filtered keys', () => {
      const settings = env.filter(penv); // check without keyPrefix
      equal(Object.keys(settings).length, Object.keys(penv).length);
    })
  });

});

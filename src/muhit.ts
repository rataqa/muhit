import { IMuhitService, IMuhitServiceOptions, IObjectWithStrings, IProcessEnv } from './types';
import { filterEnv, filterEnvAndRemoveKeyPrefix } from './utils';

const TRUTHY = ['true', '1', 'yes', 'on', 'Y'];

export class MuhitService<TPenv extends IProcessEnv = IProcessEnv, TKey = keyof TPenv> implements IMuhitService<TPenv, TKey> {

  constructor(
    public penv: TPenv,
    public options: IMuhitServiceOptions = {},
  ) {
    this.options = { keyPrefix: '', ...options };
    this.penv = this.filter(penv, this.options.keyPrefix) as TPenv; // pretending
  }

  filter(penv: IProcessEnv, keyPrefix = ''): IProcessEnv {
    return filterEnv(penv, keyPrefix, false);
  }

  _key(key: TKey): string {
    return `${this.options.keyPrefix}${String(key)}`;
  }

  /**
   * This proxy object is pretending to be an object of type Required<TPenv>.
   * It is expected to help using a pre-defined type for the environment settings directly.
   * Accessing keys will give you a string, even if the key does not exist.
   */
  get proxy(): Required<TPenv> {
    const that = this;
    return new Proxy(that as unknown as Required<TPenv>, {
      get: (_target, prop) => {
        return that.str(prop as TKey, '');
      },
    });
  }

  strRequired(key: TKey): string {
    const val = this.str(key, '');
    if (val.trim() === '') {
      throw new Error(`Env key "${this._key(key)}" is missing or empty`);
    }
    return val;
  }

  str(key: TKey, defaultValue: string = ''): string {
    let result = defaultValue;
    const fullKey = this._key(key);
    if (fullKey in this.penv) { // not undefined
      const val = this.penv[fullKey];
      result = String(val);
    }
    return result;
  }

  _validInt(val: string, fullKey: string): number {
    const i = Number.parseInt(val);
    if (Number.isNaN(i)) {
      throw new Error(`Env key "${fullKey}" is not a valid integer: "${val}"`);
    }
    return i;
  }

  intRequired(key: TKey): number {
    const val = this.strRequired(key);
    return this._validInt(val, this._key(key));
  }

  int(key: TKey, defaultValue: number): number {
    const val = this.str(key, String(defaultValue));
    return this._validInt(val, this._key(key));
  }

  _validFloat(val: string, fullKey: string): number {
    const f = Number.parseFloat(val);
    if (Number.isNaN(f)) {
      throw new Error(`Env key "${fullKey}" is not a valid float: "${val}"`);
    }
    return f;
  }

  floatRequired(key: TKey): number {
    const val = this.strRequired(key);
    return this._validFloat(val, this._key(key));
  }

  float(key: TKey, defaultValue: number): number {
    const val = this.str(key, String(defaultValue));
    return this._validFloat(val, this._key(key));
  }

  boolRequired(key: TKey): boolean {
    const val = this.strRequired(key);
    return TRUTHY.includes(val.toLowerCase());
  }

  bool(key: TKey, defaultValue: boolean): boolean {
    const defStr = defaultValue ? 'true' : 'false';
    const val = this.str(key, defStr);
    return TRUTHY.includes(val.toLowerCase());
  }

  csvRequired(key: TKey, sep = ','): string[] {
    const val = this.strRequired(key);
    return val.split(sep).map(s => s.trim());
  }

  /**
   * BASIC CSV parsing, does not support quoted values with separators inside.
   * User csv-parse or similar library for more complex cases.
   */
  csv(key: TKey, defaultValue: string, sep = ','): string[] {
    const val = this.str(key, defaultValue);
    return val.split(sep).map(s => s.trim());
  }

  urlRequired(key: TKey): URL {
    const url = this.url(key, '');
    if (!url) {
      throw new Error(`Env key "${this._key(key)}" is missing or empty`);
    }
    return url;
  }

  url(key: TKey, defaultValue: string): URL | null {
    const val = this.str(key, defaultValue);
    try {
      return val ? new URL(val) : null;
    } catch (err) {
      return null;
    }
  }

  _validPort(port: number, fullKey: string): number {
    if (port <= 0 || port > 65535) {
      throw new Error(`Env key "${fullKey}" is not a valid port number: "${port}"`);
    }
    return port;
  }

  port(key: TKey, defaultValue: number): number {
    const port = this.int(key, defaultValue);
    return this._validPort(port, this._key(key));
  }

  portRequired(key: TKey): number {
    const port = this.intRequired(key);
    return this._validPort(port, this._key(key));
  }

  usePrefix(keyPrefixIn: string): IMuhitService<TPenv> {
    const keyPrefix = `${this.options.keyPrefix}${keyPrefixIn}`;
    return new MuhitService<TPenv>(this.penv, { keyPrefix });
  }

  loopForEnv<T = any>(
    counterKey: TKey,
    indexKeyPrefix: string,
    envHandler: (env: IMuhitService, index: number, keyPrefix: string) => T,
    indexKeyGlue = '_',
  ): Array<T> {
    const list: Array<T> = [];

    const count = this.int(counterKey, 0);
    for (let i = 1; i <= count; i++) {
      const keyPrefix = `${indexKeyPrefix}${i}${indexKeyGlue}`;
      const env = this.usePrefix(keyPrefix);
      const settings = envHandler(env, i, keyPrefix) as T;
      list.push(settings); // pretending but it's ok
    }

    return list;
  }

  loopGetEnvSettings(counterKey: TKey, indexKeyPrefix: string, indexKeyGlue = '_'): Array<IObjectWithStrings> {
    return this.loopForEnv<IObjectWithStrings>(
      counterKey,
      indexKeyPrefix,
      (env, _idx, keyPrefix) => filterEnvAndRemoveKeyPrefix(env.penv, keyPrefix) as IObjectWithStrings,
      indexKeyGlue,
    );
  }
}

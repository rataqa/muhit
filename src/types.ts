
export interface IMuhitService<TPenv extends IProcessEnv = IProcessEnv, TKey = keyof TPenv> {
  penv: TPenv;
  options: IMuhitServiceOptions;

  str(key: TKey, defaultValue: string): string;
  strRequired(key: TKey): string;

  int(key: TKey, defaultValue: number): number;
  intRequired(key: TKey): number;

  float(key: TKey, defaultValue: number): number;
  floatRequired(key: TKey): number;

  bool(key: TKey, defaultValue: boolean): boolean;
  boolRequired(key: TKey): boolean;

  url(key: TKey, defaultValue: string): URL | null;
  urlRequired(key: TKey): URL;

  port(key: TKey, defaultValue: number): number;
  portRequired(key: TKey): number;

  csv(key: TKey, defaultValue: string, sep?: string): string[];
  csvRequired(key: TKey, sep?: string): string[];

  usePrefix(keyPrefix: string): IMuhitService;

  filter(penv: IProcessEnv, keyPrefix: string): Partial<IProcessEnv>;

  loopForEnv<T = any>(
    counterKey: TKey,
    indexKeyPrefix: string,
    envHandler: (env: IMuhitService, index: number, keyPrefix: string) => T,
    indexKeyGlue?: string, // defaults to '_'
  ): T[];

  loopGetEnvSettings(
    counterKey: TKey,
    indexKeyPrefix: string,
    indexKeyGlue?: string, // defaults to '_'
  ): Array<IObjectWithStrings>;
}

export type IProcessEnv = NodeJS.ProcessEnv; // alias for better readability

export type IObjectWithStrings = Record<string, string>;

export interface IMuhitServiceOptions {
  /**
   * For creating a namespaced environment service.
   * @example 'MYAPP_' to use only keys that start with 'MYAPP_'.
   */
  keyPrefix?: string;
}

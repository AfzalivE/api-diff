import * as _ from 'lodash';
import * as fs from 'fs';
import * as hjson from 'hjson';

export const { API_DIFF_CONFIG_FILE } = process.env;
const noConfigFile = !API_DIFF_CONFIG_FILE;

export type ConfigHostEntry = {
  host: string;
  aliases?: string[];
  protocol?: 'http' | 'https';
  takesArg?: boolean;
  keyEnv?: string;
  keyType?: string;
};

export type Config = {
  name: string;
  authStyle?: 'header' | 'param';
  authParam?: string;
  keyTypes?: string[];
  hosts?: Record<string, ConfigHostEntry>;
};

if (!noConfigFile && !fs.existsSync(API_DIFF_CONFIG_FILE)) {
  throw new Error(`${API_DIFF_CONFIG_FILE} missing`);
}
const config = hjson.parse(noConfigFile ? '' : fs.readFileSync(API_DIFF_CONFIG_FILE).toString()) as Config;
_.forEach(config.hosts || {}, (hostEntry, hostEntryKey) => {
  // eslint-disable-next-line no-param-reassign
  hostEntry.keyEnv = hostEntry.keyEnv || hostEntryKey;
});
export default config;

import { strictEqual as equal } from 'node:assert';
import { describe, it } from 'node:test';

import { MuhitService } from '../muhit';
import { IProcessEnv } from '../types';
import { filterEnvAndRemoveKeyPrefix } from '../utils';

describe('MuhitService with loops', () => {

  interface EnvQueueSettings extends IProcessEnv {
    QUEUES      ?: string;

    QUEUE_1_URL ?: string;
    QUEUE_1_NAME?: string;

    QUEUE_2_URL ?: string;
    QUEUE_2_NAME?: string;
  }

  interface QueueSettingRow {
    index: number;
    url  : string;
    name : string;
  }

  const penv: EnvQueueSettings = {
    QUEUES      : '2',

    QUEUE_1_URL : 'amqp://localhost:111',
    QUEUE_1_NAME: 'queue1',

    QUEUE_2_URL : 'amqp://localhost:222',
    QUEUE_2_NAME: 'queue2',
  };

  const env = new MuhitService<EnvQueueSettings>(penv);

  it('should loop for env with handler', () => {
    const queues = env.loopForEnv<QueueSettingRow>('QUEUES', 'QUEUE_', (it, index, _keyPrefix) => {
      return {
        index,
        url : it.str('URL', ''),
        name: it.str('NAME', ''),
      };
    });
    equal(queues.length, 2);

    equal(queues[0]?.index, 1);
    equal(queues[0]?.url, 'amqp://localhost:111');
    equal(queues[0]?.name, 'queue1');

    equal(queues[1]?.index, 2);
    equal(queues[1]?.url, 'amqp://localhost:222');
    equal(queues[1]?.name, 'queue2');
  });

  it('should loop for raw env settings', () => {
    const queues = env.loopGetEnvSettings('QUEUES', 'QUEUE_');

    equal(queues.length, 2);

    equal(queues[0]?.URL, 'amqp://localhost:111');
    equal(queues[0]?.NAME, 'queue1');

    equal(queues[1]?.URL, 'amqp://localhost:222');
    equal(queues[1]?.NAME, 'queue2');
  });

  it('should create a nested env service with a prefix', () => {
    const envNested = env.usePrefix('QUEUE_1_');
    equal(envNested.str('URL', ''), 'amqp://localhost:111');
    equal(envNested.str('NAME', ''), 'queue1');
  });

  it('should filter env settings with a prefix', () => {
    const nested = filterEnvAndRemoveKeyPrefix(penv, 'QUEUE_1_'); // removing empty prefix does nothing
    equal(nested.URL, 'amqp://localhost:111');
    equal(nested.NAME, 'queue1');
  });

});

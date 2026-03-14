import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import { randomInt, randomUUID } from 'node:crypto';

import { makeAxiosFactory } from '@rataqa/jalb';
import { makeLogger } from '@rataqa/sijil';
import { IRequest, IResponse, MyEnvSettings } from './types';
import { makeServiceA } from './service';

dotenv.config();

const app = express();

const env = new MyEnvSettings(process.env);
const config = env.config();

const appInfo = { appName: 'mock-app', appVersion: '1.2.3' };

const logger = makeLogger('pino', appInfo, { level: config.logger.level });

const exampleDotCom = makeAxiosFactory(config.serviceA.baseURL, { headers: config.serviceA.headers }, logger.defaultLogger);

const serviceA = makeServiceA(exampleDotCom);

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  const t0 = new Date();

  const correlation_id = req.get('x-correlation-id') || randomUUID();
  res.locals.ctx = {
    t0,
    correlation_id,
  };

  const rl = logger.makeLoggerPerRequest({ correlation_id });

  const { method, url, query, headers, body } = req;
  rl.info('New request', { method, url, query, headers, body });

  res.locals.reqLogger = rl;
  next();
});

app.get('/', (_req: Request, res: Response) => {
  res.json({ data: appInfo, ts: new Date() });
});

app.post('/', async (req: IRequest, res: IResponse) => {
  const { ctx, reqLogger } = res.locals;
  const { lat = randomInt(100), lon = randomInt(100) } = req.body;
  reqLogger.info('Handling request for root path');

  const api = serviceA.apiPerRequest(ctx, reqLogger);
  const result = await api.homePage(lat, lon);

  res.send(result);
});

app.listen(config.http.port, () => {
  logger.defaultLogger.info('Server is running on port ' + config.http.port);
});

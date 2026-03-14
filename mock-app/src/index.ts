import express, { Request, Response, NextFunction } from 'express';
import { randomInt, randomUUID } from 'node:crypto';
import { IAxiosFactory, makeAxiosFactory } from '@rataqa/jalb';
import { makeLogger, type IBasicLogger } from '@rataqa/sijil';

const app = express();

const appInfo = { appName: 'mock-app', appVersion: '1.2.3' };

const logger = makeLogger('pino', appInfo, { level: 'info' });

const exampleDotCom = makeAxiosFactory('http://example.com', { headers: { 'x-api-key': '12345' } });

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

app.listen(3000, () => {
  logger.defaultLogger.info('Server is running on port 3000');
});

interface IInputToGet {
  lat: number;
  lon: number;
}

type IRequest = Request<any, any, IInputToGet>;

type IResponse<TBody = any> = Response<TBody, IResLocals>;

interface IResLocals {
  ctx: IAppCtx;
  reqLogger: IBasicLogger;
}

interface IAppCtx {
  t0: Date;
  correlation_id: string;
}

function makeServiceA(ax: IAxiosFactory) {

  function apiPerRequest(ctx: IAppCtx, rl: IBasicLogger) {

    const http = ax.makeAxiosPerRequest({ 'x-correlation-id': ctx.correlation_id }, rl);

    async function homePage(lat: number, lon: number) {
      rl.info('homePage()', { lat, lon });
      const result = await http.get('/');

      return result.data;
    }

    return {
      http,
      homePage,
    };
  }

  return {
    apiPerRequest,
  };
}

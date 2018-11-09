import v8 = require('v8');

import Koa = require('koa');
import { SwitchBox } from '../queue/switch_box';

let g_switchBox : SwitchBox | null = null;
export function setAppStatusSwitchBox(switchBox: SwitchBox) {
  g_switchBox = switchBox;
}

const status = {
  index: async (ctx : Koa.Context, next : () => Promise<any>) => {
    await next();
    ctx.response.body = 'OK';
  },

  memory: async (ctx : Koa.Context, next : () => Promise<any>) => {
    await next();

    ctx.response.body = {
      process: process.memoryUsage(),
      heap: v8.getHeapStatistics(),
    };
  },

  queue: async (ctx : Koa.Context, next : () => Promise<any>) => {
    await next();

    if (!g_switchBox) {
      ctx.response.body = {};
      return;
    }

    ctx.response.body = g_switchBox.stats();
  },
};

export default status;

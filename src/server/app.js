// import * as Koa from 'koa';
// import * as koaCors from '@koa/cors';
// import * as koaJson from 'koa-json';
// import * as KoaRouter from 'koa-router';
const Koa = require('koa')
const koaCors = require('@koa/cors')
const koaJson = require('koa-json')
const KoaRouter = require('koa-router')

// import status from './status';
const status = require('./status')

const router = new KoaRouter();

router.get('/status/pool', status.pool);
router.get('/status/memory', status.memory);
router.get('/status', status.index);

const app = new Koa()

module.exports = app;
app.use(koaCors());
app.use(koaJson({ pretty: false, param: 'pretty_json' }));
app.use(router.routes()).use(router.allowedMethods());

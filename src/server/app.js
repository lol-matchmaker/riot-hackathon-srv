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
const profile = require('./profile')
const match = require('./match')

const router = new KoaRouter();

router.get('/status/pool', status.pool);
router.get('/status/memory', status.memory);
router.get('/status', status.index);

router.get('/profile/new', profile.new); // GET /profile/new?summoner_name=...

router.get('/match', match.id)

const app = new Koa()

app.use(koaCors());
app.use(koaJson({ pretty: false, param: 'pretty_json' }));
app.use(router.routes()).use(router.allowedMethods());

// module.exports = app;
app.listen(5000)
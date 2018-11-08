import Koa = require('koa');
import koaCors = require('@koa/cors');
import koaJson = require('koa-json');
import KoaRouter = require('koa-router');

// import match from './match';
import profile from './profile';
import status from './status';

const router = new KoaRouter();

router.get('/status/pool', status.pool);
router.get('/status/memory', status.memory);
router.get('/status', status.index);

router.get('/profile/new', profile.new); // GET /profile/new?summoner_name=...

// router.get('/match', match.id)

export const app = new Koa();

app.use(koaCors());
app.use(koaJson({ pretty: false, param: 'pretty_json' }));
app.use(router.routes()).use(router.allowedMethods());

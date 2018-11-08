import path = require('path');

import Koa = require('koa');
import koaCors = require('@koa/cors');
import koaJson = require('koa-json');
import KoaRouter = require('koa-router');
import koaStatic = require('koa-static');

import matches from './matches';
import profiles from './profiles';
import status from './status';

const router = new KoaRouter();

router.get('/status/pool', status.pool);
router.get('/status/memory', status.memory);
router.get('/status', status.index);

// GET /matches/account/(account_id)
router.get('/matches/account/:id', matches.byAccountId);
// GET /matches/details/(match_id)
router.get('/matches/details/:id', matches.byMatchId);


// GET /profiles/(account_id)
router.get('/profiles/:id', profiles.byAccountId);
// GET /profile_by_name/(summoner_name)
router.get('/profile_by_name/:name', profiles.byName);

// router.get('/match', match.id)

export const app = new Koa();

app.use(koaCors());
app.use(koaJson({ pretty: false, param: 'pretty_json' }));
app.use(koaStatic(path.join(path.dirname(__dirname), 'static'),
        {index: 'index.html'}));
app.use(router.routes()).use(router.allowedMethods());

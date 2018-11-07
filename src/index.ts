import 'source-map-support/register';

import { sequelize } from './db/connection';

import { app } from './server/app';

const main = async () => {
  await sequelize.sync();
  app.listen(parseInt(process.env['PORT'] || '3000'));
};

main();

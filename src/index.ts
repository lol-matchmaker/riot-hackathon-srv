import 'source-map-support/register';

import { sequelize } from './db/connection';
import { Multiplexer } from './queue/multiplexer';
import { app } from './server/app';

const main = async () => {
  await sequelize.sync();

  const multiplexer = new Multiplexer(app,
                                      parseInt(process.env['PORT'] || '3000'));
  multiplexer.listen();
};

main();

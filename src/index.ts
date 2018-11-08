import 'source-map-support/register';

import { app } from './api/app';
import { sequelize } from './db/connection';
import { Multiplexer } from './queue/multiplexer';

const main = async () => {
  await sequelize.sync();

  const multiplexer = new Multiplexer(app,
                                      parseInt(process.env['PORT'] || '3000'));
  await multiplexer.listen();
  console.log(`Listening on ${multiplexer.listenAddress()}`);
};

main();

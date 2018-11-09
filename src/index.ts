import 'source-map-support/register';

import { app } from './api/app';
import { sequelize } from './db/connection';
import { Multiplexer } from './queue/multiplexer';
import { SwitchBox } from './queue/switch_box';
import { setAppStatusSwitchBox } from './api/status';

const main = async () => {
  await sequelize.sync();

  const switchBox = new SwitchBox();
  setAppStatusSwitchBox(switchBox);
  const multiplexer = new Multiplexer(app,
                                      switchBox,
                                      parseInt(process.env['PORT'] || '3000'));
  await multiplexer.listen();
  console.log(`Listening on ${multiplexer.listenAddress()}`);
};

main();

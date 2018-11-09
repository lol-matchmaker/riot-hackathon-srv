"use strict";
exports.__esModule = true;
var Sequelize = require("sequelize");
// TODO: Pick this up from the environment's DATABASE_URL.
var databaseUrl = 'postgres://localhost/riot_hackathon';
exports.sequelize = new Sequelize(databaseUrl, {
    operatorsAliases: false,
    native: true,
    logging: false,
    pool: {
        max: 6,
        min: 2,
        acquire: 24 * 60 * 60 * 1000
    }
});

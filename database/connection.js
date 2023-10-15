var knex = require("knex")({
  client: "pg",
  connection: {
    host: "localhost",
    user: "everton",
    password: "1408",
    database: "burguerbao",
  },
});

module.exports = knex;

const knex = require("../database/connection");
const User = require("./User");

class PasswordToken {
  async create(email) {
    const user = await User.findByEmail(email);

    if (user) {
      try {
        const token = Date.now();
        await knex("passwordtokens").insert({
          user_id: user.id,
          used: 0,
          token: token,
        });

        return { status: true, token: token };
      } catch (err) {
        console.error(err);
        return { status: false, err: err };
      }
    } else {
      return {
        status: false,
        err: "O e-mail passado não existe no banco de dados!",
      };
    }
  }

  async validate(token) {
    try {
      const result = await knex("passwordtokens")
        .select()
        .where({ token: token });

      if (result.length > 0) {
        const tk = result[0];

        if (tk.used) {
          return { status: false };
        } else {
          return { status: true, token: tk };
        }
      } else {
        return { status: false };
      }
    } catch (err) {
      console.error(err);
      return { status: false };
    }
  }

  async setUsed(token) {
    await knex("passwordtokens").update({ used: 1 }).where({ token: token });
  }
}

module.exports = new PasswordToken();

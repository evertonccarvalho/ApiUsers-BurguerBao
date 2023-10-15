const knex = require("../database/connection");
const bcrypt = require("bcrypt");

const userColumns = [
  "id",
  "email",
  "password",
  "role",
  "name",
  "phone",
  "profilePicture",
];

class User {
  async query(query) {
    try {
      const result = await query;
      return result;
    } catch (err) {
      throw new Error(err);
    }
  }

  async findAll() {
    const query = knex.select(userColumns).table("users");
    return this.query(query);
  }

  async findById(id) {
    const query = knex.select(userColumns).where({ id }).table("users");
    const result = await this.query(query);
    return result[0] || undefined;
  }

  async findByEmail(email) {
    const query = knex.select(userColumns).where({ email }).table("users");
    const result = await this.query(query);
    return result[0] || undefined;
  }
  async findByPhone(phone) {
    const query = knex.select(userColumns).where({ phone }).table("users");
    const result = await this.query(query);
    return result[0] || undefined;
  }

  async new(name, phone, email, password) {
    const hash = await bcrypt.hash(password, 10);
    const userData = {
      email,
      password: hash,
      name,
      phone,
      role: 0,
      created_at: new Date(),
    };
    const query = knex.insert(userData).table("users");
    return this.query(query);
  }

  async findEmail(email) {
    const query = knex.select("*").from("users").where({ email });
    const result = await this.query(query);
    return result.length > 0;
  }

  async delete(id) {
    const user = await this.findById(id);

    if (!user) {
      return {
        status: false,
        err: "O usuário não existe, portanto não pode ser deletado.",
      };
    }

    const query = knex.transaction(async (trx) => {
      await trx("users").delete().where({ id });
    });

    return this.query(query).then(() => {
      return { status: true };
    });
  }

  async update(id, email, name, role, phone, profilePicture) {
    const user = await this.findById(id);

    if (!user) {
      return { status: false, err: "O usuário não existe!" };
    }

    if (email && email !== user.email) {
      const emailExists = await this.findEmail(email);

      if (emailExists) {
        return { status: false, err: "O e-mail já está cadastrado" };
      }
    }

    const editUser = {
      email: email || user.email,
      name: name || user.name,
      role: role || user.role,
      phone: phone || user.phone,
      profilePicture: profilePicture || user.profilePicture,
      updated_at: new Date(), // Atualiza a coluna "updated_at"
    };

    const query = knex.transaction(async (trx) => {
      await trx("users").update(editUser).where({ id });
    });

    try {
      await this.query(query);
      return { status: true };
    } catch (err) {
      throw new Error(err);
    }
  }

  async setUsed(token) {
    const query = knex("passwordtokens").update({ used: 1 }).where({ token });
    return this.query(query);
  }

  async changePassword(newPassword, id, token) {
    const hash = await bcrypt.hash(newPassword, 10);
    const query = knex("users").update({ password: hash }).where({ id });

    return this.query(query).then(() => {
      return this.setUsed(token);
    });
  }
}

module.exports = new User();

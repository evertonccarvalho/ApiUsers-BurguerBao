const User = require("../models/User");
const PasswordToken = require("../models/PasswordToken");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const secret = "adsuasgdhjasgdhjdgahjsg12hj3eg12hj3g12hj3g12hj3g123";
const multer = require("multer");

class UserController {
  constructor() {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "uploads/");
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
      },
    });

    this.upload = multer({ storage: storage });
  }

  async index(req, res) {
    try {
      const users = await User.findAll();
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ err: "Erro interno do servidor" });
    }
  }

  async findUser(req, res) {
    try {
      const id = req.params.id;
      const user = await User.findById(id);
      if (user === undefined) {
        res.status(404).json({});
      } else {
        res.status(200).json(user);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ err: "Erro interno do servidor" });
    }
  }

  async create(req, res) {
    try {
      const { name, phone, email, password } = req.body;

      // Validação de entrada
      if ((!email && !phone) || !password) {
        return res
          .status(400)
          .json({ err: "E-mail (ou telefone) e senha são obrigatórios" });
      }

      const emailExists = await User.findEmail(email);

      if (emailExists) {
        return res.status(406).json({ err: "O e-mail já está cadastrado!" });
      }

      await User.new(name, phone, email, password);

      res.status(200).send("Tudo OK!");
    } catch (error) {
      console.error(error);
      res.status(500).json({ err: "Erro interno do servidor" });
    }
  }

  async login(req, res) {
    try {
      const { email, phone, password } = req.body;

      // Validação de entrada
      if ((!email && !phone) || !password) {
        return res
          .status(400)
          .json({ err: "E-mail (ou telefone) e senha são obrigatórios" });
      }

      let user;

      if (email) {
        user = await User.findByEmail(email);
      } else {
        // Consulte o usuário por número de telefone
        // Certifique-se de ter a função findByPhone em seu modelo User
        user = await User.findByPhone(phone);
      }

      if (!user) {
        return res.status(406).json({ err: "Credenciais inválidas" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(406).json({ err: "Credenciais inválidas" });
      }

      const token = jwt.sign({ email: user.email, role: user.role }, secret);

      res.status(200).json({ token: token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ err: "Erro interno do servidor" });
    }
  }

  async remove(req, res) {
    try {
      const id = req.params.id;

      const result = await User.delete(id);

      if (result.status) {
        res.status(200).send("Tudo OK!");
      } else {
        res.status(406).send(result.err);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ err: "Erro interno do servidor" });
    }
  }

  async edit(req, res) {
    try {
      const { id, name, role, email, phone } = req.body;

      let profilePicture = undefined;
      if (req.file) {
        profilePicture = req.file.filename;
      }

      const result = await User.update(
        id,
        email,
        name,
        role,
        phone,
        profilePicture
      );
      if (result !== undefined) {
        if (result.status) {
          res.status(200).send("Tudo OK!");
        } else {
          res.status(406).send(result.err);
        }
      } else {
        res.status(406).send("Ocorreu um erro no servidor!");
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ err: "Erro interno do servidor" });
    }
  }

  async recoverPassword(req, res) {
    try {
      const email = req.body.email;
      const result = await PasswordToken.create(email);

      if (result.status) {
        // Envia o token por email
        await sendEmail(email, result.token);

        res
          .status(200)
          .send("Um email com o token de recuperação de senha foi enviado.");
      } else {
        res.status(406).send(result.err);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ err: "Erro interno do servidor" });
    }
  }

  async recoverPassword(req, res) {
    try {
      const email = req.body.email;
      const result = await PasswordToken.create(email);
      if (result.status) {
        res.status(200).send("seu token é " + result.token);
      } else {
        res.status(406).send(result.err);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ err: "Erro interno do servidor" });
    }
  }

  async changePassword(req, res) {
    try {
      const token = req.body.token;
      const password = req.body.password;
      const isTokenValid = await PasswordToken.validate(token);
      if (isTokenValid.status) {
        await User.changePassword(
          password,
          isTokenValid.token.user_id,
          isTokenValid.token.token
        );
        res.status(200).send("Senha alterada");
      } else {
        res.status(406).send("Token inválido!");
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ err: "Erro interno do servidor" });
    }
  }
}

module.exports = new UserController();

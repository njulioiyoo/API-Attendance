const db = require("../models/index.model");
const config = require("../config/auth.config");
const User = db.User;
const Absen = db.Absensi;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const moment = require("moment");
const { Op } = require("sequelize");
const Joi = require("joi");

const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  position: Joi.string().required(),
  hrd_related: Joi.string().required(),
  phone_number: Joi.string().required(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().allow("").optional(),
  position: Joi.string().required(),
  hrd_related: Joi.string().required(),
  phone_number: Joi.string().required(),
});

// Sign in
exports.signIn = (req, res) => {
  User.findOne({
    where: {
      email: req.body.email,
    },
  })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!passwordIsValid) {
        return res
          .status(401)
          .send({ accessToken: null, message: "Invalid Password!" });
      }

      const token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 3600, // 1 hour
      });

      const data = {
        id: user.id,
        name: user.name,
        hrd_related: user.hrd_related,
        accessToken: token,
        expiresIn: 3600, // 1 hour
      };
      return res.status(200).send({ data });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.getUser = (req, res) => {
  User.findAll().then((users) => {
    const response = {
      status: "success",
      users: users,
    };
    res.json(response);
  });
};

// Create a new user account
exports.createUser = async (req, res) => {
  const { error } = createUserSchema.validate(req.body, {
    allowUnknown: true,
  });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { name, email, password, position, hrd_related, phone_number } =
    req.body;
  const hashedPassword = await bcrypt.hash(password, 10); // melakukan hashing pada password dengan 10 round

  // cek apakah ada file gambar yang diupload
  if (req.file) {
    photo_url = req.file.path;
  }

  try {
    // memeriksa apakah email sudah terdaftar sebelumnya
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar." });
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword, // menyimpan password yang sudah di-hash ke dalam database
      position,
      hrd_related,
      phone_number,
      photo_url,
    });

    res.status(201).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat membuat akun baru." });
  }
};

// Detail view for user
exports.detailUser = (req, res) => {
  const { userId } = req.params;
  User.findByPk(userId)
    .then((user) => {
      if (!user) {
        res.status(404).json({ message: "User not found" });
      } else {
        const data = {
          name: user.name,
          email: user.email,
          password: user.password,
          position: user.position,
          hrd_related: user.hrd_related,
          phone_number: user.phone_number,
          photo_url: user.photo_url,
        };
        return res.status(200).send({ status: "success", data });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
};

// Update user
exports.updateUser = async (req, res) => {
  const { error } = updateUserSchema.validate(req.body, { allowUnknown: true });
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { userId } = req.params;
  const { name, email, password, position, hrd_related, phone_number } =
    req.body;

  let hashedPassword;
  if (password === "" || !password) {
    // Jika password kosong, gunakan password sebelumnya dari database
    const user = await User.findOne({ where: { id: userId } });
    hashedPassword = user.password;
  } else {
    // hash password menggunakan bcrypt
    const saltRounds = 10;
    hashedPassword = await bcrypt.hash(password, saltRounds);
  }

  // cek apakah ada file gambar yang diupload
  if (req.file) {
    photo_url = req.file.path;
  }

  try {
    const [numUpdated, updatedUser] = await User.update(
      {
        name,
        email,
        password: hashedPassword,
        position,
        hrd_related,
        phone_number,
        photo_url,
      },
      { where: { id: userId }, returning: true }
    );

    if (numUpdated === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findOne({ where: { id: userId } });
    const data = {
      name: user.dataValues.name,
      email: user.dataValues.email,
      password: user.dataValues.password,
      position: user.dataValues.position,
      hrd_related: user.dataValues.hrd_related,
      phone_number: user.dataValues.phone_number,
      photo_url: user.dataValues.photo_url,
    };

    res.status(201).json({
      message: "success",
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Use Case No 1 Point B
exports.createAttendance = async (req, res) => {
  const { tanggal, masuk, userId } = req.body;

  try {
    // check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // insert absen record to database
    const create = await Absen.create({
      user_id: userId,
      tanggal: tanggal,
      masuk: masuk,
    });

    res.status(201).json({
      status: "success",
      data: create,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateAttendance = async (req, res) => {
  const { tanggal, pulang, userId } = req.body;

  try {
    // check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await Absen.update(
      {
        user_id: userId,
        tanggal: tanggal,
        pulang: pulang,
      },
      {
        where: { user_id: userId, tanggal: tanggal },
      }
    );

    res.status(201).json({
      status: "success",
      data: req.body,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Use Case No 1 Point C
exports.summaryAttendance = async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    // periksa apakah user ada
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // dapatkan data summary absen dari database
    let absenData;
    if (startDate && endDate) {
      absenData = await Absen.findAll({
        where: {
          tanggal: {
            [Op.between]: [startDate, endDate],
          },
          user_id: userId,
        },
      });
    } else {
      absenData = await Absen.findAll({
        where: {
          user_id: userId,
        },
      });
    }

    // map data ke format yang diinginkan
    const summaryAbsen = absenData.map((absen) => ({
      id: absen.id,
      tanggal: moment(absen.tanggal).format("YYYY-MM-DD"),
      masuk: absen.masuk,
      pulang: absen.pulang,
    }));

    return res.status(200).send({ status: "success", summaryAbsen });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Use Case No 2 Point B
exports.getAbsensi = async (req, res) => {
  try {
    // get all absensi data
    const absensi = await Absen.findAll({
      attributes: ["id", "tanggal", "masuk", "pulang", "user_id"],
      include: {
        model: User,
        attributes: ["id", "name"],
      },
    });

    return res.status(200).send({ status: "success", absensi });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

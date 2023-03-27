const dbConfig = require("../config/config.json")[
  process.env.NODE_ENV || "development"
];
const { Sequelize, DataTypes } = require("sequelize");
const UserModel = require("./user.model");
const AbsensiModel = require("./absensi.model");

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: 3336,
    dialect: dbConfig.dialect,
    operatorsAliases: false,
    logging: false,
    define: {
      // Prevent sequelize from pluralizing table names
      freezeTableName: true,
    },
  }
);

const Absensi = AbsensiModel(sequelize, DataTypes);
const User = UserModel(sequelize, DataTypes);

Absensi.belongsTo(User, { foreignKey: "user_id" });

module.exports = {
  sequelize,
  Absensi,
  User,
};

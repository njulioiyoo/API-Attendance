module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("users", {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    position: DataTypes.STRING,
    hrd_related: DataTypes.ENUM("1", "2"),
    phone_number: DataTypes.STRING,
    photo_url: DataTypes.STRING,
  });

  return User;
};

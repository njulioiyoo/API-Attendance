module.exports = (sequelize, DataTypes) => {
  const Absensi = sequelize.define("absensis", {
    tanggal: DataTypes.DATEONLY,
    masuk: DataTypes.TIME,
    pulang: DataTypes.TIME,
    user_id: DataTypes.INTEGER,
  });

  Absensi.associate = (models) => {
    Absensi.belongsTo(models.User, { foreignKey: "user_id" });
  };

  return Absensi;
};

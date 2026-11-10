module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      firstname: { type: DataTypes.STRING, allowNull: false },
      surname: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
    },
    { tableName: "users", timestamps: true, underscored: true }
  )
  User.prototype.toJSON = function toJSON() {
    const { id, firstname, surname, email } = this.get()
    return { id, firstname, surname, email }
  }

  return User
}

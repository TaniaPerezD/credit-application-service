const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ExternalDataSnapshot extends Model {}

ExternalDataSnapshot.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    application_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    credit_bureau_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    utility_payment_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    wallet_transaction_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ecommerce_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mobile_topup_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'external_data_snapshots',
    schema: 'scoring',
    timestamps: false,
  }
);

module.exports = ExternalDataSnapshot;

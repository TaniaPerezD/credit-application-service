const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const ApplicationStatus = {
  CREATED: 'CREATED',
  DATA_COLLECTING: 'DATA_COLLECTING',
  SCORING: 'SCORING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  DISBURSED: 'DISBURSED',
};

class CreditApplication extends Model {}

CreditApplication.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    applicant_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    requested_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'USD',
    },
    term_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: ApplicationStatus.CREATED,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'credit_applications',
    schema: 'credit',
    timestamps: false,
    underscored: true,
  }
);

module.exports = { CreditApplication, ApplicationStatus };

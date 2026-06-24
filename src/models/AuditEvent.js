const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class AuditEvent extends Model {}

AuditEvent.init(
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
    event_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    from_status: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    to_status: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    signature: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    occurred_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'audit_events',
    schema: 'credit',
    timestamps: false,
  }
);

module.exports = AuditEvent;

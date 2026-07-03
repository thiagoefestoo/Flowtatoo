const fs = require('fs');
const path = require('path');

const EntityDocument = require('../models/entityDocument');
const User = require('../models/user');
const Company = require('../models/company');
const Campaign = require('../models/campaign');
const Opportunity = require('../models/opportunity');
const Delivery = require('../models/delivery');
const { registerAuditLog } = require('../services/auditService');

const entityConfig = {
  company: {
    model: Company,
    label: 'empresa',
    auditEntityType: 'company',
    nameFields: ['tradeName', 'corporateName'],
  },
  crm_campaign: {
    model: Campaign,
    label: 'campanha',
    auditEntityType: 'crm_campaign',
    nameFields: ['name'],
  },
  crm_opportunity: {
    model: Opportunity,
    label: 'oportunidade',
    auditEntityType: 'crm_opportunity',
    nameFields: ['title'],
  },
  flow_delivery: {
    model: Delivery,
    label: 'entrega',
    auditEntityType: 'delivery',
    nameFields: ['title', 'orderNumber'],
  },
};

function getConfig(entityType) {
  return entityConfig[entityType] || null;
}

function getEntityName(entity, config) {
  if (!entity || !config) return null;

  for (const field of config.nameFields) {
    if (entity[field]) return entity[field];
  }

  return entity.id;
}

async function findEntity(entityType, entityId) {
  const config = getConfig(entityType);

  if (!config) return null;

  const entity = await config.model.findByPk(entityId);

  return { config, entity };
}

async function getEntityDocuments(req, res) {
  try {
    const { entityType, entityId } = req.params;
    const found = await findEntity(entityType, entityId);

    if (!found?.entity) {
      return res.status(404).json({
        success: false,
        message: 'Registro não encontrado para consulta de documentos.',
      });
    }

    const documents = await EntityDocument.findAll({
      where: { entityType, entityId },
      include: [
        {
          model: User,
          as: 'uploadedByUser',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ success: true, data: documents });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar documentos do registro.',
      error: error.message,
    });
  }
}

async function createEntityDocument(req, res) {
  try {
    const { entityType, entityId } = req.params;
    const { documentType = 'documento', notes } = req.body;
    const found = await findEntity(entityType, entityId);

    if (!found?.entity) {
      return res.status(404).json({
        success: false,
        message: 'Registro não encontrado para anexar documento.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Envie um arquivo para anexar.',
      });
    }

    const document = await EntityDocument.create({
      entityType,
      entityId,
      documentType,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: `/uploads/entity-documents/${req.file.filename}`,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedBy: req.userId,
      notes: notes || null,
    });

    const entityName = getEntityName(found.entity, found.config);

    await registerAuditLog({
      entityType: found.config.auditEntityType,
      entityId,
      action: `${found.config.auditEntityType}_document_uploaded`,
      description: `Documento anexado à ${found.config.label} ${entityName || ''}.`.trim(),
      userId: req.userId,
      metadata: {
        entityType,
        entityId,
        entityName,
        documentType,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: document.filePath,
        sizeBytes: req.file.size,
        notes: notes || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Documento anexado com sucesso.',
      data: document,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao anexar documento ao registro.',
      error: error.message,
    });
  }
}

async function deleteEntityDocument(req, res) {
  try {
    const { entityType, id } = req.params;

    const document = await EntityDocument.findOne({
      where: { id, entityType },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado.',
      });
    }

    const found = await findEntity(document.entityType, document.entityId);
    const entityName = getEntityName(found?.entity, found?.config);

    const fileLocation = path.join(
      __dirname,
      '../../uploads/entity-documents',
      document.fileName
    );

    if (fs.existsSync(fileLocation)) {
      fs.unlinkSync(fileLocation);
    }

    await registerAuditLog({
      entityType: found?.config?.auditEntityType || document.entityType,
      entityId: document.entityId,
      action: `${found?.config?.auditEntityType || document.entityType}_document_deleted`,
      description: `Documento removido de ${found?.config?.label || 'registro'} ${entityName || ''}.`.trim(),
      userId: req.userId,
      metadata: {
        entityType: document.entityType,
        entityId: document.entityId,
        entityName,
        documentType: document.documentType,
        originalName: document.originalName,
        fileName: document.fileName,
        sizeBytes: document.sizeBytes,
      },
    });

    await document.destroy();

    return res.json({
      success: true,
      message: 'Documento removido com sucesso.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao remover documento do registro.',
      error: error.message,
    });
  }
}

module.exports = {
  getEntityDocuments,
  createEntityDocument,
  deleteEntityDocument,
};

const fs = require('fs');
const path = require('path');

const Activity = require('../models/activity');
const ActivityDocument = require('../models/activityDocument');
const User = require('../models/user');
const { registerAuditLog } = require('../services/auditService');

async function getActivityDocuments(req, res) {
  try {
    const { activityId } = req.params;

    const documents = await ActivityDocument.findAll({
      where: { activityId },
      include: [
        {
          model: User,
          as: 'uploadedByUser',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar documentos da atividade.',
      error: error.message,
    });
  }
}

async function createActivityDocument(req, res) {
  try {
    const { activityId } = req.params;
    const { documentType = 'documento', notes } = req.body;

    const activity = await Activity.findByPk(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Atividade não encontrada.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Envie um arquivo para anexar.',
      });
    }

    const document = await ActivityDocument.create({
      activityId,
      documentType,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: `/uploads/activities/${req.file.filename}`,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedBy: req.userId,
      notes: notes || null,
    });

    await registerAuditLog({
      entityType: 'crm_activity',
      entityId: activity.id,
      action: 'crm_activity_document_uploaded',
      description: `Documento anexado à atividade ${activity.title}.`,
      userId: req.userId,
      metadata: {
        activityId: activity.id,
        activityTitle: activity.title,
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
      message: 'Erro ao anexar documento da atividade.',
      error: error.message,
    });
  }
}

async function deleteActivityDocument(req, res) {
  try {
    const document = await ActivityDocument.findByPk(req.params.id, {
      include: [
        {
          model: Activity,
          as: 'activity',
          attributes: ['id', 'title'],
        },
      ],
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado.',
      });
    }

    const fileLocation = path.join(
      __dirname,
      '../../uploads/activities',
      document.fileName
    );

    if (fs.existsSync(fileLocation)) {
      fs.unlinkSync(fileLocation);
    }

    await registerAuditLog({
      entityType: 'crm_activity',
      entityId: document.activityId,
      action: 'crm_activity_document_deleted',
      description: `Documento removido da atividade ${document.activity?.title || ''}.`,
      userId: req.userId,
      metadata: {
        activityId: document.activityId,
        documentType: document.documentType,
        originalName: document.originalName,
        fileName: document.fileName,
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
      message: 'Erro ao remover documento da atividade.',
      error: error.message,
    });
  }
}

module.exports = {
  getActivityDocuments,
  createActivityDocument,
  deleteActivityDocument,
};

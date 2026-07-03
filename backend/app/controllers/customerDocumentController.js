const fs = require('fs');
const path = require('path');

const Customer = require('../models/customer');
const CustomerDocument = require('../models/customerDocument');
const User = require('../models/user');
const { registerAuditLog } = require('../services/auditService');

async function getCustomerDocuments(req, res) {
  try {
    const { customerId } = req.params;

    const documents = await CustomerDocument.findAll({
      where: {
        customerId,
      },
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
      message: 'Erro ao listar documentos do cliente.',
      error: error.message,
    });
  }
}


async function createCustomerDocument(req, res) {
  try {
    const { customerId } = req.params;
    const { documentType = 'documento', notes } = req.body;

    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Envie um arquivo para anexar.',
      });
    }

    const document = await CustomerDocument.create({
      customerId,
      documentType,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: `/uploads/customers/${req.file.filename}`,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedBy: req.userId,
      notes: notes || null,
    });

    await registerAuditLog({
      entityType: 'customer',
      entityId: customer.id,
      action: 'customer_document_uploaded',
      description: `Documento "${document.originalName}" anexado ao cliente.`,
      userId: req.userId,
      metadata: {
        customerId: customer.id,
        customerName: customer.name,
        documentType: document.documentType,
        originalName: document.originalName,
        fileName: document.fileName,
        filePath: document.filePath,
        sizeBytes: document.sizeBytes,
        notes: document.notes,
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
      message: 'Erro ao anexar documento do cliente.',
      error: error.message,
    });
  }
}

async function deleteCustomerDocument(req, res) {
  try {
    const document = await CustomerDocument.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento do cliente nao encontrado.',
      });
    }

    const customer = await Customer.findByPk(document.customerId);
    const documentData = document.toJSON();

    await document.destroy();

    const absolutePath = path.join(
      __dirname,
      '../../',
      documentData.filePath.replace(/^\/+/, '')
    );

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await registerAuditLog({
      entityType: 'customer',
      entityId: documentData.customerId,
      action: 'customer_document_deleted',
      description: `Documento "${documentData.originalName}" removido do cliente.`,
      userId: req.userId,
      metadata: {
        customerId: documentData.customerId,
        customerName: customer?.name || null,
        documentType: documentData.documentType,
        originalName: documentData.originalName,
        fileName: documentData.fileName,
        sizeBytes: documentData.sizeBytes,
      },
    });

    return res.json({
      success: true,
      message: 'Documento removido com sucesso.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao remover documento do cliente.',
      error: error.message,
    });
  }
}

module.exports = {
  getCustomerDocuments,
  createCustomerDocument,
  deleteCustomerDocument,
};
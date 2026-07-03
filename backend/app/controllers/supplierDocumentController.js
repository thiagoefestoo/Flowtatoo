const fs = require('fs');
const path = require('path');

const Supplier = require('../models/supplier');
const SupplierDocument = require('../models/supplierDocument');
const User = require('../models/user');
const { registerAuditLog } = require('../services/auditService');

async function getSupplierDocuments(req, res) {
  try {
    const { supplierId } = req.params;

    const documents = await SupplierDocument.findAll({
      where: { supplierId },
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
      message: 'Erro ao listar documentos do fornecedor.',
      error: error.message,
    });
  }
}

async function createSupplierDocument(req, res) {
  try {
    const { supplierId } = req.params;
    const { documentType = 'documento', notes } = req.body;

    const supplier = await Supplier.findByPk(supplierId);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fornecedor nao encontrado.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Envie um arquivo para anexar.',
      });
    }

    const document = await SupplierDocument.create({
      supplierId,
      documentType,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: `/uploads/suppliers/${req.file.filename}`,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedBy: req.userId,
      notes: notes || null,
    });

    await registerAuditLog({
      entityType: 'supplier',
      entityId: supplier.id,
      action: 'supplier_document_uploaded',
      description: `Documento anexado ao fornecedor ${supplier.name}.`,
      userId: req.userId,
      metadata: {
        supplierId: supplier.id,
        supplierName: supplier.name,
        documentType,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        sizeBytes: req.file.size,
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
      message: 'Erro ao anexar documento do fornecedor.',
      error: error.message,
    });
  }
}

async function deleteSupplierDocument(req, res) {
  try {
    const document = await SupplierDocument.findByPk(req.params.id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'tradeName'],
        },
      ],
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento nao encontrado.',
      });
    }

    const fileLocation = path.join(
      __dirname,
      '../../uploads/suppliers',
      document.fileName
    );

    if (fs.existsSync(fileLocation)) {
      fs.unlinkSync(fileLocation);
    }

    await registerAuditLog({
      entityType: 'supplier',
      entityId: document.supplierId,
      action: 'supplier_document_deleted',
      description: `Documento removido do fornecedor ${document.supplier?.name || ''}.`,
      userId: req.userId,
      metadata: {
        supplierId: document.supplierId,
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
      message: 'Erro ao remover documento do fornecedor.',
      error: error.message,
    });
  }
}

module.exports = {
  getSupplierDocuments,
  createSupplierDocument,
  deleteSupplierDocument,
};
const fs = require('fs');
const path = require('path');

const Proposal = require('../models/proposal');
const ProposalDocument = require('../models/proposalDocument');
const User = require('../models/user');
const { registerAuditLog } = require('../services/auditService');

async function getProposalDocuments(req, res) {
  try {
    const { proposalId } = req.params;

    const documents = await ProposalDocument.findAll({
      where: { proposalId },
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
      message: 'Erro ao listar documentos da proposta.',
      error: error.message,
    });
  }
}

async function createProposalDocument(req, res) {
  try {
    const { proposalId } = req.params;
    const { documentType = 'documento', notes } = req.body;

    const proposal = await Proposal.findByPk(proposalId);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposta não encontrada.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Envie um arquivo para anexar.',
      });
    }

    const document = await ProposalDocument.create({
      proposalId,
      documentType,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: `/uploads/proposals/${req.file.filename}`,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedBy: req.userId,
      notes: notes || null,
    });

    await registerAuditLog({
      entityType: 'crm_proposal',
      entityId: proposal.id,
      action: 'crm_proposal_document_uploaded',
      description: `Documento anexado à proposta ${proposal.number}.`,
      userId: req.userId,
      metadata: {
        proposalId: proposal.id,
        proposalNumber: proposal.number,
        proposalTitle: proposal.title,
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
      message: 'Erro ao anexar documento da proposta.',
      error: error.message,
    });
  }
}

async function deleteProposalDocument(req, res) {
  try {
    const document = await ProposalDocument.findByPk(req.params.id, {
      include: [
        {
          model: Proposal,
          as: 'proposal',
          attributes: ['id', 'number', 'title'],
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
      '../../uploads/proposals',
      document.fileName
    );

    if (fs.existsSync(fileLocation)) {
      fs.unlinkSync(fileLocation);
    }

    await registerAuditLog({
      entityType: 'crm_proposal',
      entityId: document.proposalId,
      action: 'crm_proposal_document_deleted',
      description: `Documento removido da proposta ${document.proposal?.number || ''}.`,
      userId: req.userId,
      metadata: {
        proposalId: document.proposalId,
        proposalNumber: document.proposal?.number || null,
        proposalTitle: document.proposal?.title || null,
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
      message: 'Erro ao remover documento da proposta.',
      error: error.message,
    });
  }
}

module.exports = {
  getProposalDocuments,
  createProposalDocument,
  deleteProposalDocument,
};

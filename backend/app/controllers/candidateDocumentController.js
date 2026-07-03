const fs = require('fs');
const path = require('path');

const Candidate = require('../models/candidate');
const CandidateDocument = require('../models/candidateDocument');
const User = require('../models/user');
const { registerAuditLog } = require('../services/auditService');

async function getCandidateDocuments(req, res) {
  try {
    const { candidateId } = req.params;

    const documents = await CandidateDocument.findAll({
      where: { candidateId },
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
      message: 'Erro ao listar documentos do candidato.',
      error: error.message,
    });
  }
}

async function createCandidateDocument(req, res) {
  try {
    const { candidateId } = req.params;
    const { documentType = 'curriculo', notes } = req.body;

    const candidate = await Candidate.findByPk(candidateId);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidato não encontrado.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Envie um arquivo para anexar.',
      });
    }

    const document = await CandidateDocument.create({
      candidateId,
      documentType,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: `/uploads/candidates/${req.file.filename}`,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedBy: req.userId,
      notes: notes || null,
    });

    await registerAuditLog({
      entityType: 'candidate',
      entityId: candidate.id,
      action: 'candidate_document_uploaded',
      description: `Documento "${document.originalName}" anexado ao candidato ${candidate.name}.`,
      userId: req.userId,
      metadata: {
        candidateId: candidate.id,
        candidateName: candidate.name,
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
      message: 'Documento do candidato anexado com sucesso.',
      data: document,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao anexar documento do candidato.',
      error: error.message,
    });
  }
}

async function deleteCandidateDocument(req, res) {
  try {
    const document = await CandidateDocument.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento do candidato não encontrado.',
      });
    }

    const candidate = await Candidate.findByPk(document.candidateId);
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
      entityType: 'candidate',
      entityId: documentData.candidateId,
      action: 'candidate_document_deleted',
      description: `Documento "${documentData.originalName}" removido do candidato ${candidate?.name || ''}.`,
      userId: req.userId,
      metadata: {
        candidateId: documentData.candidateId,
        candidateName: candidate?.name || null,
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
      message: 'Erro ao remover documento do candidato.',
      error: error.message,
    });
  }
}

module.exports = {
  getCandidateDocuments,
  createCandidateDocument,
  deleteCandidateDocument,
};

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Op, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

function loadModels() {
  const modelsDir = path.join(__dirname, '../app/models');
  fs.readdirSync(modelsDir)
    .filter((file) => file.endsWith('.js'))
    .sort()
    .forEach((file) => {
      require(path.join(modelsDir, file));
    });
}

function isTextAttribute(attribute) {
  const key = attribute?.type?.key;
  return ['STRING', 'TEXT', 'CHAR', 'CITEXT'].includes(key);
}

function hasEncodingProblem(value) {
  if (typeof value !== 'string') return false;

  return (
    value.includes('\uFFFD') ||
    /Ã.|Â.|â€|â€œ|â€|â€™|â€“|â€”|â€¢/.test(value)
  );
}

async function main() {
  loadModels();
  await sequelize.authenticate();
  await sequelize.query("SET client_encoding TO 'UTF8';");

  const models = sequelize.modelManager.models;
  let totalProblems = 0;

  for (const model of models) {
    const textFields = Object.entries(model.rawAttributes)
      .filter(([, attribute]) => isTextAttribute(attribute))
      .map(([name]) => name);

    if (!textFields.length) continue;

    const where = {
      [Op.or]: textFields.flatMap((field) => [
        { [field]: { [Op.like]: '%\uFFFD%' } },
        { [field]: { [Op.like]: '%Ã%' } },
        { [field]: { [Op.like]: '%Â%' } },
        { [field]: { [Op.like]: '%â€%' } },
      ]),
    };

    let rows = [];

    try {
      rows = await model.findAll({ where, limit: 50, raw: true });
    } catch (error) {
      console.log(`[IGNORADO] ${model.name}: ${error.message}`);
      continue;
    }

    for (const row of rows) {
      const fields = textFields.filter((field) => hasEncodingProblem(row[field]));

      if (!fields.length) continue;

      totalProblems += 1;
      const id = row.id || row.uuid || row.email || row.name || '(sem id)';
      console.log(`\n[${model.name}] registro: ${id}`);

      fields.forEach((field) => {
        console.log(`  - ${field}: ${row[field]}`);
      });
    }
  }

  if (!totalProblems) {
    console.log('Nenhum texto com caractere U+FFFD, Ã, Â ou sequência mojibake foi encontrado no banco.');
  } else {
    console.log(`\nTotal de registros com possível problema de codificação: ${totalProblems}`);
    console.log('Execute npm run encoding:repair para corrigir sequências reversíveis como Ã§, Ã£, Ã© etc.');
    console.log('Observação: textos que já viraram U+FFFD não podem ser 100% recuperados automaticamente, pois o caractere original foi perdido.');
  }

  await sequelize.close();
}

main().catch(async (error) => {
  console.error('Erro ao verificar codificação:', error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});

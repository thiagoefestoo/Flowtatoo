require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
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

function countMojibake(value) {
  if (typeof value !== 'string') return 0;
  const matches = value.match(/Ã.|Â.|â./g);
  return matches ? matches.length : 0;
}

function hasReversibleProblem(value) {
  return countMojibake(value) > 0;
}

function fixMojibake(value) {
  if (typeof value !== 'string') return value;

  const repairedByLatin1 = Buffer.from(value, 'latin1').toString('utf8');

  if (countMojibake(repairedByLatin1) < countMojibake(value)) {
    return repairedByLatin1;
  }

  return value;
}

async function main() {
  loadModels();
  await sequelize.authenticate();
  await sequelize.query("SET client_encoding TO 'UTF8';");

  const dryRun = process.argv.includes('--dry-run');
  const models = sequelize.modelManager.models;
  let updated = 0;
  let irreversible = 0;

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
      rows = await model.findAll({ where });
    } catch (error) {
      console.log(`[IGNORADO] ${model.name}: ${error.message}`);
      continue;
    }

    for (const row of rows) {
      const patch = {};

      for (const field of textFields) {
        const current = row[field];

        if (typeof current !== 'string') continue;

        if (current.includes('\uFFFD')) {
          irreversible += 1;
          console.log(`[AVISO] ${model.name}.${field} contém U+FFFD no registro ${row.id || '(sem id)'}. Esse caractere não permite recuperação automática perfeita.`);
        }

        if (!hasReversibleProblem(current)) continue;

        const fixed = fixMojibake(current);

        if (fixed !== current) {
          patch[field] = fixed;
        }
      }

      if (Object.keys(patch).length) {
        updated += 1;
        console.log(`${dryRun ? '[SIMULAÇÃO]' : '[CORRIGIDO]'} ${model.name} ${row.id || '(sem id)'}`);

        if (!dryRun) {
          await row.update(patch, { silent: true });
        }
      }
    }
  }

  console.log(`\nRegistros com correção reversível ${dryRun ? 'simulada' : 'aplicada'}: ${updated}`);
  console.log(`Ocorrências com caractere U+FFFD não recuperável automaticamente: ${irreversible}`);

  if (dryRun) {
    console.log('Nada foi alterado porque você usou --dry-run. Rode sem --dry-run para aplicar.');
  }

  await sequelize.close();
}

main().catch(async (error) => {
  console.error('Erro ao corrigir codificação:', error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});

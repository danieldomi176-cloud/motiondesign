import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectCredits, loadProject, type Project, root} from './project';

export function writeMetadata(project: Project, directory = path.join(root, 'out')) {
  mkdirSync(directory, {recursive: true});
  const credits = collectCredits();
  const publication = {
    ...project.publication, language: project.language,
    editorialStatus: project.editorial.status,
    readyToPublish: project.editorial.status === 'verified',
    editorialNotice: project.editorial.notice,
    sources: project.editorial.sources,
    disclosure: 'Contém imagens ilustrativas geradas por IA e narração sintética.',
    credits: credits.assets.map(({file, credit, creator, rightsBasis, license, licenseUrl, termsUrl}) => ({file, credit, creator, rightsBasis, license, licenseUrl, termsUrl})),
  };
  writeFileSync(path.join(directory, `${project.id}.metadata.json`), JSON.stringify(publication, null, 2) + '\n');
  const text = [publication.title, '', publication.description, '', publication.hashtags.join(' '), '',
    `Estado editorial: ${publication.editorialStatus}`, publication.editorialNotice, publication.disclosure,
    '', 'Créditos:', ...publication.credits.map((credit) => `${credit.file}: ${credit.credit || credit.creator || ''}`), ''].join('\n');
  writeFileSync(path.join(directory, `${project.id}.metadata.txt`), text);
  writeFileSync(path.join(directory, `${project.id}.credits.json`), JSON.stringify(credits, null, 2) + '\n');
  return publication;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const metadata = writeMetadata(loadProject());
  console.log(`Metadados escritos. Pronto para publicação: ${metadata.readyToPublish}`);
}

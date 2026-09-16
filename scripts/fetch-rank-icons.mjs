import {mkdir, writeFile} from 'node:fs/promises';

const icons = {
  bronze: 'https://static.wikia.nocookie.net/leagueoflegends/images/c/cb/Season_2023_-_Bronze.png/revision/latest/scale-to-width-down/130?cb=20231007195824',
  silver: 'https://static.wikia.nocookie.net/leagueoflegends/images/c/c4/Season_2023_-_Silver.png/revision/latest/scale-to-width-down/130?cb=20231007195834',
  platinum: 'https://static.wikia.nocookie.net/leagueoflegends/images/b/bd/Season_2023_-_Platinum.png/revision/latest/scale-to-width-down/130?cb=20231007195833',
  emerald: 'https://static.wikia.nocookie.net/leagueoflegends/images/4/4b/Season_2023_-_Emerald.png/revision/latest/scale-to-width-down/130?cb=20231007195827',
  diamond: 'https://static.wikia.nocookie.net/leagueoflegends/images/3/37/Season_2023_-_Diamond.png/revision/latest/scale-to-width-down/130?cb=20231007195826',
  master: 'https://static.wikia.nocookie.net/leagueoflegends/images/d/d5/Season_2023_-_Master.png/revision/latest/scale-to-width-down/130?cb=20231007195832',
  grandmaster: 'https://static.wikia.nocookie.net/leagueoflegends/images/6/64/Season_2023_-_Grandmaster.png/revision/latest/scale-to-width-down/130?cb=20231007195830',
  challenger: 'https://static.wikia.nocookie.net/leagueoflegends/images/1/14/Season_2023_-_Challenger.png/revision/latest/scale-to-width-down/130?cb=20231007195825',
};

await mkdir('public/ranks', { recursive: true });

for (const [name, url] of Object.entries(icons)) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${name}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(`public/ranks/${name}.png`, buffer);
}

console.log(`Downloaded ${Object.keys(icons).length} rank icons to public/ranks`);

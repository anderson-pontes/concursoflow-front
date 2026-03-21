/**
 * Corrige acentuação em RegistroEstudoModal.tsx (U+FFFD, "?" solto, mojibake comum).
 * Rode na pasta frontend: npm run fix-utf8:registro-modal
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "../src/components/estudos/RegistroEstudoModal.tsx");
let s = fs.readFileSync(file, "utf8");
const orig = s;

// --- U+FFFD (substituição Unicode) ---
const fffdPairs = [
  ["quando nada est\uFFFD selecionado", "quando nada está selecionado"],
  ["N\uFFFDo foi poss\uFFFDvel criar a categoria.", "Não foi possível criar a categoria."],
  ["T\uFFFDpico criado.", "Tópico criado."],
  ["Informe um n\uFFFDmero de dias v\uFFFDlido.", "Informe um número de dias válido."],
  ["T\uFFFDpicos estudados", "Tópicos estudados"],
  ['placeholder="Buscar t\uFFFDpico..."', 'placeholder="Buscar tópico..."'],
  ["Nenhum t\uFFFDpico encontrado.", "Nenhum tópico encontrado."],
  ['placeholder="Novo t\uFFFDpico"', 'placeholder="Novo tópico"'],
  ["criar t\uFFFDpico.", "criar tópico."],
  [" /> Novo t\uFFFDpico\n", " /> Novo tópico\n"],
  ["Coment\uFFFDrios", "Comentários"],
  ["Observa\uFFFD\uFFFDes sobre o estudo", "Observações sobre o estudo"],
  ["Quest\uFFFDes", "Questões"],
  ["P\uFFFDginas", "Páginas"],
  ['placeholder="In\uFFFDcio"', 'placeholder="Início"'],
  ["Revis\uFFFDes", "Revisões"],
  ["revis\uFFFDes", "revisões"],
  ["O tempo m\uFFFDximo \uFFFD 24 horas", "O tempo máximo é 24 horas"],
];

// --- "?" onde deveria ser acento (ferramentas / CP1252) ---
const asciiQPairs = [
  ["quando nada est? selecionado", "quando nada está selecionado"],
  ['toast.error("N?o foi poss?vel criar a categoria.")', 'toast.error("Não foi possível criar a categoria.")'],
  ['toast.success("T?pico criado.")', 'toast.success("Tópico criado.")'],
  ['toast.error("Informe um n?mero de dias v?lido.")', 'toast.error("Informe um número de dias válido.")'],
  [">T?picos estudados<", ">Tópicos estudados<"],
  ['placeholder="Buscar t?pico..."', 'placeholder="Buscar tópico..."'],
  ["Nenhum t?pico encontrado.", "Nenhum tópico encontrado."],
  ["`Selecionar t?pico ${topico.nome}`", "`Selecionar tópico ${topico.nome}`"],
  ['placeholder="Novo t?pico"', 'placeholder="Novo tópico"'],
  ['toast.error("Selecione uma disciplina para criar t?pico.");', 'toast.error("Selecione uma disciplina para criar tópico.");'],
  [" /> Novo t?pico\n", " /> Novo tópico\n"],
  [">Coment?rios<", ">Comentários<"],
  ['placeholder="Observa??es sobre o estudo"', 'placeholder="Observações sobre o estudo"'],
  [">Quest?es<", ">Questões<"],
  [">P?ginas<", ">Páginas<"],
  ['placeholder="In?cio"', 'placeholder="Início"'],
  [">Revis?es<", ">Revisões<"],
  ['Ative &quot;Programar revis?es&quot;', 'Ative &quot;Programar revisões&quot;'],
  ['toast.error("O tempo m?ximo ? 24 horas")', 'toast.error("O tempo máximo é 24 horas")'],
  ["+ Nova categoria?</SelectItem>", "+ Nova categoria…</SelectItem>"],
  [">Selecione?</SelectItem>", ">Selecione…</SelectItem>"],
];

for (const [bad, good] of fffdPairs) {
  if (s.includes(bad)) s = s.split(bad).join(good);
}
for (const [bad, good] of asciiQPairs) {
  if (s.includes(bad)) s = s.split(bad).join(good);
}

// Mojibake / 2 caracteres estranhos: "Opções", "Programar revisões" no JSX
s = s.replace(/Op.{1,4}es do registro/g, "Opções do registro");
s = s.replace(/Programar revis.{1,3}es/g, "Programar revisões");

if (s.includes("\uFFFD")) {
  console.warn("Ainda há U+FFFD no arquivo.");
}

if (s !== orig) {
  fs.writeFileSync(file, s, "utf8");
  console.log("OK — UTF-8 corrigido:", file);
} else {
  console.log("Nada a alterar (já OK).");
}

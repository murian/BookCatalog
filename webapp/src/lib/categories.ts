import type { Book } from '../types'
import { settings } from './settings'

export type CategoryGroup = 'Fiction' | 'Non-fiction'

interface CategoryDef {
  name: string
  group: CategoryGroup
  /** Children's books and comics can be fiction or not, so the fiction signal neither helps nor hurts them. */
  kind: 'fiction' | 'nonfiction' | 'either'
  match: RegExp
  /** Must match as well, e.g. "Brazilian" only counts next to a word like "fiction" or "literatura". */
  require?: RegExp
  exclude?: RegExp
  weight?: number
}

// Shelf order: fiction first, then non-fiction, the way bookshops lay things out. Patterns run on
// subjects lowercased with accents and punctuation removed, in English, Portuguese and Spanish.
const TAXONOMY: CategoryDef[] = [
  {
    name: 'Literary fiction',
    group: 'Fiction',
    kind: 'fiction',
    match:
      /\b(literary fiction|fiction literary|ficcao literaria|ficcion literaria|contemporary fiction|fiction contemporary|ficcao contemporanea|psychological fiction|fiction psychological|bildungsroman|magic(al)? realism|realismo magico|literary collections|anthologies|antologias?|short stories|fiction short stories|contos|cuentos|cronicas)\b/,
    // The default shelf for fiction, so any more specific genre wins over it.
    weight: 0.8,
  },
  {
    name: 'Classics',
    group: 'Fiction',
    kind: 'fiction',
    match: /\b(classics|classicos|clasicos|classic (literature|fiction|novels?)|literatura classica|greek literature|latin literature|literatura grega|literatura latina)\b/,
  },
  {
    name: 'Brazilian literature',
    group: 'Fiction',
    kind: 'fiction',
    match: /\b(brazilian|brasileir[ao]s?|brasilen[ao]s?|brasil|brazil)\b/,
    require: /\b(fiction|ficcao|ficcion|literature|literatura|novels?|romances?|contos|short stories|cronicas)\b/,
    // Brazilian poetry and plays go with poetry and plays.
    exclude: /\b(poetry|poesia|poemas|teatro|drama|plays)\b/,
    weight: 1.5,
  },
  {
    name: 'Science fiction & fantasy',
    group: 'Fiction',
    kind: 'fiction',
    match:
      /\b(science fiction|sci fi|scifi|ficcao cientifica|ficcion cientifica|fantasy|fantasia|fantastic fiction|ficcao fantastica|literatura fantastica|dystopi\w*|distopi\w*|space opera|cyberpunk|steampunk|time travel|viagem no tempo|viajes en el tiempo|extraterrestrial\w*|life on other planets|vida em outros planetas|interplanetary voyages|wizards?|dragons?|dragoes|dragones|alternative histor(y|ies)|historia alternativa)\b/,
  },
  {
    name: 'Mystery & thriller',
    group: 'Fiction',
    kind: 'fiction',
    match:
      /\b(myster(y|ies)|misterio|misterios|thrillers?|suspense|suspenso|crime fiction|fiction crime|romances? polic\w+|novela policiaca|novela negra|policial|policiais|policiaco|policiaca|detective\w*|detetive\w*|private investigators|espionage|espionagem|espionaje|spy stories|spies|noir)\b/,
    exclude: /\b(true crime|crime verdadeiro|unsolved mysteries|mysteries religious|occult)\b/,
  },
  {
    // Not plain "romance": in Portuguese that just means novel.
    name: 'Romance',
    group: 'Fiction',
    kind: 'fiction',
    match:
      /\b(romance novels?|romance fiction|fiction romance|love stories|historias de amor|romantic (fiction|suspense|comedy)|chick lit|romance romantico|literatura romantica|novelas? romanticas?)\b/,
  },
  {
    name: 'Horror',
    group: 'Fiction',
    kind: 'fiction',
    match:
      /\b(horror|terror|ghost stories|historias de fantasmas|haunted houses?|casas assombradas|vampires?|vampiros?|zombies?|zumbis?|werewolves|lobisomens?|supernatural fiction|fiction supernatural|occult fiction|fiction occult|paranormal fiction|fiction paranormal)\b/,
  },
  {
    name: 'Historical fiction',
    group: 'Fiction',
    kind: 'fiction',
    match:
      /\b(historical fiction|fiction historical|historical novels?|romances? historicos?|novelas? historicas?|ficcao historica|ficcion historica|war stories|war fiction|fiction war|fiction military)\b/,
  },
  {
    // "World War, 1939-1945 -- Fiction": a historical subject marked as fiction.
    name: 'Historical fiction',
    group: 'Fiction',
    kind: 'fiction',
    match: /\b(history|historia|world war|guerra mundial|civil war|guerra civil|revolution|revolucao|revolucion|middle ages|idade media|edad media|medieval|ancient|\d{4} \d{4})\b/,
    require: /\b(fiction|ficcao|ficcion)\b/,
    weight: 0.8,
  },
  {
    name: 'Poetry',
    group: 'Fiction',
    kind: 'fiction',
    match: /\b(poetry|poesia|poesias|poems|poemas|poesie|verse|versos|sonnets|sonetos|haiku|haikais|cordel)\b/,
  },
  {
    name: 'Plays & drama',
    group: 'Fiction',
    kind: 'fiction',
    match: /\b(drama|dramas|plays|theater|theatre|teatro|tragedies|tragedias|tragedy|comedies|comedias|dramaturgia|one act plays|pecas de teatro)\b/,
    exclude: /\b(production and direction|producao e direcao)\b/,
  },
  {
    name: 'Comics & graphic novels',
    group: 'Fiction',
    kind: 'either',
    match:
      /\b(comics?|comic books?|comic strips|graphic novels?|novelas graficas|romances graficos|quadrinhos|historias em quadrinhos|hqs?|manga|mangas|bande dessinee|bandes dessinees|tirinhas|historietas|cartoons|webcomics?)\b/,
    weight: 1.6,
  },
  {
    name: "Children's & young adult",
    group: 'Fiction',
    kind: 'either',
    match:
      /\b(juvenile (fiction|nonfiction|literature|poetry)|childrens?|children s|kids|infantil|infantis|infantojuvenil|infanto juvenil|juvenil|juvenis|young adult|teen|teens|picture books|livros ilustrados|fairy tales|contos de fadas|cuentos de hadas|nursery rhymes|bedtime)\b/,
    exclude:
      /\b(parenting|child rearing|child development|child psychology|psicologia infantil|educacao infantil|criacao de filhos|desenvolvimento infantil|children of|childrens? (health|rights)|children s (health|rights)|child health|saude infantil|pediatri\w*|direitos da crianca|juvenile delinquency|delinquencia juvenil)\b/,
    weight: 1.6,
  },
  {
    name: 'Biography & memoir',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(biograph\w*|biografi\w*|autobiograph\w*|autobiografi\w*|memoirs?|memorias|diaries|diarios|diary|diario|correspondence|correspondencia|personal narratives?|narrativas pessoais|relatos pessoais)\b/,
  },
  {
    name: 'History',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(history|historia|histoire|historical|historico|historica|civilization|civilizacao|civilizacion|world war|guerra mundial|military history|historia militar|civil war|guerra civil|ancient|antiguidade|antiguedad|medieval|middle ages|idade media|edad media|renaissance|renascimento|revolution|revolucao|revolucion|archaeology|arqueologia|colonial|colonization|colonizacao|empire|imperio|dictatorship|ditadura|dictadura|holocaust|holocausto)\b/,
    exclude:
      /\b(historical fiction|fiction historical|historical novels?|romances? historicos?|novelas? historicas?|ficcao historica|ficcion historica|natural history|historia natural|alternative histor(y|ies)|historia alternativa)\b/,
    // History is a facet of almost every topic ("Art -- History"), so the topic itself wins a tie.
    weight: 0.9,
  },
  {
    name: 'Philosophy',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(philosoph\w*|filosofi\w*|filosof\w*|ethics|etica|metaphysics|metafisica|epistemolog\w*|phenomenolog\w*|fenomenolog\w*|existentialism|existencialismo|stoicism|estoicismo|logic|logica|aesthetics)\b/,
  },
  {
    name: 'Religion & spirituality',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(religio\w*|religia\w*|spiritual\w*|espiritual\w*|espiritismo|espirita|spiritism|theolog\w*|teolog\w*|bibles?|biblia\w*|christian\w*|cristianismo|cristao|cristaos|cristiano|catholic\w*|catolic\w*|church|igreja|iglesia|god|deus|dios|jesus|cristo|buddhis\w*|budis\w*|islam\w*|juda\w*|hindu\w*|meditation|meditacao|meditacion|prayers?|oracoes|oracao|body mind spirit|corpo mente espirito|occult\w*|ocult\w*|esoteri\w*|astrolog\w*|tarot|mysticism|misticismo|zen|devotional|devocional)\b/,
  },
  {
    name: 'Psychology',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(psycholog\w*|psicolog\w*|psychiatr\w*|psiquiatr\w*|psychoanaly\w*|psicanali\w*|psicoanali\w*|psychotherap\w*|psicoterap\w*|mental health|saude mental|salud mental|cognitive|cognitiva|cognitivo|neuroscience|neurociencias?|behavior|behaviour|comportamento|emotions|emocoes|emociones|personality|personalidade|anxiety|ansiedade|depression|depressao|trauma|emotional intelligence|inteligencia emocional)\b/,
  },
  {
    name: 'Science & nature',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(science|sciences|ciencia|ciencias|scientific|cientifica|cientifico|physics|fisica|chemistry|quimica|biology|biologia|evolution|evolucao|evolucion|astronom\w*|cosmolog\w*|universe|universo|mathematics|matematica|matematicas|nature|natureza|naturaleza|natural history|historia natural|ecology|ecologia|environment|environmental|meio ambiente|medio ambiente|animals|animais|animales|birds|aves|plants|plantas|botany|botanica|zoology|zoologia|geology|geologia|climate|clima|genetics|genetica|dinosaurs|dinossauros|dinosaurios|oceans?|oceanography|outer space|espaco)\b/,
    exclude:
      /\b(science fiction|ficcao cientifica|ficcion cientifica|sci fi|political science|ciencia politica|ciencias politicas|social sciences?|ciencias sociais|ciencias sociales|computer science|ciencia da computacao|ciencias da computacao|library science|christian science|ciencias da religiao)\b/,
  },
  {
    name: 'Society & politics',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(politic\w*|politica\w*|government|governo|gobierno|sociology|sociologia|social sciences?|ciencias sociais|ciencias sociales|social (conditions|problems|issues|history|justice|movements|classes|change)|current events|atualidades|actualidad|true crime|crime verdadeiro|crimes?|criminology|criminologia|law|laws|direito|derecho|justice|justica|justicia|education|educacao|educacion|pedagogia|pedagogy|feminis\w*|womens rights|women s rights|direitos das mulheres|gender studies|race relations|racism|racismo|racial|human rights|direitos humanos|derechos humanos|journalism|jornalismo|periodismo|anthropology|antropologia|democracy|democracia|capitalism|capitalismo|socialism|socialismo|communism|comunismo|marxism|marxismo|globalization|globalizacao|globalizacion|immigration|imigracao|inmigracion|poverty|pobreza|mass media|social media|redes sociais|urban|world affairs|geopolitics|geopolitica|international relations|relacoes internacionais|terrorism|terrorismo)\b/,
    exclude: /\b(study and teaching|estudo e ensino)\b/,
  },
  {
    name: 'Business & economics',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(business|negocios|economics|economy|economia|economic|economica|economico|finance|financas|finanzas|financial|financeira|financeiro|financiera|investing|investments?|investimentos?|inversiones|money|dinheiro|dinero|management|gestao|gestion|administracao|administracion|marketing|leadership|lideranca|liderazgo|entrepreneurship|empreendedorismo|emprendimiento|startups?|careers?|carreira|carrera|sales|vendas|ventas|accounting|contabilidade|contabilidad|stock market|bolsa de valores|wealth|riqueza)\b/,
  },
  {
    name: 'Self-help',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(self help|autoajuda|auto ajuda|autoayuda|self improvement|self actualization|personal growth|crescimento pessoal|personal development|desenvolvimento pessoal|desarrollo personal|motivation|motivational|motivacao|motivacion|success|sucesso|exito|happiness|felicidade|felicidad|habits?|habitos?|productivity|produtividade|productividad|time management|gestao do tempo|mindfulness|conduct of life|conduta de vida|family relationships|relationships|relacionamentos?|relaciones|parenting|maternidade|paternidade|criacao de filhos|pais e filhos|marriage|casamento|matrimonio|inspiration|inspirational|inspiracao)\b/,
  },
  {
    name: 'Health & wellbeing',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(health|saude|salud|fitness|exercise|exercicios?|ejercicio|nutrition|nutricao|nutricion|diet|diets|dieta|dietas|dietetics|weight loss|emagrecimento|perder peso|wellness|well being|wellbeing|bem estar|bienestar|medicine|medicina|medical|diseases?|doencas?|enfermedades?|yoga|ioga|sleep|sono|sueno|healing|mind body|aging|envelhecimento|envejecimiento|pregnancy|gravidez|embarazo)\b/,
    exclude: /\b(mental health|saude mental|salud mental)\b/,
  },
  {
    name: 'Arts, design & music',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(art|arts|arte|artes|artists?|artistas?|painting|paintings|pintura|drawing|desenho|dibujo|sculpture|escultura|photograph\w*|fotografi\w*|architecture|arquitetura|arquitectura|design|music\w*|musica\w*|film|films|filmes|cinema|motion pictures|movies|peliculas|dance|danca|danza|ballet|performing arts|artes cenicas|fashion|moda|museums?|museus)\b/,
    exclude:
      /\b(language arts|martial arts|artes marciais|artes marciales|culinary arts|arte culinaria|liberal arts|art of war|arte da guerra|art of living|arte de viver|arts and crafts|state of the art)\b/,
  },
  {
    name: 'Travel',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(travel|travels|travelers|viagens?|viajes?|guidebooks?|guias? de viagem|guias? turistic\w*|tourism|turismo|description and travel|descricao e viagens|voyages and travels|viagens e aventuras|adventure travel)\b/,
    exclude: /\b(time travel|viagem no tempo|viajes en el tiempo|interplanetary voyages)\b/,
  },
  {
    name: 'Cooking & food',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(cooking|cookery|cookbooks?|culinaria|culinary|cozinha|cocina|recipes|receitas|recetas|food|foods|comida|alimentos|alimentacao|gastronomia|gastronomy|baking|panificacao|wine|wines|vinhos?|vinos?|beverages|bebidas|cocktails|drinks|coffee|vegan|vegana|vegano|vegetarian|vegetariana|vegetariano)\b/,
  },
  {
    name: 'Technology & computing',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(computers?|computing|computacao|computacion|informatica|programming|programacao|programacion|software|internet|web|technology|tecnologia|engineering|engenharia|ingenieria|electronics|eletronica|electronica|algorithms?|algoritmos?|artificial intelligence|inteligencia artificial|machine learning|data science|ciencia de dados|computer science|ciencia da computacao|ciencias da computacao|robotics|robotica|information technology|tecnologia da informacao|professional technical)\b/,
  },
  {
    name: 'Language & reference',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(language arts|languages?|linguistics|linguistica|grammar|gramatica|dictionar(y|ies)|dicionarios?|diccionarios?|encyclopedias?|enciclopedias?|reference|referencia|foreign language study|idiomas?|lingua portuguesa|lingua inglesa|english language|portuguese language|spanish language|french language|vocabulary|vocabulario|etymology|etimologia|writing|creative writing|escrita|redacao|authorship|style manuals|translating|traducao|study aids|test preparation|atlases|almanacs)\b/,
  },
  {
    name: 'Essays & criticism',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(essays|ensaios|ensayos|essais|literary criticism|critica literaria|criticism and interpretation|critica e interpretacao|history and criticism|historia e critica|literary studies|estudos literarios|literary theory|teoria literaria|criticism|critica)\b/,
  },
  {
    name: 'Sports & hobbies',
    group: 'Non-fiction',
    kind: 'nonfiction',
    match:
      /\b(sports?|esportes?|deportes?|football|futebol|futbol|soccer|basketball|basquete|baloncesto|tennis|tenis|running|corrida|cycling|ciclismo|chess|xadrez|ajedrez|games|jogos|juegos|puzzles|crafts|artesanato|manualidades|hobbies|hobby|gardening|jardinagem|jardineria|fishing|pesca|outdoor\w*|recreation|recreacao|recreacion|martial arts|artes marciais|artes marciales|pets|animais de estimacao|mascotas|house home|home improvement|lifestyle home|antiques|collectibles|colecionismo|transportation|automobiles)\b/,
    exclude: /\b(game theory|teoria dos jogos|teoria de juegos)\b/,
  },
]

export const CATEGORIES = [...new Set(TAXONOMY.map((c) => c.name))]

// Words that mark a subject as fiction (or poetry, plays…) rather than a topic.
const FICTION =
  /\b(fiction|ficcao|ficcion|novels?|novelas?|romances?|contos?|cuentos?|short stories|stories|tales|literature|literatura|poetry|poesia|poems|drama|plays|fantasy|fantasia|sci fi|thrillers?|suspense|horror|comics?|quadrinhos|graphic novels?)\b/
const NONFICTION = /\b(non ?fiction|nao ficcao|no ficcion)\b/
// Subjects about such books rather than one of them: "Poetry -- History and criticism".
const ABOUT_BOOKS = /\b(criticism|critica|study and teaching|estudo e ensino|literary history|historia da literatura)\b/

// Catalog bookkeeping that says nothing about the book.
const NOISE =
  /^(accessible book|protected daisy|in library|lending library|large type books|internet archive wishlist|open library staff picks|long now manual|nyt|new york times|reading level|translations into|books and reading)\b|^(books|livros|libros|ebooks?|e books|kindle|general|bestsellers?|award winners?)$/

export const normSubject = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Subjects as [normalised, original], without noise or duplicates. */
function cleanSubjects(subjects?: (string | null | undefined)[] | null): [string, string][] {
  const seen = new Set<string>()
  const out: [string, string][] = []
  for (const raw of subjects ?? []) {
    const original = raw?.trim()
    if (!original || original.length > 120) continue
    const n = normSubject(original)
    if (!n || NOISE.test(n) || seen.has(n)) continue
    seen.add(n)
    out.push([n, original])
  }
  return out
}

const isFiction = (n: string) => FICTION.test(n) && !NONFICTION.test(n) && !ABOUT_BOOKS.test(n)

/**
 * The category one subject points to. When it names several ("Philosophy / History & Surveys"),
 * the topic named first wins, so each subject counts once.
 */
function classify(n: string): CategoryDef | null {
  let best: { def: CategoryDef; at: number } | null = null
  for (const def of TAXONOMY) {
    const m = def.match.exec(n)
    if (!m || def.exclude?.test(n) || (def.require && !def.require.test(n))) continue
    // "Crime -- Fiction" is a novel, not a book about crime; "Poetry -- History and criticism" is the reverse.
    if (def.kind === 'nonfiction' ? isFiction(n) : ABOUT_BOOKS.test(n)) continue
    if (!best || m.index < best.at || (m.index === best.at && (def.weight ?? 1) > (best.def.weight ?? 1))) best = { def, at: m.index }
  }
  return best?.def ?? null
}

export interface CategorySuggestion {
  name: string
  /** The subjects it's based on, as the databases wrote them. */
  reason: string[]
  /** "low" when the evidence is thin or split; such suggestions are offered but never pre-selected. */
  confidence: 'high' | 'low'
}

/** Suggests a category from the subjects book databases list for a book. Never looks at the title. */
export function suggestCategory(subjects?: (string | null | undefined)[] | null): CategorySuggestion | null {
  const list = cleanSubjects(subjects)
  if (!list.length) return null
  const fictional = list.filter(([n]) => isFiction(n))

  const found = new Map<string, { def: CategoryDef; score: number; reason: string[] }>()
  for (const [n, original] of list) {
    const def = classify(n)
    if (!def) continue
    const entry = found.get(def.name) ?? { def, score: 0, reason: [] }
    entry.score += def.weight ?? 1
    entry.reason.push(original)
    found.set(def.name, entry)
  }

  const hasNonfiction = [...found.values()].some((f) => f.def.kind === 'nonfiction')
  const ranked = [...found.values()].map((f) => ({
    name: f.def.name,
    reason: f.reason,
    // A novel listed under "Ecology" is still a novel; a history book tagged "Mystery" is still history.
    score: f.score * (f.def.kind === 'nonfiction' && fictional.length ? 0.3 : f.def.kind === 'fiction' && !fictional.length && hasNonfiction ? 0.5 : 1),
  }))
  // Plain "Fiction" with no genre: literary fiction is the likeliest shelf, but only a guess.
  if (fictional.length && !ranked.some((r) => TAXONOMY.find((d) => d.name === r.name)!.kind !== 'nonfiction'))
    ranked.push({ name: 'Literary fiction', reason: [fictional[0][1]], score: 0.5 })
  // Stable sort: ties keep shelf order.
  ranked.sort((a, b) => b.score - a.score)

  const [best, second] = ranked
  if (!best) return null
  const confident = best.score >= 0.9 && (!second || best.score >= second.score * 1.5)
  return { name: best.name, reason: best.reason.slice(0, 3), confidence: confident ? 'high' : 'low' }
}

/** The subjects worth keeping on a book: no catalog noise or duplicates, the telling ones first. */
export function usefulSubjects(subjects?: (string | null | undefined)[] | null, max = 6): string[] {
  const list = cleanSubjects(subjects)
  const telling = list.filter(([n]) => classify(n) || isFiction(n))
  return [...new Set([...telling, ...list].map(([, original]) => original))].slice(0, max)
}

/** A book's subjects with ones found online added, so it shows them and needn't be looked up again. */
export function withFoundSubjects(book: Pick<Book, 'categories'>, found: string[]): string[] | null {
  const own = book.categories ?? []
  if (!found.length) return own.length ? own : null
  const merged = usefulSubjects([...own, ...found], Math.max(6, own.length))
  return merged.length ? merged : null
}

// ---------- The user's own names and order ----------

const renames = () => settings.getJson<Record<string, string>>('categoryRenames', {})

/** What the user calls a built-in category, if they renamed it. */
export function categoryName(builtIn: string): string {
  return renames()[builtIn] ?? builtIn
}

/** suggestCategory, using the names the user renamed categories to. */
export function suggestFor(subjects?: (string | null | undefined)[] | null): CategorySuggestion | null {
  const s = suggestCategory(subjects)
  return s && { ...s, name: categoryName(s.name) }
}

/** Remembers a rename, so suggestions and the shelf order follow it. */
export function rememberRename(from: string, to: string) {
  const map = renames()
  for (const [k, v] of Object.entries(map)) if (v === from) map[k] = to
  if (CATEGORIES.includes(from)) map[from] = to
  for (const [k, v] of Object.entries(map)) if (k === v) delete map[k]
  settings.setJson('categoryRenames', map)
  const order = settings.getJson<string[]>('sectionOrder', [])
  if (order.includes(from)) settings.setJson('sectionOrder', [...new Set(order.map((n) => (n === from ? to : n)))])
}

/** The built-in categories under the user's names, grouped for a picker. */
export function builtInCategories(): { group: CategoryGroup; names: string[] }[] {
  const map = renames()
  return (['Fiction', 'Non-fiction'] as const).map((group) => ({
    group,
    names: [...new Set(TAXONOMY.filter((d) => d.group === group).map((d) => map[d.name] ?? d.name))],
  }))
}

/** Categories in use on the user's books. */
export function usedCategories(books: Book[]): string[] {
  return [...new Set(books.map((b) => b.category?.trim()).filter((c): c is string => !!c))].sort(compareText)
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })
export const compareText = (a: string, b: string) => collator.compare(a, b)

/** Section order for the shelf: the user's own arrangement, then the built-in order, then their own categories A–Z. */
export function orderSections(names: string[]): string[] {
  const saved = settings.getJson<string[]>('sectionOrder', [])
  const map = renames()
  const rank = (name: string) => {
    const i = saved.indexOf(name)
    if (i >= 0) return i
    const builtIn = CATEGORIES.findIndex((c) => c === name || map[c] === name)
    return saved.length + (builtIn >= 0 ? builtIn : CATEGORIES.length)
  }
  return [...names].sort((a, b) => rank(a) - rank(b) || compareText(a, b))
}

export function saveSectionOrder(names: string[]) {
  settings.setJson('sectionOrder', names)
}

// ---------- Sorting like a library ----------

// Particles that stay with the surname ("du Maurier", "Van Gogh"). Lowercase Portuguese, Spanish
// and French ones don't: "Assis, Machado de", "Beauvoir, Simone de". Capitalised ones always do.
const KEEP_PARTICLES = new Set(['du', 'le', 'la', 'van', 'von', 'der', 'den', 'del', 'della', 'di', 'mac', 'st', 'st.', 'ten', 'ter', 'zu'])
const PARTICLES = new Set([...KEEP_PARTICLES, 'de', 'da', 'do', 'dos', 'das', 'e', 'y', "d'"])
const SUFFIX = /^(jr\.?|junior|júnior|filho|neto|sobrinho|sr\.?|ii|iii|iv)$/i

/** Splits the first author into [surname, given names]. */
export function splitAuthor(author?: string | null): [string, string] | null {
  const parts = (author ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (!parts.length) return null
  // "Assis, Machado de" or "Le Guin, Ursula K.": already surname first.
  const first = parts[0].split(/\s+/)
  if (parts.length === 2 && (first.length === 1 || (first.length === 2 && PARTICLES.has(first[0].toLowerCase())))) return [parts[0], parts[1]]

  // Otherwise a list of authors, and the first one decides.
  const tokens = first
  if (tokens.length === 1) return [tokens[0], '']
  let start = tokens.length - 1
  if (SUFFIX.test(tokens[start]) && start > 1) start--
  while (start > 1) {
    const prev = tokens[start - 1]
    const capitalised = prev[0] !== prev[0].toLowerCase()
    if (!PARTICLES.has(prev.toLowerCase()) || (!capitalised && !KEEP_PARTICLES.has(prev))) break
    start--
  }
  return [tokens.slice(start).join(' '), tokens.slice(0, start).join(' ')]
}

/** "Machado de Assis" → "Assis, Machado de", the way a library catalog files authors. */
export function displayAuthor(author?: string | null): string {
  const s = splitAuthor(author)
  if (!s) return ''
  return s[1] ? `${s[0]}, ${s[1]}` : s[0]
}

/** Titles file under their first word after an article: "The Hobbit" under H, "O Alquimista" under A. */
export function titleSortKey(title: string): string {
  const t = title.trim()
  return t.replace(/^(the|an?|os?|as|um|uma|el|las?|los|une?|les?)\s+(?=\S)/i, '').replace(/^l['’](?=\S)/i, '') || t
}

export function compareByTitle(a: Book, b: Book) {
  return compareText(titleSortKey(a.title), titleSortKey(b.title))
}

/** By surname, then given names, then title; books without an author go last. */
export function compareByAuthor(a: Book, b: Book) {
  const sa = splitAuthor(a.author)
  const sb = splitAuthor(b.author)
  if (!sa || !sb) return sa ? -1 : sb ? 1 : compareByTitle(a, b)
  return compareText(sa[0], sb[0]) || compareText(sa[1], sb[1]) || compareByTitle(a, b)
}

export interface Section {
  /** null for books without a category. */
  name: string | null
  books: Book[]
}

/** Books grouped into shelf sections, in shelf order, each sorted by author (or title). */
export function groupByCategory(books: Book[], by: 'author' | 'title' = 'author'): Section[] {
  const groups = new Map<string | null, Book[]>()
  for (const b of books) {
    const k = b.category?.trim() || null
    groups.set(k, [...(groups.get(k) ?? []), b])
  }
  const names = orderSections([...groups.keys()].filter((k): k is string => !!k))
  const compare = by === 'title' ? compareByTitle : compareByAuthor
  return [...names, ...(groups.has(null) ? [null] : [])].map((name) => ({ name, books: [...groups.get(name)!].sort(compare) }))
}

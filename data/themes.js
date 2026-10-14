import { publishedRecords } from "./editorial.js";

// Curated themes, reading paths, search filters, and affinity questions.
export const topicThemeRecords = [
    { id: "dominio-publico", editorialStatus: "publicado", label: "Domínio público", query: "subject:fantasy", description: "Obras com leitura pública indicada pela Open Library.", publicDomain: true },
    { id: "elfos-e-feeria", editorialStatus: "publicado", label: "Elfos e feeria", query: "elves fantasy", description: "Cortes feericas, bosques e reinos encantados." },
    { id: "mitologia-celta", editorialStatus: "publicado", label: "Mitologia celta", query: "\"celtic mythology\" fantasy", description: "Sidhe, druidas, simbolos e velhas lendas." },
    { id: "lendas-arturianas", editorialStatus: "publicado", label: "Lendas arturianas", query: "\"arthurian romance\"", description: "Camelot, Avalon e reliquias do reino." },
    { id: "espadas-e-reinos", editorialStatus: "publicado", label: "Espadas e reinos", query: "subject:fantasy", description: "Jornadas, herois e paisagens de saga." },
    { id: "magia-e-feiticaria", editorialStatus: "publicado", label: "Magia e feiticaria", query: "\"magic fantasy\"", description: "Feiticos, grimorios e aprendizes do arcano." },
    { id: "dragoes-e-criaturas", editorialStatus: "publicado", label: "Dragoes e criaturas", query: "\"dragons fantasy\"", description: "Bestiarios, monstros e folego antigo." },
    { id: "bosques-encantados", editorialStatus: "publicado", label: "Bosques encantados", query: "\"fairy tales\" forest", description: "Trilhas verdes e maravilhas do mato." },
    { id: "castelos-medievais", editorialStatus: "publicado", label: "Castelos medievais", query: "\"medieval fantasy\"", description: "Pedra, brasoes e ecos de corte." }
];

export const topicThemes = publishedRecords(topicThemeRecords);

export const readingPathRecords = [
    {
        id: "elfica",
        editorialStatus: "publicado",
        name: "Trilha Elfica",
        description: "Ideal para quem quer delicadeza feerica, bosques antigos, corte encantada e aquele sentimento de maravilha que parece vir de outra estacao do mundo.",
        focusLabel: "Elfos e feeria",
        focusQuery: "elves fantasy",
        bookIds: ["elfland", "phantastes", "princesa-goblin"],
        accent: "#cfe2af"
    },
    {
        id: "mitica",
        editorialStatus: "publicado",
        name: "Trilha Celta e Mitica",
        description: "Feita para leitores atraidos por nevoa ritual, simbolos, lendas antigas e fantasia com cheiro de mito oral e paisagem ancestral.",
        focusLabel: "Mitologia celta",
        focusQuery: "\"celtic mythology\" fantasy",
        bookIds: ["phantastes", "well-world-end", "elfland"],
        accent: "#dcbf83"
    },
    {
        id: "medieval",
        editorialStatus: "publicado",
        name: "Trilha Medieval de Estrada",
        description: "Boa para quem quer castelos, jornada, destino, corte, estrada e um senso de aventura de cronica antiga sem perder o encanto literario.",
        focusLabel: "Castelos medievais",
        focusQuery: "\"medieval fantasy\"",
        bookIds: ["well-world-end", "princesa-goblin", "elfland"],
        accent: "#c7a77b"
    },
    {
        id: "iniciatica",
        editorialStatus: "publicado",
        name: "Trilha Onirica e Iniciatica",
        description: "Pensada para quem prefere fantasia contemplativa, simbolica e transformadora, em que a paisagem exterior tambem e uma travessia interior.",
        focusLabel: "Bosques encantados",
        focusQuery: "\"fairy tales\" forest",
        bookIds: ["phantastes", "elfland", "well-world-end"],
        accent: "#95c1b2"
    }
];

export const readingPaths = publishedRecords(readingPathRecords);

export const advancedFilters = [
    {
        id: "clima",
        label: "Clima",
        defaultValue: "todos",
        options: [
            { value: "todos", label: "Tudo" },
            { value: "elfico", label: "Elfico" },
            { value: "mitico", label: "Mitico" },
            { value: "medieval", label: "Medieval" },
            { value: "iniciatico", label: "Iniciatico" }
        ]
    },
    {
        id: "dificuldade",
        label: "Leitura",
        defaultValue: "todos",
        options: [
            { value: "todos", label: "Qualquer nivel" },
            { value: "entrada", label: "Entrada" },
            { value: "intermediario", label: "Intermediario" },
            { value: "denso", label: "Denso" }
        ]
    },
    {
        id: "motivo",
        label: "Motivo central",
        defaultValue: "todos",
        options: [
            { value: "todos", label: "Todos" },
            { value: "feerico", label: "Feeria" },
            { value: "mitologia", label: "Mitologia" },
            { value: "cavaleiros", label: "Cavalaria" },
            { value: "magia", label: "Magia" },
            { value: "criaturas", label: "Criaturas" }
        ]
    }
];

export const affinityQuestions = [
    {
        id: "entrada",
        title: "Qual portal te chama primeiro?",
        options: [
            { value: "bosque", label: "Bosque elfico", description: "Encanto, folhas, luar e estranheza suave.", scores: { elfica: 3, iniciatica: 1 } },
            { value: "mito", label: "Lenda antiga", description: "Sons rituais, ilha, sidhe e memoria oral.", scores: { mitica: 3, elfica: 1 } },
            { value: "castelo", label: "Castelo e corte", description: "Pedra, brasao, jornada e promessa.", scores: { medieval: 3 } },
            { value: "sonho", label: "Sonho simbolico", description: "Paisagem interior, metafora e travessia intima.", scores: { iniciatica: 3, mitica: 1 } }
        ]
    },
    {
        id: "ritmo",
        title: "Que ritmo combina com voce?",
        options: [
            { value: "contemplativo", label: "Contemplativo", description: "Leitura mais atmosferica e lenta.", scores: { iniciatica: 2, elfica: 1 } },
            { value: "aventureiro", label: "Aventureiro", description: "Andar rapido, perigo e descoberta.", scores: { medieval: 2, elfica: 1 } },
            { value: "ritual", label: "Ritual", description: "Peso mitico, simbolos e solenidade.", scores: { mitica: 2 } },
            { value: "equilibrado", label: "Equilibrado", description: "Mistura de beleza, trama e movimento.", scores: { elfica: 1, medieval: 1, mitica: 1 } }
        ]
    },
    {
        id: "magia",
        title: "Como voce prefere a magia?",
        options: [
            { value: "sutil", label: "Encantamento sutil", description: "Misterio delicado e presenca quase invisivel.", scores: { elfica: 2, iniciatica: 1 } },
            { value: "mitica", label: "Mito e simbolo", description: "Magia como linguagem de lenda.", scores: { mitica: 2, iniciatica: 1 } },
            { value: "feiticaria", label: "Feitico e maravilha", description: "Sensacao de mundo encantado bem visivel.", scores: { elfica: 1, medieval: 1 } },
            { value: "destino", label: "Destino e prova", description: "Jornada, promessa e transformacao.", scores: { medieval: 2, mitica: 1 } }
        ]
    },
    {
        id: "paisagem",
        title: "Em que cenario voce quer entrar?",
        options: [
            { value: "verde", label: "Floresta viva", description: "Caminhos verdes, nevoa e claridade feerica.", scores: { elfica: 2, iniciatica: 1 } },
            { value: "ilha", label: "Nevoa ritual", description: "Ilhas, costa, lenda e chamada antiga.", scores: { mitica: 2 } },
            { value: "estrada", label: "Estrada medieval", description: "Ponte, corte, cavaleiro e horizonte.", scores: { medieval: 2 } },
            { value: "espelho", label: "Paisagem interior", description: "Sonho, prova intima e simbolo.", scores: { iniciatica: 2, mitica: 1 } }
        ]
    }
];

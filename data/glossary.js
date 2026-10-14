import { publishedRecords } from "./editorial.js";

// Curated glossary entries for fantasy literature.
export const glossaryRecords = [
    {
        id: "feeria",
        editorialStatus: "publicado",
        term: "Feeria",
        category: "Atmosfera",
        short: "O territorio do maravilhoso elfico e das cortes encantadas.",
        long: "Feeria nomeia o sentimento de mundo encantado ligado a fadas, elfos, musica, brilho e estranheza antiga. Nao e apenas um lugar: e uma qualidade de presenca."
    },
    {
        id: "sidhe",
        editorialStatus: "publicado",
        term: "Sidhe",
        category: "Mitologia celta",
        short: "Povo feerico associado a montes, nevoas e outro mundo.",
        long: "Na tradicao celta, os sidhe aparecem como seres ligados ao outro mundo, a moradas ocultas e a uma nobreza estranha. Sao fundamentais para o tom mitico de muitas fantasias celtas."
    },
    {
        id: "avalon",
        editorialStatus: "publicado",
        term: "Avalon",
        category: "Arturiano",
        short: "Ilha simbolica das lendas do rei Artur.",
        long: "Avalon representa cura, misterio, nevoa ritual e passagem entre mundos. Em fantasia, costuma marcar o encontro entre realeza ferida, memoria e promessa de retorno."
    },
    {
        id: "mundo-secundario",
        editorialStatus: "publicado",
        term: "Mundo secundario",
        category: "Teoria do genero",
        short: "Universo ficcional com regras proprias e coerencia interna.",
        long: "Quando um autor constri um mundo secundario, ele cria geografia, historia, linguas, criaturas e valores que fazem esse universo parecer habitavel."
    },
    {
        id: "quest",
        editorialStatus: "publicado",
        term: "Quest",
        category: "Estrutura narrativa",
        short: "Jornada em busca de um objeto, um lugar ou uma transformacao.",
        long: "A quest e a busca cerimonial da fantasia: um caminho que mistura deslocamento fisico, prova moral e mudanca interior."
    },
    {
        id: "sword-and-sorcery",
        editorialStatus: "publicado",
        term: "Sword and sorcery",
        category: "Subgenero",
        short: "Fantasia mais corporal, perigosa e centrada em aventura.",
        long: "Nesse subgenero, o foco costuma estar em conflitos imediatos, magia visivel, duelos, monstros e sobrevivencia, em vez de grandes genealogias ou cosmologias."
    },
    {
        id: "alta-fantasia",
        editorialStatus: "publicado",
        term: "Alta fantasia",
        category: "Subgenero",
        short: "Fantasia de grande escala, geralmente em mundo proprio.",
        long: "A alta fantasia opera em um registro amplo: reinos, guerras, linguas, povos e destinos coletivos. Tolkien virou seu exemplo mais conhecido."
    },
    {
        id: "fantasia-iniciatica",
        editorialStatus: "publicado",
        term: "Fantasia iniciatica",
        category: "Leitura",
        short: "Narrativa em que o percurso exterior tambem e uma formacao interior.",
        long: "Aqui a viagem funciona como rito de passagem. O leitor acompanha o protagonista por paisagens que refletem medo, desejo, amadurecimento e revelacao."
    },
    {
        id: "bestiario",
        editorialStatus: "publicado",
        term: "Bestiario",
        category: "Imagario",
        short: "Conjunto de criaturas, monstros e seres de um universo.",
        long: "Um bestiario ajuda a medir o tom de um mundo fantastico, revelando se ele privilegia encanto, perigo, humor sombrio ou maravilha."
    },
    {
        id: "cronica-antiga",
        editorialStatus: "publicado",
        term: "Cronica antiga",
        category: "Estilo",
        short: "Prosa que soa como registro oral ou memorial de eras passadas.",
        long: "Esse estilo aproxima a fantasia de uma voz historica, cerimonial ou quase liturgica, muito comum em obras de sabor medieval."
    },
    {
        id: "outro-mundo",
        editorialStatus: "publicado",
        term: "Outro mundo",
        category: "Mitologia",
        short: "Espaco vizinho ao humano, mas regido por outras leis.",
        long: "O outro mundo pode aparecer como floresta, ilha, monte, salao ou reino secreto. Ele costuma embaralhar tempo, desejo e identidade."
    },
    {
        id: "materia-arturiana",
        editorialStatus: "publicado",
        term: "Materia arturiana",
        category: "Arturiano",
        short: "Conjunto de narrativas ligadas a Artur, Camelot e seus circulos.",
        long: "A materia arturiana sustenta boa parte do imaginario medieval fantastico, de espadas lendarias a ilhas veladas, profecias e reis feridos."
    }
];

export const glossaryTerms = publishedRecords(glossaryRecords);

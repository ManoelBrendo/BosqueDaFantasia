import { publishedRecords } from "./editorial.js";

// Curated author records shown in the authors section.
export const authorRecords = [
    {
        id: "tolkien",
        editorialStatus: "publicado",
        name: "J. R. R. Tolkien",
        status: "Renomado",
        summary: "O grande arquiteto da fantasia moderna de mundo secundario, com linguas, historia profunda e senso de perda ancestral.",
        bestFor: "Leitores que querem densidade de mundo, povos bem construidos e horizonte mitico.",
        climate: "Epico, melancolico e ancestral.",
        startWith: "O Hobbit, depois O Senhor dos Aneis.",
        legacy: "Praticamente toda fantasia posterior dialoga com a escala de mundo, a filologia e o imaginario de Tolkien.",
        works: ["O Hobbit", "O Senhor dos Aneis", "O Silmarillion"]
    },
    {
        id: "leguin",
        editorialStatus: "publicado",
        name: "Ursula K. Le Guin",
        status: "Renomada",
        summary: "Mostra que fantasia tambem pode ser equilibrio, linguagem precisa, silencio e pensamento moral.",
        bestFor: "Quem quer fantasia contemplativa, inteligente e centrada em transformacao interior.",
        climate: "Maritimo, ritual e profundamente humano.",
        startWith: "Um Feiticeiro de Terramar.",
        legacy: "Expandiu o genero para territrios de sutileza filosofica e imagetica depurada.",
        works: ["Um Feiticeiro de Terramar", "As Tumbas de Atuan", "A Mais Longinqua Praia"]
    },
    {
        id: "dunsany",
        editorialStatus: "publicado",
        name: "Lord Dunsany",
        status: "Pouco lembrado",
        summary: "Mestre do sonho feerico, da distancia mitica e da frase que parece vir de uma lenda recitada a meia-luz.",
        bestFor: "Quem busca um tom elfico mais puro, nebuloso e musical.",
        climate: "Regio, nebuloso e quase liturgico.",
        startWith: "A Filha do Rei de Elfland.",
        legacy: "Foi uma ponte importante entre mito artificial, prosa encantatoria e a fantasia do seculo XX.",
        works: ["A Filha do Rei de Elfland", "The Gods of Pegana", "The Book of Wonder"]
    },
    {
        id: "morris",
        editorialStatus: "publicado",
        name: "William Morris",
        status: "Pouco lembrado",
        summary: "Une artesanato medieval, jornada, paisagem pastoral e linguagem de romance antigo em uma fantasia de forte textura historica.",
        bestFor: "Leitores atraidos por estrada, corte, destino e sensacao de mundo artesanal.",
        climate: "Medieval, cerimonial e pastoral.",
        startWith: "O Poco no Fim do Mundo.",
        legacy: "Seu medievalismo imaginativo foi decisivo para o formato de quest e para o gosto por mundos pre-industriais.",
        works: ["O Poco no Fim do Mundo", "The Wood Beyond the World", "The House of the Wolfings"]
    },
    {
        id: "macdonald",
        editorialStatus: "publicado",
        name: "George MacDonald",
        status: "Ancestral do genero",
        summary: "Uma das fontes mais antigas da fantasia moderna, combinando fe, simbolismo e maravilhamento em narrativas de passagem.",
        bestFor: "Quem gosta de fantasia iniciatica, com atmosfera de sonho e imaginario moral.",
        climate: "Onirico, terno e simbolico.",
        startWith: "Fantastes ou A Princesa e o Goblin.",
        legacy: "Influenciou C. S. Lewis, Tolkien e muitos autores que enxergaram a fantasia como forma de revelacao interior.",
        works: ["Fantastes", "A Princesa e o Goblin", "Lilith"]
    },
    {
        id: "mirrlees",
        editorialStatus: "publicado",
        name: "Hope Mirrlees",
        status: "Cultuada",
        summary: "Uma voz rara, estranha e sofisticada, capaz de misturar cidade, magia e atmosfera de nevoa intelectual.",
        bestFor: "Leitores que querem algo singular, de fantasia antiga mas menos previsivel.",
        climate: "Nebuloso, urbano e feerico.",
        startWith: "Lud-in-the-Mist.",
        legacy: "Virou referencia cult para escritores que procuram fantasia com estranheza e refinamento literario.",
        works: ["Lud-in-the-Mist"]
    },
    {
        id: "lewis",
        editorialStatus: "publicado",
        name: "C. S. Lewis",
        status: "Renomado",
        summary: "Construiu uma fantasia de portal marcada por simbolismo, aventura, alegoria e a descoberta de um mundo além do cotidiano.",
        bestFor: "Quem quer uma entrada acessível, imaginativa e cheia de criaturas, reinos e escolhas morais.",
        climate: "Aventureiro, simbólico e luminoso.",
        startWith: "O Leão, a Feiticeira e o Guarda-Roupa.",
        legacy: "As Crônicas de Nárnia se tornaram uma das portas mais populares para a fantasia de mundos paralelos.",
        works: ["O Leão, a Feiticeira e o Guarda-Roupa", "A Viagem do Peregrino da Alvorada", "A Última Batalha"]
    },
    {
        id: "eddison",
        editorialStatus: "publicado",
        name: "E. R. Eddison",
        status: "Cultuado",
        summary: "Escreveu fantasias de escala mítica, linguagem arcaica e conflitos grandiosos entre reinos de beleza perigosa.",
        bestFor: "Leitores que desejam épica antiga, prosa solene e disputas de poder em mundos inventados.",
        climate: "Heroico, trágico e cerimonial.",
        startWith: "A Serpente Uróboros.",
        legacy: "Sua prosa influenciou a fantasia épica ao tratar o mundo imaginário como uma saga de proporções lendárias.",
        works: ["A Serpente Uróboros", "Meysor de Zimiamvia"]
    },
    {
        id: "peake",
        editorialStatus: "publicado",
        name: "Mervyn Peake",
        status: "Cultuado",
        summary: "Criou um castelo labiríntico e uma fantasia gótica de atmosfera densa, personagens excêntricos e decadência familiar.",
        bestFor: "Quem prefere ambientes sombrios, arquitetura imaginária e personagens mais estranhos do que heroicos.",
        climate: "Gótico, claustrofóbico e barroco.",
        startWith: "Titus Groan.",
        legacy: "A trilogia de Gormenghast ampliou os limites da fantasia ao trocar a aventura convencional por atmosfera e obsessão.",
        works: ["Titus Groan", "Gormenghast", "Titus Alone"]
    },
    {
        id: "diana-wynne-jones",
        editorialStatus: "publicado",
        name: "Diana Wynne Jones",
        status: "Renomada",
        summary: "Misturou humor, magia cotidiana, famílias improváveis e mundos paralelos em histórias inteligentes e acolhedoras.",
        bestFor: "Leitores que querem fantasia inventiva, leve e cheia de personagens carismáticos.",
        climate: "Brincalhão, mágico e caloroso.",
        startWith: "O Castelo Animado.",
        legacy: "Sua obra mostrou que fantasia juvenil pode ser sofisticada, engraçada e estruturalmente surpreendente.",
        works: ["O Castelo Animado", "O Castelo no Ar", "A Casa dos Muitos Caminhos"]
    },
    {
        id: "pratchett",
        editorialStatus: "publicado",
        name: "Terry Pratchett",
        status: "Renomado",
        summary: "Usou uma cidade-mundo fantástica para satirizar costumes, instituições e os próprios clichês da literatura de fantasia.",
        bestFor: "Quem busca humor, crítica social e um universo vasto que pode ser explorado por várias portas.",
        climate: "Cômico, urbano e irreverente.",
        startWith: "A Cor da Magia ou Mort.",
        legacy: "Discworld provou que a fantasia cômica pode ter profundidade, continuidade e uma visão social própria.",
        works: ["A Cor da Magia", "Mort", "Guardiões! Guardiões!"]
    },
    {
        id: "clarke",
        editorialStatus: "publicado",
        name: "Susanna Clarke",
        status: "Contemporânea",
        summary: "Reimagina a tradição inglesa de magia com erudição, melancolia e uma relação inquieta entre livros, história e encantamento.",
        bestFor: "Quem gosta de fantasia histórica, magia sutil e narrativas com humor seco e atmosfera elegante.",
        climate: "Histórico, melancólico e encantado.",
        startWith: "Jonathan Strange & Mr Norrell.",
        legacy: "Sua obra aproximou a fantasia contemporânea da tradição literária, do folclore inglês e da ficção histórica.",
        works: ["Jonathan Strange & Mr Norrell", "Os Dentes do Cão"]
    }
];

export const authorsCatalog = publishedRecords(authorRecords);

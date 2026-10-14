export const DEFAULT_QUERY = "subject:fantasy";
export const DEFAULT_LABEL = "Espadas e reinos";
export const RESULTS_PER_PAGE = 9;

export const featuredBooks = [
    {
        id: "elfland",
        title: "The King of Elfland's Daughter",
        originalTitle: "The King of Elfland's Daughter",
        titleLanguage: "en",
        portugueseTitle: "A Filha do Rei de Elfland",
        author: "Lord Dunsany",
        year: "1924",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Hunting%20of%20the%20Unicorn%20by%20Samuel%20Simes%2C%20Frontispiece%20to%20The%20King%20of%20Elfland%27s%20Daughter.png?width=720",
        description: "Quando um reino humano exige um toque de magia, o principe Alveric parte para Elfland e traz de la a filha do rei. O encontro entre ambos abala as fronteiras entre a vida comum e um mundo feerico que nao obedece ao tempo dos homens.",
        aura: "Feerico, regio e melancolico",
        difficulty: "Entrada contemplativa",
        difficultyKey: "entrada",
        themes: ["elfos", "feeria", "reinos encantados", "fronteiras entre mundos"],
        readerProfile: "Ideal para quem quer entrar na fantasia pelo encanto, pela musica do texto e por uma sensacao de maravilha antiga.",
        whyRead: "E um dos caminhos mais puros para sentir o tom elfico classico antes mesmo de chegar a obras mais densas do genero.",
        authorNote: "Lord Dunsany ajudou a formar a imagetica onirica que depois influenciaria boa parte da fantasia moderna.",
        publicDomain: true,
        readUrl: "https://openlibrary.org/works/OL1136778W/The_King_of_Elfland%27s_Daughter",
        paths: ["elfica", "mitica"],
        filters: {
            clima: "elfico",
            dificuldade: "entrada",
            motivo: "feerico"
        },
        purchaseUrl: "#compra"
    },
    {
        id: "phantastes",
        title: "Phantastes",
        originalTitle: "Phantastes",
        titleLanguage: "en",
        portugueseTitle: "Fantastes",
        author: "George MacDonald",
        year: "1858",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Phantastes%20Title%20Page%201894.jpg?width=720",
        description: "Depois de herdar uma chave misteriosa, Anodos desperta em uma terra encantada e atravessa florestas, palacios e provacoes interiores. A jornada funciona ao mesmo tempo como conto de maravilhamento e travessia espiritual.",
        aura: "Onirico, simbolico e iniciatico",
        difficulty: "Intermediario lirico",
        difficultyKey: "intermediario",
        themes: ["bosques encantados", "simbolismo", "viagem interior", "maravilhamento"],
        readerProfile: "Bom para leitores que gostam de fantasia mais atmosferica, simbologica e com espaco para interpretacao.",
        whyRead: "Mostra que fantasia tambem pode ser introspeccao, imagetica espiritual e descoberta de si por meio do maravilhoso.",
        authorNote: "George MacDonald e um dos ancestrais mais importantes da fantasia literaria, sobretudo na tradicao mais contemplativa.",
        publicDomain: true,
        readUrl: "https://openlibrary.org/works/OL15520W/Phantastes",
        paths: ["elfica", "iniciatica", "mitica"],
        filters: {
            clima: "iniciatico",
            dificuldade: "intermediario",
            motivo: "magia"
        },
        purchaseUrl: "#compra"
    },
    {
        id: "princesa-goblin",
        title: "The Princess and the Goblin",
        originalTitle: "The Princess and the Goblin",
        titleLanguage: "en",
        portugueseTitle: "A Princesa e o Goblin",
        author: "George MacDonald",
        year: "1872",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Princess%20and%20the%20Goblin.jpg?width=720",
        description: "A pequena princesa Irene vive em um castelo ameacado por goblins escondidos no subterraneo. Com a ajuda de Curdie, ela precisa enfrentar perigos, descobrir passagens ocultas e confiar em uma protecao misteriosa que vela pelo reino.",
        aura: "Acolhedor, medieval e aventureiro",
        difficulty: "Entrada aventureira",
        difficultyKey: "entrada",
        themes: ["castelos", "goblins", "aventura juvenil", "protecao invisivel"],
        readerProfile: "Excelente para quem quer uma porta de entrada mais direta, narrativa e calorosa para o fantastico classico.",
        whyRead: "Tem ritmo acessivel, imaginario medieval forte e um senso de protecao encantada que conversa bem com iniciantes.",
        authorNote: "MacDonald mistura simplicidade narrativa com uma base simbolica que ainda recompensa releituras.",
        publicDomain: true,
        readUrl: "https://openlibrary.org/works/OL15524W/The_Princess_and_the_Goblin",
        paths: ["medieval", "elfica"],
        filters: {
            clima: "medieval",
            dificuldade: "entrada",
            motivo: "cavaleiros"
        },
        purchaseUrl: "#compra"
    },
    {
        id: "well-world-end",
        title: "The Well at the World's End",
        originalTitle: "The Well at the World's End",
        titleLanguage: "en",
        portugueseTitle: "O Poço no Fim do Mundo",
        author: "William Morris",
        year: "1896",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Well%20at%20the%20World%27s%20End%2C%20design%20by%20William%20Morris%2C%20Hammersmith%2C%20Kelmscott%20Press%2C%201896%20-%20National%20Gallery%20of%20Art%2C%20Washington%20-%20DSC09794.JPG?width=720",
        description: "Ralph deixa o conforto do lar para procurar um poco lendario ligado a fortuna e ao destino. A estrada o leva por cortes, encontros e provacoes que transformam a busca em um romance de formacao cavaleiresca.",
        aura: "Cavaleiresco, antigo e cerimonial",
        difficulty: "Intermediario medieval",
        difficultyKey: "intermediario",
        themes: ["jornada", "cavaleirismo", "destino", "romance de estrada"],
        readerProfile: "Ideal para quem quer sentir a fantasia medieval antes de Tolkien, com sabor de cronica antiga e caminhar ritual.",
        whyRead: "Ajuda a perceber como o imaginario medieval artesanal e a quest lendaria moldaram a fantasia posterior.",
        authorNote: "William Morris liga literatura, artesanato medieval e visao de mundo pastoral em uma prosa muito particular.",
        publicDomain: true,
        readUrl: "https://openlibrary.org/works/OL15258W/The_Well_at_the_World%27s_End",
        paths: ["medieval", "mitica"],
        filters: {
            clima: "medieval",
            dificuldade: "intermediario",
            motivo: "cavaleiros"
        },
        purchaseUrl: "#compra"
    },
    {
        id: "alice-wonderland",
        title: "Alice's Adventures in Wonderland",
        originalTitle: "Alice's Adventures in Wonderland",
        titleLanguage: "en",
        portugueseTitle: "Alice no País das Maravilhas",
        author: "Lewis Carroll",
        year: "1865",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Alice%27s%20Adventures%20in%20Wonderland%20-%20Carroll%2C%20Robinson%20-%20Scribner%27s%201906.djvu?page=11&width=720",
        description: "Alice atravessa uma toca e encontra um mundo de lógica torta, jogos de linguagem, criaturas excêntricas e mudanças constantes de tamanho e sentido.",
        aura: "Surreal, lúdico e inquietante",
        difficulty: "Entrada inventiva",
        difficultyKey: "entrada",
        themes: ["maravilha", "sonho", "criaturas fantasticas", "absurdo"],
        readerProfile: "Boa escolha para quem gosta de fantasia estranha, rápida e cheia de humor verbal.",
        whyRead: "É uma das portas mais famosas para o maravilhoso moderno, onde a regra principal é a instabilidade da imaginação.",
        authorNote: "Lewis Carroll transformou nonsense, lógica e sonho em uma matriz duradoura para a fantasia posterior.",
        publicDomain: true,
        readUrl: "https://openlibrary.org/works/OL819350W/Alice%27s_Adventures_in_Wonderland",
        paths: ["iniciatica", "elfica"],
        filters: {
            clima: "iniciatico",
            dificuldade: "entrada",
            motivo: "criaturas"
        },
        purchaseUrl: "#compra"
    },
    {
        id: "wizard-oz",
        title: "The Wonderful Wizard of Oz",
        originalTitle: "The Wonderful Wizard of Oz",
        titleLanguage: "en",
        portugueseTitle: "O Maravilhoso Mágico de Oz",
        author: "L. Frank Baum",
        year: "1900",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Wonderful%20Wizard%20of%20Oz%20cover.jpg?width=720",
        description: "Dorothy é levada por um ciclone a uma terra de bruxas, cidades coloridas, companheiros improváveis e provas que misturam aventura, afeto e imaginação popular.",
        aura: "Colorido, aventureiro e luminoso",
        difficulty: "Entrada classica",
        difficultyKey: "entrada",
        themes: ["jornada", "bruxas", "companheiros", "mundo encantado"],
        readerProfile: "Ideal para quem quer uma fantasia acessível, visual e cheia de episódios memoráveis.",
        whyRead: "É um clássico de domínio público que ajuda a entender a fantasia infantil e a jornada de grupo.",
        authorNote: "Baum criou um imaginário americano duradouro, mais solar e episódico que a fantasia medieval europeia.",
        publicDomain: true,
        readUrl: "https://openlibrary.org/works/OL18417W/The_Wonderful_Wizard_of_Oz",
        paths: ["iniciatica", "medieval"],
        filters: {
            clima: "iniciatico",
            dificuldade: "entrada",
            motivo: "magia"
        },
        purchaseUrl: "#compra"
    },
    {
        id: "peter-pan",
        title: "Peter and Wendy",
        originalTitle: "Peter and Wendy",
        titleLanguage: "en",
        portugueseTitle: "Peter Pan",
        author: "J. M. Barrie",
        year: "1911",
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Peter%20and%20Wendy%20-%20cover%2C%201911.jpg?width=720",
        description: "Wendy e seus irmãos voam para a Terra do Nunca, onde infância, aventura, perigo e imaginação convivem em uma paisagem de fadas, piratas e criaturas fantásticas.",
        aura: "Aventureiro, nostálgico e feérico",
        difficulty: "Entrada classica",
        difficultyKey: "entrada",
        themes: ["fadas", "infancia", "aventura", "Terra do Nunca"],
        readerProfile: "Boa entrada para quem busca fantasia rápida, simbólica e marcada por encanto e melancolia.",
        whyRead: "É uma obra central para entender a fantasia de infância e o fascínio por mundos que recusam crescer.",
        authorNote: "Barrie criou uma mitologia moderna sobre infância, memória e fuga imaginativa.",
        publicDomain: true,
        readUrl: "https://openlibrary.org/works/OL138052W/Peter_Pan",
        paths: ["elfica", "iniciatica"],
        filters: {
            clima: "elfico",
            dificuldade: "entrada",
            motivo: "feerico"
        },
        purchaseUrl: "#compra"
    }
];

export const authorsCatalog = [
    {
        id: "tolkien",
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

export const glossaryTerms = [
    {
        term: "Feeria",
        category: "Atmosfera",
        short: "O territorio do maravilhoso elfico e das cortes encantadas.",
        long: "Feeria nomeia o sentimento de mundo encantado ligado a fadas, elfos, musica, brilho e estranheza antiga. Nao e apenas um lugar: e uma qualidade de presenca."
    },
    {
        term: "Sidhe",
        category: "Mitologia celta",
        short: "Povo feerico associado a montes, nevoas e outro mundo.",
        long: "Na tradicao celta, os sidhe aparecem como seres ligados ao outro mundo, a moradas ocultas e a uma nobreza estranha. Sao fundamentais para o tom mitico de muitas fantasias celtas."
    },
    {
        term: "Avalon",
        category: "Arturiano",
        short: "Ilha simbolica das lendas do rei Artur.",
        long: "Avalon representa cura, misterio, nevoa ritual e passagem entre mundos. Em fantasia, costuma marcar o encontro entre realeza ferida, memoria e promessa de retorno."
    },
    {
        term: "Mundo secundario",
        category: "Teoria do genero",
        short: "Universo ficcional com regras proprias e coerencia interna.",
        long: "Quando um autor constri um mundo secundario, ele cria geografia, historia, linguas, criaturas e valores que fazem esse universo parecer habitavel."
    },
    {
        term: "Quest",
        category: "Estrutura narrativa",
        short: "Jornada em busca de um objeto, um lugar ou uma transformacao.",
        long: "A quest e a busca cerimonial da fantasia: um caminho que mistura deslocamento fisico, prova moral e mudanca interior."
    },
    {
        term: "Sword and sorcery",
        category: "Subgenero",
        short: "Fantasia mais corporal, perigosa e centrada em aventura.",
        long: "Nesse subgenero, o foco costuma estar em conflitos imediatos, magia visivel, duelos, monstros e sobrevivencia, em vez de grandes genealogias ou cosmologias."
    },
    {
        term: "Alta fantasia",
        category: "Subgenero",
        short: "Fantasia de grande escala, geralmente em mundo proprio.",
        long: "A alta fantasia opera em um registro amplo: reinos, guerras, linguas, povos e destinos coletivos. Tolkien virou seu exemplo mais conhecido."
    },
    {
        term: "Fantasia iniciatica",
        category: "Leitura",
        short: "Narrativa em que o percurso exterior tambem e uma formacao interior.",
        long: "Aqui a viagem funciona como rito de passagem. O leitor acompanha o protagonista por paisagens que refletem medo, desejo, amadurecimento e revelacao."
    },
    {
        term: "Bestiario",
        category: "Imagario",
        short: "Conjunto de criaturas, monstros e seres de um universo.",
        long: "Um bestiario ajuda a medir o tom de um mundo fantastico, revelando se ele privilegia encanto, perigo, humor sombrio ou maravilha."
    },
    {
        term: "Cronica antiga",
        category: "Estilo",
        short: "Prosa que soa como registro oral ou memorial de eras passadas.",
        long: "Esse estilo aproxima a fantasia de uma voz historica, cerimonial ou quase liturgica, muito comum em obras de sabor medieval."
    },
    {
        term: "Outro mundo",
        category: "Mitologia",
        short: "Espaco vizinho ao humano, mas regido por outras leis.",
        long: "O outro mundo pode aparecer como floresta, ilha, monte, salao ou reino secreto. Ele costuma embaralhar tempo, desejo e identidade."
    },
    {
        term: "Materia arturiana",
        category: "Arturiano",
        short: "Conjunto de narrativas ligadas a Artur, Camelot e seus circulos.",
        long: "A materia arturiana sustenta boa parte do imaginario medieval fantastico, de espadas lendarias a ilhas veladas, profecias e reis feridos."
    }
];

export const topicThemes = [
    { label: "Domínio público", query: "subject:fantasy", description: "Obras com leitura pública indicada pela Open Library.", publicDomain: true },
    { label: "Elfos e feeria", query: "elves fantasy", description: "Cortes feericas, bosques e reinos encantados." },
    { label: "Mitologia celta", query: "\"celtic mythology\" fantasy", description: "Sidhe, druidas, simbolos e velhas lendas." },
    { label: "Lendas arturianas", query: "\"arthurian romance\"", description: "Camelot, Avalon e reliquias do reino." },
    { label: "Espadas e reinos", query: "subject:fantasy", description: "Jornadas, herois e paisagens de saga." },
    { label: "Magia e feiticaria", query: "\"magic fantasy\"", description: "Feiticos, grimorios e aprendizes do arcano." },
    { label: "Dragoes e criaturas", query: "\"dragons fantasy\"", description: "Bestiarios, monstros e folego antigo." },
    { label: "Bosques encantados", query: "\"fairy tales\" forest", description: "Trilhas verdes e maravilhas do mato." },
    { label: "Castelos medievais", query: "\"medieval fantasy\"", description: "Pedra, brasoes e ecos de corte." }
];

export const readingPaths = [
    {
        id: "elfica",
        name: "Trilha Elfica",
        description: "Ideal para quem quer delicadeza feerica, bosques antigos, corte encantada e aquele sentimento de maravilha que parece vir de outra estacao do mundo.",
        focusLabel: "Elfos e feeria",
        focusQuery: "elves fantasy",
        bookIds: ["elfland", "phantastes", "princesa-goblin"],
        accent: "#cfe2af"
    },
    {
        id: "mitica",
        name: "Trilha Celta e Mitica",
        description: "Feita para leitores atraidos por nevoa ritual, simbolos, lendas antigas e fantasia com cheiro de mito oral e paisagem ancestral.",
        focusLabel: "Mitologia celta",
        focusQuery: "\"celtic mythology\" fantasy",
        bookIds: ["phantastes", "well-world-end", "elfland"],
        accent: "#dcbf83"
    },
    {
        id: "medieval",
        name: "Trilha Medieval de Estrada",
        description: "Boa para quem quer castelos, jornada, destino, corte, estrada e um senso de aventura de cronica antiga sem perder o encanto literario.",
        focusLabel: "Castelos medievais",
        focusQuery: "\"medieval fantasy\"",
        bookIds: ["well-world-end", "princesa-goblin", "elfland"],
        accent: "#c7a77b"
    },
    {
        id: "iniciatica",
        name: "Trilha Onirica e Iniciatica",
        description: "Pensada para quem prefere fantasia contemplativa, simbolica e transformadora, em que a paisagem exterior tambem e uma travessia interior.",
        focusLabel: "Bosques encantados",
        focusQuery: "\"fairy tales\" forest",
        bookIds: ["phantastes", "elfland", "well-world-end"],
        accent: "#95c1b2"
    }
];

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

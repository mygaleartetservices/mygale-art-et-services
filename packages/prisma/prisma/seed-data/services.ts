export type SeedSection = {
  key: string
  type: 'BULLET_LIST' | 'RICHTEXT'
  titleFr: string
  titleEn: string
  itemsFr?: string[]
  itemsEn?: string[]
  bodyFr?: string
  bodyEn?: string
  /** path relative to apps/web/public */
  imagePath?: string
  order: number
}

export type SeedService = {
  slug: string
  titleFr: string
  titleEn: string
  summaryFr: string
  summaryEn: string
  /** path relative to apps/web/public */
  heroImagePath: string
  order: number
  featured: boolean
  sections: SeedSection[]
}

export const SEED_SERVICES: SeedService[] = [
  {
    slug: 'architecture',
    titleFr: 'Architecture',
    titleEn: 'Architecture',
    summaryFr:
      'Conception architecturale, gestion de chantier, démarches administratives et services complémentaires pour projets résidentiels et commerciaux.',
    summaryEn:
      'Architectural design, construction management, regulatory assistance and complementary services for residential and commercial projects.',
    heroImagePath: '/architecture.jpg',
    order: 0,
    featured: true,
    sections: [
      {
        key: 'design-feasibility',
        type: 'BULLET_LIST',
        order: 0,
        titleFr: 'Conception et faisabilité',
        titleEn: 'Design & Feasibility',
        imagePath: '/services/architecture/i.png',
        itemsFr: [
          "Conseil et analyse : Étude de la faisabilité du projet, analyse des règles d'urbanisme, estimation du budget et du calendrier.",
          'Conception : Élaboration des plans, esquisses et projets architecturaux pour répondre aux besoins du client.',
          'Choix du terrain : Assistance dans le choix du site approprié pour le projet.',
        ],
        itemsEn: [
          'Consulting & analysis: Feasibility studies, urban planning review, budget and schedule estimation.',
          'Design: Development of plans, sketches and architectural proposals tailored to client needs.',
          'Site selection: Assistance in choosing the most suitable site for the project.',
        ],
      },
      {
        key: 'admin-regulatory',
        type: 'BULLET_LIST',
        order: 1,
        titleFr: 'Démarches administratives et réglementaires',
        titleEn: 'Administrative & regulatory procedures',
        imagePath: '/services/architecture/ii.png',
        itemsFr: [
          'Autorisations : Préparation et soumission des demandes de permis de construire et autres autorisations nécessaires.',
          'Conformité : Assurer que le projet respecte les normes en vigueur.',
        ],
        itemsEn: [
          'Permits: Preparation and submission of building permits and other required approvals.',
          'Compliance: Ensuring projects meet applicable standards and regulations.',
        ],
      },
      {
        // Source SERVICE_DATA referenced "iii.png" for EN which doesn't exist on disk;
        // "c.png" (used by the FR block) is the actual file present under public/services/architecture.
        key: 'construction-management',
        type: 'BULLET_LIST',
        order: 2,
        titleFr: 'Gestion de chantier',
        titleEn: 'Construction Management',
        imagePath: '/services/architecture/c.png',
        itemsFr: [
          'Suivi et pilotage : Coordination de toutes les entreprises et corps de métier sur le chantier.',
          'Gestion financière : Vérification des factures des entreprises et validation pour paiement.',
          'Réunions et comptes-rendus : Organisation de réunions de chantier régulières et rédaction de comptes-rendus.',
          'Livraison : Suivi du projet jusqu’à la livraison finale',
        ],
        itemsEn: [
          'Supervision & coordination: Management of contractors and site activities.',
          'Financial management: Verification and approval of contractor invoices.',
          'Meetings & reporting: Regular site meetings and detailed reports.',
          'Delivery: Follow-up through to final handover.',
        ],
      },
      {
        key: 'complementary-services',
        type: 'BULLET_LIST',
        order: 3,
        titleFr: 'Services complémentaires',
        titleEn: 'Complementary Services',
        imagePath: '/services/architecture/iv.png',
        itemsFr: [
          'Rénovation et réhabilitation : Transformation, agrandissement ou modernisation de bâtiments existants.',
          'Évaluation économique : Estimation des coûts et aide au montage financier.',
          "Décoration intérieure et extérieure : Conception de l'aménagement des espaces.",
          "Appel d'offres : Organisation de la procédure pour sélectionner les entreprises.",
        ],
        itemsEn: [
          'Renovation & rehabilitation: Transformation and modernization of existing buildings.',
          'Economic evaluation: Cost estimation and financial planning support.',
          'Interior & exterior design: Layout and aesthetic design for spaces.',
          'Tender management: Organization and handling of bidding procedures.',
        ],
      },
    ],
  },
  {
    slug: 'stylisme',
    titleFr: 'Stylisme',
    titleEn: 'Fashion Design',
    summaryFr:
      'Stylisme créatif, modélisme, prototypage, et consulting pour collections et productions mode.',
    summaryEn:
      'Creative styling, pattern-making, prototyping and consulting for collections and fashion productions.',
    heroImagePath: '/style.jpg',
    order: 1,
    featured: true,
    sections: [
      {
        key: 'styling-design',
        type: 'BULLET_LIST',
        order: 0,
        titleFr: 'Services de stylisme et de design',
        titleEn: 'Fashion Styling & Design Services',
        imagePath: '/services/stylisme/i.png',
        itemsFr: [
          "Création de croquis et concepts : Réalisation de croquis et de planches tendances pour définir l'univers d'une collection.",
          'Sélection de tissus et de matériaux : Choix des matières et des couleurs en fonction du design et des exigences du projet.',
          "Conception de fiches techniques : Création de fiches détaillées pour la communication avec l'atelier de production.",
          'Conception numérique : Création de silhouettes mode, de textures et de motifs en format numérique.',
        ],
        itemsEn: [
          'Sketches & concepts: Creation of sketches and style-boards to define a collection identity.',
          'Fabric & material selection: Choosing appropriate materials and colors based on the design.',
          'Technical sheets: Detailed documentation for the production workshop.',
          'Digital design: Digital silhouettes, textures and pattern creation.',
        ],
      },
      {
        key: 'pattern-making',
        type: 'BULLET_LIST',
        order: 1,
        titleFr: 'Services de modélisme et de développement de produits',
        titleEn: 'Pattern Making & Product Development',
        imagePath: '/services/stylisme/ii.png',
        itemsFr: [
          'Création de patrons : Élaboration de patrons à plat ou en 3D.',
          'Gradation : Adaptation des tailles des patrons selon les standards.',
          'Moulage : Techniques de moulage sur mannequin.',
          'Développement et prototypage : Confection de prototypes pour tester le fit.',
          'Mise au point industrielle : Adaptation pour la production en série.',
        ],
        itemsEn: [
          'Pattern creation: Flat or 3D patterns developed manually or with software.',
          'Grading: Size adaptation according to industry standards.',
          'Draping: Mannequin-based techniques for complex shapes.',
          'Prototyping & fitting: Making prototypes to test fit and make adjustments.',
          'Industrial tuning: Preparing prototypes for mass production.',
        ],
      },
      {
        key: 'collaboration-consulting',
        type: 'BULLET_LIST',
        order: 2,
        titleFr: 'Services de collaboration et de consulting',
        titleEn: 'Collaboration & Consulting',
        imagePath: '/services/stylisme/iii.png',
        itemsFr: [
          'Consulting mode : Accompagnement des créateurs de la conception à la production.',
          'Réseau de fournisseurs : Mise en relation avec fournisseurs et ateliers.',
          'Solutions éthiques et durables : Intégration de pratiques durables.',
        ],
        itemsEn: [
          'Fashion consulting: Support from concept through production.',
          'Supplier network: Connections with suppliers and workshops.',
          'Sustainable solutions: Implementation of eco-friendly design practices.',
        ],
      },
    ],
  },
  {
    slug: 'printing',
    titleFr: 'Imprimerie Textile',
    titleEn: 'Textile Printing',
    summaryFr:
      'Solutions d’impression sur tissu : sérigraphie et impression numérique professionnelle.',
    summaryEn: 'Textile printing solutions: screen printing and professional digital printing.',
    heroImagePath: '/print.jpg',
    order: 2,
    featured: true,
    sections: [
      {
        key: 'textile-printing',
        type: 'BULLET_LIST',
        order: 0,
        titleFr: 'Impression textile',
        titleEn: 'Textile Printing',
        imagePath: '/services/printing/i.png',
        itemsFr: [
          'Sérigraphie sur tissus',
          'Impression numérique haute qualité',
          'Création de motifs personnalisés',
          'Impression sur vêtements, tissus et accessoires',
        ],
        itemsEn: [
          'Screen printing on fabric',
          'High-resolution digital printing',
          'Custom pattern creation',
          'Printing on garments and accessories',
        ],
      },
      {
        key: 'graphic-services',
        type: 'BULLET_LIST',
        order: 1,
        titleFr: 'Services graphiques',
        titleEn: 'Graphic Services',
        imagePath: '/services/printing/2-ii.png',
        itemsFr: [
          'Correction de visuels',
          'Préparation de fichiers pour impression',
          'Design sur mesure',
        ],
        itemsEn: ['Artwork correction', 'Print-ready preparation', 'Custom design services'],
      },
    ],
  },
  {
    slug: 'vitraux',
    titleFr: 'Vitraux & Miroiterie',
    titleEn: 'Stained Glass & Glazing',
    summaryFr:
      "Conception, fabrication et pose d'ouvrages en verre: vitraux, verrières, façades et menuiseries vitrées.",
    summaryEn:
      'Custom design, fabrication and installation of glassworks: stained glass, skylights, façades and glazing systems.',
    heroImagePath: '/vitreaux.jpg',
    order: 3,
    featured: true,
    sections: [
      {
        key: 'custom-design-fabrication',
        type: 'BULLET_LIST',
        order: 0,
        titleFr: 'Conception et fabrication sur mesure',
        titleEn: 'Custom Design & Fabrication',
        imagePath: '/services/vitraux/i.png',
        itemsFr: [
          'Étude de projet : prise de mesures sur site, conception sur-mesure de fenêtres, portes, baies vitrées, vérandas, pergolas, etc.',
          'Fabrication : découpe des profilés aluminium et du vitrage, assemblage des éléments de menuiserie.',
          'Produits spécifiques : verrières de toit, cloisons aluminium/verre, murs-rideaux, façades.',
        ],
        itemsEn: [
          'Project study: on-site measurements and custom design of windows, doors and large glazing.',
          'Fabrication: cutting of aluminum profiles and glazing, assembly of joinery elements.',
          'Special products: skylights, interior glass partitions, curtain walls and storefront façades.',
        ],
      },
      {
        key: 'installation',
        type: 'BULLET_LIST',
        order: 1,
        titleFr: 'Pose et installation',
        titleEn: 'Installation',
        imagePath: '/services/vitraux/ii.png',
        itemsFr: [
          'Installation d’ouvrages : pose de fenêtres, portes, baies vitrées, vérandas, garde-corps.',
          'Finitions et étanchéité : réalisation de l’étanchéité et des finitions du châssis.',
          'Fixations : fourniture et pose de pattes de scellement et systèmes de fixation.',
        ],
        itemsEn: [
          'On-site installation of windows, doors, large glass panels and structures.',
          'Finishing & waterproofing: insulation and sealing details.',
          'Fixings: supply and installation of anchors and fastening systems.',
        ],
      },
      {
        key: 'glazing-mirror-services',
        type: 'BULLET_LIST',
        order: 2,
        titleFr: 'Services de vitrerie et miroitier',
        titleEn: 'Glazing & Mirror Services',
        imagePath: '/services/vitraux/iii.png',
        itemsFr: [
          'Réparation et remplacement : remplacement de vitres brisées, réparation de fenêtres.',
          'Fabrication sur mesure : découpe de vitres et miroirs sur mesure.',
          'Produits verriers : installation de portes vitrées, verrières, et produits verriers.',
        ],
        itemsEn: [
          'Repair & replacement: emergency glass replacement and window repair.',
          'Custom fabrication: cutting glass and mirrors to measure.',
          'Glass products: installation of glass doors and bespoke elements.',
        ],
      },
    ],
  },
  {
    slug: 'construction',
    titleFr: 'Accessoires & Construction',
    titleEn: 'Construction Accessories',
    summaryFr: 'Fourniture d’accessoires, conseils techniques et solutions pour vos chantiers.',
    summaryEn: 'Supply of accessories, technical guidance and construction site solutions.',
    heroImagePath: '/construction.jpg',
    order: 4,
    featured: true,
    sections: [
      {
        key: 'construction-accessories',
        type: 'BULLET_LIST',
        order: 0,
        titleFr: 'Accessoires de construction',
        titleEn: 'Construction Accessories',
        imagePath: '/services/construction/i.png',
        itemsFr: [
          "Fourniture d'outils professionnels",
          'Matériaux fiables et durables',
          'Accessoires pour chantiers',
        ],
        itemsEn: [
          'Professional tools and equipment',
          'Reliable, durable materials',
          'Accessories for construction sites',
        ],
      },
      {
        key: 'associated-services',
        type: 'BULLET_LIST',
        order: 1,
        titleFr: 'Services associés',
        titleEn: 'Associated Services',
        imagePath: '/services/construction/ii.png',
        itemsFr: [
          'Conseil et accompagnement technique',
          'Solutions adaptées aux besoins des chantiers',
          'Support pour installations',
        ],
        itemsEn: [
          'Technical guidance and recommendations',
          'Adapted solutions for project needs',
          'Support for installations',
        ],
      },
    ],
  },
  {
    slug: 'web-development',
    titleFr: 'Développement Web',
    titleEn: 'Web Development',
    summaryFr: 'Sites vitrines, UI/UX et solutions digitales adaptées à vos besoins.',
    summaryEn: 'Showcase websites, UI/UX and digital solutions tailored to your needs.',
    heroImagePath: '/web-dev.jpg',
    order: 5,
    featured: true,
    sections: [
      {
        key: 'web-development-block',
        type: 'BULLET_LIST',
        order: 0,
        titleFr: 'Développement web',
        titleEn: 'Web Development',
        imagePath: '/services/web-development/i.png',
        itemsFr: [
          'Sites vitrines professionnels',
          'Sites responsives optimisés',
          'Intégration UI/UX moderne',
        ],
        itemsEn: [
          'Professional showcase websites',
          'Responsive, mobile-first builds',
          'Modern UI/UX integration',
        ],
      },
      {
        key: 'digital-solutions',
        type: 'BULLET_LIST',
        order: 1,
        titleFr: 'Solutions digitales',
        titleEn: 'Digital Solutions',
        imagePath: '/services/web-development/ii.png',
        itemsFr: [
          'Systèmes de gestion',
          'Landing pages produits',
          'Optimisation SEO technique',
          'Tests d’intrusion',
        ],
        itemsEn: [
          'Management systems',
          'Product landing pages',
          'Technical SEO optimization',
          'Penetration Testing',
        ],
      },
    ],
  },
]

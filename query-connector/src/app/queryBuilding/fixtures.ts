import { QueryTableResult } from "./utils";

// Fixture shortened significantly for maintenance purposes
export const DEFAULT_QUERIES = [
  {
    query_id: "cf580d8d-cc7b-4eae-8a0d-96c36f9222e3",
    query_name: "Cancer case investigation",
    conditions_list: ["2"],
    valuesets: [
      {
        valueSetId: "14_20240923",
        valueSetVersion: "20240923",
        valueSetName: "Cancer (Leukemia) Lab Result",
        valueSetExternalId: "14",
        author: "DIBBs",
        system: "http://snomed.info/sct",
        ersdConceptType: "lrtc",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "1255068005",
            display:
              "Presence of DNA mismatch repair protein MSH2 in primary malignant neoplasm of colon by immunohistochemistry (observable entity)",
            include: true,
          },
          {
            code: "9484.100004300",
            display: "RESULTS",
            include: true,
          },
          {
            code: "30000.100004300",
            display: "MSH2 Result",
            include: true,
          },
        ],
      },
    ],
  },
  {
    query_id: "6edd14a2-ef78-4d8e-8509-0f87a7228d67",
    query_name: "Chlamydia case investigation",
    conditions_list: ["240589008"],
    valuesets: [
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.999_20230602",
        valueSetVersion: "20230602",
        valueSetName:
          "Chlamydia species (Organism or Substance in Lab Results)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.999",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "115289001",
            display: "Chlamydia trachomatis, serotype A (organism)",
            include: true,
          },
          {
            code: "115318000",
            display: "Chlamydia trachomatis, serotype L3 (organism)",
            include: true,
          },
          {
            code: "121191006",
            display: "Ribonucleic acid of Chlamydia pneumoniae (substance)",
            include: true,
          },
          {
            code: "115296004",
            display: "Chlamydia trachomatis, serotype I (organism)",
            include: true,
          },
          {
            code: "121015003",
            display: "Antigen of Chlamydia trachomatis serotype F (substance)",
            include: true,
          },
          {
            code: "415099003",
            display: "Phylum Chlamydiae (organism)",
            include: true,
          },
          {
            code: "103514009",
            display: "Chlamydophila pneumoniae (organism)",
            include: true,
          },
          {
            code: "115291009",
            display: "Chlamydia trachomatis, serotype Ba (organism)",
            include: true,
          },
          {
            code: "115297008",
            display: "Chlamydia trachomatis, serotype J (organism)",
            include: true,
          },
          {
            code: "115319008",
            display: "Chlamydia trachomatis, serotype G (organism)",
            include: true,
          },
          {
            code: "121017006",
            display: "Antigen of Chlamydia trachomatis serotype K (substance)",
            include: true,
          },
          {
            code: "63938009",
            display: "Chlamydia trachomatis (organism)",
            include: true,
          },
          {
            code: "115293007",
            display: "Chlamydia trachomatis, serotype D (organism)",
            include: true,
          },
          {
            code: "121014004",
            display: "Antigen of Chlamydophila pneumoniae (substance)",
            include: true,
          },
          {
            code: "413819000",
            display: "Chlamydia suis (organism)",
            include: true,
          },
          {
            code: "115295000",
            display: "Chlamydia trachomatis, serotype F (organism)",
            include: true,
          },
          {
            code: "121016002",
            display: "Antigen of Chlamydia trachomatis serotype G (substance)",
            include: true,
          },
          {
            code: "413818008",
            display: "Chlamydia muridarum (organism)",
            include: true,
          },
          {
            code: "115294001",
            display: "Chlamydia trachomatis, serotype E (organism)",
            include: true,
          },
          {
            code: "121002007",
            display: "Antigen of Chlamydia trachomatis (substance)",
            include: true,
          },
          {
            code: "407003002",
            display: "Deoxyribonucleic acid of Chlamydia (substance)",
            include: true,
          },
          {
            code: "115290005",
            display: "Chlamydia trachomatis, serotype B (organism)",
            include: true,
          },
          {
            code: "115301004",
            display: "Chlamydia trachomatis, serotype L2 (organism)",
            include: true,
          },
          {
            code: "121181000",
            display:
              "Deoxyribonucleic acid of Chlamydia trachomatis (substance)",
            include: true,
          },
          {
            code: "707635007",
            display: "Ribosomal ribonucleic acid of Chlamydia (substance)",
            include: true,
          },
          {
            code: "114231004",
            display: "Chlamydophila pecorum (organism)",
            include: true,
          },
          {
            code: "115300003",
            display: "Chlamydia trachomatis, serotype L1 (organism)",
            include: true,
          },
          {
            code: "121018001",
            display: "Antigen of Chlamydia (substance)",
            include: true,
          },
          {
            code: "59134003",
            display: "Lymphogranuloma venereum antigen (substance)",
            include: true,
          },
          {
            code: "114247002",
            display: "Class Chlamydiae (organism)",
            include: true,
          },
          {
            code: "115299006",
            display: "Chlamydia trachomatis, serotype L (organism)",
            include: true,
          },
          {
            code: "121106008",
            display:
              "Ribosomal ribonucleic acid of Chlamydia trachomatis (substance)",
            include: true,
          },
          {
            code: "708219005",
            display:
              "Deoxyribonucleic acid of Chlamydia trachomatis L2 (substance)",
            include: true,
          },
          {
            code: "115292002",
            display: "Chlamydia trachomatis, serotype C (organism)",
            include: true,
          },
          {
            code: "115298003",
            display: "Chlamydia trachomatis, serotype K (organism)",
            include: true,
          },
          {
            code: "115328009",
            display: "Chlamydia trachomatis, serotype H (organism)",
            include: true,
          },
          {
            code: "16241000",
            display: "Genus Chlamydia (organism)",
            include: true,
          },
          {
            code: "442505006",
            display: "Chlamydia trachomatis, serotype Ja (organism)",
            include: true,
          },
        ],
      },
    ],
  },
  {
    query_id: "facfefc1-dd39-4f84-9d91-e924e860ad1c",
    query_name: "Syphilis case investigation",
    conditions_list: ["35742006"],
    valuesets: [
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.554_20191227",
        valueSetVersion: "20191227",
        valueSetName: "Syphilis (Organism or Substance in Lab Results)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.554",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "44106000",
            display: "Treponema pallidum ss. endemicum (organism)",
            include: true,
          },
          {
            code: "707439008",
            display: "Treponema pallidum antigen (substance)",
            include: true,
          },
          {
            code: "6246005",
            display: "Treponema pallidum ss. pertenue (organism)",
            include: true,
          },
          {
            code: "43454006",
            display: "Treponema pallidum ss. pallidum (organism)",
            include: true,
          },
          {
            code: "72904005",
            display: "Treponema pallidum (organism)",
            include: true,
          },
          {
            code: "708462008",
            display: "Deoxyribonucleic acid of Treponema pallidum (substance)",
            include: true,
          },
        ],
      },
    ],
  },
  {
    query_id: "73e1a777-49cb-4e19-bc71-8c3fd3ffda64",
    query_name: "Gonorrhea case investigation",
    conditions_list: ["15628003"],
    valuesets: [
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.1036_20190605",
        valueSetVersion: "20190605",
        valueSetName:
          "Gonorrhea [Neisseria species Unspecified] (Organism or Substance in Lab Results)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.1036",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "715869002",
            display: "Neisseria species, not Neisseria meningitidis (organism)",
            include: true,
          },
          {
            code: "414811005",
            display: "Neisseria species not Neisseria gonococci (organism)",
            include: true,
          },
          {
            code: "59083001",
            display: "Genus Neisseria (organism)",
            include: true,
          },
          {
            code: "715872009",
            display:
              "Neisseria species, not Neisseria gonorrhoeae and not Neisseria meningitidis (organism)",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.169_20230602",
        valueSetVersion: "20230602",
        valueSetName:
          "Gonorrhea [Neisseria gonorrhoeae] (Organism or Substance in Lab Results)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.169",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "277504006",
            display: "Spectinomycin-resistant Neisseria gonorrhoeae (organism)",
            include: true,
          },
          {
            code: "120977006",
            display: "Antigen of Neisseria gonorrhoeae (substance)",
            include: true,
          },
          {
            code: "703483000",
            display:
              "Deoxyribonucleic acid of Neisseria gonorrhoeae (substance)",
            include: true,
          },
          {
            code: "277501003",
            display: "Penicillinase-producing Neisseria gonorrhoeae (organism)",
            include: true,
          },
          {
            code: "409805000",
            display:
              "Fluoroquinolone-resistant Neisseria gonorrhoeae (organism)",
            include: true,
          },
          {
            code: "277502005",
            display: "Tetracycline-resistant Neisseria gonorrhoeae (organism)",
            include: true,
          },
          {
            code: "469831000124106",
            display: "Neisseria gonorrhoeae subspecies kochii (organism)",
            include: true,
          },
          {
            code: "454421000124100",
            display: "Neisseria gonorrhoeae nucleic acid detected (finding)",
            include: true,
          },
          {
            code: "121172006",
            display:
              "Ribosomal ribonucleic acid of Neisseria gonorrhoeae (substance)",
            include: true,
          },
          {
            code: "68704007",
            display: "Neisseria gonorrhoeae (organism)",
            include: true,
          },
          {
            code: "277503000",
            display: "Cephalosporin-resistant Neisseria gonorrhoeae (organism)",
            include: true,
          },
          {
            code: "414809001",
            display:
              "Neisseria gonorrhoeae, beta lactamase negative (organism)",
            include: true,
          },
        ],
      },
    ],
  },
  {
    query_id: "c025a247-0129-4f0c-a2c6-7f3af08e06b4",
    query_name: "Newborn screening follow-up",
    conditions_list: ["1"],
    valuesets: [
      {
        valueSetId: "1_20240909",
        valueSetVersion: "20240909",
        valueSetName: "Newborn Screening",
        valueSetExternalId: "1",
        author: "DIBBs",
        system: "http://loinc.org",
        ersdConceptType: "lotc",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "57700-7",
            display: "Hearing loss newborn screening comment-discussion",
            include: true,
          },
          {
            code: "58232-0",
            display: "Hearing loss risk indicators",
            include: true,
          },
          {
            code: "73742-9",
            display:
              "Newborn hearing screen reason not performed of Ear - right",
            include: true,
          },
          {
            code: "54109-4",
            display: "Newborn hearing screen of Ear - right",
            include: true,
          },
          {
            code: "8336-0",
            display: "Body weight [Percentile] Per age",
            include: true,
          },
          {
            code: "73698-3",
            display: "Reason CCHD oxygen saturation screening not performed",
            include: true,
          },
          {
            code: "54108-6",
            display: "Newborn hearing screen of Ear - left",
            include: true,
          },
          {
            code: "2708-6",
            display: "Cannabinoids [Presence] in Vitreous fluid",
            include: true,
          },
          {
            code: "73700-7",
            display: "CCHD newborn screening interpretation",
            include: true,
          },
          {
            code: "73739-5",
            display:
              "Newborn hearing screen reason not performed of Ear - left",
            include: true,
          },
        ],
      },
    ],
  },
];

export const conditionIdToNameMap = {
  "1": {
    name: "Newborn Screening",
    category: "Birth Defects and Infant Disorders",
  },
  "2": {
    name: "Cancer (Leukemia)",
    category: "Cancer",
  },
  "240589008": {
    name: "Chlamydia trachomatis infection (disorder)",
    category: "Sexually Transmitted Diseases",
  },
  "35742006": {
    name: "Congenital syphilis (disorder)",
    category: "Congenital",
  },
  "15628003": {
    name: "Gonorrhea (disorder)",
    category: "Sexually Transmitted Diseases",
  },
};

export const categoryToConditionNameArrayMap = {
  Cancer: [
    {
      id: "363346000",
      name: "Malignant neoplastic disease (disorder)",
    },
    {
      id: "2",
      name: "Cancer (Leukemia)",
    },
  ],
  "Sexually Transmitted Diseases": [
    {
      id: "76272004",
      name: "Syphilis (disorder)",
    },
    {
      id: "240589008",
      name: "Chlamydia trachomatis infection (disorder)",
    },
    {
      id: "15628003",
      name: "Gonorrhea (disorder)",
    },
  ],
};

export const gonorreheaValueSets = [
  {
    display: "azithromycin 1000 MG",
    code_system: "http://www.nlm.nih.gov/research/umls/rxnorm",
    code: "434692",
    valueset_name: "Gonorrhea Medication",
    valueset_id: "7_20240909",
    valueset_external_id: "7",
    version: "20240909",
    author: "DIBBs",
    type: "mrtc",
    dibbs_concept_type: "medications",
    condition_id: "15628003",
  },
  {
    display: "ceftriaxone 500 MG Injection",
    code_system: "http://www.nlm.nih.gov/research/umls/rxnorm",
    code: "1665005",
    valueset_name: "Gonorrhea Medication",
    valueset_id: "7_20240909",
    valueset_external_id: "7",
    version: "20240909",
    author: "DIBBs",
    type: "mrtc",
    dibbs_concept_type: "medications",
    condition_id: "15628003",
  },
];

export const cancerValueSets = [
  {
    display: "RESULTS",
    code_system: "http://cap.org/eCC",
    code: "9484.100004300",
    valueset_name: "Cancer (Leukemia) Lab Result",
    valueset_id: "14_20240923",
    valueset_external_id: "14",
    version: "20240923",
    author: "DIBBs",
    type: "lrtc",
    dibbs_concept_type: "labs",
    condition_id: "2",
  },
  {
    display:
      "Presence of DNA mismatch repair protein MSH2 in primary malignant neoplasm of colon by immunohistochemistry (observable entity)",
    code_system: "http://snomed.info/sct",
    code: "1255068005",
    valueset_name: "Cancer (Leukemia) Lab Result",
    valueset_id: "14_20240923",
    valueset_external_id: "14",
    version: "20240923",
    author: "DIBBs",
    type: "lrtc",
    dibbs_concept_type: "labs",
    condition_id: "2",
  },
];

export const gonorreheaSavedQuery: QueryTableResult = {
  query_id: "73e1a777-49cb-4e19-bc71-8c3fd3ffda64",
  query_name: "Gonorrhea case investigation",
  conditions_list: ["15628003"],
  query_data: {
    "15628003": {
      "2.16.840.1.113762.1.4.1146.1036_20190605": {
        valueSetId: "2.16.840.1.113762.1.4.1146.1036_20190605",
        valueSetVersion: "20190605",
        valueSetName:
          "Gonorrhea [Neisseria species Unspecified] (Organism or Substance in Lab Results)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.1036",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "715869002",
            display: "Neisseria species, not Neisseria meningitidis (organism)",
            include: true,
          },
          {
            code: "414811005",
            display: "Neisseria species not Neisseria gonococci (organism)",
            include: true,
          },
          {
            code: "59083001",
            display: "Genus Neisseria (organism)",
            include: true,
          },
          {
            code: "715872009",
            display:
              "Neisseria species, not Neisseria gonorrhoeae and not Neisseria meningitidis (organism)",
            include: true,
          },
        ],
      },
      "2.16.840.1.113762.1.4.1146.169_20230602": {
        valueSetId: "2.16.840.1.113762.1.4.1146.169_20230602",
        valueSetVersion: "20230602",
        valueSetName:
          "Gonorrhea [Neisseria gonorrhoeae] (Organism or Substance in Lab Results)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.169",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "277504006",
            display: "Spectinomycin-resistant Neisseria gonorrhoeae (organism)",
            include: true,
          },
          {
            code: "120977006",
            display: "Antigen of Neisseria gonorrhoeae (substance)",
            include: true,
          },
          {
            code: "703483000",
            display:
              "Deoxyribonucleic acid of Neisseria gonorrhoeae (substance)",
            include: true,
          },
          {
            code: "277501003",
            display: "Penicillinase-producing Neisseria gonorrhoeae (organism)",
            include: true,
          },
          {
            code: "409805000",
            display:
              "Fluoroquinolone-resistant Neisseria gonorrhoeae (organism)",
            include: true,
          },
          {
            code: "277502005",
            display: "Tetracycline-resistant Neisseria gonorrhoeae (organism)",
            include: true,
          },
          {
            code: "469831000124106",
            display: "Neisseria gonorrhoeae subspecies kochii (organism)",
            include: true,
          },
          {
            code: "454421000124100",
            display: "Neisseria gonorrhoeae nucleic acid detected (finding)",
            include: true,
          },
          {
            code: "121172006",
            display:
              "Ribosomal ribonucleic acid of Neisseria gonorrhoeae (substance)",
            include: true,
          },
          {
            code: "68704007",
            display: "Neisseria gonorrhoeae (organism)",
            include: true,
          },
          {
            code: "277503000",
            display: "Cephalosporin-resistant Neisseria gonorrhoeae (organism)",
            include: true,
          },
          {
            code: "414809001",
            display:
              "Neisseria gonorrhoeae, beta lactamase negative (organism)",
            include: true,
          },
        ],
      },
    },
  },
};

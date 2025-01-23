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
      {
        valueSetId: "2_20240909",
        valueSetVersion: "20240909",
        valueSetName: "Cancer (Leukemia) Diagnosis Problem",
        valueSetExternalId: "2",
        author: "DIBBs",
        system: "http://loinc.org",
        ersdConceptType: "dxtc",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "21908-9",
            display: "Stage group.clinical Cancer",
            include: true,
          },
          {
            code: "60568-3",
            display: "Pathology Synoptic report",
            include: true,
          },
          {
            code: "418689008",
            display: "Allergy to sulfonamide",
            include: true,
          },
          {
            code: "36929009",
            display: "Stage II (localized)",
            include: true,
          },
          {
            code: "92814006",
            display: "Chronic lymphoid leukemia, disease (disorder)",
            include: true,
          },
        ],
      },
      {
        valueSetId: "15_20240923",
        valueSetVersion: "20240923",
        valueSetName: "Suspected Cancer (Leukemia) Diagnosis",
        valueSetExternalId: "15",
        author: "DIBBs",
        system: "http://snomed.info/sct",
        ersdConceptType: "sdtc",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "363346000",
            display: "Malignant neoplastic disease (disorder)",
            include: true,
          },
        ],
      },
      {
        valueSetId: "3_20240909",
        valueSetVersion: "20240909",
        valueSetName: "Cancer (Leukemia) Medication",
        valueSetExternalId: "3",
        author: "DIBBs",
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        ersdConceptType: "mrtc",
        dibbsConceptType: "medications",
        includeValueSet: true,
        concepts: [
          {
            code: "828265",
            display: "1 ML alemtuzumab 30 MG/ML Injection",
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
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.170_20230602",
        valueSetVersion: "20230602",
        valueSetName:
          "Chlamydia trachomatis Infection (Organism or Substance in Lab Results)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.170",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "115292002",
            display: "Chlamydia trachomatis, serotype C (organism)",
            include: true,
          },
          {
            code: "115318000",
            display: "Chlamydia trachomatis, serotype L3 (organism)",
            include: true,
          },
          {
            code: "454431000124102",
            display: "Chlamydia trachomatis nucleic acid detected (finding)",
            include: true,
          },
          {
            code: "115293007",
            display: "Chlamydia trachomatis, serotype D (organism)",
            include: true,
          },
          {
            code: "115319008",
            display: "Chlamydia trachomatis, serotype G (organism)",
            include: true,
          },
          {
            code: "59134003",
            display: "Lymphogranuloma venereum antigen (substance)",
            include: true,
          },
          {
            code: "115296004",
            display: "Chlamydia trachomatis, serotype I (organism)",
            include: true,
          },
          {
            code: "121002007",
            display: "Antigen of Chlamydia trachomatis (substance)",
            include: true,
          },
          {
            code: "708219005",
            display:
              "Deoxyribonucleic acid of Chlamydia trachomatis L2 (substance)",
            include: true,
          },
          {
            code: "115298003",
            display: "Chlamydia trachomatis, serotype K (organism)",
            include: true,
          },
          {
            code: "121016002",
            display: "Antigen of Chlamydia trachomatis serotype G (substance)",
            include: true,
          },
          {
            code: "115295000",
            display: "Chlamydia trachomatis, serotype F (organism)",
            include: true,
          },
          {
            code: "121015003",
            display: "Antigen of Chlamydia trachomatis serotype F (substance)",
            include: true,
          },
          {
            code: "115294001",
            display: "Chlamydia trachomatis, serotype E (organism)",
            include: true,
          },
          {
            code: "115328009",
            display: "Chlamydia trachomatis, serotype H (organism)",
            include: true,
          },
          {
            code: "63938009",
            display: "Chlamydia trachomatis (organism)",
            include: true,
          },
          {
            code: "115297008",
            display: "Chlamydia trachomatis, serotype J (organism)",
            include: true,
          },
          {
            code: "121017006",
            display: "Antigen of Chlamydia trachomatis serotype K (substance)",
            include: true,
          },
          {
            code: "115290005",
            display: "Chlamydia trachomatis, serotype B (organism)",
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
            code: "115289001",
            display: "Chlamydia trachomatis, serotype A (organism)",
            include: true,
          },
          {
            code: "115300003",
            display: "Chlamydia trachomatis, serotype L1 (organism)",
            include: true,
          },
          {
            code: "442505006",
            display: "Chlamydia trachomatis, serotype Ja (organism)",
            include: true,
          },
          {
            code: "115291009",
            display: "Chlamydia trachomatis, serotype Ba (organism)",
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
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.240_20230602",
        valueSetVersion: "20230602",
        valueSetName:
          "Chlamydia trachomatis Infection (Tests for Chlamydia trachomatis Antigen)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.240",
        author: "CSTE Steward",
        system: "http://loinc.org",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "14507-8",
            display:
              "Chlamydia trachomatis Ag [Presence] in Blood by Immunofluorescence",
            include: true,
          },
          {
            code: "31775-0",
            display: "Chlamydia trachomatis Ag [Presence] in Urine sediment",
            include: true,
          },
          {
            code: "6352-9",
            display:
              "Chlamydia trachomatis Ag [Presence] in Stool by Immunofluorescence",
            include: true,
          },
          {
            code: "14469-1",
            display:
              "Chlamydia trachomatis Ag [Presence] in Cerebral spinal fluid by Immunoassay",
            include: true,
          },
          {
            code: "31768-5",
            display: "Chlamydia trachomatis Ag [Presence] in Blood",
            include: true,
          },
          {
            code: "34710-4",
            display: "Chlamydia trachomatis Ag [Presence] in Anal",
            include: true,
          },
          {
            code: "91860-7",
            display:
              "Chlamydia trachomatis Ag [Presence] in Genital specimen by Immunofluorescence",
            include: true,
          },
          {
            code: "14468-3",
            display:
              "Chlamydia trachomatis Ag [Presence] in Blood by Immunoassay",
            include: true,
          },
          {
            code: "14511-0",
            display:
              "Chlamydia trachomatis Ag [Presence] in Urethra by Immunofluorescence",
            include: true,
          },
          {
            code: "31777-6",
            display: "Chlamydia trachomatis Ag [Presence] in Specimen",
            include: true,
          },
          {
            code: "6353-7",
            display:
              "Chlamydia trachomatis Ag [Presence] in Tissue by Immunofluorescence",
            include: true,
          },
          {
            code: "14472-5",
            display:
              "Chlamydia trachomatis Ag [Presence] in Urethra by Immunoassay",
            include: true,
          },
          {
            code: "31770-1",
            display:
              "Chlamydia trachomatis Ag [Presence] in Cerebral spinal fluid",
            include: true,
          },
          {
            code: "45092-4",
            display:
              "Chlamydia trachomatis Ag [Presence] in Nasopharynx by Immunoassay",
            include: true,
          },
          {
            code: "91873-0",
            display:
              "Chlamydia trachomatis Ag [Presence] in Throat by Immunofluorescence",
            include: true,
          },
          {
            code: "14474-1",
            display:
              "Chlamydia trachomatis Ag [Presence] in Urine sediment by Immunoassay",
            include: true,
          },
          {
            code: "31771-9",
            display: "Chlamydia trachomatis Ag [Presence] in Cervix",
            include: true,
          },
          {
            code: "6350-3",
            display:
              "Chlamydia trachomatis Ag [Presence] in Conjunctival specimen by Immunoassay",
            include: true,
          },
          {
            code: "14510-2",
            display:
              "Chlamydia trachomatis Ag [Presence] in Vaginal fluid by Immunofluorescence",
            include: true,
          },
          {
            code: "31776-8",
            display: "Chlamydia trachomatis Ag [Presence] in Urethra",
            include: true,
          },
          {
            code: "6354-5",
            display:
              "Chlamydia trachomatis Ag [Presence] in Specimen by Immunoassay",
            include: true,
          },
          {
            code: "14508-6",
            display:
              "Chlamydia trachomatis Ag [Presence] in Cerebral spinal fluid by Immunofluorescence",
            include: true,
          },
          {
            code: "31774-3",
            display: "Chlamydia trachomatis Ag [Presence] in Stool",
            include: true,
          },
          {
            code: "6351-1",
            display:
              "Chlamydia trachomatis Ag [Presence] in Conjunctival specimen by Immunofluorescence",
            include: true,
          },
          {
            code: "14471-7",
            display:
              "Chlamydia trachomatis Ag [Presence] in Vaginal fluid by Immunoassay",
            include: true,
          },
          {
            code: "31769-3",
            display:
              "Chlamydia trachomatis Ag [Presence] in Conjunctival specimen",
            include: true,
          },
          {
            code: "45091-6",
            display: "Chlamydia trachomatis Ag [Presence] in Genital specimen",
            include: true,
          },
          {
            code: "91861-5",
            display:
              "Chlamydia trachomatis Ag [Presence] in Aspirate by Immunofluorescence",
            include: true,
          },
          {
            code: "14509-4",
            display:
              "Chlamydia trachomatis Ag [Presence] in Cervix by Immunofluorescence",
            include: true,
          },
          {
            code: "31772-7",
            display: "Chlamydia trachomatis Ag [Presence] in Vaginal fluid",
            include: true,
          },
          {
            code: "47234-0",
            display: "Chlamydia trachomatis Ag [Presence] in Body fluid",
            include: true,
          },
          {
            code: "99105-9",
            display:
              "Chlamydia trachomatis Ag [Presence] in Serum or Plasma by Immunoassay",
            include: true,
          },
          {
            code: "14470-9",
            display:
              "Chlamydia trachomatis Ag [Presence] in Cervix by Immunoassay",
            include: true,
          },
          {
            code: "14513-6",
            display:
              "Chlamydia trachomatis Ag [Presence] in Urine sediment by Immunofluorescence",
            include: true,
          },
          {
            code: "34709-6",
            display: "Chlamydia trachomatis Ag [Presence] in Nasopharynx",
            include: true,
          },
          {
            code: "6355-2",
            display:
              "Chlamydia trachomatis Ag [Presence] in Specimen by Immunofluorescence",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.238_20190605",
        valueSetVersion: "20190605",
        valueSetName:
          "Chlamydia trachomatis Infection (Tests for Chlamydia trachomatis by Culture and Identification Method)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.238",
        author: "CSTE Steward",
        system: "http://loinc.org",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "14462-6",
            display:
              "Chlamydia trachomatis [Presence] in Cerebral spinal fluid by Organism specific culture",
            include: true,
          },
          {
            code: "14467-5",
            display:
              "Chlamydia trachomatis [Presence] in Urine sediment by Organism specific culture",
            include: true,
          },
          {
            code: "6349-5",
            display:
              "Chlamydia trachomatis [Presence] in Unspecified specimen by Organism specific culture",
            include: true,
          },
          {
            code: "14463-4",
            display:
              "Chlamydia trachomatis [Presence] in Cervix by Organism specific culture",
            include: true,
          },
          {
            code: "14465-9",
            display:
              "Chlamydia trachomatis [Presence] in Urethra by Organism specific culture",
            include: true,
          },
          {
            code: "89648-0",
            display:
              "Chlamydia trachomatis [Presence] in Throat by Organism specific culture",
            include: true,
          },
          {
            code: "14464-2",
            display:
              "Chlamydia trachomatis [Presence] in Vaginal fluid by Organism specific culture",
            include: true,
          },
          {
            code: "45094-0",
            display:
              "Chlamydia trachomatis [Presence] in Conjunctival specimen by Organism specific culture",
            include: true,
          },
          {
            code: "87950-2",
            display:
              "Chlamydia trachomatis [Presence] in Tissue by Organism specific culture",
            include: true,
          },
          {
            code: "45093-2",
            display:
              "Chlamydia trachomatis [Presence] in Anal by Organism specific culture",
            include: true,
          },
          {
            code: "45095-7",
            display:
              "Chlamydia trachomatis [Presence] in Genital specimen by Organism specific culture",
            include: true,
          },
          {
            code: "45096-5",
            display:
              "Chlamydia trachomatis [Presence] in Nasopharynx by Organism specific culture",
            include: true,
          },
          {
            code: "14461-8",
            display:
              "Chlamydia trachomatis [Presence] in Blood by Organism specific culture",
            include: true,
          },
          {
            code: "80367-6",
            display:
              "Chlamydia trachomatis [Presence] in Rectum by Organism specific culture",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.239_20230602",
        valueSetVersion: "20230602",
        valueSetName:
          "Chlamydia trachomatis Infection (Tests for Chlamydia trachomatis Nucleic Acid)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.239",
        author: "CSTE Steward",
        system: "http://loinc.org",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "16600-9",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Genital specimen by Probe",
            include: true,
          },
          {
            code: "21187-0",
            display:
              "Chlamydia trachomatis DNA [Presence] in Conjunctival specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "36902-5",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae DNA [Presence] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "36903-3",
            display:
              "Chlamydia trachomatis and Neisseria gonorrhoeae DNA [Identifier] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "44807-6",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae DNA [Presence] in Genital specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "45068-4",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae DNA [Presence] in Cervix by NAA with probe detection",
            include: true,
          },
          {
            code: "45078-3",
            display: "Chlamydia trachomatis rRNA [Presence] in Cervix by Probe",
            include: true,
          },
          {
            code: "45084-1",
            display:
              "Chlamydia trachomatis DNA [Presence] in Vaginal fluid by NAA with probe detection",
            include: true,
          },
          {
            code: "51578-3",
            display:
              "Chlamydia trachomatis DNA [Presence] in Semen by NAA with probe detection",
            include: true,
          },
          {
            code: "53925-4",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Urethra by NAA with probe detection",
            include: true,
          },
          {
            code: "80363-5",
            display:
              "Chlamydia trachomatis DNA [Presence] in Anorectal by NAA with probe detection",
            include: true,
          },
          {
            code: "80364-3",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Anorectal by NAA with probe detection",
            include: true,
          },
          {
            code: "100356-5",
            display:
              "Chlamydia trachomatis and Neisseria gonorrhoeae and Trichomonas vaginalis DNA [Identifier] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "21190-4",
            display:
              "Chlamydia trachomatis DNA [Presence] in Cervix by NAA with probe detection",
            include: true,
          },
          {
            code: "21613-5",
            display:
              "Chlamydia trachomatis DNA [Presence] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "43404-3",
            display:
              "Chlamydia trachomatis DNA [Presence] in Specimen by Probe with signal amplification",
            include: true,
          },
          {
            code: "43405-0",
            display:
              "Chlamydia trachomatis and Neisseria gonorrhoeae DNA [Identifier] in Specimen by Probe with signal amplification",
            include: true,
          },
          {
            code: "45073-4",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Tissue by Probe",
            include: true,
          },
          {
            code: "45075-9",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Urethra by Probe",
            include: true,
          },
          {
            code: "45090-8",
            display:
              "Chlamydia trachomatis DNA [Presence] in Anal by NAA with probe detection",
            include: true,
          },
          {
            code: "47212-6",
            display:
              "Chlamydia trachomatis DNA [Identifier] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "6356-0",
            display:
              "Chlamydia trachomatis DNA [Presence] in Genital specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "6357-8",
            display:
              "Chlamydia trachomatis DNA [Presence] in Urine by NAA with probe detection",
            include: true,
          },
          {
            code: "87949-4",
            display:
              "Chlamydia trachomatis DNA [Presence] in Tissue by NAA with probe detection",
            include: true,
          },
          {
            code: "99778-3",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Conjunctival specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "16599-3",
            display:
              "Chlamydia trachomatis DNA [Presence] in Blood by NAA with probe detection",
            include: true,
          },
          {
            code: "21191-2",
            display:
              "Chlamydia trachomatis DNA [Presence] in Urethra by NAA with probe detection",
            include: true,
          },
          {
            code: "23838-6",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Genital fluid by Probe",
            include: true,
          },
          {
            code: "43406-8",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae DNA [Presence] in Specimen by Probe with signal amplification",
            include: true,
          },
          {
            code: "45067-6",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Cervix by Probe",
            include: true,
          },
          {
            code: "45076-7",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Specimen by Probe",
            include: true,
          },
          {
            code: "45080-9",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Vaginal fluid by Probe",
            include: true,
          },
          {
            code: "47211-8",
            display:
              "Chlamydia trachomatis L2 DNA [Presence] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "4993-2",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Specimen by Probe",
            include: true,
          },
          {
            code: "57288-3",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Nasopharynx by NAA with probe detection",
            include: true,
          },
          {
            code: "80361-9",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Cervix by NAA with probe detection",
            include: true,
          },
          {
            code: "88221-7",
            display:
              "Chlamydia trachomatis DNA [Presence] in Throat by NAA with probe detection",
            include: true,
          },
          {
            code: "16601-7",
            display: "Chlamydia trachomatis rRNA [Presence] in Urine by Probe",
            include: true,
          },
          {
            code: "21189-6",
            display:
              "Chlamydia trachomatis DNA [Presence] in Cervical mucus by NAA with probe detection",
            include: true,
          },
          {
            code: "38469-3",
            display: "Chlamydia trachomatis rRNA [Presence] in Blood by Probe",
            include: true,
          },
          {
            code: "42931-6",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Urine by NAA with probe detection",
            include: true,
          },
          {
            code: "45069-2",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Genital specimen by Probe",
            include: true,
          },
          {
            code: "45072-6",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Anal by Probe",
            include: true,
          },
          {
            code: "45086-6",
            display:
              "Chlamydia trachomatis DNA [Presence] in Nasopharynx by NAA with probe detection",
            include: true,
          },
          {
            code: "45089-0",
            display: "Chlamydia trachomatis rRNA [Presence] in Anal by Probe",
            include: true,
          },
          {
            code: "53926-2",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Vaginal fluid by NAA with probe detection",
            include: true,
          },
          {
            code: "57287-5",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Anal by NAA with probe detection",
            include: true,
          },
          {
            code: "80365-0",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Anorectal by NAA with probe detection",
            include: true,
          },
          {
            code: "82306-2",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Throat by NAA with probe detection",
            include: true,
          },
          {
            code: "21188-8",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Conjunctival specimen by Probe",
            include: true,
          },
          {
            code: "43304-5",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "45070-0",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Vaginal fluid by Probe",
            include: true,
          },
          {
            code: "45085-8",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Nasopharynx by Probe",
            include: true,
          },
          {
            code: "50387-0",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Cervix by NAA with probe detection",
            include: true,
          },
          {
            code: "80360-1",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Urine by NAA with probe detection",
            include: true,
          },
          {
            code: "21192-0",
            display:
              "Chlamydia trachomatis rRNA [Presence] in Urethra by Probe",
            include: true,
          },
          {
            code: "44806-8",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae DNA [Presence] in Urine by NAA with probe detection",
            include: true,
          },
          {
            code: "45074-2",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Urine by Probe",
            include: true,
          },
          {
            code: "49096-1",
            display:
              "Chlamydia trachomatis DNA [Units/volume] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "80362-7",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Vaginal fluid by NAA with probe detection",
            include: true,
          },
          {
            code: "21613-5",
            display:
              "Chlamydia trachomatis DNA [Presence] in Specimen by NAA with probe detection",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.707_20181031",
        valueSetVersion: "20181031",
        valueSetName:
          "Chlamydia trachomatis Infection (Tests for Chlamydia species by Culture and Identification Method)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.707",
        author: "CSTE Steward",
        system: "http://loinc.org",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "556-1",
            display:
              "Chlamydia sp identified in Conjunctival specimen by Organism specific culture",
            include: true,
          },
          {
            code: "558-7",
            display:
              "Chlamydia sp identified in Throat by Organism specific culture",
            include: true,
          },
          {
            code: "557-9",
            display:
              "Chlamydia sp identified in Genital specimen by Organism specific culture",
            include: true,
          },
          {
            code: "45099-9",
            display:
              "Chlamydia sp identified in Body fluid by Organism specific culture",
            include: true,
          },
          {
            code: "45101-3",
            display:
              "Chlamydia sp identified in Nasopharynx by Organism specific culture",
            include: true,
          },
          {
            code: "559-5",
            display:
              "Chlamydia sp identified in Urethra by Organism specific culture",
            include: true,
          },
          {
            code: "24005-1",
            display:
              "Chlamydia sp identified in Bronchial specimen by Organism specific culture",
            include: true,
          },
          {
            code: "6348-7",
            display:
              "Chlamydia sp identified in Sputum by Organism specific culture",
            include: true,
          },
          {
            code: "45097-3",
            display:
              "Chlamydia sp identified in Anal by Organism specific culture",
            include: true,
          },
          {
            code: "560-3",
            display:
              "Chlamydia sp identified in Unspecified specimen by Organism specific culture",
            include: true,
          },
          {
            code: "45100-5",
            display:
              "Chlamydia sp identified in Vaginal fluid by Organism specific culture",
            include: true,
          },
          {
            code: "45098-1",
            display:
              "Chlamydia sp identified in Cervix by Organism specific culture",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.708_20181031",
        valueSetVersion: "20181031",
        valueSetName:
          "Chlamydia trachomatis Infection (Tests for Chlamydia species Antigen)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.708",
        author: "CSTE Steward",
        system: "http://loinc.org",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "20755-5",
            display: "Chlamydia sp Ag [Presence] in Body fluid by Immunoassay",
            include: true,
          },
          {
            code: "31764-4",
            display: "Chlamydia sp Ag [Presence] in Body fluid",
            include: true,
          },
          {
            code: "45106-2",
            display: "Chlamydia sp Ag [Presence] in Cervix by Immunoassay",
            include: true,
          },
          {
            code: "45133-6",
            display: "Chlamydia sp Ag [Presence] in Nasopharynx",
            include: true,
          },
          {
            code: "20757-1",
            display:
              "Chlamydia sp Ag [Presence] in Tissue by Immunofluorescence",
            include: true,
          },
          {
            code: "45103-9",
            display: "Chlamydia sp Ag [Presence] in Anal by Immunofluorescence",
            include: true,
          },
          {
            code: "45115-3",
            display:
              "Chlamydia sp Ag [Presence] in Urethra by Immunofluorescence",
            include: true,
          },
          {
            code: "16593-6",
            display: "Chlamydia sp Ag [Presence] in Urine",
            include: true,
          },
          {
            code: "32003-6",
            display:
              "Chlamydia sp Ag [Presence] in Peritoneal fluid by Immunoassay",
            include: true,
          },
          {
            code: "45112-0",
            display:
              "Chlamydia sp Ag [Presence] in Urine by Immunofluorescence",
            include: true,
          },
          {
            code: "6344-6",
            display:
              "Chlamydia sp Ag [Presence] in Conjunctival specimen by Immunofluorescence",
            include: true,
          },
          {
            code: "20756-3",
            display: "Chlamydia sp Ag [Presence] in Stool by Immunoassay",
            include: true,
          },
          {
            code: "32004-4",
            display: "Chlamydia sp Ag [Presence] in Urine by Immunoassay",
            include: true,
          },
          {
            code: "45113-8",
            display: "Chlamydia sp Ag [Presence] in Urethra by Immunoassay",
            include: true,
          },
          {
            code: "6347-9",
            display:
              "Chlamydia sp Ag [Presence] in Unspecified specimen by Immunoassay",
            include: true,
          },
          {
            code: "31765-1",
            display: "Chlamydia sp Ag [Presence] in Genital specimen",
            include: true,
          },
          {
            code: "45105-4",
            display: "Chlamydia sp Ag [Presence] in Anal",
            include: true,
          },
          {
            code: "45132-8",
            display: "Chlamydia sp Ag [Presence] in Nasopharynx by Immunoassay",
            include: true,
          },
          {
            code: "31767-7",
            display: "Chlamydia sp Ag [Presence] in Unspecified specimen",
            include: true,
          },
          {
            code: "45108-8",
            display:
              "Chlamydia sp Ag [Presence] in Cervix by Immunofluorescence",
            include: true,
          },
          {
            code: "6343-8",
            display:
              "Chlamydia sp Ag [Presence] in Conjunctival specimen by Immunoassay",
            include: true,
          },
          {
            code: "31763-6",
            display: "Chlamydia sp Ag [Presence] in Conjunctival specimen",
            include: true,
          },
          {
            code: "45104-7",
            display: "Chlamydia sp Ag [Presence] in Anal by Immunoassay",
            include: true,
          },
          {
            code: "45131-0",
            display:
              "Chlamydia sp Ag [Presence] in Nasopharynx by Immunofluorescence",
            include: true,
          },
          {
            code: "31766-9",
            display: "Chlamydia sp Ag [Presence] in Stool",
            include: true,
          },
          {
            code: "45107-0",
            display: "Chlamydia sp Ag [Presence] in Cervix",
            include: true,
          },
          {
            code: "561-1",
            display:
              "Chlamydia sp Ag [Presence] in Unspecified specimen by Immunofluorescence",
            include: true,
          },
          {
            code: "32001-0",
            display:
              "Chlamydia sp Ag [Presence] in Vaginal fluid by Immunoassay",
            include: true,
          },
          {
            code: "45109-6",
            display:
              "Chlamydia sp Ag [Presence] in Body fluid by Immunofluorescence",
            include: true,
          },
          {
            code: "6345-3",
            display:
              "Chlamydia sp Ag [Presence] in Genital specimen by Immunoassay",
            include: true,
          },
          {
            code: "32671-0",
            display: "Chlamydia sp Ag [Presence] in Vaginal fluid",
            include: true,
          },
          {
            code: "45114-6",
            display: "Chlamydia sp Ag [Presence] in Urethra",
            include: true,
          },
          {
            code: "6346-1",
            display:
              "Chlamydia sp Ag [Presence] in Genital specimen by Immunofluorescence",
            include: true,
          },
        ],
      },
      {
        valueSetId: "12_20240910",
        valueSetVersion: "20240910",
        valueSetName: "Chlamydia Lab Result",
        valueSetExternalId: "12",
        author: "DIBBs",
        system: "http://loinc.org",
        ersdConceptType: "lrtc",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "24111-7",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "11350-6",
            display: "History of Sexual behavior Narrative",
            include: true,
          },
          {
            code: "72828-7",
            display:
              "Chlamydia trachomatis and Neisseria gonorrhoeae DNA panel - Specimen",
            include: true,
          },
          {
            code: "83317-8",
            display: "Sexual activity with anonymous partner in the past year",
            include: true,
          },
          {
            code: "82810-3",
            display: "Pregnancy status",
            include: true,
          },
          {
            code: "21613-5",
            display:
              "Chlamydia trachomatis DNA [Presence] in Specimen by NAA with probe detection",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.706_20181031",
        valueSetVersion: "20181031",
        valueSetName:
          "Chlamydia trachomatis Infection (Tests for Chlamydia species Nucleic Acid)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.706",
        author: "CSTE Steward",
        system: "http://loinc.org",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "35412-6",
            display:
              "Chlamydia sp DNA [Presence] in Nose by NAA with probe detection",
            include: true,
          },
          {
            code: "35722-8",
            display:
              "Chlamydia sp DNA [Presence] in Serum by NAA with probe detection",
            include: true,
          },
          {
            code: "35730-1",
            display:
              "Chlamydia sp rRNA [Presence] in Unspecified specimen by Probe",
            include: true,
          },
          {
            code: "35716-0",
            display:
              "Chlamydia sp DNA [Presence] in Vaginal fluid by NAA with probe detection",
            include: true,
          },
          {
            code: "35726-9",
            display: "Chlamydia sp rRNA [Presence] in Urine by Probe",
            include: true,
          },
          {
            code: "32774-2",
            display:
              "Chlamydia sp DNA [Presence] in Genital specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "35715-2",
            display:
              "Chlamydia sp rRNA [Presence] in Genital specimen by Probe",
            include: true,
          },
          {
            code: "35728-5",
            display: "Chlamydia sp rRNA [Presence] in Urethra by Probe",
            include: true,
          },
          {
            code: "34708-8",
            display:
              "Chlamydia sp DNA [Presence] in Urine by NAA with probe detection",
            include: true,
          },
          {
            code: "35718-6",
            display: "Chlamydia sp rRNA [Presence] in Nose by Probe",
            include: true,
          },
          {
            code: "35736-8",
            display: "Chlamydia sp rRNA [Presence] in Nasopharynx by Probe",
            include: true,
          },
          {
            code: "35714-5",
            display: "Chlamydia sp rRNA [Presence] in Cervix by Probe",
            include: true,
          },
          {
            code: "35727-7",
            display:
              "Chlamydia sp DNA [Presence] in Urethra by NAA with probe detection",
            include: true,
          },
          {
            code: "35711-1",
            display:
              "Chlamydia sp DNA [Presence] in Anal by NAA with probe detection",
            include: true,
          },
          {
            code: "35724-4",
            display:
              "Chlamydia sp DNA [Presence] in Throat by NAA with probe detection",
            include: true,
          },
          {
            code: "35717-8",
            display: "Chlamydia sp rRNA [Presence] in Vaginal fluid by Probe",
            include: true,
          },
          {
            code: "35729-3",
            display:
              "Chlamydia sp DNA [Presence] in Unspecified specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "35712-9",
            display:
              "Chlamydia sp rRNA [Presence] in Conjunctival specimen by Probe",
            include: true,
          },
          {
            code: "35723-6",
            display: "Chlamydia sp rRNA [Presence] in Serum by Probe",
            include: true,
          },
          {
            code: "35710-3",
            display:
              "Chlamydia sp DNA [Presence] in Conjunctival specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "35721-0",
            display: "Chlamydia sp rRNA [Presence] in Anal by Probe",
            include: true,
          },
          {
            code: "35713-7",
            display:
              "Chlamydia sp DNA [Presence] in Cervix by NAA with probe detection",
            include: true,
          },
          {
            code: "35725-1",
            display: "Chlamydia sp rRNA [Presence] in Throat by Probe",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.632_20240620",
        valueSetVersion: "20240620",
        valueSetName:
          "Chlamydia trachomatis Infection [Secondary Sites Complications] (Disorders) (SNOMED)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.632",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "1163085006",
            display:
              "Dacryoadenitis caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "198176005",
            display: "Female chlamydial pelvic inflammatory disease (disorder)",
            include: true,
          },
          {
            code: "236773004",
            display: "Chlamydial epididymo-orchitis (disorder)",
            include: true,
          },
          {
            code: "406566006",
            display:
              "Chlamydial infection of the central nervous system (disorder)",
            include: true,
          },
          {
            code: "446752000",
            display:
              "Infection of peritoneum caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "1163117009",
            display: "Colitis caused by Chlamydia (disorder)",
            include: true,
          },
          {
            code: "197172005",
            display: "Chlamydial peritonitis (disorder)",
            include: true,
          },
          {
            code: "236749007",
            display: "Chlamydial balanitis (disorder)",
            include: true,
          },
          {
            code: "240590004",
            display: "Neonatal chlamydial infection (disorder)",
            include: true,
          },
          {
            code: "446471004",
            display:
              "Infection of epididymis caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "722552001",
            display: "Sequela of infection caused by Chlamydia (disorder)",
            include: true,
          },
          {
            code: "1197369000",
            display: "Colitis caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "232403001",
            display: "Chlamydial pharyngitis (disorder)",
            include: true,
          },
          {
            code: "237043008",
            display: "Chlamydial perihepatitis (disorder)",
            include: true,
          },
          {
            code: "312099009",
            display: "Genitourinary chlamydia infection (disorder)",
            include: true,
          },
          {
            code: "446902002",
            display:
              "Infection of testis caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "1084821000119103",
            display: "Cystitis caused by Chlamydia (disorder)",
            include: true,
          },
          {
            code: "189312004",
            display:
              "Pelvic inflammation with female sterility caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "236767000",
            display: "Chlamydial epididymitis (disorder)",
            include: true,
          },
          {
            code: "420910002",
            display:
              "Chlamydia trachomatis infection of anus and rectum (disorder)",
            include: true,
          },
          {
            code: "447402003",
            display:
              "Infection of vagina caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "105629000",
            display: "Chlamydial infection (disorder)",
            include: true,
          },
          {
            code: "186729003",
            display:
              "Chlamydial infection of lower genitourinary tract (disorder)",
            include: true,
          },
          {
            code: "236672003",
            display: "Chlamydial prostatitis (disorder)",
            include: true,
          },
          {
            code: "240589008",
            display: "Chlamydia trachomatis infection (disorder)",
            include: true,
          },
          {
            code: "446594000",
            display:
              "Infection of pharynx caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "722520001",
            display:
              "Non-ulcerative sexually transmitted infection caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "112121000119105",
            display:
              "Venereal disease caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "188463006",
            display: "Chlamydial pelvic inflammatory disease (disorder)",
            include: true,
          },
          {
            code: "236683007",
            display: "Chlamydial urethritis (disorder)",
            include: true,
          },
          {
            code: "276681001",
            display: "Neonatal chlamydial dacryocystitis (disorder)",
            include: true,
          },
          {
            code: "446642005",
            display:
              "Infection of anus caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "788012008",
            display:
              "Inflammation of pelvis caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "10750051000119105",
            display:
              "Chlamydia trachomatis infection in mother complicating childbirth (disorder)",
            include: true,
          },
          {
            code: "186731007",
            display: "Chlamydial infection of anus and rectum (disorder)",
            include: true,
          },
          {
            code: "234099003",
            display: "Lymphedema due to lymphogranuloma venereum (disorder)",
            include: true,
          },
          {
            code: "237106009",
            display: "Chlamydial bartholinitis (disorder)",
            include: true,
          },
          {
            code: "426165006",
            display:
              "Acute infection of genitourinary system caused by Chlamydia (disorder)",
            include: true,
          },
          {
            code: "460618008",
            display: "Endocarditis caused by Chlamydia (disorder)",
            include: true,
          },
          {
            code: "1621000119101",
            display: "Chlamydia trachomatis infection in pregnancy (disorder)",
            include: true,
          },
          {
            code: "233600003",
            display: "Acute chlamydial bronchitis (disorder)",
            include: true,
          },
          {
            code: "237039009",
            display: "Chlamydial salpingitis (disorder)",
            include: true,
          },
          {
            code: "367504009",
            display:
              "Pelvic inflammatory disease with female sterility due to Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "447372001",
            display:
              "Infection of rectum caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "1163477006",
            display:
              "Infection of intestine caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "206289001",
            display: "Congenital chlamydial pneumonia (disorder)",
            include: true,
          },
          {
            code: "237097008",
            display: "Chlamydial vulvovaginitis (disorder)",
            include: true,
          },
          {
            code: "426247003",
            display:
              "Acute genitourinary Chlamydia trachomatis infection (disorder)",
            include: true,
          },
          {
            code: "447386002",
            display:
              "Infection of vulva caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "143511000119105",
            display: "Perihepatitis caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "233610007",
            display: "Neonatal chlamydial pneumonia (disorder)",
            include: true,
          },
          {
            code: "238372002",
            display: "Chlamydial dermatological disorders (disorder)",
            include: true,
          },
          {
            code: "428015005",
            display:
              "Chlamydia trachomatis infection of genital structure (disorder)",
            include: true,
          },
          {
            code: "59484000",
            display: "Chlamydial polyarthritis (disorder)",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.634_20190605",
        valueSetVersion: "20190605",
        valueSetName:
          "Chlamydia trachomatis Infection [Secondary Sites Complications] (Disorders) (ICD10CM)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.634",
        author: "CSTE Steward",
        system: "http://hl7.org/fhir/sid/icd-10-cm",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "A56.0",
            display: "Chlamydial infection of lower genitourinary tract",
            include: true,
          },
          {
            code: "A56.8",
            display: "Sexually transmitted chlamydial infection of other sites",
            include: true,
          },
          {
            code: "A56.19",
            display: "Other chlamydial genitourinary infection",
            include: true,
          },
          {
            code: "A74.89",
            display: "Other chlamydial diseases",
            include: true,
          },
          {
            code: "A56",
            display: "Other sexually transmitted chlamydial diseases",
            include: true,
          },
          {
            code: "A56.4",
            display: "Chlamydial infection of pharynx",
            include: true,
          },
          {
            code: "P23.1",
            display: "Congenital pneumonia due to Chlamydia",
            include: true,
          },
          {
            code: "A56.09",
            display: "Other chlamydial infection of lower genitourinary tract",
            include: true,
          },
          {
            code: "A74.81",
            display: "Chlamydial peritonitis",
            include: true,
          },
          {
            code: "A56.11",
            display: "Chlamydial female pelvic inflammatory disease",
            include: true,
          },
          {
            code: "J16.0",
            display: "Chlamydial pneumonia",
            include: true,
          },
          {
            code: "A56.2",
            display: "Chlamydial infection of genitourinary tract, unspecified",
            include: true,
          },
          {
            code: "A56.01",
            display: "Chlamydial cystitis and urethritis",
            include: true,
          },
          {
            code: "A74.8",
            display: "Other chlamydial diseases",
            include: true,
          },
          {
            code: "A56.00",
            display:
              "Chlamydial infection of lower genitourinary tract, unspecified",
            include: true,
          },
          {
            code: "A56.3",
            display: "Chlamydial infection of anus and rectum",
            include: true,
          },
          {
            code: "A56.02",
            display: "Chlamydial vulvovaginitis",
            include: true,
          },
          {
            code: "A74",
            display: "Other diseases caused by chlamydiae",
            include: true,
          },
          {
            code: "A56.1",
            display:
              "Chlamydial infection of pelviperitoneum and other genitourinary organs",
            include: true,
          },
          {
            code: "A74.9",
            display: "Chlamydial infection, unspecified",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.633_20220602",
        valueSetVersion: "20220602",
        valueSetName:
          "Chlamydia trachomatis Infection [Conjunctivitis] (Disorders) (SNOMED)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.633",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "231861005",
            display: "Chlamydial conjunctivitis (disorder)",
            include: true,
          },
          {
            code: "268842008",
            display:
              "Neonatal dacryocystitis or conjunctivitis caused by chlamydiae (disorder)",
            include: true,
          },
          {
            code: "56009001",
            display: "Inclusion conjunctivitis of the adult (disorder)",
            include: true,
          },
          {
            code: "240591000",
            display: "Neonatal chlamydial conjunctivitis (disorder)",
            include: true,
          },
          {
            code: "15680081000119109",
            display:
              "Conjunctivitis of bilateral eyes caused by Chlamydia (disorder)",
            include: true,
          },
          {
            code: "15680161000119101",
            display:
              "Conjunctivitis of left eye caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.53_20220602",
        valueSetVersion: "20220602",
        valueSetName:
          "Chlamydia trachomatis Infection [Cervicitis Urethritis LGV] (Disorders) (ICD10CM)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.53",
        author: "CSTE Steward",
        system: "http://hl7.org/fhir/sid/icd-10-cm",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "A55",
            display: "Chlamydial lymphogranuloma (venereum)",
            include: true,
          },
          {
            code: "A56.01",
            display: "Chlamydial cystitis and urethritis",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.609_20191227",
        valueSetVersion: "20191227",
        valueSetName: "Trachoma (Disorders) (SNOMED)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.609",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "29976007",
            display: "Trachoma, initial stage (disorder)",
            include: true,
          },
          {
            code: "722553006",
            display: "Sequela of trachoma (disorder)",
            include: true,
          },
          {
            code: "55555001",
            display: "Trachomatous pannus (disorder)",
            include: true,
          },
          {
            code: "52812002",
            display: "Trachoma, active stage (disorder)",
            include: true,
          },
          {
            code: "2576002",
            display: "Trachoma (disorder)",
            include: true,
          },
          {
            code: "27020006",
            display: "Trachomatous follicular conjunctivitis (disorder)",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.52_20220602",
        valueSetVersion: "20220602",
        valueSetName:
          "Chlamydia trachomatis Infection [Cervicitis Urethritis LGV] (Disorders) (SNOMED)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.52",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "236683007",
            display: "Chlamydial urethritis (disorder)",
            include: true,
          },
          {
            code: "240604009",
            display: "Latent lymphogranuloma venereum (disorder)",
            include: true,
          },
          {
            code: "179101003",
            display: "Urethritis caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
          {
            code: "237084006",
            display: "Chlamydial cervicitis (disorder)",
            include: true,
          },
          {
            code: "240602008",
            display: "Early lymphogranuloma venereum (disorder)",
            include: true,
          },
          {
            code: "186946009",
            display: "Lymphogranuloma venereum (disorder)",
            include: true,
          },
          {
            code: "240603003",
            display: "Late lymphogranuloma venereum (disorder)",
            include: true,
          },
          {
            code: "447353001",
            display:
              "Infection of cervix caused by Chlamydia trachomatis (disorder)",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.635_20181031",
        valueSetVersion: "20181031",
        valueSetName:
          "Chlamydia trachomatis Infection [Conjunctivitis] (Disorders) (ICD10CM)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.635",
        author: "CSTE Steward",
        system: "http://hl7.org/fhir/sid/icd-10-cm",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "A74.0",
            display: "Chlamydial conjunctivitis",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.610_20181031",
        valueSetVersion: "20181031",
        valueSetName: "Trachoma (Disorders) (ICD10CM)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.610",
        author: "CSTE Steward",
        system: "http://hl7.org/fhir/sid/icd-10-cm",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "A71.1",
            display: "Active stage of trachoma",
            include: true,
          },
          {
            code: "B94.0",
            display: "Sequelae of trachoma",
            include: true,
          },
          {
            code: "A71.9",
            display: "Trachoma, unspecified",
            include: true,
          },
          {
            code: "A71.0",
            display: "Initial stage of trachoma",
            include: true,
          },
          {
            code: "A71",
            display: "Trachoma",
            include: true,
          },
        ],
      },
      {
        valueSetId: "13_20240910",
        valueSetVersion: "20240910",
        valueSetName: "Suspected Chlamydia Diagnosis",
        valueSetExternalId: "13",
        author: "DIBBs",
        system: "http://snomed.info/sct",
        ersdConceptType: "sdtc",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "2339001",
            display: "Sexual overexposure",
            include: true,
          },
          {
            code: "72531000052105 ",
            display: "Counseling for contraception",
            include: true,
          },
        ],
      },
      {
        valueSetId: "11_20240910",
        valueSetVersion: "20240910",
        valueSetName: "Chlamydia Medication",
        valueSetExternalId: "11",
        author: "DIBBs",
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        ersdConceptType: "mrtc",
        dibbsConceptType: "medications",
        includeValueSet: true,
        concepts: [
          {
            code: "1649987",
            display: "doxycycline hyclate 100 MG",
            include: true,
          },
          {
            code: "434692",
            display: "azithromycin 1000 MG",
            include: true,
          },
          {
            code: "82122",
            display: "levofloxacin",
            include: true,
          },
          {
            code: "1665005",
            display: "ceftriaxone 500 MG Injection",
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
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.550_20240123",
        valueSetVersion: "20240123",
        valueSetName: "Syphilis (Tests for Treponema pallidum Nucleic Acid)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.550",
        author: "CSTE Steward",
        system: "http://loinc.org",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "49799-0",
            display:
              "Treponema pallidum DNA [Presence] in Cerebral spinal fluid by NAA with probe detection",
            include: true,
          },
          {
            code: "41163-7",
            display:
              "Treponema pallidum DNA [Presence] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "91846-6",
            display:
              "Treponema pallidum DNA [Presence] in Genital specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "103199-6",
            display:
              "Treponema pallidum DNA [Presence] in Urine by Probe with amplification",
            include: true,
          },
          {
            code: "53605-2",
            display:
              "Treponema pallidum DNA [Presence] in Blood by NAA with probe detection",
            include: true,
          },
          {
            code: "76766-5",
            display:
              "Treponema pallidum polA gene [Presence] in Genital specimen by NAA with probe detection",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.746_20220118",
        valueSetVersion: "20220118",
        valueSetName: "Treponema pallidum (Tests by Microscopic Observation)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.746",
        author: "CSTE Steward",
        system: "http://loinc.org",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "29310-0",
            display:
              "Treponema pallidum [Presence] in Specimen by Immunofluorescence",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.705_20220602",
        valueSetVersion: "20220602",
        valueSetName:
          "Syphilis (Tests for Treponemal or Non Treponemal Antibody)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.705",
        author: "CSTE Steward",
        system: "http://loinc.org",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "11597-2",
            display: "Treponema pallidum Ab [Units/volume] in Serum",
            include: true,
          },
          {
            code: "20508-8",
            display: "Reagin Ab [Units/volume] in Serum or Plasma by RPR",
            include: true,
          },
          {
            code: "22592-0",
            display: "Treponema pallidum IgG Ab [Units/volume] in Serum",
            include: true,
          },
          {
            code: "39015-3",
            display:
              "Treponema pallidum Ab [Units/volume] in Body fluid by Hemagglutination",
            include: true,
          },
          {
            code: "47237-3",
            display:
              "Treponema pallidum IgM Ab [Presence] in Serum by Immunoassay",
            include: true,
          },
          {
            code: "51783-9",
            display: "Reagin Ab [Presence] in Cord blood by VDRL",
            include: true,
          },
          {
            code: "58031-6",
            display:
              "Treponema pallidum IgG Ab [Presence] in Cerebral spinal fluid",
            include: true,
          },
          {
            code: "98217-3",
            display:
              "Treponema pallidum IgG Ab [Titer] in Cerebral spinal fluid by Immunofluorescence",
            include: true,
          },
          {
            code: "13288-6",
            display:
              "Treponema pallidum Ab [Units/volume] in Blood by Immunofluorescence",
            include: true,
          },
          {
            code: "22459-2",
            display: "Reagin Ab [Presence] in Cerebral spinal fluid",
            include: true,
          },
          {
            code: "24312-1",
            display:
              "Treponema pallidum Ab [Presence] in Serum by Agglutination",
            include: true,
          },
          {
            code: "41122-3",
            display: "Treponema pallidum Ab [Units/volume] in Specimen",
            include: true,
          },
          {
            code: "47511-1",
            display: "Treponema pallidum Ab [Units/volume] in Body fluid",
            include: true,
          },
          {
            code: "51838-1",
            display:
              "Treponema pallidum IgG Ab [Units/volume] in Serum by Immunoassay",
            include: true,
          },
          {
            code: "63464-2",
            display:
              "Treponema pallidum Ab [Units/volume] in Serum by Immunoassay",
            include: true,
          },
          {
            code: "98218-1",
            display:
              "Treponema pallidum IgM Ab [Titer] in Cerebral spinal fluid by Immunofluorescence",
            include: true,
          },
          {
            code: "17728-7",
            display:
              "Treponema pallidum IgM Ab [Units/volume] in Serum by Immunofluorescence",
            include: true,
          },
          {
            code: "22464-2",
            display: "Reagin Ab [Presence] in Specimen",
            include: true,
          },
          {
            code: "31146-4",
            display: "Reagin Ab [Titer] in Cerebral spinal fluid by VDRL",
            include: true,
          },
          {
            code: "46203-6",
            display: "Reagin Ab [Titer] in Cerebral spinal fluid",
            include: true,
          },
          {
            code: "49800-6",
            display:
              "Treponema pallidum Ab [Units/volume] in Cerebral spinal fluid by Hemagglutination",
            include: true,
          },
          {
            code: "5292-8",
            display: "Reagin Ab [Presence] in Serum by VDRL",
            include: true,
          },
          {
            code: "69946-2",
            display:
              "Treponema pallidum IgM Ab [Presence] in Cerebral spinal fluid by Immunoblot",
            include: true,
          },
          {
            code: "98223-1",
            display:
              "Treponema pallidum IgM bands [Identifier] in Serum by Immunoblot",
            include: true,
          },
          {
            code: "14904-7",
            display: "Reagin Ab [Presence] in Specimen by VDRL",
            include: true,
          },
          {
            code: "20507-0",
            display: "Reagin Ab [Presence] in Serum by RPR",
            include: true,
          },
          {
            code: "22590-4",
            display: "Treponema pallidum Ab [Titer] in Serum",
            include: true,
          },
          {
            code: "34147-9",
            display: "Treponema pallidum IgG+IgM Ab [Presence] in Serum",
            include: true,
          },
          {
            code: "47236-5",
            display:
              "Treponema pallidum IgG+IgM Ab [Presence] in Serum by Immunoassay",
            include: true,
          },
          {
            code: "50695-6",
            display:
              "Treponema pallidum Ab [Titer] in Cerebral spinal fluid by Hemagglutination",
            include: true,
          },
          {
            code: "5394-2",
            display:
              "Treponema pallidum Ab [Titer] in Serum by Latex agglutination",
            include: true,
          },
          {
            code: "8041-6",
            display:
              "Treponema pallidum Ab [Presence] in Serum by Hemagglutination",
            include: true,
          },
          {
            code: "9826-9",
            display:
              "Treponema pallidum Ab [Presence] in Cerebral spinal fluid by Immunofluorescence",
            include: true,
          },
          {
            code: "17725-3",
            display:
              "Treponema pallidum Ab [Units/volume] in Serum by Latex agglutination",
            include: true,
          },
          {
            code: "22462-6",
            display: "Reagin Ab [Units/volume] in Serum",
            include: true,
          },
          {
            code: "24110-9",
            display: "Treponema pallidum Ab [Presence] in Serum by Immunoassay",
            include: true,
          },
          {
            code: "40680-1",
            display:
              "Treponema pallidum IgM Ab [Presence] in Serum by Immunoblot",
            include: true,
          },
          {
            code: "47238-1",
            display:
              "Treponema pallidum IgG Ab [Presence] in Serum by Immunoassay",
            include: true,
          },
          {
            code: "51474-5",
            display:
              "Treponema pallidum Ab [Units/volume] in Cerebral spinal fluid",
            include: true,
          },
          {
            code: "57032-5",
            display: "Treponema pallidum Ab [Presence] in Serum by Immunoblot",
            include: true,
          },
          {
            code: "98216-5",
            display:
              "Treponema pallidum Ab [Units/volume] in Cerebral spinal fluid by Immunoassay",
            include: true,
          },
          {
            code: "17726-1",
            display:
              "Treponema pallidum IgG Ab [Presence] in Serum by Immunofluorescence",
            include: true,
          },
          {
            code: "22585-4",
            display: "Treponema pallidum Ab [Units/volume] in Blood",
            include: true,
          },
          {
            code: "31147-2",
            display: "Reagin Ab [Titer] in Serum by RPR",
            include: true,
          },
          {
            code: "47063-3",
            display:
              "Treponema pallidum IgM Ab [Units/volume] in Cerebral spinal fluid by Immunofluorescence",
            include: true,
          },
          {
            code: "50689-9",
            display:
              "Treponema pallidum Ab [Presence] in Cerebral spinal fluid by Hemagglutination",
            include: true,
          },
          {
            code: "5393-4",
            display:
              "Treponema pallidum Ab [Presence] in Serum by Immunofluorescence",
            include: true,
          },
          {
            code: "87925-4",
            display: "Reagin Ab [Titer] in Cerebral spinal fluid by RPR",
            include: true,
          },
          {
            code: "98224-9",
            display:
              "Treponema pallidum IgM bands [Identifier] in Cerebral spinal fluid by Immunoblot",
            include: true,
          },
          {
            code: "11084-1",
            display: "Reagin Ab [Titer] in Serum",
            include: true,
          },
          {
            code: "17729-5",
            display:
              "Treponema pallidum IgM Ab [Presence] in Serum by Immunofluorescence",
            include: true,
          },
          {
            code: "22587-0",
            display: "Treponema pallidum Ab [Presence] in Serum",
            include: true,
          },
          {
            code: "34382-2",
            display:
              "Treponema pallidum Ab [Titer] in Serum by Immunofluorescence",
            include: true,
          },
          {
            code: "47235-7",
            display: "Reagin Ab [Titer] in Specimen by VDRL",
            include: true,
          },
          {
            code: "50690-7",
            display: "Reagin Ab [Titer] in Serum by VDRL",
            include: true,
          },
          {
            code: "5392-6",
            display:
              "Treponema pallidum Ab [Units/volume] in Serum by Immobilization",
            include: true,
          },
          {
            code: "71793-4",
            display:
              "Treponema pallidum Ab [Titer] in Serum or Plasma by Agglutination",
            include: true,
          },
          {
            code: "98221-5",
            display:
              "Treponema pallidum IgG bands [Identifier] in Serum by Immunoblot",
            include: true,
          },
          {
            code: "17727-9",
            display:
              "Treponema pallidum IgG Ab [Units/volume] in Serum by Immunofluorescence",
            include: true,
          },
          {
            code: "22586-2",
            display:
              "Treponema pallidum Ab [Presence] in Cerebral spinal fluid",
            include: true,
          },
          {
            code: "26658-5",
            display: "Treponema sp Ab [Presence] in Serum",
            include: true,
          },
          {
            code: "47051-8",
            display:
              "Treponema pallidum IgG Ab [Units/volume] in Cerebral spinal fluid by Immunofluorescence",
            include: true,
          },
          {
            code: "47512-9",
            display:
              "Treponema pallidum IgG Ab [Units/volume] in Cerebral spinal fluid",
            include: true,
          },
          {
            code: "5289-4",
            display:
              "Reagin Ab [Units/volume] in Cerebral spinal fluid by VDRL",
            include: true,
          },
          {
            code: "5291-0",
            display: "Reagin Ab [Units/volume] in Serum by VDRL",
            include: true,
          },
          {
            code: "6562-3",
            display: "Treponema pallidum IgM Ab [Presence] in Serum",
            include: true,
          },
          {
            code: "98222-3",
            display:
              "Treponema pallidum IgG bands [Identifier] in Cerebral spinal fluid by Immunoblot",
            include: true,
          },
          {
            code: "17724-6",
            display:
              "Treponema pallidum Ab [Units/volume] in Serum by Immunofluorescence",
            include: true,
          },
          {
            code: "22461-8",
            display: "Reagin Ab [Presence] in Serum",
            include: true,
          },
          {
            code: "26009-1",
            display:
              "Treponema pallidum Ab [Titer] in Serum by Hemagglutination",
            include: true,
          },
          {
            code: "43813-5",
            display: "Reagin Ab [Presence] in Cord blood",
            include: true,
          },
          {
            code: "47514-5",
            display:
              "Treponema pallidum IgM Ab [Units/volume] in Cerebral spinal fluid",
            include: true,
          },
          {
            code: "51839-9",
            display:
              "Treponema pallidum IgM Ab [Units/volume] in Serum by Immunoassay",
            include: true,
          },
          {
            code: "5290-2",
            display: "Reagin Ab [Presence] in Cerebral spinal fluid by VDRL",
            include: true,
          },
          {
            code: "6561-5",
            display: "Treponema pallidum IgG Ab [Presence] in Serum",
            include: true,
          },
          {
            code: "98220-7",
            display:
              "Treponema pallidum IgG Ab [Presence] in Cerebral spinal fluid by Immunoblot",
            include: true,
          },
          {
            code: "17723-8",
            display:
              "Treponema pallidum Ab [Presence] in Serum by Immobilization",
            include: true,
          },
          {
            code: "22460-0",
            display: "Reagin Ab [Units/volume] in Cerebral spinal fluid",
            include: true,
          },
          {
            code: "22594-6",
            display: "Treponema pallidum IgM Ab [Units/volume] in Serum",
            include: true,
          },
          {
            code: "40679-3",
            display:
              "Treponema pallidum IgG Ab [Presence] in Serum by Immunoblot",
            include: true,
          },
          {
            code: "47476-7",
            display: "Reagin Ab [Titer] in Specimen",
            include: true,
          },
          {
            code: "51475-2",
            display: "Treponema pallidum Ab [Titer] in Cerebral spinal fluid",
            include: true,
          },
          {
            code: "58751-9",
            display:
              "Treponema pallidum IgG Ab [Presence] in Cerebral spinal fluid by Immunofluorescence",
            include: true,
          },
          {
            code: "98215-7",
            display:
              "Treponema pallidum Ab [Presence] in Cerebral spinal fluid by Immunoassay",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.1089_20191227",
        valueSetVersion: "20191227",
        valueSetName: "Syphilis [Congenital] (Disorders) (ICD10CM)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.1089",
        author: "CSTE Steward",
        system: "http://hl7.org/fhir/sid/icd-10-cm",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "A50",
            display: "Congenital syphilis",
            include: true,
          },
          {
            code: "A50.08",
            display: "Early visceral congenital syphilis",
            include: true,
          },
          {
            code: "A50.40",
            display: "Late congenital neurosyphilis, unspecified",
            include: true,
          },
          {
            code: "A50.53",
            display: "Hutchinson's triad",
            include: true,
          },
          {
            code: "A50.02",
            display: "Early congenital syphilitic osteochondropathy",
            include: true,
          },
          {
            code: "A50.2",
            display: "Early congenital syphilis, unspecified",
            include: true,
          },
          {
            code: "A50.43",
            display: "Late congenital syphilitic polyneuropathy",
            include: true,
          },
          {
            code: "A50.57",
            display: "Syphilitic saddle nose",
            include: true,
          },
          {
            code: "A50.01",
            display: "Early congenital syphilitic oculopathy",
            include: true,
          },
          {
            code: "A50.30",
            display: "Late congenital syphilitic oculopathy, unspecified",
            include: true,
          },
          {
            code: "A50.49",
            display: "Other late congenital neurosyphilis",
            include: true,
          },
          {
            code: "A50.59",
            display: "Other late congenital syphilis, symptomatic",
            include: true,
          },
          {
            code: "A50.07",
            display: "Early mucocutaneous congenital syphilis",
            include: true,
          },
          {
            code: "A50.4",
            display: "Late congenital neurosyphilis [juvenile neurosyphilis}",
            include: true,
          },
          {
            code: "A50.52",
            display: "Hutchinson's teeth",
            include: true,
          },
          {
            code: "A50.0",
            display: "Early congenital syphilis, symptomatic",
            include: true,
          },
          {
            code: "A50.09",
            display: "Other early congenital syphilis, symptomatic",
            include: true,
          },
          {
            code: "A50.41",
            display: "Late congenital syphilitic meningitis",
            include: true,
          },
          {
            code: "A50.54",
            display: "Late congenital cardiovascular syphilis",
            include: true,
          },
          {
            code: "A50.03",
            display: "Early congenital syphilitic pharyngitis",
            include: true,
          },
          {
            code: "A50.3",
            display: "Late congenital syphilitic oculopathy",
            include: true,
          },
          {
            code: "A50.44",
            display: "Late congenital syphilitic optic nerve atrophy",
            include: true,
          },
          {
            code: "A50.56",
            display: "Late congenital syphilitic osteochondropathy",
            include: true,
          },
          {
            code: "A50.06",
            display: "Early cutaneous congenital syphilis",
            include: true,
          },
          {
            code: "A50.31",
            display: "Late congenital syphilitic interstitial keratitis",
            include: true,
          },
          {
            code: "A50.45",
            display: "Juvenile general paresis",
            include: true,
          },
          {
            code: "A50.6",
            display: "Late congenital syphilis, latent",
            include: true,
          },
          {
            code: "A50.04",
            display: "Early congenital syphilitic pneumonia",
            include: true,
          },
          {
            code: "A50.32",
            display: "Late congenital syphilitic chorioretinitis",
            include: true,
          },
          {
            code: "A50.51",
            display: "Clutton's joints",
            include: true,
          },
          {
            code: "A50.9",
            display: "Congenital syphilis, unspecified",
            include: true,
          },
          {
            code: "A50.1",
            display: "Early congenital syphilis, latent",
            include: true,
          },
          {
            code: "A50.42",
            display: "Late congenital syphilitic encephalitis",
            include: true,
          },
          {
            code: "A50.55",
            display: "Late congenital syphilitic arthropathy",
            include: true,
          },
          {
            code: "A50.05",
            display: "Early congenital syphilitic rhinitis",
            include: true,
          },
          {
            code: "A50.39",
            display: "Other late congenital syphilitic oculopathy",
            include: true,
          },
          {
            code: "A50.5",
            display: "Other late congenital syphilis, symptomatic",
            include: true,
          },
          {
            code: "A50.7",
            display: "Late congenital syphilis, unspecified",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.1090_20230602",
        valueSetVersion: "20230602",
        valueSetName: "Syphilis [Congenital] (Disorders) (SNOMED)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.1090",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "109436001",
            display: "Moon molar teeth (disorder)",
            include: true,
          },
          {
            code: "230563005",
            display: "Late congenital syphilitic polyneuropathy (disorder)",
            include: true,
          },
          {
            code: "46235002",
            display:
              "Early latent congenital syphilis, positive serology, negative spinal fluid (disorder)",
            include: true,
          },
          {
            code: "82323002",
            display: "Late congenital syphilis (2 years OR more) (disorder)",
            include: true,
          },
          {
            code: "19290004",
            display: "Clutton's joints (disorder)",
            include: true,
          },
          {
            code: "276700005",
            display: "Congenital syphilitic rhinitis (disorder)",
            include: true,
          },
          {
            code: "6267005",
            display: "Congenital syphilitic meningitis (disorder)",
            include: true,
          },
          {
            code: "9941009",
            display: "Congenital syphilitic choroiditis (disorder)",
            include: true,
          },
          {
            code: "1142031005",
            display: "Optic atrophy due to late congenital syphilis (disorder)",
            include: true,
          },
          {
            code: "230152000",
            display: "Late congenital syphilitic meningitis (disorder)",
            include: true,
          },
          {
            code: "35742006",
            display: "Congenital syphilis (disorder)",
            include: true,
          },
          {
            code: "721583004",
            display: "Mucocutaneous early congenital syphilis (disorder)",
            include: true,
          },
          {
            code: "192008",
            display: "Congenital syphilitic hepatomegaly (disorder)",
            include: true,
          },
          {
            code: "275376007",
            display: "Congenital syphilitic chronic coryza (disorder)",
            include: true,
          },
          {
            code: "59721007",
            display: "Congenital syphilitic pemphigus (disorder)",
            include: true,
          },
          {
            code: "86443005",
            display: "Hutchinson's teeth (disorder)",
            include: true,
          },
          {
            code: "186833000",
            display: "Early congenital syphilis - latent (disorder)",
            include: true,
          },
          {
            code: "32735002",
            display: "Congenital syphilitic encephalitis (disorder)",
            include: true,
          },
          {
            code: "703134008",
            display:
              "Hypoplasia of enamel due to congenital syphilis (disorder)",
            include: true,
          },
          {
            code: "1142112002",
            display:
              "Sensorineural deafness due to late congenital syphilis (disorder)",
            include: true,
          },
          {
            code: "266125005",
            display: "Early congenital syphilis with symptoms (disorder)",
            include: true,
          },
          {
            code: "58392004",
            display: "Congenital syphilitic osteochondritis (disorder)",
            include: true,
          },
          {
            code: "866106004",
            display:
              "Interstitial keratitis due to late congenital syphilis (disorder)",
            include: true,
          },
          {
            code: "1142092000",
            display: "Late congenital syphilitic osteochondropathy (disorder)",
            include: true,
          },
          {
            code: "240554006",
            display: "Hutchinson's triad (disorder)",
            include: true,
          },
          {
            code: "54069001",
            display: "Congenital syphilitic mucous patches (disorder)",
            include: true,
          },
          {
            code: "827006",
            display:
              "Late congenital syphilis, latent (positive serology - cerebrospinal fluid, 2 years OR more) (disorder)",
            include: true,
          },
          {
            code: "186842007",
            display: "Late congenital syphilitic oculopathy (disorder)",
            include: true,
          },
          {
            code: "27648007",
            display: "Congenital syphilitic periostitis (disorder)",
            include: true,
          },
          {
            code: "68764005",
            display: "Juvenile taboparesis (disorder)",
            include: true,
          },
          {
            code: "87318008",
            display: "Congenital syphilis with gumma (disorder)",
            include: true,
          },
          {
            code: "1142095003",
            display:
              "Late congenital syphilis of cardiovascular system (disorder)",
            include: true,
          },
          {
            code: "235898000",
            display: "Pericellular fibrosis of congenital syphilis (disorder)",
            include: true,
          },
          {
            code: "4359001",
            display: "Early congenital syphilis (less than 2 years) (disorder)",
            include: true,
          },
          {
            code: "735515000",
            display: "Symptomatic late congenital syphilis (disorder)",
            include: true,
          },
          {
            code: "1177081002",
            display: "Mulberry molar teeth (disorder)",
            include: true,
          },
          {
            code: "266126006",
            display: "Late congenital neurosyphilis (disorder)",
            include: true,
          },
          {
            code: "56118002",
            display: "Congenital syphilitic splenomegaly (disorder)",
            include: true,
          },
          {
            code: "82959004",
            display: "Dementia paralytica juvenilis (disorder)",
            include: true,
          },
        ],
      },
      {
        valueSetId: "5_20240909",
        valueSetVersion: "20240909",
        valueSetName: "Syphilis Diagnosis Problem",
        valueSetExternalId: "5",
        author: "DIBBs",
        system: "http://snomed.info/sct",
        ersdConceptType: "dxtc",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "76272004",
            display: "Syphilis (disorder)",
            include: true,
          },
        ],
      },
      {
        valueSetId: "6_20240909",
        valueSetVersion: "20240909",
        valueSetName: "Suspected Syphilis Disorder",
        valueSetExternalId: "6",
        author: "DIBBs",
        system: "http://snomed.info/sct",
        ersdConceptType: "sdtc",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "186647001",
            display: "Primary genital syphilis",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.1913_20230122",
        valueSetVersion: "20230122",
        valueSetName: "Penicillin G [Procaine] [Injectable] (RXNORM)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.1913",
        author: "CSTE Steward",
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        ersdConceptType: "medications",
        dibbsConceptType: "medications",
        includeValueSet: true,
        concepts: [
          {
            code: "1050115",
            display:
              "penicillin G procaine 300000 UNT/ML Injectable Suspension [Norocillin}",
            include: true,
          },
          {
            code: "1050111",
            display:
              "penicillin G procaine 300000 UNT/ML Injectable Suspension [Bactracillin G}",
            include: true,
          },
          {
            code: "745560",
            display:
              "1 ML penicillin G procaine 600000 UNT/ML Prefilled Syringe",
            include: true,
          },
          {
            code: "745303",
            display:
              "penicillin G procaine 300000 UNT/ML Injectable Suspension",
            include: true,
          },
          {
            code: "1731729",
            display:
              "penicillin G procaine 300000 UNT/ML Injectable Suspension [Vetripen}",
            include: true,
          },
          {
            code: "1438127",
            display:
              "10 ML penicillin G procaine 10000 UNT/ML Prefilled Syringe",
            include: true,
          },
          {
            code: "1233540",
            display:
              "penicillin G procaine 300000 UNT/ML Injectable Suspension [Pro-Pen-G}",
            include: true,
          },
          {
            code: "745462",
            display:
              "2 ML penicillin G procaine 600000 UNT/ML Prefilled Syringe",
            include: true,
          },
          {
            code: "1094911",
            display:
              "penicillin G procaine 300000 UNT/ML Injectable Suspension [Pen-Aqueous}",
            include: true,
          },
          {
            code: "745561",
            display:
              "penicillin G procaine 600000 UNT/ML Injectable Suspension",
            include: true,
          },
          {
            code: "1438136",
            display:
              "10 ML penicillin G procaine 10000 UNT/ML Prefilled Syringe [Masti-clear}",
            include: true,
          },
          {
            code: "1438129",
            display:
              "10 ML penicillin G procaine 10000 UNT/ML Prefilled Syringe [Go-dry}",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.1912_20230122",
        valueSetVersion: "20230122",
        valueSetName:
          "Penicillin G [Aqueous Crystalline] [Injectable] (RXNORM)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.1912",
        author: "CSTE Steward",
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        ersdConceptType: "medications",
        dibbsConceptType: "medications",
        includeValueSet: true,
        concepts: [
          {
            code: "863538",
            display:
              "penicillin G potassium 1000000 UNT/ML Injectable Solution",
            include: true,
          },
          {
            code: "745302",
            display: "penicillin G sodium 100000 UNT/ML Injectable Solution",
            include: true,
          },
          {
            code: "204466",
            display: "50 ML penicillin G potassium 40000 UNT/ML Injection",
            include: true,
          },
          {
            code: "995906",
            display:
              "penicillin G potassium 1000000 UNT/ML Injectable Solution [Pfizerpen}",
            include: true,
          },
          {
            code: "207391",
            display: "50 ML penicillin G potassium 60000 UNT/ML Injection",
            include: true,
          },
          {
            code: "207390",
            display: "50 ML penicillin G potassium 20000 UNT/ML Injection",
            include: true,
          },
        ],
      },
      {
        valueSetId: "4_20240909",
        valueSetVersion: "20240909",
        valueSetName: "Syphilis Medication",
        valueSetExternalId: "4",
        author: "DIBBs",
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        ersdConceptType: "mrtc",
        dibbsConceptType: "medications",
        includeValueSet: true,
        concepts: [
          {
            code: "2671695",
            display: "penicillin G benzathine 2400000 UNT Injection",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.747_20220603",
        valueSetVersion: "20220603",
        valueSetName:
          "Penicillin G [Benzathine] [Injectable] [Bicillin] (RXNORM)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.747",
        author: "CSTE Steward",
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        ersdConceptType: "medications",
        dibbsConceptType: "medications",
        includeValueSet: true,
        concepts: [
          {
            code: "731568",
            display:
              "2 ML penicillin G benzathine 600000 UNT/ML Prefilled Syringe [Bicillin L-A}",
            include: true,
          },
          {
            code: "731567",
            display:
              "2 ML penicillin G benzathine 600000 UNT/ML Prefilled Syringe",
            include: true,
          },
          {
            code: "731566",
            display:
              "1 ML penicillin G benzathine 600000 UNT/ML Prefilled Syringe [Bicillin L-A}",
            include: true,
          },
          {
            code: "731570",
            display:
              "4 ML penicillin G benzathine 600000 UNT/ML Prefilled Syringe",
            include: true,
          },
          {
            code: "731572",
            display:
              "penicillin G benzathine 600000 UNT/ML Injectable Suspension",
            include: true,
          },
          {
            code: "731564",
            display:
              "1 ML penicillin G benzathine 600000 UNT/ML Prefilled Syringe",
            include: true,
          },
          {
            code: "731571",
            display:
              "4 ML penicillin G benzathine 600000 UNT/ML Prefilled Syringe [Bicillin L-A}",
            include: true,
          },
          {
            code: "731575",
            display:
              "penicillin G benzathine 300000 UNT/ML Injectable Suspension",
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
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.245_20191227",
        valueSetVersion: "20191227",
        valueSetName:
          "Gonorrhea (Tests for Neisseria gonorrhoeae by Culture and Identification Method)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.245",
        author: "CSTE Steward",
        system: "http://loinc.org",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "691-6",
            display:
              "Neisseria gonorrhoeae [Presence] in Genital specimen by Organism specific culture",
            include: true,
          },
          {
            code: "690-8",
            display:
              "Neisseria gonorrhoeae [Presence] in Endometrium by Organism specific culture",
            include: true,
          },
          {
            code: "91781-5",
            display:
              "Neisseria gonorrhoeae [Presence] in Aspirate by Organism specific culture",
            include: true,
          },
          {
            code: "696-5",
            display:
              "Neisseria gonorrhoeae [Presence] in Throat by Organism specific culture",
            include: true,
          },
          {
            code: "693-2",
            display:
              "Neisseria gonorrhoeae [Presence] in Vaginal fluid by Organism specific culture",
            include: true,
          },
          {
            code: "695-7",
            display:
              "Neisseria gonorrhoeae [Presence] in Synovial fluid by Organism specific culture",
            include: true,
          },
          {
            code: "688-2",
            display:
              "Neisseria gonorrhoeae [Presence] in Cervix by Organism specific culture",
            include: true,
          },
          {
            code: "80368-4",
            display:
              "Neisseria gonorrhoeae [Presence] in Rectum by Organism specific culture",
            include: true,
          },
          {
            code: "14127-5",
            display:
              "Neisseria gonorrhoeae [Presence] in Anal by Organism specific culture",
            include: true,
          },
          {
            code: "697-3",
            display:
              "Neisseria gonorrhoeae [Presence] in Urethra by Organism specific culture",
            include: true,
          },
          {
            code: "692-4",
            display:
              "Neisseria gonorrhoeae [Presence] in Genital lochia by Organism specific culture",
            include: true,
          },
          {
            code: "694-0",
            display:
              "Neisseria gonorrhoeae [Presence] in Semen by Organism specific culture",
            include: true,
          },
          {
            code: "30099-6",
            display:
              "Neisseria gonorrhoeae [Presence] in Conjunctival specimen by Organism specific culture",
            include: true,
          },
          {
            code: "698-1",
            display:
              "Neisseria gonorrhoeae [Presence] in Unspecified specimen by Organism specific culture",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.244_20230602",
        valueSetVersion: "20230602",
        valueSetName:
          "Gonorrhea (Tests for Neisseria gonorrhoeae Nucleic Acid)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.244",
        author: "CSTE Steward",
        system: "http://loinc.org",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "21414-8",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Cervical mucus by NAA with probe detection",
            include: true,
          },
          {
            code: "36903-3",
            display:
              "Chlamydia trachomatis and Neisseria gonorrhoeae DNA [Identifier] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "32199-2",
            display:
              "Neisseria gonorrhoeae rRNA [Presence] in Urethra by Probe",
            include: true,
          },
          {
            code: "44806-8",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae DNA [Presence] in Urine by NAA with probe detection",
            include: true,
          },
          {
            code: "45075-9",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Urethra by Probe",
            include: true,
          },
          {
            code: "60256-5",
            display:
              "Neisseria gonorrhoeae rRNA [Presence] in Urine by NAA with probe detection",
            include: true,
          },
          {
            code: "24111-7",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "43405-0",
            display:
              "Chlamydia trachomatis and Neisseria gonorrhoeae DNA [Identifier] in Specimen by Probe with signal amplification",
            include: true,
          },
          {
            code: "45074-2",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Urine by Probe",
            include: true,
          },
          {
            code: "57458-2",
            display:
              "Neisseria gonorrhoeae rRNA [Presence] in Anal by NAA with probe detection",
            include: true,
          },
          {
            code: "36902-5",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae DNA [Presence] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "45068-4",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae DNA [Presence] in Cervix by NAA with probe detection",
            include: true,
          },
          {
            code: "50388-8",
            display:
              "Neisseria gonorrhoeae rRNA [Presence] in Cervix by NAA with probe detection",
            include: true,
          },
          {
            code: "80362-7",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Vaginal fluid by NAA with probe detection",
            include: true,
          },
          {
            code: "33904-4",
            display:
              "Neisseria gonorrhoeae rRNA [Presence] in Conjunctival specimen by Probe",
            include: true,
          },
          {
            code: "45067-6",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Cervix by Probe",
            include: true,
          },
          {
            code: "5028-6",
            display:
              "Neisseria gonorrhoeae rRNA [Presence] in Specimen by Probe",
            include: true,
          },
          {
            code: "80360-1",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Urine by NAA with probe detection",
            include: true,
          },
          {
            code: "21416-3",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Urine by NAA with probe detection",
            include: true,
          },
          {
            code: "43403-5",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Specimen by Probe with signal amplification",
            include: true,
          },
          {
            code: "45073-4",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Tissue by Probe",
            include: true,
          },
          {
            code: "57289-1",
            display:
              "Neisseria gonorrhoeae rRNA [Presence] in Nasopharynx by NAA with probe detection",
            include: true,
          },
          {
            code: "88225-8",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Throat by NAA with probe detection",
            include: true,
          },
          {
            code: "100356-5",
            display:
              "Chlamydia trachomatis and Neisseria gonorrhoeae and Trichomonas vaginalis DNA [Identifier] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "35735-0",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Conjunctival specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "45069-2",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Genital specimen by Probe",
            include: true,
          },
          {
            code: "53879-3",
            display:
              "Neisseria gonorrhoeae rRNA [Presence] in Vaginal fluid by NAA with probe detection",
            include: true,
          },
          {
            code: "80365-0",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Anorectal by NAA with probe detection",
            include: true,
          },
          {
            code: "21415-5",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Urethra by NAA with probe detection",
            include: true,
          },
          {
            code: "43305-2",
            display:
              "Neisseria gonorrhoeae rRNA [Presence] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "45072-6",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Anal by Probe",
            include: true,
          },
          {
            code: "57180-2",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Nasopharynx by NAA with probe detection",
            include: true,
          },
          {
            code: "88224-1",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Anorectal by NAA with probe detection",
            include: true,
          },
          {
            code: "32705-6",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Vaginal fluid by NAA with probe detection",
            include: true,
          },
          {
            code: "44807-6",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae DNA [Presence] in Genital specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "47387-6",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Genital specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "80361-9",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Cervix by NAA with probe detection",
            include: true,
          },
          {
            code: "32198-4",
            display: "Neisseria gonorrhoeae rRNA [Presence] in Cervix by Probe",
            include: true,
          },
          {
            code: "43406-8",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae DNA [Presence] in Specimen by Probe with signal amplification",
            include: true,
          },
          {
            code: "45076-7",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Specimen by Probe",
            include: true,
          },
          {
            code: "60255-7",
            display:
              "Neisseria gonorrhoeae rRNA [Presence] in Throat by NAA with probe detection",
            include: true,
          },
          {
            code: "97626-6",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Synovial fluid by NAA with non-probe detection",
            include: true,
          },
          {
            code: "45070-0",
            display:
              "Chlamydia trachomatis+Neisseria gonorrhoeae rRNA [Presence] in Vaginal fluid by Probe",
            include: true,
          },
          {
            code: "53927-0",
            display:
              "Neisseria gonorrhoeae rRNA [Presence] in Urethra by NAA with probe detection",
            include: true,
          },
          {
            code: "80366-8",
            display:
              "Neisseria gonorrhoeae rRNA [Presence] in Anorectal by NAA with probe detection",
            include: true,
          },
          {
            code: "96599-6",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Cervix by NAA with probe detection",
            include: true,
          },
          {
            code: "99779-1",
            display:
              "Neisseria gonorrhoeae rRNA [Presence] in Conjunctival specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "24111-7",
            display:
              "Neisseria gonorrhoeae DNA [Presence] in Specimen by NAA with probe detection",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.1000_20220601",
        valueSetVersion: "20220601",
        valueSetName:
          "Gonorrhea (Tests for Neisseria species by Culture and Identification Method)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.1000",
        author: "CSTE Steward",
        system: "http://loinc.org",
        ersdConceptType: "labs",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "43386-2",
            display:
              "Neisseria sp identified in Anal by Organism specific culture",
            include: true,
          },
          {
            code: "43385-4",
            display:
              "Neisseria sp identified in Cervix by Organism specific culture",
            include: true,
          },
          {
            code: "43384-7",
            display:
              "Neisseria sp identified in Urethra by Organism specific culture",
            include: true,
          },
          {
            code: "90072-0",
            display:
              "Haemophilus and Neisseria species identified in Isolate by Organism specific culture",
            include: true,
          },
          {
            code: "43383-9",
            display:
              "Neisseria sp identified in Throat by Organism specific culture",
            include: true,
          },
          {
            code: "43387-0",
            display:
              "Neisseria sp identified in Specimen by Organism specific culture",
            include: true,
          },
          {
            code: "80369-2",
            display:
              "Neisseria sp identified in Anorectal by Organism specific culture",
            include: true,
          },
        ],
      },
      {
        valueSetId: "9_20240909",
        valueSetVersion: "20240909",
        valueSetName: "Gonorrhea Lab Organism",
        valueSetExternalId: "9",
        author: "DIBBs",
        system: "http://loinc.org",
        ersdConceptType: "lotc",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "11350-6",
            display: "History of Sexual behavior Narrative",
            include: true,
          },
        ],
      },
      {
        valueSetId: "10_20240909",
        valueSetVersion: "20240909",
        valueSetName: "Gonorrhea Lab Result",
        valueSetExternalId: "10",
        author: "DIBBs",
        system: "http://loinc.org",
        ersdConceptType: "lrtc",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "21613-5",
            display:
              "Chlamydia trachomatis DNA [Presence] in Specimen by NAA with probe detection",
            include: true,
          },
          {
            code: "83317-8",
            display: "Sexual activity with anonymous partner in the past year",
            include: true,
          },
          {
            code: "82810-3",
            display: "Pregnancy status",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.44_20240620",
        valueSetVersion: "20240620",
        valueSetName: "Gonorrhea [Cervicitis Urethritis] (Disorders) (ICD10CM)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.44",
        author: "CSTE Steward",
        system: "http://hl7.org/fhir/sid/icd-10-cm",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "A54.00",
            display:
              "Gonococcal infection of lower genitourinary tract, unspecified",
            include: true,
          },
          {
            code: "A54.02",
            display: "Gonococcal vulvovaginitis, unspecified",
            include: true,
          },
          {
            code: "A54.01",
            display: "Gonococcal cystitis and urethritis, unspecified",
            include: true,
          },
          {
            code: "A54.1",
            display:
              "Gonococcal infection of lower genitourinary tract with periurethral and accessory gland abscess",
            include: true,
          },
          {
            code: "A54.03",
            display: "Gonococcal cervicitis, unspecified",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.43_20240620",
        valueSetVersion: "20240620",
        valueSetName: "Gonorrhea [Cervicitis Urethritis] (Disorders) (SNOMED)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.43",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "50970007",
            display: "Acute gonorrhea of upper genitourinary tract (disorder)",
            include: true,
          },
          {
            code: "16217981000119107",
            display:
              "Infection of upper genitourinary tract caused by Neisseria gonorrheae (disorder)",
            include: true,
          },
          {
            code: "76802005",
            display: "Chronic gonococcal cervicitis (disorder)",
            include: true,
          },
          {
            code: "1087021000119101",
            display:
              "Periurethral abscess caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "20943002",
            display: "Acute gonococcal cervicitis (disorder)",
            include: true,
          },
          {
            code: "788961008",
            display:
              "Infection of the penile urethra caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "54825009",
            display: "Acute gonorrhea of lower genitourinary tract (disorder)",
            include: true,
          },
          {
            code: "29864006",
            display: "Acute gonococcal urethritis (disorder)",
            include: true,
          },
          {
            code: "236682002",
            display: "Gonococcal urethritis (disorder)",
            include: true,
          },
          {
            code: "44412000",
            display: "Chronic gonococcal urethritis (disorder)",
            include: true,
          },
          {
            code: "444834005",
            display:
              "Abscess of urethral gland caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "237083000",
            display: "Gonococcal cervicitis (disorder)",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.641_20190605",
        valueSetVersion: "20190605",
        valueSetName:
          "Gonorrhea [Secondary Sites Complications Chronic] (Disorders) (ICD10CM)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.641",
        author: "CSTE Steward",
        system: "http://hl7.org/fhir/sid/icd-10-cm",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "A54.09",
            display: "Other gonococcal infection of lower genitourinary tract",
            include: true,
          },
          {
            code: "A54.33",
            display: "Gonococcal keratitis",
            include: true,
          },
          {
            code: "A54.6",
            display: "Gonococcal infection of anus and rectum",
            include: true,
          },
          {
            code: "O98.2",
            display:
              "Gonorrhea complicating pregnancy, childbirth and the puerperium",
            include: true,
          },
          {
            code: "A54.23",
            display: "Gonococcal infection of other male genital organs",
            include: true,
          },
          {
            code: "A54.40",
            display:
              "Gonococcal infection of musculoskeletal system, unspecified",
            include: true,
          },
          {
            code: "A54.81",
            display: "Gonococcal meningitis",
            include: true,
          },
          {
            code: "O98.21",
            display: "Gonorrhea complicating pregnancy",
            include: true,
          },
          {
            code: "A54.02",
            display: "Gonococcal vulvovaginitis, unspecified",
            include: true,
          },
          {
            code: "A54.30",
            display: "Gonococcal infection of eye, unspecified",
            include: true,
          },
          {
            code: "A54.5",
            display: "Gonococcal pharyngitis",
            include: true,
          },
          {
            code: "A54.89",
            display: "Other gonococcal infections",
            include: true,
          },
          {
            code: "A54.24",
            display: "Gonococcal female pelvic inflammatory disease",
            include: true,
          },
          {
            code: "A54.49",
            display: "Gonococcal infection of other musculoskeletal tissue",
            include: true,
          },
          {
            code: "A54.9",
            display: "Gonococcal infection, unspecified",
            include: true,
          },
          {
            code: "A54",
            display: "Gonococcal infection",
            include: true,
          },
          {
            code: "A54.22",
            display: "Gonococcal prostatitis",
            include: true,
          },
          {
            code: "A54.41",
            display: "Gonococcal spondylopathy",
            include: true,
          },
          {
            code: "A54.85",
            display: "Gonococcal peritonitis",
            include: true,
          },
          {
            code: "O98.23",
            display: "Gonorrhea complicating the puerperium",
            include: true,
          },
          {
            code: "A54.0",
            display:
              "Gonococcal infection of lower genitourinary tract without periurethral or accessory gland abscess",
            include: true,
          },
          {
            code: "A54.3",
            display: "Gonococcal infection of eye",
            include: true,
          },
          {
            code: "A54.42",
            display: "Gonococcal arthritis",
            include: true,
          },
          {
            code: "A54.86",
            display: "Gonococcal sepsis",
            include: true,
          },
          {
            code: "O98.219",
            display: "Gonorrhea complicating pregnancy, unspecified trimester",
            include: true,
          },
          {
            code: "A54.21",
            display: "Gonococcal infection of kidney and ureter",
            include: true,
          },
          {
            code: "A54.4",
            display: "Gonococcal infection of musculoskeletal system",
            include: true,
          },
          {
            code: "A54.83",
            display: "Gonococcal heart infection",
            include: true,
          },
          {
            code: "O98.213",
            display: "Gonorrhea complicating pregnancy, third trimester",
            include: true,
          },
          {
            code: "A54.1",
            display:
              "Gonococcal infection of lower genitourinary tract with periurethral and accessory gland abscess",
            include: true,
          },
          {
            code: "A54.32",
            display: "Gonococcal iridocyclitis",
            include: true,
          },
          {
            code: "A54.8",
            display: "Other gonococcal infections",
            include: true,
          },
          {
            code: "O98.211",
            display: "Gonorrhea complicating pregnancy, first trimester",
            include: true,
          },
          {
            code: "A54.2",
            display:
              "Gonococcal pelviperitonitis and other gonococcal genitourinary infection",
            include: true,
          },
          {
            code: "A54.39",
            display: "Other gonococcal eye infection",
            include: true,
          },
          {
            code: "A54.82",
            display: "Gonococcal brain abscess",
            include: true,
          },
          {
            code: "O98.212",
            display: "Gonorrhea complicating pregnancy, second trimester",
            include: true,
          },
          {
            code: "A54.00",
            display:
              "Gonococcal infection of lower genitourinary tract, unspecified",
            include: true,
          },
          {
            code: "A54.29",
            display: "Other gonococcal genitourinary infections",
            include: true,
          },
          {
            code: "A54.43",
            display: "Gonococcal osteomyelitis",
            include: true,
          },
          {
            code: "A54.84",
            display: "Gonococcal pneumonia",
            include: true,
          },
          {
            code: "O98.22",
            display: "Gonorrhea complicating childbirth",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.642_20190605",
        valueSetVersion: "20190605",
        valueSetName: "Gonorrhea [Conjunctivitis] (Disorders) (ICD10CM)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.642",
        author: "CSTE Steward",
        system: "http://hl7.org/fhir/sid/icd-10-cm",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "A54.30",
            display: "Gonococcal infection of eye, unspecified",
            include: true,
          },
          {
            code: "A54.31",
            display: "Gonococcal conjunctivitis",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.640_20220601",
        valueSetVersion: "20220601",
        valueSetName: "Gonorrhea [Conjunctivitis] (Disorders) (SNOMED)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.640",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "35876006",
            display: "Gonococcal infection of eye (disorder)",
            include: true,
          },
          {
            code: "28438004",
            display: "Gonococcal conjunctivitis neonatorum (disorder)",
            include: true,
          },
          {
            code: "231858009",
            display: "Gonococcal conjunctivitis (disorder)",
            include: true,
          },
          {
            code: "1163495009",
            display:
              "Dacryoadenitis caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "721281003",
            display:
              "Neonatal conjunctivitis and dacrocystitis caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "719755001",
            display:
              "Conjunctivitis of adulthood caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
        ],
      },
      {
        valueSetId: "2.16.840.1.113762.1.4.1146.639_20210527",
        valueSetVersion: "20210527",
        valueSetName:
          "Gonorrhea [Secondary Sites Complications Chronic] (Disorders) (SNOMED)",
        valueSetExternalId: "2.16.840.1.113762.1.4.1146.639",
        author: "CSTE Steward",
        system: "http://snomed.info/sct",
        ersdConceptType: "conditions",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "1052287002",
            display: "Myocarditis caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "111806005",
            display: "Acute gonococcal prostatitis (disorder)",
            include: true,
          },
          {
            code: "186915005",
            display: "Chronic gonorrhea lower genitourinary tract (disorder)",
            include: true,
          },
          {
            code: "1087051000119109",
            display: "Gonococcal osteomyelitis (disorder)",
            include: true,
          },
          {
            code: "151004",
            display: "Gonococcal meningitis (disorder)",
            include: true,
          },
          {
            code: "197967000",
            display: "Gonococcal prostatitis (disorder)",
            include: true,
          },
          {
            code: "236766009",
            display: "Gonococcal epididymitis (disorder)",
            include: true,
          },
          {
            code: "23975003",
            display: "Chronic gonococcal seminal vesiculitis (disorder)",
            include: true,
          },
          {
            code: "240580007",
            display: "Gonococcal penile fistula (disorder)",
            include: true,
          },
          {
            code: "30168008",
            display: "Acute gonococcal epididymo-orchitis (disorder)",
            include: true,
          },
          {
            code: "35876006",
            display: "Gonococcal infection of eye (disorder)",
            include: true,
          },
          {
            code: "5085001",
            display: "Gonococcemia (disorder)",
            include: true,
          },
          {
            code: "72225002",
            display:
              "Urethral stricture due to gonococcal infection (disorder)",
            include: true,
          },
          {
            code: "9241004",
            display: "Gonococcal heart disease (disorder)",
            include: true,
          },
          {
            code: "10754031000119105",
            display: "Gonorrhea in mother complicating childbirth (disorder)",
            include: true,
          },
          {
            code: "1087061000119106",
            display: "Gonococcal pneumonia (disorder)",
            include: true,
          },
          {
            code: "16217981000119107",
            display:
              "Infection of upper genitourinary tract caused by Neisseria gonorrheae (disorder)",
            include: true,
          },
          {
            code: "199163006",
            display:
              "Maternal gonorrhea during pregnancy - baby delivered (disorder)",
            include: true,
          },
          {
            code: "237038001",
            display: "Gonococcal salpingitis (disorder)",
            include: true,
          },
          {
            code: "240571007",
            display: "Neonatal gonococcal infection (disorder)",
            include: true,
          },
          {
            code: "240579009",
            display: "Gonococcal paraurethral gland abscess (disorder)",
            include: true,
          },
          {
            code: "27681008",
            display: "Chronic gonorrhea (disorder)",
            include: true,
          },
          {
            code: "402957000",
            display: "Gonococcal bartholinitis (disorder)",
            include: true,
          },
          {
            code: "53664003",
            display: "Gonococcal spondylitis (disorder)",
            include: true,
          },
          {
            code: "74372003",
            display: "Gonorrhea of pharynx (disorder)",
            include: true,
          },
          {
            code: "1087001000119105",
            display:
              "Infection of anus and rectum caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "111807001",
            display: "Gonococcal endophthalmia (disorder)",
            include: true,
          },
          {
            code: "186931002",
            display: "Gonococcal anal infection (disorder)",
            include: true,
          },
          {
            code: "235861001",
            display: "Abscess gonococcal (disorder)",
            include: true,
          },
          {
            code: "237069002",
            display: "Gonococcal endometritis (disorder)",
            include: true,
          },
          {
            code: "240575003",
            display: "Gonococcal Tysonitis (disorder)",
            include: true,
          },
          {
            code: "266138002",
            display: "Gonococcal synovitis or tenosynovitis (disorder)",
            include: true,
          },
          {
            code: "35526001",
            display: "Chronic gonococcal epididymo-orchitis (disorder)",
            include: true,
          },
          {
            code: "444834005",
            display:
              "Abscess of urethral gland caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "61048000",
            display: "Gonococcal endocarditis (disorder)",
            include: true,
          },
          {
            code: "80388004",
            display:
              "Chronic gonorrhea of upper genitourinary tract (disorder)",
            include: true,
          },
          {
            code: "1087041000119107",
            display:
              "Infection of kidney and ureter caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "15628003",
            display: "Gonorrhea (disorder)",
            include: true,
          },
          {
            code: "199161008",
            display:
              "Maternal gonorrhea during pregnancy, childbirth and the puerperium (disorder)",
            include: true,
          },
          {
            code: "237042003",
            display: "Gonococcal perihepatitis (disorder)",
            include: true,
          },
          {
            code: "240572000",
            display: "Gonorrhea with local complication (disorder)",
            include: true,
          },
          {
            code: "240582004",
            display: "Gonococcal synovitis (disorder)",
            include: true,
          },
          {
            code: "31999004",
            display: "Chronic gonococcal endometritis (disorder)",
            include: true,
          },
          {
            code: "45377007",
            display: "Acute gonococcal salpingitis (disorder)",
            include: true,
          },
          {
            code: "65295003",
            display: "Acute gonococcal endometritis (disorder)",
            include: true,
          },
          {
            code: "90428001",
            display: "Gonococcal pericarditis (disorder)",
            include: true,
          },
          {
            code: "1087021000119101",
            display:
              "Periurethral abscess caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "12373006",
            display: "Chronic gonococcal bartholinitis (disorder)",
            include: true,
          },
          {
            code: "197848003",
            display: "Gonococcal cystitis (disorder)",
            include: true,
          },
          {
            code: "235863003",
            display: "Gonococcal hepatitis (disorder)",
            include: true,
          },
          {
            code: "2390000",
            display: "Acute gonococcal vulvovaginitis (disorder)",
            include: true,
          },
          {
            code: "240577006",
            display: "Gonococcal Littritis (disorder)",
            include: true,
          },
          {
            code: "24868007",
            display: "Acute gonococcal cystitis (disorder)",
            include: true,
          },
          {
            code: "35255008",
            display:
              "Gonorrhea in mother complicating pregnancy, childbirth AND/OR puerperium (disorder)",
            include: true,
          },
          {
            code: "44743006",
            display: "Gonococcal infection of joint (disorder)",
            include: true,
          },
          {
            code: "60893000",
            display: "Chronic gonococcal prostatitis (disorder)",
            include: true,
          },
          {
            code: "80604007",
            display: "Acute gonococcal bartholinitis (disorder)",
            include: true,
          },
          {
            code: "1092601000119103",
            display:
              "Severe sepsis with acute organ dysfunction caused by Gonococcus (disorder)",
            include: true,
          },
          {
            code: "17305005",
            display: "Acute gonorrhea of genitourinary tract (disorder)",
            include: true,
          },
          {
            code: "199164000",
            display:
              "Maternal gonorrhea in the puerperium - baby delivered during current episode of care (disorder)",
            include: true,
          },
          {
            code: "237046000",
            display: "Gonococcal tubo-ovarian abscess (disorder)",
            include: true,
          },
          {
            code: "240574004",
            display: "Gonococcal Skenitis (disorder)",
            include: true,
          },
          {
            code: "240583009",
            display: "Cutaneous gonorrhea (disorder)",
            include: true,
          },
          {
            code: "307423008",
            display: "Gonococcal pelvic peritonitis (disorder)",
            include: true,
          },
          {
            code: "406581000",
            display:
              "Gonococcal infection of the central nervous system (disorder)",
            include: true,
          },
          {
            code: "53529004",
            display: "Chronic gonococcal salpingitis (disorder)",
            include: true,
          },
          {
            code: "733131001",
            display:
              "Infection of musculoskeletal system caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "9091006",
            display: "Gonococcal iridocyclitis (disorder)",
            include: true,
          },
          {
            code: "1087011000119108",
            display:
              "Infection of lower genitourinary tract co-occurrent with abscess of periurethral gland caused by Gonococcus (disorder)",
            include: true,
          },
          {
            code: "11906007",
            display: "Chronic gonococcal vulvovaginitis (disorder)",
            include: true,
          },
          {
            code: "194910001",
            display: "Acute gonococcal pericarditis (disorder)",
            include: true,
          },
          {
            code: "236687008",
            display: "Gonococcal urethral abscess (disorder)",
            include: true,
          },
          {
            code: "238419002",
            display: "Gonococcal lymphangitis of penis (disorder)",
            include: true,
          },
          {
            code: "240578001",
            display: "Gonococcal Littré gland abscess (disorder)",
            include: true,
          },
          {
            code: "28572009",
            display: "Chronic gonorrhea of genitourinary tract (disorder)",
            include: true,
          },
          {
            code: "402956009",
            display: "Localized cutaneous gonococcal infection (disorder)",
            include: true,
          },
          {
            code: "46699001",
            display: "Bursitis caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "713261005",
            display:
              "Gingival disease caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "1086991000119103",
            display: "Gonococcal abscess of brain (disorder)",
            include: true,
          },
          {
            code: "114881000119108",
            display: "Maternal gonorrhea during pregnancy (disorder)",
            include: true,
          },
          {
            code: "186939000",
            display: "Gonococcal peritonitis (disorder)",
            include: true,
          },
          {
            code: "199166003",
            display:
              "Maternal gonorrhea in the puerperium - baby delivered during previous episode of care (disorder)",
            include: true,
          },
          {
            code: "237095000",
            display: "Gonococcal vulvovaginitis (disorder)",
            include: true,
          },
          {
            code: "240573005",
            display: "Gonococcal Bartholin's gland abscess (disorder)",
            include: true,
          },
          {
            code: "240584003",
            display: "Gonococcal cellulitis (disorder)",
            include: true,
          },
          {
            code: "342381000119109",
            display: "Gonococcal iritis (disorder)",
            include: true,
          },
          {
            code: "42746002",
            display: "Gonorrhea of rectum (disorder)",
            include: true,
          },
          {
            code: "60335002",
            display: "Gonococcal keratosis (disorder)",
            include: true,
          },
          {
            code: "762257007",
            display:
              "Disseminated infection caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "1092501000119104",
            display:
              "Septic shock co-occurrent with acute organ dysfunction due to Gonococcus (disorder)",
            include: true,
          },
          {
            code: "16898641000119100",
            display: "Gonorrhea of lower genitourinary tract (disorder)",
            include: true,
          },
          {
            code: "198242009",
            display: "Female gonococcal pelvic inflammatory disease (disorder)",
            include: true,
          },
          {
            code: "236772009",
            display: "Gonococcal epididymo-orchitis (disorder)",
            include: true,
          },
          {
            code: "240039005",
            display: "Gonococcal tenosynovitis (disorder)",
            include: true,
          },
          {
            code: "240581006",
            display: "Gonococcal female pelvic infection (disorder)",
            include: true,
          },
          {
            code: "301990003",
            display: "Gonococcal seminal vesiculitis (disorder)",
            include: true,
          },
          {
            code: "402958005",
            display:
              "Pustular vasculitis caused by gonococcal bacteraemia (disorder)",
            include: true,
          },
          {
            code: "54825009",
            display: "Acute gonorrhea of lower genitourinary tract (disorder)",
            include: true,
          },
          {
            code: "735516004",
            display:
              "Infection of genitourinary system caused by Neisseria gonorrhoeae (disorder)",
            include: true,
          },
          {
            code: "199165004",
            display:
              "Maternal gonorrhea during pregnancy - baby not yet delivered (disorder)",
            include: true,
          },
          {
            code: "237096004",
            display: "Neonatal gonococcal vulvovaginitis (disorder)",
            include: true,
          },
          {
            code: "240576002",
            display: "Gonococcal Cowperitis (disorder)",
            include: true,
          },
          {
            code: "272006008",
            display: "Gonococcal arthritis dermatitis syndrome (disorder)",
            include: true,
          },
          {
            code: "40149008",
            display: "Gonococcal keratitis (disorder)",
            include: true,
          },
          {
            code: "50970007",
            display: "Acute gonorrhea of upper genitourinary tract (disorder)",
            include: true,
          },
          {
            code: "65049003",
            display: "Acute gonococcal seminal vesiculitis (disorder)",
            include: true,
          },
          {
            code: "88813005",
            display: "Chronic gonococcal cystitis (disorder)",
            include: true,
          },
        ],
      },
      {
        valueSetId: "8_20240909",
        valueSetVersion: "20240909",
        valueSetName: "Gonorrhea Diagnosis Problem",
        valueSetExternalId: "8",
        author: "DIBBs",
        system: "http://snomed.info/sct",
        ersdConceptType: "dxtc",
        dibbsConceptType: "conditions",
        includeValueSet: true,
        concepts: [
          {
            code: "72531000052105 ",
            display: "Counseling for contraception",
            include: true,
          },
          {
            code: "2339001",
            display: "Sexual overexposure",
            include: true,
          },
        ],
      },
      {
        valueSetId: "7_20240909",
        valueSetVersion: "20240909",
        valueSetName: "Gonorrhea Medication",
        valueSetExternalId: "7",
        author: "DIBBs",
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        ersdConceptType: "mrtc",
        dibbsConceptType: "medications",
        includeValueSet: true,
        concepts: [
          {
            code: "1665005",
            display: "ceftriaxone 500 MG Injection",
            include: true,
          },
          {
            code: "434692",
            display: "azithromycin 1000 MG",
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
      {
        valueSetId: "16_20241015",
        valueSetVersion: "20241015",
        valueSetName: "Newborn Screening Metabolic Disorder Confirmatory Labs",
        valueSetExternalId: "16",
        author: "Center for Public Health Innovation",
        system: "http://loinc.org",
        ersdConceptType: "lrtc",
        dibbsConceptType: "labs",
        includeValueSet: true,
        concepts: [
          {
            code: "30551-6",
            display:
              "Propionylcarnitine (C3) [Moles/volume] inn Serum or Plasma",
            include: true,
          },
          {
            code: "30331-3",
            display:
              "Dodecanoylcarnitine (C12) [Moles/volume]  in Serum or Plasma",
            include: true,
          },
          {
            code: "30235-6",
            display:
              "3-Hydroxypalmitoleylcarnitine (C16:1-OH) [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "24437-6",
            display: "Butyrylglycine/Creatinine [Molar ratio] iin Urine",
            include: true,
          },
          {
            code: "14288-5",
            display: "Carnitine [Moles/volume] in Serum or Plassma",
            include: true,
          },
          {
            code: "14683-7",
            display: "Creatinine [Moles/volume] in Urine",
            include: true,
          },
          {
            code: "26605-6",
            display: "Beta aminoisobutyrate [Moles/volume] in SSerum or Plasma",
            include: true,
          },
          {
            code: "22672-0",
            display: "Cystine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "20649-0",
            display: "Leucine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "20659-9",
            display: "Tryptophan [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "30062-4",
            display: "Arginine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "30059-0",
            display: "Glutamate/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "30049-1",
            display: "Ornithine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "25112-4",
            display: "Lactate/Creatinine [Molar ratio] in Urinee",
            include: true,
          },
          {
            code: "25085-2",
            display: "2-Oxoisovalerate/Creatinine [Molar ratio]] in Urine",
            include: true,
          },
          {
            code: "1982-8",
            display:
              "Biotinidase [Enzymatic activity/volume] in  Serum or Plasma",
            include: true,
          },
          {
            code: "2312-7",
            display: "Galactose 1 phosphate [Mass/volume] in Red  Blood Cells",
            include: true,
          },
          {
            code: "26759-1",
            display: "CD4+CD45RA+ cells [#/volume] in Blood",
            include: true,
          },
          {
            code: "54218-3",
            display:
              "CD3+CD4+ (T4 helper) cells/CD3+CD8+ ((T8 suppressor cells) cells [# Ratio] in Blood",
            include: true,
          },
          {
            code: "46252-3",
            display:
              "Acylcarnitine pattern [Interpretation] in Serum or Plasma",
            include: true,
          },
          {
            code: "30332-1",
            display:
              "Dodecenoylcarnitine (C12:1) [Moles/volumee] in Serum or Plasma",
            include: true,
          },
          {
            code: "30234-9",
            display:
              "3-Hydroxypalmitoylcarnitine (C16-OH) [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "24438-4",
            display: "Hexanoylglycine/Creatinine [Molar ratio]  in Urine",
            include: true,
          },
          {
            code: "40869-0",
            display:
              "Carnitine esters/Carnitine.free (C0) [Mollar ratio] in Serum or Plasma",
            include: true,
          },
          {
            code: "79292-9",
            display: "Creatine",
            include: true,
          },
          {
            code: "20634-2",
            display: "Alpha aminobutyrate [Moles/volume] in Serrum or Plasma",
            include: true,
          },
          {
            code: "20643-3",
            display: "Glutamine [Moles/volume] in Serum or Plassma",
            include: true,
          },
          {
            code: "20652-4",
            display: "Ornithine [Moles/volume] in Serum or Plassma",
            include: true,
          },
          {
            code: "20661-5",
            display: "Valine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "28602-1",
            display: "Beta aminoisobutyrate/Creatinine [Ratio]  in Urine",
            include: true,
          },
          {
            code: "30050-9",
            display: "Hydroxylysine/Creatinine [Ratio] in Urinee",
            include: true,
          },
          {
            code: "30058-2",
            display: "Serine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "25101-7",
            display: "Fumarate/Creatinine [Molar ratio] in Urinne",
            include: true,
          },
          {
            code: "25135-5",
            display: "Suberate/Creatinine [Molar ratio] in Urinne",
            include: true,
          },
          {
            code: "1668-3",
            display: "17-Hydroxyprogesterone [Mass/volume] in Serrum or Plasma",
            include: true,
          },
          {
            code: "15195-1",
            display: "CD3-CD19+ cells [#/volume] in Blood",
            include: true,
          },
          {
            code: "24467-3",
            display: "CD3+CD4+ (T4 helper) cells [#/volume] i  in Blood",
            include: true,
          },
          {
            code: "51413-3",
            display:
              "Butyrylcarnitine+Isobutyrylcarnitine (C4)) [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "30328-9",
            display:
              "Decenoylcarnitine (C10:1) [Moles/volume]  in Serum or Plasma",
            include: true,
          },
          {
            code: "30357-8",
            display:
              "Palmitoleylcarnitine (C16:1) [Moles/volumme] in Serum or Plasma",
            include: true,
          },
          {
            code: "53718-3",
            display: "Acylglycines [Interpretation] in Urine Narrative",
            include: true,
          },
          {
            code: "24444-2",
            display: "Tiglylglycine/Creatinine [Molar ratio] inn Urine",
            include: true,
          },
          {
            code: "33244-5",
            display: "Guanidinoacetate [Moles/volume] in Serum  or Plasma",
            include: true,
          },
          {
            code: "26609-8",
            display: "Gamma aminobutyrate [Moles/volume] in Serrum or Plasma",
            include: true,
          },
          {
            code: "26608-0",
            display: "Ethanolamine [Moles/volume] in Serum or PPlasma",
            include: true,
          },
          {
            code: "20647-4",
            display: "Hydroxyproline [Moles/volume] in Serum orr Plasma",
            include: true,
          },
          {
            code: "20657-3",
            display: "Taurine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "28590-8",
            display: "Alpha aminobutyrate/Creatinine [Ratio] inn Urine",
            include: true,
          },
          {
            code: "28605-4",
            display: "Ethanolamine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "30053-3",
            display: "Leucine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "30057-4",
            display: "Threonine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "29507-1",
            display: "Alpha ketoglutarate/Creatinine [Molar rattio] in Urine",
            include: true,
          },
          {
            code: "29859-6",
            display: "Adipate/Creatinine [Molar ratio] in Urinee",
            include: true,
          },
          {
            code: "3024-7",
            display: "Thyroxine (T4) free [Mass/volume] in Serum  or Plasma",
            include: true,
          },
          {
            code: "38485-9",
            display: "Galactose 1 phosphate [Moles/mass] in Redd Blood Cells",
            include: true,
          },
          {
            code: "17157-9",
            display: "CD45RA cells/100 cells in Blood",
            include: true,
          },
          {
            code: "8118-2",
            display: "CD2 cells/100 cells in Blood",
            include: true,
          },
          {
            code: "30531-8",
            display:
              "Isovalerylcarnitine+Methylbutyrylcarnitinne (C5) [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "30564-9",
            display:
              "Tetradecadienoylcarnitine (C14:2) [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "35656-8",
            display:
              "3-Hydroxystearoylcarnitine (C18-OH) [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "24439-2",
            display: "Isobutyrylglycine/Creatinine [Molar ratioo] in Urine",
            include: true,
          },
          {
            code: "19074-4",
            display: "Carnitine esters [Moles/volume] in Serum  or Plasma",
            include: true,
          },
          {
            code: "34275-8",
            display: "Creatine/Creatinine [Molar ratio] in Urinne",
            include: true,
          },
          {
            code: "26599-1",
            display: "Anserine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "20645-8",
            display: "Histidine [Moles/volume] in Serum or Plassma",
            include: true,
          },
          {
            code: "20655-7",
            display: "Proline [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "30068-1",
            display: "Alanine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "30065-7",
            display: "Cystine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "28601-3",
            display: "Hydroxyproline/Creatinine [Ratio] in Urinne",
            include: true,
          },
          {
            code: "28595-7",
            display: "Taurine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "25116-5",
            display: "Methylmalonate/Creatinine [Molar ratio] iin Urine",
            include: true,
          },
          {
            code: "29519-6",
            display:
              "4-Hydroxyphenylpyruvate/Creatinine [Molarr ratio] in Urine",
            include: true,
          },
          {
            code: "42941-5",
            display:
              "GALT gene allele 2 [Presence] in Blood by Molecular genetics method",
            include: true,
          },
          {
            code: "41994-5",
            display: "CD4+CD45RO+ cells/100 cells in Blood",
            include: true,
          },
          {
            code: "32518-3",
            display:
              "CD3+CD8+ (T8 suppressor cells) cells/10  00 cells in Unspecified specimen",
            include: true,
          },
          {
            code: "30541-7",
            display:
              "Octenoylcarnitine (C8:1) [Moles/volume] iin Serum or Plasma",
            include: true,
          },
          {
            code: "30356-0",
            display:
              "Palmitoylcarnitine (C16) [Moles/volume] iin Serum or Plasma",
            include: true,
          },
          {
            code: "2161-8",
            display: "Creatinine [Mass/volume] in Urine",
            include: true,
          },
          {
            code: "24443-4",
            display: "Suberylglycine/Creatinine [Molar ratio] iin Urine",
            include: true,
          },
          {
            code: "54442-9",
            display:
              "Carnitine esters/Carnitine.free (C0) [Mollar ratio] in Urine",
            include: true,
          },
          {
            code: "20636-7",
            display: "Alanine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "20638-3",
            display: "Asparagine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "20646-6",
            display: "Homocystine [Moles/volume] in Serum or Pllasma",
            include: true,
          },
          {
            code: "14875-9",
            display: "Phenylalanine [Moles/volume] in Serum or  Plasma",
            include: true,
          },
          {
            code: "28588-2",
            display: "Beta alanine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "30061-6",
            display: "Aspartate/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "30047-5",
            display: "Histidine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "30055-8",
            display: "Phenylalanine/Creatinine [Ratio] in Urinee",
            include: true,
          },
          {
            code: "30064-0",
            display: "Valine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "25083-7",
            display: "2-Oxo",
            include: true,
          },
          {
            code: "25137-1",
            display: "Succinylacetone/Creatinine [Molar ratio]  in Urine",
            include: true,
          },
          {
            code: "10970-2",
            display:
              "Galactose 1 phosphate uridyl transferase [Enzymatic activity/volume] in Blood",
            include: true,
          },
          {
            code: "34475-4",
            display: "CD4+CD45RO+ cells [#/volume] in Blood",
            include: true,
          },
          {
            code: "20593-0",
            display: "CD19 cells/100 cells in Unspecified specimen",
            include: true,
          },
          {
            code: "30540-9",
            display:
              "Octanoylcarnitine (C8) [Moles/volume] in  Serum or Plasma",
            include: true,
          },
          {
            code: "30190-3",
            display:
              "3-Hydroxytetradecenoylcarnitine (C14:1-OH) [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "30542-5",
            display:
              "Oleoylcarnitine (C18:1) [Moles/volume] inn Serum or Plasma",
            include: true,
          },
          {
            code: "24440-0",
            display: "Isovalerylglycine/Creatinine [Molar ratioo] in Urine",
            include: true,
          },
          {
            code: "17867-3",
            display: "Carnitine free (C0)/Creatinine [Ratio] inn Urine",
            include: true,
          },
          {
            code: "34155-2",
            display: "Guanidinoacetate/Creatinine [Molar ratio]] in Urine",
            include: true,
          },
          {
            code: "32227-1",
            display: "Argininosuccinate [Moles/volume] in Serumm or Plasma",
            include: true,
          },
          {
            code: "20642-5",
            display: "Glutamate [Moles/volume] in Serum or Plassma",
            include: true,
          },
          {
            code: "20651-6",
            display: "Methionine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "49248-8",
            display: "Amino acid pattern [Interpretation] in Urine Narrative",
            include: true,
          },
          {
            code: "30161-4",
            display: "Citrulline/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "32248-7",
            display: "Homocitrulline/Creatinine [Ratio] in Urinne",
            include: true,
          },
          {
            code: "28610-4",
            display: "Sarcosine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "25136-3",
            display: "Succinate/Creatinine [Molar ratio] in Uriine",
            include: true,
          },
          {
            code: "25089-4",
            display:
              "4-Hydroxyphenyllactate/Creatinine [Molar  ratio] in Urine",
            include: true,
          },
          {
            code: "42940-7",
            display:
              "GALT gene allele 1 [Presence] in Blood by Molecular genetics method",
            include: true,
          },
          {
            code: "20604-5",
            display:
              "CD3-CD16+CD56+ (Natural killer) cells [# #/volume] in Unspecified specimen",
            include: true,
          },
          {
            code: "8123-2",
            display: "CD3+CD4+ (T4 helper) cells/100 cells in B  Blood",
            include: true,
          },
          {
            code: "30358-6",
            display:
              "Hexanoylcarnitine (C6) [Moles/volume] in  Serum or Plasma",
            include: true,
          },
          {
            code: "30233-1",
            display:
              "3-Hydroxydodecanoylcarnitine (C12-OH) [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "30560-7",
            display:
              "Stearoylcarnitine (C18) [Moles/volume] inn Serum or Plasma",
            include: true,
          },
          {
            code: "24442-6",
            display: "Propionylglycine/Creatinine [Molar ratio]] in Urine",
            include: true,
          },
          {
            code: "14286-9",
            display: "Carnitine free (C0) [Moles/volume] in Serrum or Plasma",
            include: true,
          },
          {
            code: "15045-8",
            display: "Creatine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "26600-7",
            display: "Alpha aminoadipate [Moles/volume] in Seruum or Plasma",
            include: true,
          },
          {
            code: "26607-2",
            display: "Cystathionine [Moles/volume] in Serum or  Plasma",
            include: true,
          },
          {
            code: "20648-2",
            display: "Isoleucine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "20658-1",
            display: "Threonine [Moles/volume] in Serum or Plassma",
            include: true,
          },
          {
            code: "32229-7",
            display: "Argininosuccinate/Creatinine [Ratio] in UUrine",
            include: true,
          },
          {
            code: "30056-6",
            display: "Glutamine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "30063-2",
            display: "Methionine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "33477-1",
            display: "Organic acids pattern [Interpretation] in Urine",
            include: true,
          },
          {
            code: "25084-5",
            display: "2-Oxoisocaproate/Creatinine [Molar ratio]] in Urine",
            include: true,
          },
          {
            code: "54457-7",
            display:
              "Biotinidase [Enzymatic activity/volume] iin Serum or Plasma from Normal control",
            include: true,
          },
          {
            code: "33360-9",
            display: "Galactose 1 phosphate [Mass/mass] in Red  Blood Cells",
            include: true,
          },
          {
            code: "31113-4",
            display: "HLA-DR+ cells/100 cells in Blood",
            include: true,
          },
          {
            code: "9557-0",
            display: "CD2 cells [#/volume] in Blood",
            include: true,
          },
          {
            code: "30191-1",
            display: "Acetylcarnitine (C2) [Moles/volume] in Seerum or Plasma",
            include: true,
          },
          {
            code: "30327-1",
            display:
              "Decanoylcarnitine (C10) [Moles/volume] inn Serum or Plasma",
            include: true,
          },
          {
            code: "30238-0",
            display:
              "3-Hydroxytetradecanoylcarnitine (C14-OH) [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "30237-2",
            display:
              "3-Hydroxylinoleoylcarnitine (C18:2-OH) [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "24441-8",
            display:
              "Phenylpropionylglycine/Creatinine [Molar  ratio] in Urine",
            include: true,
          },
          {
            code: "28589-0",
            display: "Carnitine esters/Creatinine [Ratio] in Urrine",
            include: true,
          },
          {
            code: "26604-9",
            display: "Beta alanine [Moles/volume] in Serum or PPlasma",
            include: true,
          },
          {
            code: "20639-1",
            display: "Aspartate [Moles/volume] in Serum or Plassma",
            include: true,
          },
          {
            code: "55876-7",
            display: "Homocitrulline [Moles/volume] in Serum orr Plasma",
            include: true,
          },
          {
            code: "26613-0",
            display: "Sarcosine [Moles/volume] in Serum or Plassma",
            include: true,
          },
          {
            code: "28598-1",
            display: "Alpha aminoadipate/Creatinine [Ratio] in  Urine",
            include: true,
          },
          {
            code: "28599-9",
            display: "Cystathionine/Creatinine [Ratio] in Urinee",
            include: true,
          },
          {
            code: "30052-5",
            display: "Isoleucine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "28608-8",
            display: "Tryptophan/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "29509-7",
            display: "Beta hydroxybutyrate/Creatinine [Molar raatio] in Urine",
            include: true,
          },
          {
            code: "25088-6",
            display:
              "4-Hydroxyphenylacetate/Creatinine [Molar  ratio] in Urine",
            include: true,
          },
          {
            code: "2077-6",
            display: "Chloride [Moles/volume] in Sweat",
            include: true,
          },
          {
            code: "32519-1",
            display:
              "CD3-CD16+CD56+ (Natural killer) cells/1  100 cells in Unspecified specimen",
            include: true,
          },
          {
            code: "14135-8",
            display:
              "CD3+CD8+ (T8 suppressor cells) cells [#/ /volume] in Blood",
            include: true,
          },
          {
            code: "35462-1",
            display:
              "SMN1 gene targeted mutation analysis in Blood or Tissue by Molecular genetics method Narrative",
            include: true,
          },
          {
            code: "30349-5",
            display:
              "Glutarylcarnitine (C5-DC) [Moles/volume]  in Serum or Plasma",
            include: true,
          },
          {
            code: "30566-4",
            display:
              "Tetradecenoylcarnitine (C14:1) [Moles/vollume] in Serum or Plasma",
            include: true,
          },
          {
            code: "30534-2",
            display:
              "Linoleoylcarnitine (C18:2) [Moles/volume]] in Serum or Plasma",
            include: true,
          },
          {
            code: "24436-8",
            display:
              "3-Methylcrotonylglycine/Creatinine [Molarr ratio] in Urine",
            include: true,
          },
          {
            code: "79291-1",
            display:
              "Creatine and guanidinoacetate pattern [Interpretation] in Serum or Plasma Narrative",
            include: true,
          },
          {
            code: "22670-4",
            display: "Alloisoleucine [Moles/volume] in Serum orr Plasma",
            include: true,
          },
          {
            code: "20640-9",
            display: "Citrulline [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "26610-6",
            display: "Hydroxylysine [Moles/volume] in Serum or  Plasma",
            include: true,
          },
          {
            code: "20656-5",
            display: "Serine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "28596-5",
            display: "Anserine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "28593-2",
            display: "Gamma aminobutyrate/Creatinine [Ratio] inn Urine",
            include: true,
          },
          {
            code: "30048-3",
            display: "Lysine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "30054-1",
            display: "Tyrosine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "29524-6",
            display: "Acetoacetate/Creatinine [Molar ratio] in  Urine",
            include: true,
          },
          {
            code: "25134-8",
            display: "Sebacate (C8)/Creatinine [Molar ratio] inn Urine",
            include: true,
          },
          {
            code: "2954-6",
            display: "Sodium [Moles/volume] in Sweat",
            include: true,
          },
          {
            code: "33617-2",
            display: "HLA-DR+ cells [#/volume] in Blood",
            include: true,
          },
          {
            code: "20599-7",
            display: "CD3 cells/100 cells in Unspecified specimen",
            include: true,
          },
          {
            code: "54449-4",
            display:
              "SMN2 gene targeted mutation analysis in Blood or Tissue by Molecular genetics method Narrative",
            include: true,
          },
          {
            code: "39001-3",
            display:
              "3-Hydroxyisovalerylcarnitine (C5-OH) [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "30565-6",
            display:
              "Tetradecanoylcarnitine (C14) [Moles/volumme] in Serum or Plasma",
            include: true,
          },
          {
            code: "30312-3",
            display:
              "3-Hydroxyoleoylcarnitine (C18:1-OH) [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "24435-0",
            display:
              "2-Methylbutyrylglycine/Creatinine [Molar  ratio] in Urine",
            include: true,
          },
          {
            code: "17866-5",
            display: "Carnitine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "13500-4",
            display: "Amino acid pattern [Interpretation] in Serum or Plasma",
            include: true,
          },
          {
            code: "20637-5",
            display: "Arginine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "20644-1",
            display: "Glycine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "20650-8",
            display: "Lysine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "20660-7",
            display: "Tyrosine [Moles/volume] in Serum or Plasma",
            include: true,
          },
          {
            code: "28603-9",
            display: "Asparagine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "30066-5",
            display: "Glycine/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "30067-3",
            display: "Proline/Creatinine [Ratio] in Urine",
            include: true,
          },
          {
            code: "25132-2",
            display: "Pyruvate/Creatinine [Molar ratio] in Urinne",
            include: true,
          },
          {
            code: "25099-3",
            display: "Ethylmalonate/Creatinine [Molar ratio] inn Urine",
            include: true,
          },
          {
            code: "3016-3",
            display: "Thyrotropin [Units/volume] in Serum or Plassma",
            include: true,
          },
          {
            code: "48767-8",
            display: "Annotation comment [Interpretation] Narrative",
            include: true,
          },
          {
            code: "8122-4",
            display: "CD3 cells [#/volume] in Blood",
            include: true,
          },
          {
            code: "49857-6",
            display:
              "SMN1 gene+SMN2 gene targeted mutation anaalysis in Blood or Tissue by Molecular genetics method Narrative",
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
  "792004": {
    name: "Jakob-Creutzfeldt disease (disorder)",
    category: "Neurological Diseases",
  },
  "805002": {
    name: "Pneumoconiosis caused by silica (disorder)",
    category: "Respiratory Conditions (non-infectious)",
  },
  "1214006": {
    name: "Infection caused by Strongyloides (disorder)",
    category: "Parasitic Diseases",
  },
  "1857005": {
    name: "Congenital rubella syndrome (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "3398004": {
    name: "Cadmium poisoning (disorder)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "3928002": {
    name: "Zika virus disease (disorder)",
    category: "Vectorborne Diseases",
  },
  "4241002": {
    name: "Listeriosis (disorder)",
    category: "Enteric Diseases",
  },
  "4374004": {
    name: "Congenital anomaly of tricuspid valve (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "4639008": {
    name: "Glanders (disorder)",
    category: "Zoonotic Diseases",
  },
  "4834000": {
    name: "Typhoid fever (disorder)",
    category: "Enteric Diseases",
  },
  "6142004": {
    name: "Influenza (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "6415009": {
    name: "Human respiratory syncytial virus (organism)",
    category: "Respiratory Conditions (Infectious)",
  },
  "6452009": {
    name: "Colorado tick fever (disorder)",
    category: "Vectorborne Diseases",
  },
  "7180009": {
    name: "Meningitis (disorder)",
    category: "Neurological Diseases",
  },
  "7305005": {
    name: "Coarctation of aorta (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "7484005": {
    name: "Double outlet right ventricle (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "10301003": {
    name: "Tick-borne relapsing fever (disorder)",
    category: "Vectorborne Diseases",
  },
  "11999007": {
    name: "Inactive tuberculosis (finding)",
    category: "Latent Infection (LTBI)",
  },
  "12962009": {
    name: "Histoplasmosis (disorder)",
    category: "Respiratory Conditions (Infectious)",
  },
  "13906002": {
    name: "Anaplasmosis (disorder)",
    category: "Vectorborne Diseases",
  },
  "14168008": {
    name: "Rabies (disorder)",
    category: "Zoonotic Diseases",
  },
  "14189004": {
    name: "Measles (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "14683004": {
    name: "Relapsing fever caused by Borrelia recurrentis (disorder)",
    category: "Vectorborne Diseases",
  },
  "15628003": {
    name: "Gonorrhea (disorder)",
    category: "Sexually Transmitted Diseases",
  },
  "16541001": {
    name: "Yellow fever (disorder)",
    category: "Vectorborne Diseases",
  },
  "17383000": {
    name: "Toxic effect of carbon monoxide (disorder)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "18504008": {
    name: "Toxic shock syndrome (disorder)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "18624000": {
    name: "Disease caused by Rotavirus (disorder)",
    category: "Enteric Diseases",
  },
  "18690003": {
    name: "Farmers' lung (disorder)",
    category: "Respiratory Conditions (non-infectious)",
  },
  "19265001": {
    name: "Tularemia (disorder)",
    category: "Vectorborne Diseases",
  },
  "20484008": {
    name: "Prion disease (disorder)",
    category: "Neurological Diseases",
  },
  "21061004": {
    name: "Babesiosis (disorder)",
    category: "Vectorborne Diseases",
  },
  "22607003": {
    name: "Asbestosis (disorder)",
    category: "Respiratory Conditions (non-infectious)",
  },
  "23502006": {
    name: "Lyme disease (disorder)",
    category: "Vectorborne Diseases",
  },
  "23511006": {
    name: "Meningococcal infectious disease (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "26726000": {
    name: "Legionella infection (disorder)",
    category: "Respiratory Conditions (Infectious)",
  },
  "27836007": {
    name: "Pertussis (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "28867007": {
    name: "Granuloma inguinale (disorder)",
    category: "Sexually Transmitted Diseases",
  },
  "29422001": {
    name: "Coal workers' pneumoconiosis (disorder)",
    category: "Respiratory Conditions (non-infectious)",
  },
  "33839006": {
    name: "Genital herpes simplex (disorder)",
    category: "Genital",
  },
  "34298002": {
    name: "Neonatal conjunctivitis (disorder)",
    category: "Sexually Transmitted Diseases",
  },
  "35742006": {
    name: "Congenital syphilis (disorder)",
    category: "Congenital",
  },
  "36188001": {
    name: "Shigellosis (disorder)",
    category: "Enteric Diseases",
  },
  "36653000": {
    name: "Rubella (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "36921006": {
    name: "Vesicular stomatitis (disorder)",
    category: "Zoonotic Diseases",
  },
  "36989005": {
    name: "Mumps (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "37131007": {
    name: "Pesticide poisoning (disorder)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "38362002": {
    name: "Dengue (disorder)",
    category: "Vectorborne Diseases",
  },
  "38907003": {
    name: "Varicella (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "38959009": {
    name: "Methemoglobinemia (disorder)",
    category: "Systemic Conditions",
  },
  "40468003": {
    name: "Viral hepatitis, type A (disorder)",
    category: "Enteric Diseases",
  },
  "40610006": {
    name: "Arbovirus infection (disorder)",
    category: "Vectorborne Diseases",
  },
  "40956001": {
    name: "Guillain-Barre syndrome (disorder)",
    category: "Neurological Diseases",
  },
  "41040004": {
    name: "Complete trisomy 21 syndrome (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "41439009": {
    name: "Microcystis flos-aquae poisoning (disorder)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "41723001": {
    name: "Jamestown Canyon virus disease (disorder)",
    category: "Vectorborne Diseases",
  },
  "42386007": {
    name: "Cryptococcosis (disorder)",
    category: "Respiratory Conditions (Infectious)",
  },
  "43692000": {
    name: "Influenzal acute upper respiratory infection (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "44301001": {
    name: "Suicide (event)",
    category: "Injuries",
  },
  "45170000": {
    name: "Encephalitis (disorder)",
    category: "Neurological Diseases",
  },
  "45503006": {
    name: "Common ventricle (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "47523006": {
    name: "Western equine encephalitis (disorder)",
    category: "Vectorborne Diseases",
  },
  "49049000": {
    name: "Parkinson's disease (disorder)",
    category: "Neurological Diseases",
  },
  "49649001": {
    name: "Infection caused by Acanthamoeba (disorder)",
    category: "Waterborne (not enteric)",
  },
  "50711007": {
    name: "Viral hepatitis type C (disorder)",
    category: "Bloodborne Diseases",
  },
  "52947006": {
    name: "Japanese encephalitis virus disease (disorder)",
    category: "Vectorborne Diseases",
  },
  "53648006": {
    name: "Disease caused by Enterovirus (disorder)",
    category: "Enteric Diseases",
  },
  "55735004": {
    name: "Respiratory syncytial virus infection (disorder)",
    category: "Respiratory Conditions (Infectious)",
  },
  "56717001": {
    name: "Tuberculosis (disorder)",
    category: "Respiratory Conditions (Infectious)",
  },
  "57607007": {
    name: "Occupational asthma (disorder)",
    category: "Respiratory Conditions (non-infectious)",
  },
  "58265007": {
    name: "Giardiasis (disorder)",
    category: "Enteric Diseases",
  },
  "58718002": {
    name: "Rheumatic fever (disorder)",
    category: "Streptococcal Diseases",
  },
  "58750007": {
    name: "Plague (disorder)",
    category: "Zoonotic Diseases",
  },
  "59051007": {
    name: "Cysticercosis (disorder)",
    category: "Zoonotic Diseases",
  },
  "59527008": {
    name: "Congenital cytomegalovirus infection (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "60498001": {
    name: "Congenital viral hepatitis B infection (disorder)",
    category: "Perinatal",
  },
  "60826002": {
    name: "Coccidioidomycosis (disorder)",
    category: "Respiratory Conditions (Infectious)",
  },
  "61094002": {
    name: "La Crosse encephalitis (disorder)",
    category: "Vectorborne Diseases",
  },
  "61462000": {
    name: "Malaria (disorder)",
    category: "Vectorborne Diseases",
  },
  "61750000": {
    name: "Infection caused by Angiostrongylus (disorder)",
    category: "Zoonotic Diseases",
  },
  "61959006": {
    name: "Common truncus arteriosus (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "62067003": {
    name: "Hypoplastic left heart syndrome (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "63650001": {
    name: "Cholera (disorder)",
    category: "Enteric Diseases",
  },
  "65154009": {
    name: "Infection caused by Clostridium perfringens (disorder)",
    category: "Enteric Diseases",
  },
  "66071002": {
    name: "Viral hepatitis type B (disorder)",
    category: "Bloodborne Diseases",
  },
  "66948001": {
    name: "Cleft palate with cleft lip (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "67341007": {
    name: "Longitudinal deficiency of limb (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "67531005": {
    name: "Spina bifida (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "67924001": {
    name: "Smallpox (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "69996000": {
    name: "Blastomycosis (disorder)",
    category: "Respiratory Conditions (Infectious)",
  },
  "71695001": {
    name: "Complication of ventilation therapy (disorder)",
    category: "Healthcare-Associated Events",
  },
  "72951007": {
    name: "Gastroschisis (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "74225001": {
    name: "Tick paralysis (disorder)",
    category: "Vectorborne Diseases",
  },
  "74351001": {
    name: "Reye's Syndrome (disorder)",
    category: "Systemic Conditions",
  },
  "74942003": {
    name: "Echinococcosis (disorder)",
    category: "Parasitic Diseases",
  },
  "75053002": {
    name: "Acute febrile mucocutaneous lymph node syndrome (disorder)",
    category: "Systemic Conditions",
  },
  "75116005": {
    name: "Ornithosis (disorder)",
    category: "Respiratory Conditions (Infectious)",
  },
  "75702008": {
    name: "Brucellosis (disorder)",
    category: "Zoonotic Diseases",
  },
  "76172008": {
    name: "Infection caused by Taenia (disorder)",
    category: "Zoonotic Diseases",
  },
  "76272004": {
    name: "Syphilis (disorder)",
    category: "Sexually Transmitted Diseases",
  },
  "76902006": {
    name: "Tetanus (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "77377001": {
    name: "Leptospirosis (disorder)",
    category: "Zoonotic Diseases",
  },
  "77506005": {
    name: "Infection caused by Trypanosoma cruzi (disorder)",
    category: "Vectorborne Diseases",
  },
  "80281008": {
    name: "Cleft lip (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "80612004": {
    name: "Leishmaniasis (disorder)",
    category: "Vectorborne Diseases",
  },
  "81004002": {
    name: "Leprosy (disorder)",
    category: "Respiratory Conditions (Infectious)",
  },
  "82271004": {
    name: "Injury of head (disorder)",
    category: "Injuries",
  },
  "83436008": {
    name: "Yersiniosis (disorder)",
    category: "Enteric Diseases",
  },
  "84619001": {
    name: "Nongonococcal urethritis (disorder)",
    category: "Sexually Transmitted Diseases",
  },
  "85761009": {
    name: "Byssinosis (disorder)",
    category: "Respiratory Conditions (non-infectious)",
  },
  "85904008": {
    name: "Paratyphoid fever (disorder)",
    category: "Enteric Diseases",
  },
  "86299006": {
    name: "Tetralogy of Fallot (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "86406008": {
    name: "Human immunodeficiency virus infection (disorder)",
    category: "Sexually Transmitted Diseases",
  },
  "86500004": {
    name: "Campylobacteriosis (disorder)",
    category: "Enteric Diseases",
  },
  "87979003": {
    name: "Cleft palate (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "89369001": {
    name: "Anencephalus (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "91576008": {
    name: "Congenital herpes simplex (disorder)",
    category: "Neonatal",
  },
  "93614002": {
    name: "Infection caused by Baylisascaris procyonis (disorder)",
    category: "Zoonotic Diseases",
  },
  "95821001": {
    name: "Neonatal hearing loss (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "95891005": {
    name: "Influenza-like illness (finding)",
    category: "Respiratory Conditions (Infectious)",
  },
  "111323005": {
    name: "Total anomalous pulmonary venous return (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "111407006": {
    name: "Hemolytic uremic syndrome (disorder)",
    category: "Enteric Diseases",
  },
  "111811007": {
    name: "Mycobacterial infection (excluding tuberculosis AND leprosy) (disorder)",
    category: "Extrapulmonary",
  },
  "111864006": {
    name: "Chikungunya fever (disorder)",
    category: "Vectorborne Diseases",
  },
  "115635005": {
    name: "Balamuthia mandrillaris (organism)",
    category: "Waterborne (not enteric)",
  },
  "128869009": {
    name: "Infestation caused by Sarcoptes scabiei var hominis (disorder)",
    category: "Parasitic Diseases",
  },
  "186431008": {
    name: "Infection caused by Clostridioides difficile (disorder)",
    category: "Enteric Diseases",
  },
  "186771002": {
    name: "Spotted fever group rickettsial disease (disorder)",
    category: "Vectorborne Diseases",
  },
  "186788009": {
    name: "Q fever (disorder)",
    category: "Zoonotic Diseases",
  },
  "187151009": {
    name: "Diphyllobothriasis (disorder)",
    category: "Zoonotic Diseases",
  },
  "187192000": {
    name: "Toxoplasmosis (disorder)",
    category: "Zoonotic Diseases",
  },
  "190268003": {
    name: "Congenital hypothyroidism (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "190687004": {
    name: "Phenylketonuria (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "198130006": {
    name: "Female pelvic inflammatory disease (disorder)",
    category: "Sexually Transmitted Diseases",
  },
  "204296002": {
    name: "Discordant ventriculoarterial connection (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "204339005": {
    name: "Congenital pulmonary valve abnormality (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "204357006": {
    name: "Ebstein's anomaly of tricuspid valve (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "212962007": {
    name: "Drowning and non-fatal immersion (disorder)",
    category: "Injuries",
  },
  "216809001": {
    name: "Accidental poisoning caused by fertilizers (disorder)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "218728005": {
    name: "Interrupted aortic arch (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "233733000": {
    name: "Toxic pneumonitis (disorder)",
    category: "Respiratory Conditions (non-infectious)",
  },
  "240370009": {
    name: "Cryptosporidiosis (disorder)",
    category: "Enteric Diseases",
  },
  "240372001": {
    name: "Cyclosporiasis (disorder)",
    category: "Enteric Diseases",
  },
  "240451000": {
    name: "Streptococcal toxic shock syndrome (disorder)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "240507007": {
    name: "Trivittatus fever (disorder)",
    category: "Vectorborne Diseases",
  },
  "240523007": {
    name: "Viral hemorrhagic fever (disorder)",
    category: "Zoonotic Diseases",
  },
  "240589008": {
    name: "Chlamydia trachomatis infection (disorder)",
    category: "Sexually Transmitted Diseases",
  },
  "240613006": {
    name: "Typhus group rickettsial disease (disorder)",
    category: "Vectorborne Diseases",
  },
  "240626005": {
    name: "Human ehrlichiosis (disorder)",
    category: "Vectorborne Diseases",
  },
  "240820001": {
    name: "Lymphatic filariasis (disorder)",
    category: "Vectorborne Diseases",
  },
  "242253008": {
    name: "Overdose of opiate (disorder)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "266113007": {
    name: "Genital warts (disorder)",
    category: "Sexually Transmitted Diseases",
  },
  "266123003": {
    name: "Bartonellosis (disorder)",
    category: "Vectorborne Diseases",
  },
  "266143009": {
    name: "Chancroid (disorder)",
    category: "Sexually Transmitted Diseases",
  },
  "269275003": {
    name: "Seafood causing toxic effect (disorder)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "276197005": {
    name: "Infection caused by Corynebacterium diphtheriae (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "283545005": {
    name: "Gunshot wound (disorder)",
    category: "Injuries",
  },
  "293104008": {
    name: "Adverse reaction to component of vaccine product (disorder)",
    category: "Healthcare-Associated Events",
  },
  "302231008": {
    name: "Salmonella infection (disorder)",
    category: "Enteric Diseases",
  },
  "359761005": {
    name: "Disease caused by Hantavirus (disorder)",
    category: "Zoonotic Diseases",
  },
  "359814004": {
    name: "Monkeypox (disorder)",
    category: "Zoonotic Diseases",
  },
  "363346000": {
    name: "Malignant neoplastic disease (disorder)",
    category: "Cancer",
  },
  "388759003": {
    name: "Infection caused by Entamoeba histolytica (disorder)",
    category: "Enteric Diseases",
  },
  "397575003": {
    name: "Viral hepatitis, type G (disorder)",
    category: "Bloodborne Diseases",
  },
  "398102009": {
    name: "Acute poliomyelitis (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "398447004": {
    name: "Severe acute respiratory syndrome (disorder)",
    category: "Respiratory Conditions (Infectious)",
  },
  "398557001": {
    name: "Infection caused by non-cholerae vibrio (disorder)",
    category: "Enteric Diseases",
  },
  "398565003": {
    name: "Infection caused by Clostridium botulinum (disorder)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "399907009": {
    name: "Animal bite wound (disorder)",
    category: "Injuries",
  },
  "404236003": {
    name: "Snowshoe hare virus encephalitis (disorder)",
    category: "Vectorborne Diseases",
  },
  "404237007": {
    name: "Keystone virus encephalitis (disorder)",
    category: "Vectorborne Diseases",
  },
  "404681006": {
    name: "Infection caused by vancomycin resistant Staphylococcus aureus (disorder)",
    category: "Healthcare-Associated Events",
  },
  "406575008": {
    name: "Infection caused by vancomycin resistant enterococcus (disorder)",
    category: "Healthcare-Associated Events",
  },
  "406583002": {
    name: "Invasive Haemophilus influenzae disease (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "406597005": {
    name: "Infection caused by Nipah virus (disorder)",
    category: "Zoonotic Diseases",
  },
  "406602003": {
    name: "Infection caused by Staphylococcus aureus (disorder)",
    category: "Healthcare-Associated Events",
  },
  "406604002": {
    name: "Infection caused by vancomycin intermediate Staphylococcus aureus (disorder)",
    category: "Healthcare-Associated Events",
  },
  "406612005": {
    name: "Invasive Group B beta-hemolytic streptococcal disease (disorder)",
    category: "Streptococcal Diseases",
  },
  "406614006": {
    name: "Invasive Group A beta-hemolytic streptococcal disease (disorder)",
    category: "Streptococcal Diseases",
  },
  "406617004": {
    name: "Invasive Streptococcus pneumoniae disease (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "407152001": {
    name: "Blood lead level above reference range (finding)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "407153006": {
    name: "Injury due to motor vehicle accident (disorder)",
    category: "Injuries",
  },
  "409498004": {
    name: "Anthrax (disorder)",
    category: "Zoonotic Diseases",
  },
  "409617000": {
    name: "Ricin poisoning (disorder)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "409636005": {
    name: "Complication of smallpox vaccination (disorder)",
    category: "Healthcare-Associated Events",
  },
  "414015000": {
    name: "Disease caused by Orthopoxvirus (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "414488002": {
    name: "Infantile botulism (disorder)",
    category: "Infant",
  },
  "414819007": {
    name: "Neonatal abstinence syndrome (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "416707008": {
    name: "Powassan encephalitis virus infection (disorder)",
    category: "Vectorborne Diseases",
  },
  "416925005": {
    name: "Eastern equine encephalitis virus infection (disorder)",
    category: "Vectorborne Diseases",
  },
  "417093003": {
    name: "Disease caused by West Nile virus (disorder)",
    category: "Vectorborne Diseases",
  },
  "417192005": {
    name: "Saint Louis encephalitis virus infection (disorder)",
    category: "Vectorborne Diseases",
  },
  "418182000": {
    name: "Disease caused by California serogroup virus (disorder)",
    category: "Vectorborne Diseases",
  },
  "419488004": {
    name: "Staphylococcus aureus enterotoxin B (substance)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "428111003": {
    name: "Melioidosis (disorder)",
    category: "Waterborne (not enteric)",
  },
  "428175000": {
    name: "Primary amebic encephalitis caused by Naegleria fowleri (disorder)",
    category: "Waterborne (not enteric)",
  },
  "433202001": {
    name: "Surgical site infection (disorder)",
    category: "Healthcare-Associated Events",
  },
  "444664004": {
    name: "Genus Cronobacter (organism)",
    category: "Systemic Conditions",
  },
  "700372006": {
    name: "Urinary tract infection associated with catheter (disorder)",
    category: "Healthcare-Associated Events",
  },
  "707341005": {
    name: "Viral hepatitis type D (disorder)",
    category: "Bloodborne Diseases",
  },
  "709018004": {
    name: "Infection caused by larvae of Trichinella (disorder)",
    category: "Zoonotic Diseases",
  },
  "712662001": {
    name: "Carbapenem resistant Enterobacteriaceae (organism)",
    category: "Healthcare-Associated Events",
  },
  "715174007": {
    name: "Carbapenem resistant Acinetobacter baumannii (organism)",
    category: "Healthcare-Associated Events",
  },
  "719590007": {
    name: "Influenza caused by seasonal influenza virus (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "721763002": {
    name: "Infection caused by Norovirus (disorder)",
    category: "Enteric Diseases",
  },
  "721781004": {
    name: "Infection caused by Lymphocytic choriomeningitis virus (disorder)",
    category: "Zoonotic Diseases",
  },
  "726492000": {
    name: "Carbapenem resistant Pseudomonas aeruginosa (organism)",
    category: "Healthcare-Associated Events",
  },
  "734350003": {
    name: "Carbapenemase-producing bacteria (organism)",
    category: "Healthcare-Associated Events",
  },
  "736152001": {
    name: "Infection of bloodstream co-occurrent and due to central venous catheter in situ (disorder)",
    category: "Healthcare-Associated Events",
  },
  "767146004": {
    name: "Toxic effect of arsenic and/or arsenic compound (disorder)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "767299002": {
    name: "Toxic effect of mercury and/or mercury compound (disorder)",
    category: "Toxic Effects of Non-Medicinal Substances",
  },
  "788781001": {
    name: "Delayed allergy to red meat (finding)",
    category: "Vectorborne Diseases",
  },
  "840539006": {
    name: "Disease caused by severe acute respiratory syndrome coronavirus 2 (disorder)",
    category: "Respiratory Conditions (Infectious)",
  },
  "865929003": {
    name: "Infection caused by Candida auris (disorder)",
    category: "Healthcare-Associated Events",
  },
  "895448002": {
    name: "Multisystem inflammatory syndrome in children (disorder)",
    category: "Systemic Conditions",
  },
  "897031002": {
    name: "Acute flaccid myelitis (disorder)",
    category: "Neurological Diseases",
  },
  "1119306006": {
    name: "Multisystem inflammatory syndrome in adults (disorder)",
    category: "Systemic Conditions",
  },
  "1149222004": {
    name: "Overdose (disorder)",
    category: "Non-opioid",
  },
  "1237074000": {
    name: "Congenital atrioventricular septal defect (disorder)",
    category: "Birth Defects and Infant Disorders",
  },
  "651000146102": {
    name: "Middle East respiratory syndrome (disorder)",
    category: "Respiratory Conditions (Infectious)",
  },
  "7111000119109": {
    name: "Viral hepatitis type E (disorder)",
    category: "Enteric Diseases",
  },
  "661761000124109": {
    name: "Death associated with influenza (event)",
    category: "Vaccine Preventable Diseases",
  },
  "551611000124101": {
    name: "Perinatal hepatitis caused by Hepatitis C virus (disorder)",
    category: "Perinatal",
  },
  "1731000119106": {
    name: "Atypical mycobacterial infection of lung (disorder)",
    category: "Pulmonary",
  },
  "541131000124102": {
    name: "Infection caused by novel Influenza A virus variant (disorder)",
    category: "Vaccine Preventable Diseases",
  },
  "328291000119103": {
    name: "Infection caused by Shiga toxin producing Escherichia coli (disorder)",
    category: "Enteric Diseases",
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
  "Healthcare-Associated Events": [
    {
      id: "712662001",
      name: "Carbapenem resistant Enterobacteriaceae (organism)",
    },
    {
      id: "409636005",
      name: "Complication of smallpox vaccination (disorder)",
    },
    {
      id: "726492000",
      name: "Carbapenem resistant Pseudomonas aeruginosa (organism)",
    },
    {
      id: "715174007",
      name: "Carbapenem resistant Acinetobacter baumannii (organism)",
    },
    {
      id: "433202001",
      name: "Surgical site infection (disorder)",
    },
    {
      id: "865929003",
      name: "Infection caused by Candida auris (disorder)",
    },
    {
      id: "404681006",
      name: "Infection caused by vancomycin resistant Staphylococcus aureus (disorder)",
    },
    {
      id: "734350003",
      name: "Carbapenemase-producing bacteria (organism)",
    },
    {
      id: "700372006",
      name: "Urinary tract infection associated with catheter (disorder)",
    },
    {
      id: "736152001",
      name: "Infection of bloodstream co-occurrent and due to central venous catheter in situ (disorder)",
    },
    {
      id: "406604002",
      name: "Infection caused by vancomycin intermediate Staphylococcus aureus (disorder)",
    },
    {
      id: "406602003",
      name: "Infection caused by Staphylococcus aureus (disorder)",
    },
    {
      id: "71695001",
      name: "Complication of ventilation therapy (disorder)",
    },
    {
      id: "293104008",
      name: "Adverse reaction to component of vaccine product (disorder)",
    },
    {
      id: "406575008",
      name: "Infection caused by vancomycin resistant enterococcus (disorder)",
    },
  ],
  "Enteric Diseases": [
    {
      id: "63650001",
      name: "Cholera (disorder)",
    },
    {
      id: "53648006",
      name: "Disease caused by Enterovirus (disorder)",
    },
    {
      id: "36188001",
      name: "Shigellosis (disorder)",
    },
    {
      id: "186431008",
      name: "Infection caused by Clostridioides difficile (disorder)",
    },
    {
      id: "4834000",
      name: "Typhoid fever (disorder)",
    },
    {
      id: "302231008",
      name: "Salmonella infection (disorder)",
    },
    {
      id: "388759003",
      name: "Infection caused by Entamoeba histolytica (disorder)",
    },
    {
      id: "86500004",
      name: "Campylobacteriosis (disorder)",
    },
    {
      id: "240370009",
      name: "Cryptosporidiosis (disorder)",
    },
    {
      id: "240372001",
      name: "Cyclosporiasis (disorder)",
    },
    {
      id: "58265007",
      name: "Giardiasis (disorder)",
    },
    {
      id: "111407006",
      name: "Hemolytic uremic syndrome (disorder)",
    },
    {
      id: "7111000119109",
      name: "Viral hepatitis type E (disorder)",
    },
    {
      id: "4241002",
      name: "Listeriosis (disorder)",
    },
    {
      id: "721763002",
      name: "Infection caused by Norovirus (disorder)",
    },
    {
      id: "65154009",
      name: "Infection caused by Clostridium perfringens (disorder)",
    },
    {
      id: "83436008",
      name: "Yersiniosis (disorder)",
    },
    {
      id: "398557001",
      name: "Infection caused by non-cholerae vibrio (disorder)",
    },
    {
      id: "18624000",
      name: "Disease caused by Rotavirus (disorder)",
    },
    {
      id: "85904008",
      name: "Paratyphoid fever (disorder)",
    },
    {
      id: "40468003",
      name: "Viral hepatitis, type A (disorder)",
    },
    {
      id: "328291000119103",
      name: "Infection caused by Shiga toxin producing Escherichia coli (disorder)",
    },
  ],
  "Respiratory Conditions (Infectious)": [
    {
      id: "840539006",
      name: "Disease caused by severe acute respiratory syndrome coronavirus 2 (disorder)",
    },
    {
      id: "55735004",
      name: "Respiratory syncytial virus infection (disorder)",
    },
    {
      id: "651000146102",
      name: "Middle East respiratory syndrome (disorder)",
    },
    {
      id: "42386007",
      name: "Cryptococcosis (disorder)",
    },
    {
      id: "6415009",
      name: "Human respiratory syncytial virus (organism)",
    },
    {
      id: "26726000",
      name: "Legionella infection (disorder)",
    },
    {
      id: "69996000",
      name: "Blastomycosis (disorder)",
    },
    {
      id: "60826002",
      name: "Coccidioidomycosis (disorder)",
    },
    {
      id: "81004002",
      name: "Leprosy (disorder)",
    },
    {
      id: "95891005",
      name: "Influenza-like illness (finding)",
    },
    {
      id: "12962009",
      name: "Histoplasmosis (disorder)",
    },
    {
      id: "398447004",
      name: "Severe acute respiratory syndrome (disorder)",
    },
    {
      id: "75116005",
      name: "Ornithosis (disorder)",
    },
    {
      id: "56717001",
      name: "Tuberculosis (disorder)",
    },
  ],
  Injuries: [
    {
      id: "212962007",
      name: "Drowning and non-fatal immersion (disorder)",
    },
    {
      id: "82271004",
      name: "Injury of head (disorder)",
    },
    {
      id: "399907009",
      name: "Animal bite wound (disorder)",
    },
    {
      id: "283545005",
      name: "Gunshot wound (disorder)",
    },
    {
      id: "44301001",
      name: "Suicide (event)",
    },
    {
      id: "407153006",
      name: "Injury due to motor vehicle accident (disorder)",
    },
  ],
  "Vectorborne Diseases": [
    {
      id: "19265001",
      name: "Tularemia (disorder)",
    },
    {
      id: "21061004",
      name: "Babesiosis (disorder)",
    },
    {
      id: "404237007",
      name: "Keystone virus encephalitis (disorder)",
    },
    {
      id: "16541001",
      name: "Yellow fever (disorder)",
    },
    {
      id: "47523006",
      name: "Western equine encephalitis (disorder)",
    },
    {
      id: "13906002",
      name: "Anaplasmosis (disorder)",
    },
    {
      id: "40610006",
      name: "Arbovirus infection (disorder)",
    },
    {
      id: "266123003",
      name: "Bartonellosis (disorder)",
    },
    {
      id: "111864006",
      name: "Chikungunya fever (disorder)",
    },
    {
      id: "38362002",
      name: "Dengue (disorder)",
    },
    {
      id: "240626005",
      name: "Human ehrlichiosis (disorder)",
    },
    {
      id: "52947006",
      name: "Japanese encephalitis virus disease (disorder)",
    },
    {
      id: "788781001",
      name: "Delayed allergy to red meat (finding)",
    },
    {
      id: "77506005",
      name: "Infection caused by Trypanosoma cruzi (disorder)",
    },
    {
      id: "404236003",
      name: "Snowshoe hare virus encephalitis (disorder)",
    },
    {
      id: "240820001",
      name: "Lymphatic filariasis (disorder)",
    },
    {
      id: "417093003",
      name: "Disease caused by West Nile virus (disorder)",
    },
    {
      id: "6452009",
      name: "Colorado tick fever (disorder)",
    },
    {
      id: "417192005",
      name: "Saint Louis encephalitis virus infection (disorder)",
    },
    {
      id: "10301003",
      name: "Tick-borne relapsing fever (disorder)",
    },
    {
      id: "41723001",
      name: "Jamestown Canyon virus disease (disorder)",
    },
    {
      id: "61094002",
      name: "La Crosse encephalitis (disorder)",
    },
    {
      id: "80612004",
      name: "Leishmaniasis (disorder)",
    },
    {
      id: "418182000",
      name: "Disease caused by California serogroup virus (disorder)",
    },
    {
      id: "240507007",
      name: "Trivittatus fever (disorder)",
    },
    {
      id: "14683004",
      name: "Relapsing fever caused by Borrelia recurrentis (disorder)",
    },
    {
      id: "416925005",
      name: "Eastern equine encephalitis virus infection (disorder)",
    },
    {
      id: "23502006",
      name: "Lyme disease (disorder)",
    },
    {
      id: "416707008",
      name: "Powassan encephalitis virus infection (disorder)",
    },
    {
      id: "186771002",
      name: "Spotted fever group rickettsial disease (disorder)",
    },
    {
      id: "61462000",
      name: "Malaria (disorder)",
    },
    {
      id: "74225001",
      name: "Tick paralysis (disorder)",
    },
    {
      id: "3928002",
      name: "Zika virus disease (disorder)",
    },
    {
      id: "240613006",
      name: "Typhus group rickettsial disease (disorder)",
    },
  ],
  Genital: [
    {
      id: "33839006",
      name: "Genital herpes simplex (disorder)",
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
      id: "266113007",
      name: "Genital warts (disorder)",
    },
    {
      id: "266143009",
      name: "Chancroid (disorder)",
    },
    {
      id: "15628003",
      name: "Gonorrhea (disorder)",
    },
    {
      id: "28867007",
      name: "Granuloma inguinale (disorder)",
    },
    {
      id: "34298002",
      name: "Neonatal conjunctivitis (disorder)",
    },
    {
      id: "86406008",
      name: "Human immunodeficiency virus infection (disorder)",
    },
    {
      id: "84619001",
      name: "Nongonococcal urethritis (disorder)",
    },
    {
      id: "198130006",
      name: "Female pelvic inflammatory disease (disorder)",
    },
  ],
  "Toxic Effects of Non-Medicinal Substances": [
    {
      id: "269275003",
      name: "Seafood causing toxic effect (disorder)",
    },
    {
      id: "18504008",
      name: "Toxic shock syndrome (disorder)",
    },
    {
      id: "17383000",
      name: "Toxic effect of carbon monoxide (disorder)",
    },
    {
      id: "407152001",
      name: "Blood lead level above reference range (finding)",
    },
    {
      id: "216809001",
      name: "Accidental poisoning caused by fertilizers (disorder)",
    },
    {
      id: "398565003",
      name: "Infection caused by Clostridium botulinum (disorder)",
    },
    {
      id: "3398004",
      name: "Cadmium poisoning (disorder)",
    },
    {
      id: "41439009",
      name: "Microcystis flos-aquae poisoning (disorder)",
    },
    {
      id: "767146004",
      name: "Toxic effect of arsenic and/or arsenic compound (disorder)",
    },
    {
      id: "767299002",
      name: "Toxic effect of mercury and/or mercury compound (disorder)",
    },
    {
      id: "419488004",
      name: "Staphylococcus aureus enterotoxin B (substance)",
    },
    {
      id: "240451000",
      name: "Streptococcal toxic shock syndrome (disorder)",
    },
    {
      id: "242253008",
      name: "Overdose of opiate (disorder)",
    },
    {
      id: "409617000",
      name: "Ricin poisoning (disorder)",
    },
    {
      id: "37131007",
      name: "Pesticide poisoning (disorder)",
    },
  ],
  "Zoonotic Diseases": [
    {
      id: "359814004",
      name: "Monkeypox (disorder)",
    },
    {
      id: "186788009",
      name: "Q fever (disorder)",
    },
    {
      id: "61750000",
      name: "Infection caused by Angiostrongylus (disorder)",
    },
    {
      id: "36921006",
      name: "Vesicular stomatitis (disorder)",
    },
    {
      id: "409498004",
      name: "Anthrax (disorder)",
    },
    {
      id: "75702008",
      name: "Brucellosis (disorder)",
    },
    {
      id: "187151009",
      name: "Diphyllobothriasis (disorder)",
    },
    {
      id: "359761005",
      name: "Disease caused by Hantavirus (disorder)",
    },
    {
      id: "14168008",
      name: "Rabies (disorder)",
    },
    {
      id: "240523007",
      name: "Viral hemorrhagic fever (disorder)",
    },
    {
      id: "77377001",
      name: "Leptospirosis (disorder)",
    },
    {
      id: "406597005",
      name: "Infection caused by Nipah virus (disorder)",
    },
    {
      id: "721781004",
      name: "Infection caused by Lymphocytic choriomeningitis virus (disorder)",
    },
    {
      id: "76172008",
      name: "Infection caused by Taenia (disorder)",
    },
    {
      id: "93614002",
      name: "Infection caused by Baylisascaris procyonis (disorder)",
    },
    {
      id: "4639008",
      name: "Glanders (disorder)",
    },
    {
      id: "59051007",
      name: "Cysticercosis (disorder)",
    },
    {
      id: "187192000",
      name: "Toxoplasmosis (disorder)",
    },
    {
      id: "709018004",
      name: "Infection caused by larvae of Trichinella (disorder)",
    },
    {
      id: "58750007",
      name: "Plague (disorder)",
    },
  ],
  "Systemic Conditions": [
    {
      id: "1119306006",
      name: "Multisystem inflammatory syndrome in adults (disorder)",
    },
    {
      id: "895448002",
      name: "Multisystem inflammatory syndrome in children (disorder)",
    },
    {
      id: "74351001",
      name: "Reye's Syndrome (disorder)",
    },
    {
      id: "38959009",
      name: "Methemoglobinemia (disorder)",
    },
    {
      id: "444664004",
      name: "Genus Cronobacter (organism)",
    },
    {
      id: "75053002",
      name: "Acute febrile mucocutaneous lymph node syndrome (disorder)",
    },
  ],
  "Respiratory Conditions (non-infectious)": [
    {
      id: "22607003",
      name: "Asbestosis (disorder)",
    },
    {
      id: "18690003",
      name: "Farmers' lung (disorder)",
    },
    {
      id: "85761009",
      name: "Byssinosis (disorder)",
    },
    {
      id: "57607007",
      name: "Occupational asthma (disorder)",
    },
    {
      id: "233733000",
      name: "Toxic pneumonitis (disorder)",
    },
    {
      id: "29422001",
      name: "Coal workers' pneumoconiosis (disorder)",
    },
    {
      id: "805002",
      name: "Pneumoconiosis caused by silica (disorder)",
    },
  ],
  "Waterborne (not enteric)": [
    {
      id: "428175000",
      name: "Primary amebic encephalitis caused by Naegleria fowleri (disorder)",
    },
    {
      id: "428111003",
      name: "Melioidosis (disorder)",
    },
    {
      id: "49649001",
      name: "Infection caused by Acanthamoeba (disorder)",
    },
    {
      id: "115635005",
      name: "Balamuthia mandrillaris (organism)",
    },
  ],
  "Bloodborne Diseases": [
    {
      id: "397575003",
      name: "Viral hepatitis, type G (disorder)",
    },
    {
      id: "707341005",
      name: "Viral hepatitis type D (disorder)",
    },
    {
      id: "66071002",
      name: "Viral hepatitis type B (disorder)",
    },
    {
      id: "50711007",
      name: "Viral hepatitis type C (disorder)",
    },
  ],
  "Vaccine Preventable Diseases": [
    {
      id: "27836007",
      name: "Pertussis (disorder)",
    },
    {
      id: "406583002",
      name: "Invasive Haemophilus influenzae disease (disorder)",
    },
    {
      id: "406617004",
      name: "Invasive Streptococcus pneumoniae disease (disorder)",
    },
    {
      id: "1857005",
      name: "Congenital rubella syndrome (disorder)",
    },
    {
      id: "276197005",
      name: "Infection caused by Corynebacterium diphtheriae (disorder)",
    },
    {
      id: "719590007",
      name: "Influenza caused by seasonal influenza virus (disorder)",
    },
    {
      id: "23511006",
      name: "Meningococcal infectious disease (disorder)",
    },
    {
      id: "38907003",
      name: "Varicella (disorder)",
    },
    {
      id: "661761000124109",
      name: "Death associated with influenza (event)",
    },
    {
      id: "6142004",
      name: "Influenza (disorder)",
    },
    {
      id: "414015000",
      name: "Disease caused by Orthopoxvirus (disorder)",
    },
    {
      id: "43692000",
      name: "Influenzal acute upper respiratory infection (disorder)",
    },
    {
      id: "67924001",
      name: "Smallpox (disorder)",
    },
    {
      id: "541131000124102",
      name: "Infection caused by novel Influenza A virus variant (disorder)",
    },
    {
      id: "398102009",
      name: "Acute poliomyelitis (disorder)",
    },
    {
      id: "76902006",
      name: "Tetanus (disorder)",
    },
    {
      id: "14189004",
      name: "Measles (disorder)",
    },
    {
      id: "36653000",
      name: "Rubella (disorder)",
    },
    {
      id: "36989005",
      name: "Mumps (disorder)",
    },
  ],
  "Birth Defects and Infant Disorders": [
    {
      id: "72951007",
      name: "Gastroschisis (disorder)",
    },
    {
      id: "111323005",
      name: "Total anomalous pulmonary venous return (disorder)",
    },
    {
      id: "1237074000",
      name: "Congenital atrioventricular septal defect (disorder)",
    },
    {
      id: "80281008",
      name: "Cleft lip (disorder)",
    },
    {
      id: "66948001",
      name: "Cleft palate with cleft lip (disorder)",
    },
    {
      id: "7305005",
      name: "Coarctation of aorta (disorder)",
    },
    {
      id: "7484005",
      name: "Double outlet right ventricle (disorder)",
    },
    {
      id: "204357006",
      name: "Ebstein's anomaly of tricuspid valve (disorder)",
    },
    {
      id: "87979003",
      name: "Cleft palate (disorder)",
    },
    {
      id: "190687004",
      name: "Phenylketonuria (disorder)",
    },
    {
      id: "67531005",
      name: "Spina bifida (disorder)",
    },
    {
      id: "61959006",
      name: "Common truncus arteriosus (disorder)",
    },
    {
      id: "89369001",
      name: "Anencephalus (disorder)",
    },
    {
      id: "59527008",
      name: "Congenital cytomegalovirus infection (disorder)",
    },
    {
      id: "1",
      name: "Newborn Screening",
    },
    {
      id: "41040004",
      name: "Complete trisomy 21 syndrome (disorder)",
    },
    {
      id: "67341007",
      name: "Longitudinal deficiency of limb (disorder)",
    },
    {
      id: "204296002",
      name: "Discordant ventriculoarterial connection (disorder)",
    },
    {
      id: "218728005",
      name: "Interrupted aortic arch (disorder)",
    },
    {
      id: "190268003",
      name: "Congenital hypothyroidism (disorder)",
    },
    {
      id: "4374004",
      name: "Congenital anomaly of tricuspid valve (disorder)",
    },
    {
      id: "62067003",
      name: "Hypoplastic left heart syndrome (disorder)",
    },
    {
      id: "86299006",
      name: "Tetralogy of Fallot (disorder)",
    },
    {
      id: "95821001",
      name: "Neonatal hearing loss (disorder)",
    },
    {
      id: "204339005",
      name: "Congenital pulmonary valve abnormality (disorder)",
    },
    {
      id: "45503006",
      name: "Common ventricle (disorder)",
    },
    {
      id: "414819007",
      name: "Neonatal abstinence syndrome (disorder)",
    },
  ],
  "Streptococcal Diseases": [
    {
      id: "58718002",
      name: "Rheumatic fever (disorder)",
    },
    {
      id: "406614006",
      name: "Invasive Group A beta-hemolytic streptococcal disease (disorder)",
    },
    {
      id: "406612005",
      name: "Invasive Group B beta-hemolytic streptococcal disease (disorder)",
    },
  ],
  Infant: [
    {
      id: "414488002",
      name: "Infantile botulism (disorder)",
    },
  ],
  "Parasitic Diseases": [
    {
      id: "74942003",
      name: "Echinococcosis (disorder)",
    },
    {
      id: "1214006",
      name: "Infection caused by Strongyloides (disorder)",
    },
    {
      id: "128869009",
      name: "Infestation caused by Sarcoptes scabiei var hominis (disorder)",
    },
  ],
  "Neurological Diseases": [
    {
      id: "40956001",
      name: "Guillain-Barre syndrome (disorder)",
    },
    {
      id: "897031002",
      name: "Acute flaccid myelitis (disorder)",
    },
    {
      id: "792004",
      name: "Jakob-Creutzfeldt disease (disorder)",
    },
    {
      id: "49049000",
      name: "Parkinson's disease (disorder)",
    },
    {
      id: "20484008",
      name: "Prion disease (disorder)",
    },
    {
      id: "45170000",
      name: "Encephalitis (disorder)",
    },
    {
      id: "7180009",
      name: "Meningitis (disorder)",
    },
  ],
  Perinatal: [
    {
      id: "60498001",
      name: "Congenital viral hepatitis B infection (disorder)",
    },
    {
      id: "551611000124101",
      name: "Perinatal hepatitis caused by Hepatitis C virus (disorder)",
    },
  ],
  "Non-opioid": [
    {
      id: "1149222004",
      name: "Overdose (disorder)",
    },
  ],
  Extrapulmonary: [
    {
      id: "111811007",
      name: "Mycobacterial infection (excluding tuberculosis AND leprosy) (disorder)",
    },
  ],
  Pulmonary: [
    {
      id: "1731000119106",
      name: "Atypical mycobacterial infection of lung (disorder)",
    },
  ],
  "Latent Infection (LTBI)": [
    {
      id: "11999007",
      name: "Inactive tuberculosis (finding)",
    },
  ],
  Neonatal: [
    {
      id: "91576008",
      name: "Congenital herpes simplex (disorder)",
    },
  ],
  Congenital: [
    {
      id: "35742006",
      name: "Congenital syphilis (disorder)",
    },
  ],
};

// Fixture shortened significantly compared to valuesets in the actual DB
export const malignantNeoplasticValuesets = [
  {
    display: "Mucositis following chemotherapy (disorder)",
    code_system: "http://snomed.info/sct",
    code: "109256003",
    valueset_name:
      "Cancer [Unspecified Skin Cancer, Benign Carcinoid Tumor, in situ Cervical Cancer, Intraepithelial Neoplasia, History Cancer, Complication of Cancer or Treatment] (Disorders) (SNOMED)",
    valueset_id: "2.16.840.1.113762.1.4.1146.1405_20240123",
    valueset_external_id: "2.16.840.1.113762.1.4.1146.1405",
    version: "20240123",
    author: "CSTE Steward",
    type: "conditions",
    dibbs_concept_type: "conditions",
    condition_id: "363346000",
  },
  {
    display: "Pathological fracture of left humerus due to neoplasm (disorder)",
    code_system: "http://snomed.info/sct",
    code: "11305601000119109",
    valueset_name:
      "Cancer [Unspecified Skin Cancer, Benign Carcinoid Tumor, in situ Cervical Cancer, Intraepithelial Neoplasia, History Cancer, Complication of Cancer or Treatment] (Disorders) (SNOMED)",
    valueset_id: "2.16.840.1.113762.1.4.1146.1405_20240123",
    valueset_external_id: "2.16.840.1.113762.1.4.1146.1405",
    version: "20240123",
    author: "CSTE Steward",
    type: "conditions",
    dibbs_concept_type: "conditions",
    condition_id: "363346000",
  },
];

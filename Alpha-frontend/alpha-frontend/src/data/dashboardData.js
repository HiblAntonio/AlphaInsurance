export const sidebarMainMenu = [
  { label: "Dashboard", icon: "/svg/dashboard-house.svg", href: "/dashboard" },
  { label: "Statistika", icon: "/svg/statistic-chart.svg", href: "/statistika" },
  { label: "Ugovaratelji", icon: "/svg/contractor.svg", href: "/ugovaratelji" },
  { label: "Zaposlenici", icon: "/svg/employees.svg", href: "/zaposlenici" },
  { label: "B-skadenca", icon: "/svg/b-skadenca-board.svg", href: "/b-skadenca" },
  { label: "Smeće", icon: "/svg/trash.svg", href: "/smece" },
];

export const sidebarSettingsMenu = [
  { label: "Općenito", icon: "/svg/settings.svg", href: "/postavke" },
];

export const summaryItems = [
  { label: "Policu izradio/la", value: "David Bolić" },
  { label: "Ugovaratelj", value: "Antonio Hibl", isLink: true, href: "/ugovaratelji" },
  { label: "Radnja", value: "Produženje police", isLink: true },
  { label: "Datum produženja", value: "10.12.2026." },
  { label: "Osiguravajuća kuća", value: "Croatia osiguranje" },
  { label: "Vrsta osiguranja", value: "AO" },
  { label: "Premija", value: "384.21 €" },
  { label: "Prodajno mjesto", value: "Beli Manastir" },
];

export const featureCards = [
  {
    title: "Dodaj novu policu",
    description:
      "Kreiraj novog ugovaratelja ili dodaj novu policu postojećem ugovaratelju",
    image: "/images/file-plus-dynamic-color.png",
    href: "/dodaj-policu",
  },
  {
    title: "Isprintaj police",
    description:
      "Isprintaj sve filtrirane police osiguranja u PDF format",
    image: "/images/file-text-dynamic-color.png",
  },
];

export const filterTabs = [
  { label: "Svi", count: 1928, active: true },
  { label: "Aktivni", count: 1654, active: false },
  { label: "Neaktivni", count: 155, active: false },
  { label: "2 tjedna prije isteka", count: 77, active: false },
  { label: "Tjedan prije isteka", count: 42, active: false },
];

export const policies = [
  {
    id: "384916273",
    status: "Produženo",
    ugovaratelj: "Antonio Hibl",
    datumProduzenja: "12.10.2025.",
    osiguravajucaKuca: "Croatia osiguranje",
    vrstaOsiguranja: "AO",
    premija: "384.21 €",
    prodajnoMjesto: "Beli Manastir",
  },
  {
    id: "384916274",
    status: "Produženo",
    ugovaratelj: "Antonio Hibl",
    datumProduzenja: "12.10.2025.",
    osiguravajucaKuca: "Croatia osiguranje",
    vrstaOsiguranja: "AO",
    premija: "384.21 €",
    prodajnoMjesto: "Beli Manastir",
  },
  {
    id: "384916275",
    status: "Produženo",
    ugovaratelj: "Antonio Hibl",
    datumProduzenja: "12.10.2025.",
    osiguravajucaKuca: "Croatia osiguranje",
    vrstaOsiguranja: "AO",
    premija: "384.21 €",
    prodajnoMjesto: "Beli Manastir",
  },
];

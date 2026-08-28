# ALPHA — Insurance Policy Management System

> **Alpha web** · Version 1.0.0.

---

## Table of Contents

- [English](#english)
  - [Overview](#overview)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Prerequisites](#prerequisites)
  - [Local Installation](#local-installation)
  - [Running the Application](#running-the-application)
  - [User Roles](#user-roles)
  - [Application Guide](#application-guide)
- [Hrvatski](#hrvatski)
  - [Pregled](#pregled)
  - [Mogućnosti](#mogućnosti)
  - [Tehnologije](#tehnologije)
  - [Preduvjeti](#preduvjeti)
  - [Lokalna instalacija](#lokalna-instalacija)
  - [Pokretanje aplikacije](#pokretanje-aplikacije)
  - [Korisničke uloge](#korisničke-uloge)
  - [Vodič za korištenje](#vodič-za-korištenje)

---

# English

## Overview

ALPHA is a web-based insurance policy management system built for insurance agents and their administrators. It provides a centralised (internal) platform for creating, tracking, renewing, and analysing insurance policies, along with employee management, client records, and detailed statistics.

## Features

### Policy Management
- **Create policies** — Add new insurance policies linked to existing or new clients
- **Extend policies** — Renew expiring policies with pre-filled data from the previous term
- **Edit policies** — Update policy details such as price, insurance company, type, location, partner, and remarks
- **Delete & restore policies** — Soft-delete policies with a reason; restore them from the Trash
- **Search & filter** — Filter policies by status (active, expiring, expired), insurance company, type, location, partner, price range, and date range
- **Policy printing** — Printing insurance policies based on the provided filtering

### Statistics
- **Today's policies** — Live view of all policies entered today with search and filter
- **Yearly comparison** — Compare policy counts and premium sums between the current and previous year
- **Sales chart** — Daily policy count chart with gradient fill, filterable by period (7 days, 30 days, YTD, custom range)
- **Top partners & locations** — Ranked breakdown of performance
- **Expiring policies** — Donut chart showing expiring policies by insurance type with tooltip breakdown
- **Premium comparison** — Multi-year premium sum comparison

### B-Skadenca
- Dedicated page for tracking policy renewals year-over-year
- Fair YTD comparison: both years are capped at today's day-of-year
- Filterable by insurance company, type, location, and custom date range

### Client (Contractor) Management
- Search and view clients
- Edit client details
- View all policies linked to a specific client

### Employee Management *(Admin only)*
- List all employees with filtering and search
- View detailed employee profiles (total/monthly policies, premium sums, last login)
- Add new employees with automatic ID number generation
- Edit employee details (name, email, role, location, OIB, phone, date of birth)
- Activate / deactivate employees

### Settings *(Admin only)*
- **Lookup table management** — Add, edit, activate, and deactivate values for:
  - Insurance companies
  - Partners
  - Insurance types
  - Locations
  - Deactivated values are hidden from policy forms but remain visible in filters and statistics
- **Password change** — Any user can change their own password

### Sidebar & Navigation
- Collapsible sidebar with role-based menu items
- Live badge on "Statistika" showing today's policy count (auto-refreshes every 2 minutes)
- "Što je novo?" button showing the latest version changelog

### Trash
- View soft-deleted policies with deletion reason and comment
- Restore individual policies

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Charts | Recharts |
| Backend | ASP.NET Core (.NET 10) |
| Database | Microsoft SQL Server |
| Query layer | Dapper, raw SQL |
| Authentication | JWT Bearer tokens + Refresh tokens |
| Password hashing | BCrypt.Net |
| API docs | Swagger (Swashbuckle) |

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/) and npm
- [SQL Server](https://www.microsoft.com/en-us/sql-server) (or SQL Server Express / Docker image)
- Git

## Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/HiblAntonio/AlphaInsurance
cd "Alpha web"
```

### 2. Configure the frontend

The frontend calls `http://localhost:5000` by default. If your backend runs on a different port, create a `.env` file in `Alpha-frontend/alpha-frontend/`:

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

### 3. Install frontend dependencies

```bash
cd Alpha-frontend/alpha-frontend
npm install
```

## Running the Application

### Start the backend

```bash
cd Alpha/Alpha.WebAPI
dotnet run
```

The API will be available at `http://localhost:5000` (or as configured in `launchSettings.json`).

### Start the frontend

```bash
cd Alpha-frontend/alpha-frontend
npm start
```

The React app will open at `http://localhost:3000`.

### Swagger

Once the backend is running, open `http://localhost:5000/swagger` to browse and test all available API endpoints.

## User Roles

| Role | Permissions |
|------|------------|
| **Admin** | Full access to all features including employee management and lookup table administration |
| **Djelatnik** (Agent) | Can manage policies and clients; no access to employee management or lookup table settings |

## Application Guide

### Logging in
Navigate to `http://localhost:3000/login`. Enter your identification number and password. Contact your administrator for initial credentials.

### Creating a policy
1. Click **Dodaj policu** in the sidebar or use the button on the Dashboard
2. Search for an existing client by OIB, or fill in new client details
3. Fill in policy details: policy number, price, start date, insurance company, type, location, partner
4. Click **Spremi policu**

### Extending a policy
1. Open a policy from the policies list
2. Click **Produži policu**
3. Adjust the new term dates and price if needed
4. Confirm

### Filtering policies
Use the filter bar at the top of the policies list. Filters can be combined freely. Active filter values are shown as removable chips.

### Statistics
Navigate to **Statistika** in the sidebar. Admin users see the full dashboard including charts, partner breakdowns, and expiring policies. Agents see their own policy stats and today's entries.

### Managing lookup values *(Admin)*
Go to **Postavke → Vrijednosti lookup tablice**. Select a category tab, then use the **+** button to add a value or **Uredi** to rename one. Use **Deaktiviraj** to hide a value from policy forms without permanently deleting it.

---

# Hrvatski

## Pregled

ALPHA je web aplikacija za upravljanje policama osiguranja namijenjena zastupanjima za osiguranja i njihovim administratorima. Pruža centraliziranu (internu) platformu za kreiranje, praćenje, produživanje i analizu polica osiguranja, uz upravljanje djelatnicima, evidenciju klijenata i detaljne statistike.

## Mogućnosti

### Upravljanje policama
- **Dodavanje polica** — Unos novih polica osiguranja vezanih uz postojeće ili nove klijente
- **Produživanje polica** — Obnavljanje polica kojima ističe rok uz automatski popunjene podatke iz prethodnog perioda
- **Uređivanje polica** — Ažuriranje detalja poput cijene, osiguravajuće kuće, vrste, prodajnog mjesta, partnera i napomene
- **Brisanje i vraćanje polica** — Soft-delete polica s razlogom brisanja
- **Pretraga i filtriranje** — Filtriranje po statusu (aktivna, ističe, istekla), osiguravajućoj kući, vrsti, prodajnom mjestu, partneru, rasponu cijene i datumu
- **Printanje polica** — Printanje polica osiguranja s odabranim filterom

### Statistike
- **Danas unesene police** — Pregled svih polica unesenih danas s pretragom i filtriranjem
- **Godišnja usporedba** — Usporedba broja polica i premija između tekuće i prethodne godine
- **Graf prodaje** — Dnevni graf broja polica s gradijentnim punjenjem, filtrirajući po periodu (7 dana, 30 dana, od početka godine, vlastiti raspon)
- **Vodeći partneri i lokacije** — Rangirana analiza uspješnosti
- **Police koje ističu** — Kružni graf polica koje ističu po vrstama osiguranja s tooltip prikazom
- **Usporedba premija** — Višegodišnja usporedba ukupnih premija

### B-Skadenca
- Zasebna stranica za praćenje obnavljanja polica po godinama
- Pravedna usporedba od početka godine: obje godine su ograničene na trenutni dan u godini
- Filtriranje po osiguravajućoj kući, vrsti, prodajnom mjestu i datumskom rasponu

### Upravljanje klijentima (ugovaratelji)
- Pretraga i pregled klijenata
- Uređivanje podataka o klijentima
- Pregled svih polica vezanih uz određenog klijenta

### Upravljanje djelatnicima *(samo Admin)*
- Popis svih djelatnika s filtriranjem i pretragom
- Detaljni profil djelatnika (ukupno/mjesečno police, premije, posljednja prijava)
- Dodavanje novih djelatnika s automatskim generiranjem identifikacijskog broja
- Uređivanje podataka djelatnika (ime, email, uloga, prodajno mjesto, OIB, telefon, datum rođenja)
- Aktivacija / deaktivacija djelatnika

### Postavke *(samo Admin)*
- **Upravljanje lookup tablicama** — Dodavanje, uređivanje, aktivacija i deaktivacija vrijednosti za:
  - Osiguravajuće kuće
  - Partnere
  - Vrste osiguranja
  - Prodajna mjesta
  - Deaktivirane vrijednosti ne prikazuju se u formama za police, ali ostaju vidljive u filtrima i statistikama
- **Promjena lozinke** — Svaki korisnik može promijeniti vlastitu lozinku

### Bočna (traka) navigacija
- Sklopiva bočna traka s izbornicima ovisno o ulozi korisnika
- Živi brojač na stavci „Statistika" koji prikazuje broj polica unesenih danas (osvježava se svakih 2 minute)
- Gumb „Što je novo?" koji prikazuje changelog trenutne verzije

### Košarica
- Pregled soft-deletiranih polica s razlogom i komentarom brisanja
- Vraćanje pojedinačnih polica

## Tehnologije

| Sloj | Tehnologija |
|------|------------|
| Frontend | React 18, React Router v6 |
| Grafovi | Recharts |
| Backend | ASP.NET Core (.NET 10) |
| Baza podataka | Microsoft SQL Server |
| Upiti | Dapper, raw SQL |
| Autentikacija | JWT Bearer tokeni + Refresh tokeni |
| Hashiranje lozinki | BCrypt.Net |
| API dokumentacija | Swagger (Swashbuckle) |

## Preduvjeti

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/) i npm
- [SQL Server](https://www.microsoft.com/en-us/sql-server) (ili SQL Server Express / Docker image)
- Git

## Lokalna instalacija

### 1. Kloniranje repozitorija

```bash
git clone https://github.com/HiblAntonio/AlphaInsurance
cd "Alpha web"
```

### 2. Konfiguracija frontenda

Frontend zadano poziva `http://localhost:5000`. Ako backend radi na drugom portu, kreirajte `.env` datoteku u `Alpha-frontend/alpha-frontend/`:

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

### 3. Instalacija frontend ovisnosti

```bash
cd Alpha-frontend/alpha-frontend
npm install
```

## Pokretanje aplikacije

### Pokretanje backenda

```bash
cd Alpha/Alpha.WebAPI
dotnet run
```

API se pokreće na `http://localhost:5000` (ili prema konfiguraciji u `launchSettings.json`).

### Pokretanje frontenda

```bash
cd Alpha-frontend/alpha-frontend
npm start
```

React aplikacija otvara se na `http://localhost:3000`.

### Swagger

Nakon pokretanja backenda, otvorite `http://localhost:5000/swagger` za pregled i testiranje svih dostupnih API endpointa.

## Korisničke uloge

| Uloga | Ovlasti |
|-------|---------|
| **Admin** | Potpuni pristup svim funkcionalnostima uključujući upravljanje djelatnicima i lookup tablicama |
| **Djelatnik** | Može upravljati policama i klijentima; nema pristup upravljanju djelatnicima ni lookup postavkama |

## Vodič za korištenje

### Prijava
Navigirajte na `http://localhost:3000/login`. Unesite identifikacijski broj i lozinku. Obratite se administratoru za početne podatke za prijavu.

### Kreiranje police
1. Kliknite **Dodaj policu** u bočnoj traci ili koristite gumb na Dashboardu
2. Pretražite postojećeg klijenta po OIB-u ili unesite podatke novog klijenta
3. Ispunite detalje police: broj police, cijena, datum početka, osiguravajuća kuća, vrsta, prodajno mjesto, partner
4. Kliknite **Spremi policu**

### Produživanje police
1. Otvorite policu s popisa polica
2. Kliknite **Produži policu**
3. Po potrebi prilagodite datume novog perioda i cijenu
4. Potvrdite

### Filtriranje polica
Koristite traku za filtriranje na vrhu popisa polica. Filteri se mogu slobodno kombinirati. Aktivne vrijednosti filtera prikazuju se kao uklonjivi žetoni.

### Statistike
Navigirajte na **Statistika** u bočnoj traci. Admin korisnici vide kompletan dashboard uključujući grafove, analizu partnera i police koje ističu. Djelatnici vide vlastite statistike i današnje unose.

### Upravljanje lookup vrijednostima *(Admin)*
Idite na **Postavke → Vrijednosti lookup tablice**. Odaberite tab kategorije, zatim koristite gumb **+** za dodavanje vrijednosti ili **Uredi** za preimenovanje. Koristite **Deaktiviraj** kako biste sakrili vrijednost iz formi za police bez trajnog brisanja.
